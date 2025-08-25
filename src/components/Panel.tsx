"use client";

export default function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold tracking-wide text-white">{title}</h2>
          {right}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
