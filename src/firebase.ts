import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
// App Check initialization removed — App Check should be configured in Firebase Console.
// If you later enable App Check, re-add provider imports and initialization guarded by env vars.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBOsjSCZyu9JXzpyJJO8kny_bGvsgudzL8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "exeai-by-hexky.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://exeai-by-hexky-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "exeai-by-hexky",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:585171848007:web:f481cb1936f00d6e2f1a62",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "exeai-by-hexky.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "585171848007",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TBP1D6M8E7",
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.databaseURL || !firebaseConfig.appId) {
  throw new Error(
    "Firebase config is missing required VITE_FIREBASE_* environment variables.\n" +
    "Create a .env file in the project root (copy .env.example) and set VITE_FIREBASE_API_KEY, " +
    "VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID."
  );
}

const app = initializeApp(firebaseConfig);

// NOTE: intentionally not initializing App Check here to avoid enforcement blocking clients.
// App Check should be set up in the Firebase Console and site keys should never be stored
// in public client builds unless you fully understand the flow.

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

export { auth, provider, db };
