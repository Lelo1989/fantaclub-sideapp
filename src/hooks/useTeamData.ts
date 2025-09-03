// src/hooks/useTeamData.ts
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import {
  collection,
  doc,
  getDoc,
  limit,
  orderBy,
  query,
  where,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import logger from '@/lib/logger';

export type TeamDoc = { name: string; seasonId?: string; ownerUserId?: string; stadiumId?: string; [k: string]: unknown };
export type StadiumDoc = { teamId: string; name: string; capacity?: number; ticketPrice?: number };
export type ContractDoc = { teamId: string; playerName: string; role: string; cost: number; startYear: number; endYear: number; status: string };

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

const DBG = (...args: unknown[]) => logger.debug('[useTeamData]', ...args);

export function useTeamData() {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    uid: null,
    teamId: null,
    data: { team: null, stadium: null, contracts: [] },
  });

  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    DBG('effect', { hasUser: !!user, authLoading });
    if (authLoading) return;

    if (!user) {
      if (alive.current) {
        setState({ loading: false, error: null, uid: null, teamId: null, data: { team: null, stadium: null, contracts: [] } });
      }
      return;
    }

    let cancelled = false;
    let teamUnsub: Unsubscribe | null = null;
    let stadiumUnsub: Unsubscribe | null = null;
    let contractsUnsub: Unsubscribe | null = null;

    (async () => {
      try {
        if (alive.current && !cancelled)
          setState((s) => ({ ...s, loading: true, error: null, uid: user.uid }));

        // 1) users/{uid}
        const uRef = doc(db, 'users', user.uid);
        const uSnap = await getDoc(uRef);
        const userTeamId = uSnap.exists()
          ? ((uSnap.data() as DocumentData).teamId as string | null)
          : null;
        DBG('user doc', { exists: uSnap.exists(), userTeamId });

        // 2) fallback owner
        let resolvedTeamId: string | null = userTeamId ?? null;
        if (!resolvedTeamId) {
          const ownerQ = query(
            collection(db, 'teams'),
            where('ownerUserId', '==', user.uid),
            limit(1)
          );
          DBG('query owner team', { uid: user.uid });
          resolvedTeamId = await new Promise<string | null>((resolve, reject) => {
            const unsub = onSnapshot(
              ownerQ,
              (ownerRes) => {
                const id = ownerRes.empty ? null : ownerRes.docs[0].id;
                resolve(id);
                unsub();
              },
              (err) => {
                reject(err);
              }
            );
          });
          DBG('owner result', { resolvedTeamId });
        }

        if (!resolvedTeamId) {
          DBG('NO TEAM for user → stop here');
          if (alive.current && !cancelled)
            setState((s) => ({
              ...s,
              loading: false,
              teamId: null,
              data: { team: null, stadium: null, contracts: [] },
            }));
          return;
        }

        // 3) team
        teamUnsub = onSnapshot(
          doc(db, 'teams', resolvedTeamId),
          (tSnap) => {
            const team = tSnap.exists()
              ? ({ id: tSnap.id, ...(tSnap.data() as TeamDoc) })
              : null;
            DBG('team', { exists: tSnap.exists(), team });
            if (alive.current && !cancelled)
              setState((s) => ({
                ...s,
                loading: false,
                error: null,
                teamId: resolvedTeamId,
                data: { ...s.data, team },
              }));

            // 4) stadium
            stadiumUnsub?.();
            if (team?.stadiumId) {
              DBG('stadium by id', team.stadiumId);
              stadiumUnsub = onSnapshot(
                doc(db, 'stadiums', team.stadiumId),
                (stSnap) => {
                  const stadium = stSnap.exists()
                    ? ({ id: stSnap.id, ...(stSnap.data() as StadiumDoc) })
                    : null;
                  if (alive.current && !cancelled)
                    setState((s) => ({
                      ...s,
                      loading: false,
                      data: { ...s.data, stadium },
                    }));
                },
                (err) => {
                  logger.error('[useTeamData]', err);
                  if (alive.current && !cancelled)
                    setState((s) => ({
                      ...s,
                      loading: false,
                      error: err.message,
                    }));
                }
              );
            } else {
              const stQ = query(
                collection(db, 'stadiums'),
                where('teamId', '==', resolvedTeamId),
                limit(1)
              );
              DBG('stadium by teamId', resolvedTeamId);
              stadiumUnsub = onSnapshot(
                stQ,
                (stRes) => {
                  let stadium: (StadiumDoc & { id: string }) | null = null;
                  if (!stRes.empty) {
                    const d = stRes.docs[0];
                    stadium = { id: d.id, ...(d.data() as StadiumDoc) };
                  }
                  if (alive.current && !cancelled)
                    setState((s) => ({
                      ...s,
                      loading: false,
                      data: { ...s.data, stadium },
                    }));
                },
                (err) => {
                  logger.error('[useTeamData]', err);
                  if (alive.current && !cancelled)
                    setState((s) => ({
                      ...s,
                      loading: false,
                      error: err.message,
                    }));
                }
              );
            }
          },
          (err) => {
            logger.error('[useTeamData]', err);
            if (alive.current && !cancelled)
              setState((s) => ({
                ...s,
                loading: false,
                error: err.message,
              }));
          }
        );

        // 5) contracts
        const cQ = query(
          collection(db, 'contracts'),
          where('teamId', '==', resolvedTeamId),
          orderBy('endYear', 'desc')
        );
        DBG('contracts query', { teamId: resolvedTeamId });
        contractsUnsub = onSnapshot(
          cQ,
          (cRes) => {
            const contracts = cRes.docs.map((d) => ({
              id: d.id,
              ...(d.data() as ContractDoc),
            }));
            DBG('contracts count', contracts.length);
            if (alive.current && !cancelled)
              setState((s) => ({
                ...s,
                loading: false,
                data: { ...s.data, contracts },
              }));
          },
          (err) => {
            logger.error('[useTeamData]', err);
            if (alive.current && !cancelled)
              setState((s) => ({
                ...s,
                loading: false,
                error: err.message,
              }));
          }
        );
      } catch (e: unknown) {
        logger.error('[useTeamData] ERROR', e);
        if (alive.current && !cancelled)
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          }));
      }
    })();

    return () => {
      cancelled = true;
      teamUnsub?.();
      stadiumUnsub?.();
      contractsUnsub?.();
    };
  }, [user, authLoading]);

  const api = useMemo(
    () => ({
      team: state.data.team,
      stadium: state.data.stadium,
      contracts: state.data.contracts,
      teamId: state.teamId,
      uid: state.uid,
      loading: state.loading,
      error: state.error,
    }),
    [state]
  );

  return api;
}

