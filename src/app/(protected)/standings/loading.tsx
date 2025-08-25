// src/app/(protected)/standings/loading.tsx  (oppure src/app/standings/loading.tsx)
import { TableSkeleton } from "@/components/TablSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Classifica</h1>
      <TableSkeleton rows={10} />
    </main>
  );
}
