import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { useSocial } from '../context/SocialContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  BackupMeta,
  readBackupJson,
  readBackupMeta,
  registerConflictHandlers,
  setBackupStatus,
  toCloudPayload,
  writeBackup,
} from '../firebase/backup';

// Keeps the cloud backup (src/firebase/backup.ts) in step with the phone.
//
// The one thing this must never do is overwrite a real backup with the wrong
// phone's data. The dangerous case is ordinary: a new phone, the onboarding
// done and a habit or two added, THEN a login to the account holding 99 days.
// Uploading on login would replace those 99 days with the new phone's two.
//
// So a phone only writes to a backup it has been reconciled with — "claimed",
// remembered per uid:
//   - no backup yet, or the backup already matches this phone → claim;
//   - a backup exists and this phone has no habits → restore it, claim;
//   - a backup exists and this phone has its own data → ask. "Restaurer" is
//     the default; cancelling claims NOTHING, so nothing is overwritten and
//     the question comes back next launch. Keeping this phone instead is a
//     deliberate button in Profil.
const OWNER_KEY = 'defi99:backup-owner';
const hashKey = (uid: string) => `defi99:backup-hash:${uid}`;
const chunksKey = (uid: string) => `defi99:backup-chunks:${uid}`;
const savedAtKey = (uid: string) => `defi99:backup-at:${uid}`;
// Long enough that a morning of ticking is one upload, short enough that a
// closed app rarely loses anything — and closing flushes immediately anyway.
const DEBOUNCE_MS = 15_000;

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

function report(e: any) {
  if (e?.code === 'permission-denied') setBackupStatus({ state: 'denied' });
  else if (e?.code === 'unavailable') setBackupStatus({ state: 'error', message: 'Hors ligne — nouvel essai au prochain changement.' });
  else setBackupStatus({ state: 'error', message: e?.message ?? 'Erreur inconnue' });
}

export function useCloudBackup() {
  const { loading, habits, completions, profile, unlockedAchievements, metrics, runs, exportData, importData, showToast } =
    useApp();
  const { uid } = useSocial();
  const { confirmAction } = useConfirm();

  const claimed = useRef(false);
  const pendingCloud = useRef<BackupMeta | null>(null);
  const uploading = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upload = useCallback(
    async (force = false) => {
      if (!uid || !claimed.current || uploading.current) return;
      uploading.current = true;
      try {
        const payload = toCloudPayload(await exportData());
        if (!force && (await AsyncStorage.getItem(hashKey(uid))) === payload.hash) {
          // Nothing new — but Profil should still say when it was last saved.
          const at = Number(await AsyncStorage.getItem(savedAtKey(uid)));
          setBackupStatus({ state: 'saved', at: at || Date.now() });
          return;
        }
        setBackupStatus({ state: 'saving' });
        const previous = Number((await AsyncStorage.getItem(chunksKey(uid))) ?? 0);
        const chunks = await writeBackup(uid, payload, previous);
        const at = Date.now();
        await AsyncStorage.multiSet([
          [hashKey(uid), payload.hash],
          [chunksKey(uid), String(chunks)],
          [savedAtKey(uid), String(at)],
        ]);
        setBackupStatus({ state: 'saved', at });
      } catch (e) {
        report(e);
      } finally {
        uploading.current = false;
      }
    },
    [uid, exportData]
  );

  const claim = useCallback(
    async (knownCloud?: BackupMeta | null) => {
      if (!uid) return;
      await AsyncStorage.setItem(OWNER_KEY, uid);
      if (knownCloud) {
        await AsyncStorage.multiSet([
          [hashKey(uid), knownCloud.hash],
          [chunksKey(uid), String(knownCloud.chunks)],
          [savedAtKey(uid), String(knownCloud.updatedAt?.getTime() ?? Date.now())],
        ]);
      }
      claimed.current = true;
    },
    [uid]
  );

  const restore = useCallback(
    async (meta: BackupMeta) => {
      if (!uid) return;
      try {
        setBackupStatus({ state: 'saving' });
        await importData(await readBackupJson(uid, meta));
        await claim(meta);
        setBackupStatus({ state: 'saved', at: Date.now() });
        showToast('cloud-download', 'Ta sauvegarde a été restaurée.');
      } catch (e) {
        report(e);
      }
    },
    [uid, importData, claim, showToast]
  );

  // Reconcile whenever the signed-in identity changes: first launch, a login,
  // a logout (which signs back in anonymously under a new uid).
  useEffect(() => {
    if (loading || !uid) return;
    let cancelled = false;
    claimed.current = false;

    (async () => {
      try {
        if ((await AsyncStorage.getItem(OWNER_KEY)) === uid) {
          claimed.current = true;
          upload();
          return;
        }
        const meta = await readBackupMeta(uid);
        const local = toCloudPayload(await exportData());
        if (cancelled) return;

        if (!meta || meta.hash === local.hash) {
          await claim(meta);
          upload();
          return;
        }
        if (local.summary.habits === 0) {
          await restore(meta);
          return;
        }

        pendingCloud.current = meta;
        setBackupStatus({ state: 'conflict', cloud: meta.summary, cloudAt: meta.updatedAt, local: local.summary });
        const when = meta.updatedAt
          ? `, sauvegardée le ${meta.updatedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
          : '';
        confirmAction(
          'Une sauvegarde existe sur ce compte',
          `Elle contient ${plural(meta.summary.habits, 'habitude')} et ${plural(meta.summary.checkIns, 'check-in')}${when}. ` +
            `Ce téléphone en a ${local.summary.habits} et ${local.summary.checkIns}. ` +
            'Restaurer remplace les données de ce téléphone par la sauvegarde.',
          'Restaurer',
          () => restore(meta),
          false
        );
      } catch (e) {
        report(e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Deliberately keyed on identity only: data changes are the job of the
    // debounce below, and re-running this on every tick would re-ask.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, uid]);

  // Both ways out of a conflict, offered in Profil only while one stands.
  useEffect(() => {
    registerConflictHandlers({
      restore: async () => {
        if (pendingCloud.current) await restore(pendingCloud.current);
        pendingCloud.current = null;
      },
      overwrite: async () => {
        pendingCloud.current = null;
        await claim();
        await upload(true);
      },
    });
    return () => registerConflictHandlers(null);
  }, [claim, upload, restore]);

  // Any change to what's stored → one upload, a little later.
  useEffect(() => {
    if (!claimed.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => upload(), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [habits, completions, profile, unlockedAchievements, metrics, runs, upload]);

  // Leaving the app flushes at once: the last tick before closing it is the
  // one most likely to be lost to a debounce. Also catches journal entries,
  // which change nothing this hook can watch.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        if (timer.current) clearTimeout(timer.current);
        upload();
      }
    });
    return () => sub.remove();
  }, [upload]);
}
