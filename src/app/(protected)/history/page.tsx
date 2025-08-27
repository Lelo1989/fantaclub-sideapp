"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useTeamData } from "@/hooks/useTeamData";
import Panel from "@/components/Panel";
import { History as HistoryIcon } from "lucide-react";

type EventRow = {
  id: string;
  kind: "revenue" | "contract" | "renewal" | "release";
  createdAt?: any;
  payload?: any;
};

export default function HistoryPage() {
  const { team, loading } = useTeamData();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!team) return;
      setEventsLoading(true);
      const q = query(
        collection(db, "teamHistory"),
        where("teamId", "==", team.id),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setEventsLoading(false);
    })();
  }, [team]);

  return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-white/70" />
            Storico squadra
          </h1>
        </div>

        {loading && <p className="text-white/70">Caricamento…</p>}
        {!loading && !team && (
          <Panel title="Setup richiesto">Nessun team assegnato.</Panel>
        )}

        {!loading && team && (
          <Panel title="Eventi">
            {eventsLoading ? (
              <p className="text-white/70 text-sm">Carico eventi…</p>
            ) : !rows.length ? (
              <p className="text-white/70 text-sm">Nessun evento.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-[13px] leading-tight">
                  <thead className="bg-white/[0.06] text-white/90">
                    <tr>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Dettagli</th>
                      <th className="text-left p-2">Data</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr]:border-t [&_tr]:border-white/10">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.03] odd:bg-white/[0.015]">
                        <td className="p-2">{r.kind}</td>
                        <td className="p-2">
                          {r.kind === "revenue" && (
                            <>Incasso: €{r.payload?.revenue} — Presenze {r.payload?.attendance} × €{r.payload?.ticketPrice}{r.payload?.opponent ? ` — vs ${r.payload.opponent}` : ""}</>
                          )}
                          {r.kind === "contract" && <>Nuovo contratto: {r.payload?.playerName} ({r.payload?.startYear}–{r.payload?.endYear})</>}
                          {r.kind === "renewal" && <>Rinnovo: {r.payload?.playerName} → {r.payload?.newEnd}</>}
                          {r.kind === "release" && <>Svincolo: {r.payload?.playerName}</>}
                        </td>
                        <td className="p-2">{r.createdAt?.toDate?.().toLocaleString?.() ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}
      </div>
  );
}
