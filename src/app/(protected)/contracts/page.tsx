"use client";

import { useAuth } from "@/components/AuthProvider";
import { useTeamData } from "@/hooks/useTeamData";
import { addContract, renewContract, releaseContract } from "@/lib/contracts";
import AppShell from "@/components/AppShell";
import Panel from "@/components/Panel";
import { RoleBadge, StatusTag } from "@/components/RoleBadge";
import { FileText, RotateCcw, UserMinus, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

export default function ContractsPage() {
  const { user } = useAuth();
  const { team, contracts, loading } = useTeamData();

  const [form, setForm] = useState({
    playerName: "",
    role: "C",
    cost: 10,
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
  });
  const currentYear = new Date().getFullYear();

  const expiringSoon = useMemo(
    () => contracts.filter((c) => c.status === "active" && c.endYear <= currentYear),
    [contracts, currentYear]
  );

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;
    await addContract({
      teamId: team.id,
      playerName: form.playerName.trim(),
      role: form.role,
      cost: Number(form.cost),
      startYear: Number(form.startYear),
      endYear: Number(form.endYear),
    });
    setForm((f) => ({ ...f, playerName: "", cost: 10 }));
    alert("Contratto aggiunto e budget aggiornato");
  }

  async function onRenew(cId: string, currentEnd: number) {
    if (!team) return;
    const suggested = currentEnd + 1;
    const input = prompt(`Nuovo anno di scadenza`, String(suggested));
    if (!input) return;
    const y = Number(input);
    if (Number.isNaN(y) || y <= currentEnd) { alert("Anno non valido"); return; }
    await renewContract(cId, { teamId: team.id, currentEnd, newEnd: y, feePerYear: 5 });
    alert("Rinnovo effettuato");
  }

  async function onRelease(cId: string) {
    if (!team) return;
    if (!confirm(`Confermi lo svincolo?`)) return;
    await releaseContract(cId, { teamId: team.id, penalty: 5 });
    alert("Giocatore svincolato");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-white/70" />
            Gestione contratti
          </h1>
          <p className="text-white/60 text-xs sm:text-sm">{user?.email}</p>
        </div>

        {loading && <p className="text-white/70">Caricamento…</p>}
        {!loading && !team && <Panel title="Setup richiesto">Nessun team assegnato.</Panel>}

        {!loading && team && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Nuovo contratto */}
              <Panel title="Nuovo contratto" className="xl:col-span-2" right={<PlusCircle className="w-4 h-4 text-white/60" />}>
                <form onSubmit={onAdd} className="grid sm:grid-cols-5 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-sm">Giocatore</label>
                    <input
                      className="w-full bg-neutral-800 border border-white/20 rounded px-2 py-1"
                      value={form.playerName}
                      onChange={(e) => setForm({ ...form, playerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Ruolo</label>
                    <select
                      className="w-full bg-neutral-800 border border-white/20 rounded px-2 py-1"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option>P</option><option>D</option><option>C</option><option>A</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Costo</label>
                    <input
                      type="number"
                      className="w-full bg-neutral-800 border border-white/20 rounded px-2 py-1 text-right"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Periodo</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        className="w-24 bg-neutral-800 border border-white/20 rounded px-2 py-1 text-right"
                        value={form.startYear}
                        onChange={(e) => setForm({ ...form, startYear: Number(e.target.value) })}
                      />
                      <span className="self-center">→</span>
                      <input
                        type="number"
                        className="w-24 bg-neutral-800 border border-white/20 rounded px-2 py-1 text-right"
                        value={form.endYear}
                        onChange={(e) => setForm({ ...form, endYear: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-5">
                    <button className="px-4 py-2 rounded bg-white text-black font-semibold">Aggiungi</button>
                  </div>
                </form>
              </Panel>

              {/* Regole */}
              <Panel title="Regole (MVP)" className="xl:col-span-1">
                <ul className="text-sm text-white/80 space-y-1">
                  <li>Rinnovo: 5 / anno</li>
                  <li>Penale svincolo: 5</li>
                </ul>
              </Panel>

              {/* Tabella contratti */}
              <Panel title="Rosa e contratti" className="xl:col-span-3">
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full text-[13px] leading-tight">
                    <thead className="bg-white/[0.06] text-white/90">
                      <tr>
                        <th className="text-left p-2">Giocatore</th>
                        <th className="text-left p-2">Ruolo</th>
                        <th className="text-right p-2">Costo</th>
                        <th className="text-center p-2">Periodo</th>
                        <th className="text-center p-2">Stato</th>
                        <th className="text-right p-2">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr]:border-t [&_tr]:border-white/10">
                      {contracts.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.03] odd:bg-white/[0.015]">
                          <td className="p-2">{c.playerName}</td>
                          <td className="p-2"><RoleBadge role={c.role} /></td>
                          <td className="p-2 text-right">{c.cost}</td>
                          <td className="p-2 text-center">{c.startYear}–{c.endYear}</td>
                          <td className="p-2 text-center"><StatusTag text={c.status} /></td>
                          <td className="p-2 text-right space-x-2">
                            <button
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border"
                              onClick={() => onRenew(c.id, c.endYear)}
                            >
                              <RotateCcw className="w-4 h-4" /> Rinnova
                            </button>
                            <button
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border"
                              onClick={() => onRelease(c.id)}
                            >
                              <UserMinus className="w-4 h-4" /> Svincola
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!contracts.length && (
                        <tr><td className="p-2" colSpan={6}>Nessun contratto.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>

              {!!expiringSoon.length && (
                <Panel title={`In scadenza (≤ ${currentYear})`} className="xl:col-span-3">
                  <ul className="list-disc ml-5 text-sm">
                    {expiringSoon.map((c) => (
                      <li key={c.id}>{c.playerName} — fine {c.endYear}</li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
