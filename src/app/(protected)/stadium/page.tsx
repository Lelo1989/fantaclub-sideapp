"use client";

import { useTeamData } from "@/hooks/useTeamData";
import Panel from "@/components/Panel";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { registerMatchRevenue } from "@/lib/revenue";

export default function StadiumPage() {
  const { team, stadium, loading } = useTeamData();
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

      {loading && <p className="text-white/70">Caricamento…</p>}
      {!loading && !team && (
        <Panel title="Setup richiesto">Nessun team assegnato.</Panel>
      )}

      {!loading && team && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Dati stadio */}
          <Panel title="Dati stadio">
            {stadium ? (
              <ul className="text-sm leading-6">
                <li>
                  <b className="text-white/80">Nome:</b> {stadium.name}
                </li>
                <li>
                  <b className="text-white/80">Capienza:</b> {stadium.capacity ?? "—"}
                </li>
                <li>
                  <b className="text-white/80">Prezzo biglietto:</b>{" "}
                  {stadium.ticketPrice ?? "—"}
                </li>
              </ul>
            ) : (
              <p className="text-white/70">Stadio non collegato.</p>
            )}
          </Panel>

          {/* Simulatore incasso */}
          <Panel title="Simulatore incasso">
            {!stadium ? (
              <p>Collega uno stadio al team per simulare incassi.</p>
            ) : (
              (() => {
                // === GUARDIE TIPOLOGICHE ===
                // Estraggo e verifico i valori che in revenue.ts sono obbligatori (number/string)
                const capacity = stadium.capacity; // number | undefined
                const price = stadium.ticketPrice; // number | undefined
                const seasonId = team?.seasonId; // string | undefined

                if (capacity == null || price == null || !seasonId) {
                  return (
                    <div className="space-y-2 text-sm">
                      <p className="text-white/80">
                        Configurazione stadio incompleta:
                      </p>
                      {capacity == null && <div>- Capienza mancante</div>}
                      {price == null && <div>- Prezzo biglietto mancante</div>}
                      {!seasonId && <div>- SeasonId mancante sul team</div>}
                      <p className="text-white/60">
                        Completa i dati per abilitare la simulazione dell’incasso.
                      </p>
                    </div>
                  );
                }

                // Da qui in poi TS sa che capacity e price sono number e seasonId è string.
                const cappedAttendance = Math.min(attendance, capacity);
                const estimated = cappedAttendance * price;

                return (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await registerMatchRevenue({
                          teamId: team.id,
                          stadiumId: stadium.id,
                          stadiumCapacity: capacity, // ✅ number
                          ticketPrice: price, // ✅ number
                          attendance, // ✅ number
                          opponent: opponent || "", // opzionale
                          seasonId, // ✅ string
                        });
                        alert(
                          `Incasso registrato: € ${res.revenue} (presenze conteggiate: ${res.cappedAttendance})`
                        );
                      } catch (error) {
                        console.error("Errore nella registrazione dell'incasso", error);
                        alert(
                          "Si è verificato un errore durante la registrazione dell'incasso."
                        );
                      }
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
                      <label className="block text-sm">
                        Presenze stimate (0 – {capacity})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={capacity}
                        className="w-full bg-neutral-800 border border-white/20 rounded px-2 py-1"
                        value={attendance}
                        onChange={(e) => setAttendance(Math.max(0, Math.min(Number(e.target.value) || 0, capacity)))}
                      />
                      <p className="text-sm text-white/70 mt-1">
                        Incasso previsto: {estimated}
                      </p>
                    </div>

                    <button className="px-4 py-2 rounded bg-white text-black font-semibold">
                      Registra incasso
                    </button>
                  </form>
                );
              })()
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
