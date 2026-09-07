import {
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';

export const TRIAL_DAYS = 3;

export type Account = {
  email: string;
  createdAt: number | null;
  trialStartedAt: number | null;
  trialEndsAt: number | null;
  // 'trial' and 'expired' are both real, computed from trialEndsAt. No paid
  // plan exists yet — 'active'/'canceled' are reserved for when a real
  // payment processor (Stripe, etc.) is wired in, not produced today.
  subscriptionStatus: 'trial' | 'expired' | 'active' | 'canceled';
};

function toAccount(data: any): Account {
  const trialStartedAt = data.trialStartedAt instanceof Timestamp ? data.trialStartedAt.toMillis() : null;
  const trialEndsAt = trialStartedAt ? trialStartedAt + TRIAL_DAYS * 86_400_000 : null;
  const storedStatus = data.subscriptionStatus ?? 'trial';
  const subscriptionStatus = storedStatus === 'trial' && trialEndsAt && trialEndsAt < Date.now() ? 'expired' : storedStatus;
  return {
    email: data.email,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : null,
    trialStartedAt,
    trialEndsAt,
    subscriptionStatus,
  };
}

function translateAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email — connecte-toi plutôt.';
    case 'auth/invalid-email':
      return "Cet email n'a pas l'air valide.";
    case 'auth/weak-password':
      return 'Le mot de passe doit faire au moins 6 caractères.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives, réessaie dans un instant.';
    case 'auth/operation-not-allowed':
      return "La connexion par email n'est pas encore activée côté serveur.";
    default:
      return 'Réessaie dans un instant.';
  }
}

// Links the current (anonymous) session to a permanent email/password
// credential instead of creating a fresh user — this keeps the same uid, so
// existing friends/groups/messages carry over instead of starting empty.
export async function signUpWithEmail(email: string, password: string): Promise<Account> {
  const current = auth.currentUser;
  if (!current) throw new Error('Pas encore connecté, réessaie dans un instant.');
  try {
    const credential = EmailAuthProvider.credential(email.trim(), password);
    await linkWithCredential(current, credential);
  } catch (e: any) {
    throw new Error(translateAuthError(e?.code));
  }
  await setDoc(doc(db, 'accounts', current.uid), {
    email: email.trim(),
    createdAt: serverTimestamp(),
    trialStartedAt: serverTimestamp(),
    subscriptionStatus: 'trial',
  });
  const snap = await getDoc(doc(db, 'accounts', current.uid));
  return toAccount(snap.data());
}

export async function logInWithEmail(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (e: any) {
    throw new Error(translateAuthError(e?.code));
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
  await signInAnonymously(auth);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e: any) {
    throw new Error(translateAuthError(e?.code));
  }
}

export async function getAccount(uid: string): Promise<Account | null> {
  const snap = await getDoc(doc(db, 'accounts', uid));
  if (!snap.exists()) return null;
  return toAccount(snap.data());
}

export function subscribeToAccount(uid: string, cb: (account: Account | null) => void) {
  return onSnapshot(doc(db, 'accounts', uid), (snap) => {
    cb(snap.exists() ? toAccount(snap.data()) : null);
  });
}

export function trialDaysLeft(account: Account | null): number {
  if (!account?.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((account.trialEndsAt - Date.now()) / 86_400_000));
}
