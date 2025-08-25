"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useUserRole } from "@/hooks/useUserRole";

type NavItem = { href: string; label: string; emoji: string; adminOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", emoji: "🏠" },
  { href: "/contracts", label: "Contratti", emoji: "📝" },
  { href: "/stadium", label: "Stadio", emoji: "🏟️" },
  { href: "/history", label: "Storico", emoji: "🕰️" },
  { href: "/standings", label: "Classifica", emoji: "📊" },
  { href: "/admin", label: "Admin", emoji: "🛡️", adminOnly: true },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "flex items-center gap-3 px-4 py-2 rounded-xl transition-colors",
        active ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10",
      ].join(" ")}
    >
      <span className="text-lg leading-none">{item.emoji}</span>
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useUserRole(); // "admin" | "manager" | null

  return (
    <div className="min-h-screen flex bg-slate-50" suppressHydrationWarning>
      {/* Sidebar */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col gap-4 p-4 text-white"
        style={{
          backgroundImage:
            "var(--sidebar-gradient, linear-gradient(180deg, #5865F2 0%, #7C3AED 100%))",
          boxShadow: "inset -1px 0 0 rgba(255,255,255,.12)",
        }}
      >
        <div className="px-2 pt-1 pb-3">
          <Link href="/dashboard" className="block">
            <div className="text-white text-xl font-extrabold tracking-wide">FantaClub</div>
            <div className="text-white/80 text-xs">SideApp</div>
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {NAV_ITEMS.filter((n) => (n.adminOnly ? role === "admin" : true)).map((n) => {
            const active = pathname === n.href || pathname?.startsWith(n.href + "/");
            return <NavLink key={n.href} item={n} active={!!active} />;
          })}
        </nav>

        <div className="text-[11px] text-white/70 px-2">
          Sidebar theming via <code>--sidebar-gradient</code>
        </div>
      </aside>

      {/* Topbar mobile neutra */}
      <header className="md:hidden sticky top-0 z-20 w-full bg-white/80 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold">FantaClub</Link>
          <nav className="flex items-center gap-3 text-sm text-slate-700">
            <Link href="/contracts">Contratti</Link>
            <Link href="/stadium">Stadio</Link>
            <Link href="/history">Storico</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-w-0 text-slate-900">
        <div className="max-w-6xl mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
