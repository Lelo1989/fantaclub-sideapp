// src/hooks/useTeamData.ts
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, where, DocumentData,
} from 'firebase/firestore';

export type TeamDoc = { name: string; seasonId?: string; ownerUserId?: string; stadiumId?: string; [k: string]: any };
export type StadiumDoc = { teamId: string; name: string; capacity?: number; ticketPrice?: number };
export type ContractDoc = { teamId: string; playerName: string; role: string; cost: number; startYear: number; endYear: number; status: string; };

type TeamData = {
  team: (TeamDoc & { id: string }) | null;
  stadium: (StadiumDoc & { id: string }) | null;
  contracts: Array<ContractDoc & { id: string }>;
};

type State = {
  loading: boolean;
  error: string | null;
  uid: string | null;
  teamId: string | null;
  data: TeamData;
};

const DBG = (...args: any[]) => {
  // stampa solo se flag attivo
  // @ts-ignore
  if (typeof window !== 'undefined' && (window as any).FC_DEBUG) console.debug('[FC][useTeamData]', ...args);
};

export function useTeamData() {
  const [state, setState] = useState<State>({
    loading: true, error: null, uid: null, teamId: null, data: { team: null, stadium: null, contracts: [] },
  });

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    DBG('effect start');
    const unsub = onAuthStateChanged(auth, async (user) => {
      DBG('onAuthStateChanged fired', { hasUser: !!user, uid: user?.uid });
      if (!user) {
        if (alive.current) {
          setState({ loading: false, error: null, uid: null, teamId: null, data: { team: null, stadium: null, contracts: [] } });
        }
        return;
      }

      try {
        if (alive.current) setState((s) => ({ ...s, loading: true, error: null, uid: user.uid }));

        // 1) users/{uid}
        const uRef = doc(db, 'users', user.uid);
        const uSnap = await getDoc(uRef);
        const userTeamId = uSnap.exists() ? ((uSnap.data() as DocumentData).teamId as string | null) : null;
        DBG('user doc', { exists: uSnap.exists(), userTeamId });

        // 2) fallback owner
        let resolvedTeamId: string | null = userTeamId ?? null;
        if (!resolvedTeamId) {
          const ownerQ = query(collection(db, 'teams'), where('ownerUserId', '==', user.uid), limit(1));
          DBG('query owner team', { uid: user.uid });
          const ownerRes = await getDocs(ownerQ);
          resolvedTeamId = ownerRes.empty ? null : ownerRes.docs[0].id;
          DBG('owner result', { empty: ownerRes.empty, resolvedTeamId });
        }

        if (!resolvedTeamId) {
          DBG('NO TEAM for user → stop here');
          if (alive.current) setState((s) => ({ ...s, loading: false, teamId: null, data: { team: null, stadium: null, contracts: [] } }));
          return;
        }

        // 3) team
        const tRef = doc(db, 'teams', resolvedTeamId);
        const tSnap = await getDoc(tRef);
        const team = tSnap.exists() ? ({ id: tSnap.id, ...(tSnap.data() as TeamDoc) }) : null;
        DBG('team', { exists: tSnap.exists(), team });

        // 4) stadium
        let stadium: (StadiumDoc & { id: string }) | null = null;
        if (team?.stadiumId) {
          DBG('stadium by id', team.stadiumId);
          const stSnap = await getDoc(doc(db, 'stadiums', team.stadiumId));
          if (stSnap.exists()) stadium = { id: stSnap.id, ...(stSnap.data() as StadiumDoc) };
        } else {
          const stQ = query(collection(db, 'stadiums'), where('teamId', '==', resolvedTeamId), limit(1));
          DBG('stadium by teamId', resolvedTeamId);
          const stRes = await getDocs(stQ);
          if (!stRes.empty) {
            const d = stRes.docs[0]; stadium = { id: d.id, ...(d.data() as StadiumDoc) };
          }
        }
        DBG('stadium result', stadium);

        // 5) contracts
        const cQ = query(
          collection(db, 'contracts'),
          where('teamId', '==', resolvedTeamId),
          orderBy('endYear', 'desc')
        );
        DBG('contracts query', { teamId: resolvedTeamId });
        const cRes = await getDocs(cQ);
        const contracts = cRes.docs.map((d) => ({ id: d.id, ...(d.data() as ContractDoc) }));
        DBG('contracts count', contracts.length);

        if (alive.current) {
          setState((s) => ({
            ...s,
            loading: false,
            error: null,
            teamId: resolvedTeamId,
            data: { team, stadium, contracts },
          }));
        }
        DBG('DONE update state');
      } catch (e: any) {
        console.error('[FC][useTeamData] ERROR', e);
        if (alive.current) setState((s) => ({ ...s, loading: false, error: e?.message ?? String(e) }));
      }
    });

    return () => {
      DBG('cleanup unsub');
      unsub();
    };
  }, []);

  const api = useMemo(() => ({
    team: state.data.team,
    stadium: state.data.stadium,
    contracts: state.data.contracts,
    teamId: state.teamId,
    uid: state.uid,
    loading: state.loading,
    error: state.error,
  }), [state]);

  return api;
}
