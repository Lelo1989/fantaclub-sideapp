import { CardSkeleton } from "@/components/CardSkeleton";
import { TableSkeleton } from "@/components/TableSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Rosa</h1>
      <div className="grid xl:grid-cols-3 gap-6">
        <CardSkeleton />
        <div className="xl:col-span-2">
          <TableSkeleton rows={10} />
        </div>
      </div>
    </main>
  );
}
