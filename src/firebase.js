import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only when all required vars are present and non-placeholder
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !String(import.meta.env.VITE_FIREBASE_API_KEY).startsWith('your-')
);

let app = null;
let db  = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db   = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.error('Firebase init error:', err);
  }
}

export { app, db, auth };
