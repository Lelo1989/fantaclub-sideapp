// src/hooks/useExpiringContracts.ts
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

export type Contract = {
  id: string;
  teamId: string;
  playerName: string;
  role: string;
  startYear: string;
  endYear: string;
  status?: string;
};

export function useExpiringContracts(teamId?: string, currentSeasonId?: string) {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !currentSeasonId) return;
    const q = query(
      collection(db, "contracts"),
      where("teamId", "==", teamId),
      where("endYear", "==", currentSeasonId),
      orderBy("playerName", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const { id: _ignore, ...rest } = d.data() as any;
        return { id: d.id, ...rest } as Contract;
      });
      setData(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [teamId, currentSeasonId]);

  return { data, loading };
}
