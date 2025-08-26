// src/hooks/useExpiringContracts.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  where,
  DocumentData,
} from 'firebase/firestore';

export type Contract = {
  id: string;
  teamId: string;
  playerName: string;
  role: string;
  cost: number;
  startYear: number;
  endYear: number; // anno di scadenza
  status: string;  // 'active' | 'released' | ...
};

const DBG = (...args: any[]) => {
  // @ts-ignore
  if (typeof window !== 'undefined' && (window as any).FC_DEBUG) {
    console.debug('[FC][useExpiringContracts]', ...args);
  }
};

export function useExpiringContracts(teamId?: string, seasonId?: string) {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(!!teamId);
  const [error, setError] = useState<string | null>(null);

  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // cleanup precedente
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!teamId) {
      DBG('no teamId → reset');
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const seasonNum = seasonId ? Number(seasonId) : NaN;
    const hasSeasonFilter = Number.isFinite(seasonNum);

    let qBase;
    if (hasSeasonFilter) {
      qBase = query(
        collection(db, 'contracts'),
        where('teamId', '==', teamId),
        where('endYear', '==', seasonNum),
        orderBy('playerName', 'asc')
      );
      DBG('subscribe with season filter', { teamId, seasonNum });
    } else {
      qBase = query(
        collection(db, 'contracts'),
        where('teamId', '==', teamId),
        orderBy('endYear', 'asc')
      );
      DBG('subscribe without season filter', { teamId });
    }

    const unsub = onSnapshot(
      qBase,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const v = d.data() as DocumentData;
          return { id: d.id, ...(v as Omit<Contract, 'id'>) } as Contract;
        });
        setData(rows);
        setLoading(false);
        DBG('got', rows.length);
      },
      (err) => {
        console.error('[FC][useExpiringContracts] ERROR', err);
        setError(err.message ?? String(err));
        setLoading(false);
      }
    );

    unsubRef.current = unsub;
    return () => {
      DBG('cleanup');
      unsub();
      unsubRef.current = null;
    };
  }, [teamId, seasonId]); // 🔑 DIPENDENZE

  return { data, loading, error };
}
