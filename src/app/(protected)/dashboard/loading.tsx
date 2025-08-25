// src/app/(protected)/dashboard/loading.tsx
import { CardSkeleton } from "@/components/CardSkeleton";
import { TableSkeleton } from "@/components/TablSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <div className="md:col-span-2">
          <TableSkeleton rows={6} />
        </div>
      </div>
    </main>
  );
}
