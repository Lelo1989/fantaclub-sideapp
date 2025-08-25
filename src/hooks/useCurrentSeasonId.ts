// src/hooks/useCurrentSeasonId.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

export function useCurrentSeasonId(teamSeasonId?: string) {
  const [seasonId, setSeasonId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "league"));
        const s = snap.exists() ? (snap.data().currentSeasonId as string) : undefined;
        if (mounted) setSeasonId(s ?? teamSeasonId ?? null);
      } catch {
        if (mounted) setSeasonId(teamSeasonId ?? null);
      }
    })();
    return () => { mounted = false; };
  }, [teamSeasonId]);
  return seasonId;
}
