import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './config';
import { migrateGroupEmoji } from '../utils/iconMigration';

export type PublicProfile = {
  uid: string;
  username: string;
  avatarColor: string;
  currentDay: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  level: number;
};

export type SocialGroup = {
  id: string;
  name: string;
  emoji: string;
  code: string;
  ownerId: string;
  memberIds: string[];
  isPublic: boolean;
  lastMessageAt: number | null;
  lastMessageText: string | null;
  lastMessageSenderId: string | null;
};

export type GroupMessage = {
  id: string;
  text: string;
  senderId: string;
  senderUsername: string;
  createdAt: number | null;
};

export type DirectThread = {
  id: string;
  participantIds: string[];
  participants: Record<string, { username: string; avatarColor: string }>;
  lastMessageAt: number | null;
  lastMessageText: string | null;
  lastMessageSenderId: string | null;
};

function toGroup(id: string, data: any): SocialGroup {
  return {
    id,
    name: data.name,
    emoji: migrateGroupEmoji(data.emoji),
    code: data.code,
    ownerId: data.ownerId,
    memberIds: data.memberIds,
    isPublic: data.isPublic ?? false,
    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toMillis() : null,
    lastMessageText: data.lastMessageText ?? null,
    lastMessageSenderId: data.lastMessageSenderId ?? null,
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/\s+/g, '');
}

function toDirectThread(id: string, data: any): DirectThread {
  return {
    id,
    participantIds: data.participantIds ?? [],
    participants: data.participants ?? {},
    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toMillis() : null,
    lastMessageText: data.lastMessageText ?? null,
    lastMessageSenderId: data.lastMessageSenderId ?? null,
  };
}

// Deterministic id so two people always land on the same thread doc no
// matter who opens the conversation first — avoids duplicate threads.
export function directThreadId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join('_');
}

// Tracks the signed-in user for the lifetime of the app, not just at
// startup — needed so logging in/out (switching between an anonymous
// session and a real account) propagates everywhere. Only signs in
// anonymously when there's truly no session yet; calling
// signInAnonymously() unconditionally on every load would silently replace
// an already-linked/permanent session with a fresh anonymous one before it
// has a chance to resolve.
export function subscribeToAuthUser(cb: (user: User | null) => void): () => void {
  let signingInAnonymously = false;
  const unsub = onAuthStateChanged(auth, (user) => {
    if (!user && !signingInAnonymously) {
      signingInAnonymously = true;
      signInAnonymously(auth).catch(() => cb(null));
      return;
    }
    cb(user);
  });
  return unsub;
}

export async function claimUsername(uid: string, rawUsername: string, avatarColor: string) {
  const normalized = normalizeUsername(rawUsername);
  if (normalized.length < 3) throw new Error('Le pseudo doit faire au moins 3 caractères.');
  if (normalized.length > 20) throw new Error('Le pseudo est trop long (20 caractères max).');

  const usernameRef = doc(db, 'usernames', normalized);
  const existing = await getDoc(usernameRef);
  if (existing.exists() && existing.data().uid !== uid) {
    throw new Error('Ce pseudo est déjà pris.');
  }

  await setDoc(usernameRef, { uid });
  await setDoc(
    doc(db, 'users', uid),
    {
      username: rawUsername.trim(),
      avatarColor,
      currentDay: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      level: 1,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function syncMyStats(
  uid: string,
  stats: { currentDay: number; currentStreak: number; longestStreak: number; totalCompletions: number; level: number }
) {
  await setDoc(doc(db, 'users', uid), { ...stats, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<PublicProfile, 'uid'>) };
}

export async function findUserByUsername(username: string): Promise<PublicProfile | null> {
  const normalized = normalizeUsername(username);
  const usernameSnap = await getDoc(doc(db, 'usernames', normalized));
  if (!usernameSnap.exists()) return null;
  return getProfile(usernameSnap.data().uid);
}

export async function followUser(myUid: string, targetUid: string) {
  await setDoc(doc(db, 'users', myUid, 'following', targetUid), { addedAt: serverTimestamp() });
}

export async function unfollowUser(myUid: string, targetUid: string) {
  await deleteDoc(doc(db, 'users', myUid, 'following', targetUid));
}

export async function listFollowingIds(myUid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', myUid, 'following'));
  return snap.docs.map((d) => d.id);
}

function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createGroup(uid: string, name: string, emoji: string, isPublic: boolean): Promise<SocialGroup> {
  const code = generateGroupCode();
  const ref = doc(collection(db, 'groups'));
  await setDoc(ref, {
    name: name.trim(),
    emoji,
    code,
    ownerId: uid,
    memberIds: [uid],
    isPublic,
    createdAt: serverTimestamp(),
    lastMessageAt: null,
    lastMessageText: null,
    lastMessageSenderId: null,
  });
  return {
    id: ref.id,
    name: name.trim(),
    emoji,
    code,
    ownerId: uid,
    memberIds: [uid],
    isPublic,
    lastMessageAt: null,
    lastMessageText: null,
    lastMessageSenderId: null,
  };
}

export async function joinGroupById(uid: string, groupId: string): Promise<SocialGroup | null> {
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  await setDoc(ref, { memberIds: arrayUnion(uid) }, { merge: true });
  const data = snap.data();
  return toGroup(snap.id, { ...data, memberIds: [...data.memberIds, uid] });
}

export async function listPublicGroups(): Promise<SocialGroup[]> {
  const q = query(collection(db, 'groups'), where('isPublic', '==', true), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toGroup(d.id, d.data()));
}

export async function joinGroupByCode(uid: string, code: string): Promise<SocialGroup | null> {
  const q = query(collection(db, 'groups'), where('code', '==', code.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const groupDoc = snap.docs[0];
  await setDoc(doc(db, 'groups', groupDoc.id), { memberIds: arrayUnion(uid) }, { merge: true });
  const data = groupDoc.data();
  return toGroup(groupDoc.id, { ...data, memberIds: [...data.memberIds, uid] });
}

export async function listMyGroups(uid: string): Promise<SocialGroup[]> {
  const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toGroup(d.id, d.data()));
}

export function subscribeToMyGroups(uid: string, cb: (groups: SocialGroup[]) => void) {
  const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toGroup(d.id, d.data())));
  });
}

export async function sendGroupMessage(groupId: string, senderId: string, senderUsername: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(collection(db, 'groups', groupId, 'messages'), {
    text: trimmed,
    senderId,
    senderUsername,
    createdAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, 'groups', groupId),
    { lastMessageAt: serverTimestamp(), lastMessageText: trimmed, lastMessageSenderId: senderId },
    { merge: true }
  );
}

export function subscribeToGroupMessages(groupId: string, cb: (messages: GroupMessage[]) => void) {
  const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    const messages = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : null,
        };
      })
      .reverse();
    cb(messages);
  });
}

export function subscribeToMyDirectThreads(uid: string, cb: (threads: DirectThread[]) => void) {
  const q = query(collection(db, 'directMessages'), where('participantIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toDirectThread(d.id, d.data())));
  });
}

// Unlike sendGroupMessage, the thread doc may not exist yet the first time
// two people message each other — a group always exists before anyone can
// send to it (you join it first), but a DM thread doesn't. So this upserts
// the thread doc (with both participants' info, needed for security-rule
// membership checks on the message write right after) before adding the
// message, instead of after like the group version does.
export async function sendDirectMessage(
  myUid: string,
  myUsername: string,
  myAvatarColor: string,
  peerUid: string,
  peerUsername: string,
  peerAvatarColor: string,
  text: string
) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const threadId = directThreadId(myUid, peerUid);
  const threadRef = doc(db, 'directMessages', threadId);
  await setDoc(
    threadRef,
    {
      participantIds: [myUid, peerUid].sort(),
      participants: {
        [myUid]: { username: myUsername, avatarColor: myAvatarColor },
        [peerUid]: { username: peerUsername, avatarColor: peerAvatarColor },
      },
      lastMessageAt: serverTimestamp(),
      lastMessageText: trimmed,
      lastMessageSenderId: myUid,
    },
    { merge: true }
  );
  await addDoc(collection(db, 'directMessages', threadId, 'messages'), {
    text: trimmed,
    senderId: myUid,
    senderUsername: myUsername,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToDirectMessages(threadId: string, cb: (messages: GroupMessage[]) => void) {
  const q = query(collection(db, 'directMessages', threadId, 'messages'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    const messages = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : null,
        };
      })
      .reverse();
    cb(messages);
  });
}
