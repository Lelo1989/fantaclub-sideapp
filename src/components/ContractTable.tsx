// src/components/ContractsTable.tsx
"use client";

import type { ContractDoc } from "@/hooks/useTeamData";

export default function ContractsTable({
  contracts,
}: {
  contracts: (ContractDoc & { id: string })[];
}) {
  if (!contracts.length) return <p>Nessun contratto.</p>;

  return (
    <div className="overflow-x-auto rounded border border-white/20">
      <table className="w-full text-sm">
        <thead className="bg-white/10">
          <tr>
            <th className="text-left p-2">Giocatore</th>
            <th className="text-left p-2">Ruolo</th>
            <th className="text-right p-2">Costo</th>
            <th className="text-center p-2">Periodo</th>
            <th className="text-center p-2">Stato</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c.id} className="border-t border-white/10">
              <td className="p-2">{c.playerName}</td>
              <td className="p-2">{c.role ?? "—"}</td>
              <td className="p-2 text-right">{c.cost}</td>
              <td className="p-2 text-center">
                {c.startYear}–{c.endYear}
              </td>
              <td className="p-2 text-center">{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
