// src/lib/contracts.ts
"use client";

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { renewalCost } from "./fc";

type AddContractInput = {
  teamId: string;
  playerName: string;
  role?: string;
  cost: number;
  startYear: number;
  endYear: number;
};

export async function addContract(input: AddContractInput) {
  await runTransaction(db, async (tx) => {
    const teamRef = doc(db, "teams", input.teamId);
    const teamSnap = await tx.get(teamRef);
    if (!teamSnap.exists()) throw new Error("Team non trovato");

    // ✅ Safe: data può essere undefined → uso optional chaining
    const teamData = teamSnap.data() as { budget?: number } | undefined;
    const budget = Number((teamData?.budget ?? 0));

    if (budget < input.cost) throw new Error("Budget insufficiente");

    const cRef = doc(collection(db, "contracts"));
    tx.set(cRef, {
      ...input,
      status: "active",
      notes: "",
      createdAt: serverTimestamp(),
    });

    tx.update(teamRef, { budget: budget - input.cost });
  });
}

export async function renewContract(contractId: string, opts: {
  teamId: string;
  currentEnd: number;
  newEnd: number;
  feePerYear: number; // preso dai settings
}) {
  if (opts.newEnd <= opts.currentEnd) throw new Error("Nuova scadenza non valida");

  await runTransaction(db, async (tx) => {
    const teamRef = doc(db, "teams", opts.teamId);
    const teamSnap = await tx.get(teamRef);
    if (!teamSnap.exists()) throw new Error("Team non trovato");

    // ✅ Safe access
    const teamData = teamSnap.data() as { budget?: number } | undefined;
    const budget = Number((teamData?.budget ?? 0));

    const fee = renewalCost(opts.currentEnd, opts.newEnd, opts.feePerYear);
    if (budget < fee) throw new Error("Budget insufficiente per rinnovo");

    const cRef = doc(db, "contracts", contractId);
    tx.update(cRef, { endYear: opts.newEnd });

    tx.update(teamRef, { budget: budget - fee });
  });
}

export async function releaseContract(contractId: string, opts: {
  teamId: string;
  penalty: number;
}) {
  await runTransaction(db, async (tx) => {
    const teamRef = doc(db, "teams", opts.teamId);
    const teamSnap = await tx.get(teamRef);
    if (!teamSnap.exists()) throw new Error("Team non trovato");

    // ✅ Safe access (anche se qui il budget lo leggiamo solo per completezza)
    const teamData = teamSnap.data() as { budget?: number } | undefined;
    const budget = Number((teamData?.budget ?? 0));

    const cRef = doc(db, "contracts", contractId);
    tx.update(cRef, { status: "released" });

    tx.update(teamRef, { budget: budget - Math.max(0, opts.penalty) });
  });
}
