"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Panel from "@/components/Panel";
import { ListOrdered } from "lucide-react";

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

type Row = {
  teamId: string;
  rank: number;
  points: number;
  gf: number;
  gs: number;
  diff: number;
};
type Doc = { seasonId: string; positions: Row[]; updatedAt?: any };

export default function StandingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [seasonId, setSeasonId] = useState<string>("2025-26");
  const [updated, setUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({}); // id -> name

  // carica standings della stagione
  useEffect(() => {
    (async () => {
      setLoading(true);
      const qy = query(
        collection(db, "standings"),
        where("seasonId", "==", seasonId),
        orderBy("updatedAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(qy);

      if (!snap.empty) {
        const d = snap.docs[0].data() as Doc;
        const sorted = (d.positions || []).sort((a, b) => a.rank - b.rank);
        setRows(sorted);
        setUpdated(d.updatedAt?.toDate?.()?.toLocaleString?.() ?? "");
      } else {
        setRows([]);
        setUpdated("");
      }
      setLoading(false);
    })();
  }, [seasonId]);

  // quando ho le righe, risolvo gli id -> nomi team
  useEffect(() => {
    (async () => {
      if (!rows.length) {
        setTeamNames({});
        return;
      }
      // prendi gli id unici che non ho ancora risolto
      const needed = Array.from(new Set(rows.map((r) => r.teamId))).filter(
        (id) => !teamNames[id]
      );
      if (!needed.length) return;

      const results: Record<string, string> = {};
      // Firestore non supporta in questa versione un IN su doc ids in batch qui,
      // quindi faccio semplici getDoc per chiarezza (10 squadre = ok per MVP)
      await Promise.all(
        needed.map(async (id) => {
          const ref = doc(db, "teams", id);
          const snap = await getDoc(ref);
          results[id] = snap.exists() ? ((snap.data() as any).name ?? id) : id;
        })
      );
      setTeamNames((prev) => ({ ...prev, ...results }));
    })();
  }, [rows]);

  const displayRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        teamName: teamNames[r.teamId] ?? r.teamId,
      })),
    [rows, teamNames]
  );

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-white/70" />
            Classifica
          </h1>
          {updated && (
            <span className="text-white/60 text-xs sm:text-sm">
              Aggiornata: {updated}
            </span>
          )}
        </div>

        {/* Selettore stagione */}
        <Panel title="Stagione">
          <div className="flex items-center gap-2">
            <label className="text-sm">Seleziona:</label>
            <select
              className="bg-neutral-800 border border-white/20 rounded px-2 py-1"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
            >
              <option>2025-26</option>
            </select>
          </div>
        </Panel>

        {/* Tabella */}
        <Panel title="Tabella">
          {loading ? (
            <p className="text-white/70 text-sm">Caricamento classifica…</p>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-[13px] leading-tight">
                <thead className="bg-white/[0.06] text-white/90">
                  <tr>
                    <th className="text-right p-2">#</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-right p-2">Pt</th>
                    <th className="text-right p-2">GF</th>
                    <th className="text-right p-2">GS</th>
                    <th className="text-right p-2">Diff</th>
                  </tr>
                </thead>
                <tbody className="[&_tr]:border-t [&_tr]:border-white/10">
                  {displayRows.map((r) => (
                    <tr
                      key={r.teamId}
                      className="hover:bg-white/[0.03] odd:bg-white/[0.015]"
                    >
                      <td className="p-2 text-right">{r.rank}</td>
                      <td className="p-2">{r.teamName}</td>
                      <td className="p-2 text-right">{r.points}</td>
                      <td className="p-2 text-right">{r.gf}</td>
                      <td className="p-2 text-right">{r.gs}</td>
                      <td className="p-2 text-right">{r.diff}</td>
                    </tr>
                  ))}
                  {!displayRows.length && (
                    <tr>
                      <td className="p-2" colSpan={6}>
                        Nessun dato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
  );
}
