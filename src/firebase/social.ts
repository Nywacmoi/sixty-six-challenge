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

function toGroup(id: string, data: any): SocialGroup {
  return {
    id,
    name: data.name,
    emoji: data.emoji,
    code: data.code,
    ownerId: data.ownerId,
    memberIds: data.memberIds,
    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toMillis() : null,
    lastMessageText: data.lastMessageText ?? null,
    lastMessageSenderId: data.lastMessageSenderId ?? null,
  };
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/\s+/g, '');
}

export function waitForAuthUser(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub();
          resolve(user);
        }
      },
      reject
    );
    signInAnonymously(auth).catch((err) => {
      unsub();
      reject(err);
    });
  });
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

export async function createGroup(uid: string, name: string, emoji: string): Promise<SocialGroup> {
  const code = generateGroupCode();
  const ref = doc(collection(db, 'groups'));
  await setDoc(ref, {
    name: name.trim(),
    emoji,
    code,
    ownerId: uid,
    memberIds: [uid],
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
    lastMessageAt: null,
    lastMessageText: null,
    lastMessageSenderId: null,
  };
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
