// src/hooks/useTeamData.ts
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export type TeamDoc = {
  name: string;
  slug: string;
  ownerUserId?: string | null;
  foundedYear: number;
  logoUrl?: string | null;
  budget: number;
  stadiumId?: string | null;
  seasonId: string;
};

export type StadiumDoc = {
  teamId: string;
  name: string;
  capacity: number;
  ticketPrice: number;
  theme?: string | null;
};

export type ContractDoc = {
  teamId: string;
  playerName: string;
  role?: string;
  cost: number;
  startYear: number;
  endYear: number;
  status: "active" | "expired" | "released";
  notes?: string | null;
};

type TeamData = {
  team: (TeamDoc & { id: string }) | null;
  stadium: (StadiumDoc & { id: string }) | null;
  contracts: Array<ContractDoc & { id: string }>;
};

export function useTeamData() {
  const { user } = useAuth();
  const [data, setData] = useState<TeamData>({
    team: null,
    stadium: null,
    contracts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        // 1) leggi il doc utente per ottenere teamId
        const u = await getDoc(doc(db, "users", user.uid));
        const teamId = u.exists() ? ((u.data() as any).teamId as string | null) : null;

        if (!teamId) {
          setData({ team: null, stadium: null, contracts: [] });
          setLoading(false);
          return;
        }

        // 2) team
        const teamSnap = await getDoc(doc(db, "teams", teamId));
        const team = teamSnap.exists()
          ? ({ id: teamSnap.id, ...(teamSnap.data() as TeamDoc) })
          : null;

        // 3) stadio (per stadiumId o, in fallback, per teamId)
        let stadium: (StadiumDoc & { id: string }) | null = null;
        if (team?.stadiumId) {
          const stSnap = await getDoc(doc(db, "stadiums", team.stadiumId));
          if (stSnap.exists()) stadium = { id: stSnap.id, ...(stSnap.data() as StadiumDoc) };
        } else {
          const stQ = query(
            collection(db, "stadiums"),
            where("teamId", "==", teamId),
            limit(1)
          );
          const stDocs = await getDocs(stQ);
          if (!stDocs.empty) {
            const d = stDocs.docs[0];
            stadium = { id: d.id, ...(d.data() as StadiumDoc) };
          }
        }

        // 4) contratti (ordinati per fine contratto desc)
        // Se Firestore chiede un indice, clicca il link suggerito nella console.
        const cQ = query(
          collection(db, "contracts"),
          where("teamId", "==", teamId),
          orderBy("endYear", "desc")
        );
        const cSnap = await getDocs(cQ);
        const contracts = cSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as ContractDoc),
        }));

        setData({ team, stadium, contracts });
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Errore nel caricamento dati squadra");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return { ...data, loading, error };
}
