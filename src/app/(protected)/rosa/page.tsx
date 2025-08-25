"use client";

import AppShell from "@/components/AppShell";
import Panel from "@/components/Panel";
import Pitch from "@/components/Pitch";
import { useTeamData } from "@/hooks/useTeamData";
import { RoleBadge, StatusTag } from "@/components/RoleBadge";
import { Users } from "lucide-react";
import { useMemo } from "react";

export default function RosaPage() {
  const { team, contracts, loading } = useTeamData();

  // Ordina per ruolo (P, D, C, A) e poi alfabetico giocatore
  const rows = useMemo(() => {
    const order: Record<string, number> = { P: 0, D: 1, C: 2, A: 3 };
    return [...contracts].sort((a, b) => {
      const ra = order[a.role ?? "Z"] ?? 9;
      const rb = order[b.role ?? "Z"] ?? 9;
      if (ra !== rb) return ra - rb;
      return a.playerName.localeCompare(b.playerName);
    });
  }, [contracts]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* header */}
        <div className="flex items-end justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-white/70" />
            Rosa
          </h1>
          {team && <span className="text-white/60 text-xs sm:text-sm">{team.name}</span>}
        </div>

        {/* layout 2 colonne: sinistra campo, destra tabella */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Campo (occupazione 1 colonna) */}
          <Panel title="Campo" className="xl:col-span-1">
            <Pitch />
            <p className="text-white/60 text-xs mt-3">
              Vista statica del campo (MVP). In seguito abiliteremo il <i>drag &amp; drop</i> dei giocatori.
            </p>
          </Panel>

          {/* Rosa completa (2 colonne) */}
          <Panel title="Rosa completa" className="xl:col-span-2">
            {loading ? (
              <p className="text-white/70 text-sm">Caricamento rosa…</p>
            ) : !team ? (
              <p className="text-white/70 text-sm">
                Nessun team assegnato. L’admin deve impostare <code>users/{'{'}uid{'}'}.teamId</code>.
              </p>
            ) : rows.length === 0 ? (
              <p className="text-white/70 text-sm">Nessun giocatore in rosa.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-[13px] leading-tight">
                  <thead className="bg-white/[0.06] text-white/90">
                    <tr>
                      <th className="text-left p-2">Giocatore</th>
                      <th className="text-left p-2">Ruolo</th>
                      <th className="text-right p-2">Costo</th>
                      <th className="text-center p-2">Periodo</th>
                      <th className="text-center p-2">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr]:border-t [&_tr]:border-white/10">
                    {rows.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.03] odd:bg-white/[0.015]">
                        <td className="p-2">{c.playerName}</td>
                        <td className="p-2"><RoleBadge role={c.role} /></td>
                        <td className="p-2 text-right">{c.cost}</td>
                        <td className="p-2 text-center">{c.startYear}–{c.endYear}</td>
                        <td className="p-2 text-center"><StatusTag text={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
