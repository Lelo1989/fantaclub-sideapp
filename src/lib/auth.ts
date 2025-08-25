// src/lib/auth.ts
"use client";

import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export async function signUpEmail({
  email,
  password,
  displayName,
}: {
  email: string;
  password: string;
  displayName: string;
}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  // crea/aggiorna il documento utente in Firestore
  await setDoc(
    doc(db, "users", cred.user.uid),
    {
      email,
      displayName,
      role: "manager",
      teamId: null,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return cred.user;
}

export async function signInEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
}
