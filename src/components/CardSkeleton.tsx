// src/components/CardSkeleton.tsx
"use client";

import Skeleton from "./Skeleton";

export function CardSkeleton() {
  return (
    <div className="rounded border border-white/20 p-4 space-y-3">
      <Skeleton className="h-6 w-32" aria-label="Titolo card in caricamento" />
      <Skeleton className="h-4 w-3/4" aria-label="Riga 1" />
      <Skeleton className="h-4 w-2/3" aria-label="Riga 2" />
      <Skeleton className="h-4 w-1/2" aria-label="Riga 3" />
    </div>
  );
}
