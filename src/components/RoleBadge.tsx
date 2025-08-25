"use client";

const map: Record<string, string> = {
  P: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30",
  D: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  C: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  A: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
};

export function RoleBadge({ role }: { role?: string }) {
  const cls = map[role ?? ""] ?? "bg-white/10 text-white/80 ring-1 ring-white/15";
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>{role ?? "—"}</span>;
}

export function StatusTag({ text }: { text: string }) {
  const ok = ["active","attivo","ok"].includes(text.toLowerCase());
  const cls = ok
    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
    : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}>{text}</span>;
}
