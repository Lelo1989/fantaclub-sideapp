"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import Panel from "@/components/Panel";
import { Shield } from "lucide-react";

type UserRow = { id: string; email: string; displayName?: string; role?: string; teamId?: string | null };
type TeamRow = { id: string; name: string; ownerUserId?: string | null; budget: number; seasonId: string };

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const uSnap = await getDocs(query(collection(db, "users"), orderBy("email", "asc")));
      const tSnap = await getDocs(query(collection(db, "teams"), orderBy("name", "asc")));
      setUsers(uSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setTeams(tSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    })();
  }, []);

  const teamOptions = useMemo(
    () => [{ id: "", name: "— Nessuno —" }, ...teams.map((t) => ({ id: t.id, name: t.name }))],
    [teams]
  );

  async function assignTeam(userId: string, teamId: string) {
    setSaving(userId);
    try {
      await updateDoc(doc(db, "users", userId), { teamId: teamId || null });
      if (teamId) await updateDoc(doc(db, "teams", teamId), { ownerUserId: userId });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, teamId: teamId || null } : u)));
    } finally {
      setSaving(null);
    }
  }

  return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-white/70" />
            Admin
          </h1>
        </div>

        {loading ? (
          <p className="text-white/70">Caricamento sezione admin…</p>
        ) : (
          <>
            <Panel title="Utenti ↔ Squadre">
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-[13px] leading-tight">
                  <thead className="bg-white/[0.06] text-white/90">
                    <tr>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Ruolo</th>
                      <th className="text-left p-2">Team assegnato</th>
                      <th className="text-right p-2">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr]:border-t [&_tr]:border-white/10">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.03] odd:bg-white/[0.015]">
                        <td className="p-2">{u.displayName ?? "—"}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role ?? "manager"}</td>
                        <td className="p-2">
                          <select
                            className="bg-neutral-800 border border-white/20 rounded px-2 py-1"
                            defaultValue={u.teamId ?? ""}
                            onChange={(e) => assignTeam(u.id, e.target.value)}
                            disabled={saving === u.id}
                          >
                            {teamOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-right">
                          {saving === u.id ? <span>Salvo…</span> : <span className="text-white/60">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <TeamEditor teams={teams} />
          </>
        )}
      </div>
  );
}

function TeamEditor({ teams }: { teams: TeamRow[] }) {
  const [local, setLocal] = useState<Record<string, Partial<TeamRow>>>({});

  function bind(id: string, key: keyof TeamRow) {
    return {
      value: (local[id]?.[key] ?? (teams.find((t) => t.id === id)?.[key] as any) ?? ""),
      onChange: (e: any) => setLocal((prev) => ({ ...prev, [id]: { ...prev[id], [key]: e.target.valueAsNumber ?? e.target.value } })),
    };
  }

  async function save(id: string) {
    const payload = local[id];
    if (!payload) return;
    await updateDoc(doc(db, "teams", id), { ...(payload.budget !== undefined ? { budget: Number(payload.budget) } : {}) });
    setLocal((prev) => { const { [id]: _, ...rest } = prev; return rest; });
  }

  return (
    <Panel title="Team (budget)">
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-[13px] leading-tight">
          <thead className="bg-white/[0.06] text-white/90">
            <tr>
              <th className="text-left p-2">Team</th>
              <th className="text-left p-2">Season</th>
              <th className="text-right p-2">Budget</th>
              <th className="text-right p-2">Azione</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-t [&_tr]:border-white/10">
            {teams.map((t) => (
              <tr key={t.id} className="hover:bg-white/[0.03] odd:bg-white/[0.015]">
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.seasonId}</td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    className="w-28 bg-neutral-800 border border-white/20 rounded px-2 py-1 text-right"
                    {...bind(t.id, "budget")}
                  />
                </td>
                <td className="p-2 text-right">
                  <button onClick={() => save(t.id)} className="px-3 py-1 rounded bg-white text-black">Salva</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StadiumEditor />
    </Panel>
  );
}

function StadiumEditor() {
  const [rows, setRows] = useState<Array<{ id: string; teamId: string; name: string; capacity: number; ticketPrice: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const sSnap = await getDocs(query(collection(db, "stadiums"), orderBy("name", "asc")));
      const temp = sSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(temp);
      setLoading(false);
    })();
  }, []);

  async function saveRow(id: string, patch: Partial<{ capacity: number; ticketPrice: number }>) {
    await updateDoc(doc(db, "stadiums", id), patch as any);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Stadi</h3>
      {loading ? (
        <p className="text-white/70 text-sm">Carico stadi…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-[13px] leading-tight">
            <thead className="bg-white/[0.06] text-white/90">
              <tr>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Team</th>
                <th className="text-right p-2">Capienza</th>
                <th className="text-right p-2">Prezzo biglietto</th>
                <th className="text-right p-2">Azione</th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-t [&_tr]:border-white/10">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03] odd:bg-white/[0.015]">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.teamId}</td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      defaultValue={r.capacity}
                      onChange={(e) => saveRow(r.id, { capacity: Number(e.target.value) })}
                      className="w-28 bg-neutral-800 border border-white/20 rounded px-2 py-1 text-right"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="1"
                      defaultValue={r.ticketPrice}
                      onChange={(e) => saveRow(r.id, { ticketPrice: Number(e.target.value) })}
                      className="w-28 bg-neutral-800 border border-white/20 rounded px-2 py-1 text-right"
                    />
                  </td>
                  <td className="p-2 text-right text-white/60">Auto‑salva su modifica</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
