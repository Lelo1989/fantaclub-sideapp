"use client";

import { useTeamData } from "@/hooks/useTeamData";
import AppShell from "@/components/AppShell";
import Panel from "@/components/Panel";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { registerMatchRevenue } from "@/lib/revenue";

export default function StadiumPage() {
  const { team, stadium } = useTeamData();
  const [attendance, setAttendance] = useState<number>(10000);
  const [opponent, setOpponent] = useState<string>("");

  return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-white/70" />
            Stadio
          </h1>
        </div>

        {!team && <Panel title="Setup richiesto">Nessun team assegnato.</Panel>}

        {team && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Dati stadio">
              {stadium ? (
                <ul className="text-sm leading-6">
                  <li><b className="text-white/80">Nome:</b> {stadium.name}</li>
                  <li><b className="text-white/80">Capienza:</b> {stadium.capacity}</li>
                  <li><b className="text-white/80">Prezzo biglietto:</b> {stadium.ticketPrice}</li>
                </ul>
              ) : (
                <p className="text-white/70">Stadio non collegato.</p>
              )}
            </Panel>

            <Panel title="Simulatore incasso">
              {stadium ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await registerMatchRevenue({
                      teamId: team.id,
                      stadiumId: stadium.id,
                      stadiumCapacity: stadium.capacity,
                      ticketPrice: stadium.ticketPrice,
                      attendance,
                      opponent: opponent || "",
                      seasonId: team.seasonId,
                    });
                    alert(`Incasso registrato: € ${res.revenue} (presenze conteggiate: ${res.cappedAttendance})`);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-sm">Avversario (facoltativo)</label>
                    <input
                      className="w-full bg-neutral-800 border border-white/20 rounded px-2 py-1"
                      value={opponent}
                      onChange={(e) => setOpponent(e.target.value)}
                      placeholder="Es. Divano Kiev"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Presenze stimate</label>
                    <input
                      type="number"
                      className="w-full bg-neutral-800 border border-white/20 rounded px-2 py-1"
                      value={attendance}
                      onChange={(e) => setAttendance(Number(e.target.value))}
                      min={0}
                    />
                    <p className="text-white/60 text-sm mt-1">
                      Incasso previsto: {Math.min(attendance, stadium.capacity) * stadium.ticketPrice}
                    </p>
                  </div>
                  <button className="px-4 py-2 rounded bg-white text-black font-semibold">Registra incasso</button>
                </form>
              ) : (
                <p>Collega uno stadio al team per simulare incassi.</p>
              )}
            </Panel>
          </div>
        )}
      </div>
  );
}
