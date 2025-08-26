// src/hooks/useStadium.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';

type StadiumDoc = {
  teamId: string;
  name: string;
  capacity?: number;
  ticketPrice?: number;
  imageUrl?: string;
};

const DBG = (...args: any[]) => {
  // @ts-ignore
  if (typeof window !== 'undefined' && (window as any).FC_DEBUG) {
    console.debug('[FC][useStadium]', ...args);
  }
};

export function useStadium(teamId?: string) {
  const [stadium, setStadium] = useState<(StadiumDoc & { id: string }) | null>(null);
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
      setStadium(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'stadiums'),
      where('teamId', '==', teamId),
      limit(1)
    );

    DBG('subscribe', { teamId });
    const unsub = onSnapshot(
      q,
      (snap) => {
        const doc = snap.docs[0];
        if (!doc) {
          DBG('no stadium doc');
          setStadium(null);
        } else {
          const data = doc.data() as DocumentData;
          setStadium({ id: doc.id, ...(data as StadiumDoc) });
          DBG('stadium', { id: doc.id, name: (data as StadiumDoc).name });
        }
        setLoading(false);
      },
      (err) => {
        console.error('[FC][useStadium] ERROR', err);
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
  }, [teamId]); // 🔑 DIPENDENZA

  return { stadium, loading, error };
}
