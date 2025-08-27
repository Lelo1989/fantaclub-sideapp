// src/components/TableSkeleton.tsx
"use client";

import Skeleton from "./Skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto rounded border border-white/20">
      <table className="w-full">
        <thead className="bg-white/10">
          <tr>
            {[...Array(5)].map((_, i) => (
              <th key={i} className="p-2 text-left">
                <Skeleton className="h-4 w-24" aria-label={`Colonna ${i + 1}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, r) => (
            <tr key={r} className="border-t border-white/10">
              {[...Array(5)].map((__, c) => (
                <td key={c} className="p-2">
                  <Skeleton
                    className="h-4 w-full"
                    aria-label={`Cella r${r + 1} c${c + 1}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
