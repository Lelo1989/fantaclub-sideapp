// src/hooks/useLeagueSettings.ts
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export type LeagueSettings = {
  maxContractYears: number;
  renewalFeePerYear: number;
  releasePenalty: number;
};

export function useLeagueSettings() {
  const [s, setS] = useState<LeagueSettings | null>(null);
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "settings", "league"));
      if (snap.exists()) setS(snap.data() as LeagueSettings);
    })();
  }, []);
  return s;
}
