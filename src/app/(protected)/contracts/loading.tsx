// src/app/(protected)/contracts/loading.tsx
import { TableSkeleton } from "@/components/TableSkeleton";
import { CardSkeleton } from "@/components/CardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Gestione contratti</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
      <div className="mt-6">
        <TableSkeleton rows={8} />
      </div>
    </main>
  );
}
