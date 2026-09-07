import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web config is meant to be public — real security is enforced by
// Firestore security rules (see FIRESTORE_RULES.md), not by hiding this.
// Web-only for now (this app is deployed as a web PWA) — auth persistence
// uses the browser's own storage automatically via getAuth().
const firebaseConfig = {
  apiKey: 'AIzaSyBhZBW6K6X5N0zfz0zVyfnFCxdruKtOb6g',
  authDomain: 'defi-99.firebaseapp.com',
  projectId: 'defi-99',
  storageBucket: 'defi-99.firebasestorage.app',
  messagingSenderId: '781472379331',
  appId: '1:781472379331:web:749c45946fff9b0388cd76',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);
