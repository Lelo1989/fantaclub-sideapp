// src/lib/revenue.ts
"use client";

import { db } from "@/lib/firebase";
import {
  addDoc, collection, doc, runTransaction, serverTimestamp,
} from "firebase/firestore";

export async function registerMatchRevenue(params: {
  teamId: string;
  stadiumId: string;
  stadiumCapacity: number;
  ticketPrice: number;
  attendance: number;
  opponent?: string | null;
  seasonId: string;
}) {
  const att = Math.max(0, Math.min(params.attendance, params.stadiumCapacity));
  const revenue = att * params.ticketPrice;

  await runTransaction(db, async (tx) => {
    const teamRef = doc(db, "teams", params.teamId);
    const teamSnap = await tx.get(teamRef);
    if (!teamSnap.exists()) throw new Error("Team non trovato");
    const budget = Number((teamSnap.data() as any)?.budget ?? 0);

    // 1) aggiorna budget
    tx.update(teamRef, { budget: budget + revenue });

    // 2) salva record incasso
    const revRef = doc(collection(db, "revenues"));
    tx.set(revRef, {
      teamId: params.teamId,
      seasonId: params.seasonId,
      stadiumId: params.stadiumId,
      opponent: params.opponent ?? "",
      attendance: att,
      ticketPrice: params.ticketPrice,
      revenue,
      createdAt: serverTimestamp(),
      type: "match",
    });

    // 3) salva evento nello storico squadra
    const histRef = doc(collection(db, "teamHistory"));
    tx.set(histRef, {
      teamId: params.teamId,
      seasonId: params.seasonId,
      kind: "revenue",
      payload: { opponent: params.opponent ?? "", attendance: att, ticketPrice: params.ticketPrice, revenue },
      createdAt: serverTimestamp(),
    });
  });

  return { revenue, cappedAttendance: att };
}
