"use client";

import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";
import { useTeamData } from "@/hooks/useTeamData";
import Panel from "@/components/Panel";
import { RoleBadge, StatusTag } from "@/components/RoleBadge";
import AppShell from "@/components/AppShell";

export default function DashboardPage() {
  const { user } = useAuth();
  const { team, stadium, contracts, loading, error } = useTeamData();

  const currentYear = new Date().getFullYear();
  const expiring = contracts.filter(c => c.status === "active" && c.endYear <= currentYear);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header “hub” */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-white/60 text-xs sm:text-sm mt-1">{user?.email}</p>
          </div>
          <button onClick={()=>signOut()} className="hidden lg:inline-flex px-3 py-1.5 rounded-md bg-white text-black text-sm font-semibold">
            Esci
          </button>
        </div>

        {loading && (
          <p className="text-white/70">Caricamento dati…</p>
        )}

        {!loading && error && <p className="text-rose-300">{error}</p>}

        {!loading && !team && (
          <Panel title="Setup richiesto">
            <p className="text-white/80">
              Nessun team assegnato. L’admin deve impostare <code className="text-white/90">users/{"{uid}"}.teamId</code>.
            </p>
          </Panel>
        )}

        {!loading && team && (
          <>
            {/* Griglia a 3 colonne desktop */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Colonna 1: Team */}
              <Panel title="Squadra" className="xl:col-span-1">
                <ul className="text-sm leading-6">
                  <li><b className="text-white/80">Nome:</b> {team.name}</li>
                  <li><b className="text-white/80">Fondata:</b> {team.foundedYear}</li>
                  <li><b className="text-white/80">Budget:</b> {team.budget}</li>
                  <li><b className="text-white/80">Stagione:</b> {team.seasonId}</li>
                </ul>
              </Panel>

              {/* Colonna 2: Stadio */}
              <Panel title="Stadio" className="xl:col-span-1">
                {stadium ? (
                  <ul className="text-sm leading-6">
                    <li><b className="text-white/80">Nome:</b> {stadium.name}</li>
                    <li><b className="text-white/80">Capienza:</b> {stadium.capacity}</li>
                    <li><b className="text-white/80">Prezzo biglietto:</b> {stadium.ticketPrice}</li>
                  </ul>
                ) : (
                  <p className="text-white/70">Nessuno stadio collegato.</p>
                )}
              </Panel>

              {/* Colonna 3: Scadenze */}
              <Panel title="Contratti in evidenza" className="xl:col-span-1">
                {expiring.length === 0 && <p className="text-white/70 text-sm">Nessuna scadenza imminente.</p>}
                {expiring.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {expiring.map(c => (
                      <li key={c.id} className="flex items-center justify-between">
                        <span className="truncate">{c.playerName}</span>
                        <span className="text-white/60">{c.endYear}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {/* Tabella contratti, full‑width */}
              <Panel title="Rosa e contratti" className="xl:col-span-3">
                {!contracts.length ? (
                  <p className="text-white/70 text-sm">Nessun contratto.</p>
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
                        {contracts.map(c => (
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
          </>
        )}
      </div>
    </AppShell>
  );
}
