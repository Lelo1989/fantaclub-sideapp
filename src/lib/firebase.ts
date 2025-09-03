// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import logger from "@/lib/logger";

declare global {
  interface Window {
    FC_DEBUG?: boolean;
  }
}


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- aggiunto

// 🔧 DEBUG: abilita log verbosi quando NEXT_PUBLIC_DEBUG=1
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEBUG === "1") {
  window.FC_DEBUG = true;
  setLogLevel("debug"); // log firestore su console
  logger.info("[firebase] Firestore logLevel=debug attivo");}
