// src/hooks/useCurrentSeasonId.ts
'use client';

import { useEffect, useState } from 'react';

/** Mantiene sincronizzato il seasonId passato (es. da team.seasonId) */
export function useCurrentSeasonId(initial?: string | null) {
  const [seasonId, setSeasonId] = useState<string | null>(initial ?? null);
  useEffect(() => {
    setSeasonId(initial ?? null);
  }, [initial]); // 🔑 si aggiorna quando cambia l'input
  return seasonId;
}
