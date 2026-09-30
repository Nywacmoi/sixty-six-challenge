import { useSyncExternalStore } from 'react';
import { Bytes, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './config';

// Cloud backup of everything the app stores on the phone.
//
// Until this existed, an account protected nothing: the `accounts` document
// held an email and a subscription status, and habits and check-ins never
// left localStorage. A lost or replaced phone, or Safari clearing site data,
// took the whole challenge with it — account or not.
//
// Layout, per signed-in user (anonymous included — linking an email later
// keeps the same uid, so the backup is already there when they need it):
//
//   backups/{uid}               meta: when, how big, a hash, a summary
//   backups/{uid}/chunks/{i}    the payload, gzipped, split under Firestore's
//                               1 MiB document limit
//
// The payload is the same JSON as the manual export, minus photos (they
// stay on the phone; thirty of them would not fit) and minus its timestamp,
// so an unchanged day hashes the same and isn't re-uploaded. GPS routes are
// why it's compressed and chunked rather than stored as one field: a point
// every three seconds is ~30 KB a run, and a backup that silently stops
// working once someone has run twenty times is the worst kind.

const CHUNK_BYTES = 900_000;

export type BackupSummary = { habits: number; checkIns: number; challengeStartDate: string | null };

export type BackupMeta = {
  hash: string;
  chunks: number;
  encoding: 'gzip' | 'utf8';
  bytes: number;
  summary: BackupSummary;
  updatedAt: Date | null;
};

// --- Payload -----------------------------------------------------------

export function toCloudPayload(exportJson: string): { json: string; hash: string; summary: BackupSummary } {
  const data = JSON.parse(exportJson);
  delete data.exportedAt;
  if (Array.isArray(data.completions)) {
    data.completions = data.completions.map(({ photoUri, ...rest }: any) => rest);
  }
  const json = JSON.stringify(data);
  return {
    json,
    hash: fnv1a(json),
    summary: {
      habits: Array.isArray(data.habits) ? data.habits.filter((h: any) => !h.archived).length : 0,
      checkIns: Array.isArray(data.completions) ? data.completions.filter((c: any) => c.completed).length : 0,
      challengeStartDate: data.profile?.challengeStartDate ?? null,
    },
  };
}

// Not cryptographic — only "did anything change since the last upload".
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0') + ':' + s.length;
}

// Text ⇄ the byte chunks stored in Firestore. Exported so the round trip —
// the part that silently corrupts a backup if it's wrong — can be tested
// without a database.
export async function pack(text: string): Promise<{ chunks: Uint8Array[]; encoding: 'gzip' | 'utf8' }> {
  const raw = new TextEncoder().encode(text);
  let bytes = raw;
  let encoding: 'gzip' | 'utf8' = 'utf8';
  // Safari has had CompressionStream since 16.4. Anywhere it's missing, the
  // backup still works, just larger — and chunking keeps it under the limit.
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    encoding = 'gzip';
  }
  const count = Math.max(1, Math.ceil(bytes.length / CHUNK_BYTES));
  const chunks = Array.from({ length: count }, (_, i) => bytes.slice(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES));
  return { chunks, encoding };
}

export async function unpack(chunks: Uint8Array[], encoding: 'gzip' | 'utf8'): Promise<string> {
  const joined = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) {
    joined.set(c, offset);
    offset += c.length;
  }
  if (encoding === 'utf8') return new TextDecoder().decode(joined);
  const stream = new Blob([joined]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

// --- Firestore ---------------------------------------------------------

const metaRef = (uid: string) => doc(db, 'backups', uid);
const chunkRef = (uid: string, i: number) => doc(db, 'backups', uid, 'chunks', String(i));

export async function readBackupMeta(uid: string): Promise<BackupMeta | null> {
  const snap = await getDoc(metaRef(uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    hash: d.hash,
    chunks: d.chunks,
    encoding: d.encoding,
    bytes: d.bytes,
    summary: d.summary,
    updatedAt: d.updatedAt?.toDate?.() ?? null,
  };
}

/** Uploads a payload. All chunks and the meta land in one batch, so a
 *  reader never sees a meta pointing at half-written chunks. */
export async function writeBackup(
  uid: string,
  payload: { json: string; hash: string; summary: BackupSummary },
  previousChunks: number
): Promise<number> {
  const { chunks, encoding } = await pack(payload.json);
  const count = chunks.length;
  const batch = writeBatch(db);
  chunks.forEach((c, i) => batch.set(chunkRef(uid, i), { data: Bytes.fromUint8Array(c) }));
  for (let i = count; i < previousChunks; i++) batch.delete(chunkRef(uid, i));
  batch.set(metaRef(uid), {
    version: 1,
    hash: payload.hash,
    chunks: count,
    encoding,
    bytes: chunks.reduce((n, c) => n + c.length, 0),
    summary: payload.summary,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return count;
}

export async function readBackupJson(uid: string, meta: BackupMeta): Promise<string> {
  const chunks = await Promise.all(
    Array.from({ length: meta.chunks }, (_, i) =>
      getDoc(chunkRef(uid, i)).then((s) => {
        if (!s.exists()) throw new Error('Sauvegarde incomplète');
        return (s.data().data as Bytes).toUint8Array();
      })
    )
  );
  return unpack(chunks, meta.encoding);
}

// --- Status, for the Profil screen ------------------------------------

export type BackupStatus =
  | { state: 'off' } // not signed in yet
  | { state: 'saving' }
  | { state: 'saved'; at: number }
  | { state: 'conflict'; cloud: BackupSummary; cloudAt: Date | null; local: BackupSummary }
  | { state: 'denied' } // Firestore rules don't allow backups/{uid}
  | { state: 'error'; message: string };

let status: BackupStatus = { state: 'off' };
const listeners = new Set<() => void>();

export function setBackupStatus(next: BackupStatus) {
  status = next;
  listeners.forEach((l) => l());
}

export function useBackupStatus(): BackupStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status
  );
}

// While a conflict stands, Profil offers both ways out — bring the backup
// back, or deliberately replace it with this phone — without owning any of
// the logic that decides when either is safe.
type ConflictHandlers = { restore: () => Promise<void>; overwrite: () => Promise<void> };
let conflictHandlers: ConflictHandlers | null = null;
export function registerConflictHandlers(h: ConflictHandlers | null) {
  conflictHandlers = h;
}
export async function restoreCloudBackup() {
  await conflictHandlers?.restore();
}
export async function overwriteCloudWithThisPhone() {
  await conflictHandlers?.overwrite();
}
