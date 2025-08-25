"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth";
import {
  LogOut,
  LayoutDashboard,
  ListOrdered,
  FileText,
  Building2,
  Users,
  Users2,
  Shield,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rosa", label: "Rosa", icon: Users },
  { href: "/standings", label: "Classifica", icon: ListOrdered },
  { href: "/contracts", label: "Contratti", icon: FileText },
  { href: "/stadium", label: "Stadio", icon: Building2 },
  { href: "/history", label: "Storico", icon: Users2 },
  { href: "/admin", label: "Admin", icon: Shield },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0b0b0c,_#0b0b0c_50%,_#0e0e11_60%,_#121216_100%)] text-white">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="px-5 py-4">
          <div className="text-lg font-extrabold tracking-wide">FantaClub</div>
          <div className="text-xs text-white/60">SideApp • Manager Hub</div>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {nav.map((n) => {
            const active = pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition " +
                  (active
                    ? "bg-white/10 ring-1 ring-white/15"
                    : "hover:bg-white/5")
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black py-2 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </aside>

      {/* Topbar (mobile/tablet) */}
      <header className="lg:ml-64 sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur supports-[backdrop-filter]:bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="font-bold tracking-wide">FantaClub</div>
          <div className="ml-auto flex lg:hidden gap-2 text-xs">
            {nav.slice(0, 4).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-2 py-1 rounded bg-white/10"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
