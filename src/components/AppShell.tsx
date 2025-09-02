'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
// Facoltativo: se vuoi mostrare link admin solo agli admin, abilita la riga sotto
// import { useUserRole } from '@/hooks/useUserRole';

type Props = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', match: (p) => p === '/dashboard' },
  { href: '/contracts', label: 'Contratti', match: (p) => p === '/contracts' },
  { href: '/stadium', label: 'Stadio', match: (p) => p === '/stadium' },
  { href: '/rosa', label: 'Rosa', match: (p) => p === '/rosa' },
  { href: '/history', label: 'Storico', match: (p) => p === '/history' },
  { href: '/standings', label: 'Classifica', match: (p) => p === '/standings' },
];

export default function AppShell({ children }: Props) {
  const pathname = usePathname();

  // Facoltativo: mostra link admin solo se ruolo admin
  // const { role } = useUserRole();
  // const isAdmin = role === 'admin';
  const isAdmin = true; // <-- se vuoi sempre visibile, poi rimetti il controllo con useUserRole

  const adminItems: NavItem[] = useMemo(
    () =>
      isAdmin
        ? [
            {
              href: '/admin',
              label: 'Admin',
              match: (p) => p === '/admin',
            },
            {
              href: '/admin/standings',
              label: 'Admin Classifica',
              match: (p) => p === '/admin/standings',
            },
          ]
        : [],
    [isAdmin]
  );

  const allItems = [...navItems, ...adminItems];

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] bg-neutral-100 text-neutral-900">
      {/* Sidebar */}
      <aside className="sticky top-0 z-20 md:h-screen border-b md:border-b-0 md:border-r border-neutral-200 bg-white">
        <div className="flex items-center gap-2 p-4 border-b border-neutral-200">
          <div className="size-8 rounded-xl bg-neutral-900" />
          <div className="font-semibold">FantaClub SideApp</div>
        </div>
        <nav className="p-2">
          <ul className="flex md:block gap-2 md:gap-0 overflow-x-auto md:overflow-visible">
            {allItems.map((item) => {
              const active = item.match(pathname ?? '');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'block px-3 py-2 rounded-xl md:rounded-lg transition',
                      active
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Content */}
      <main className="min-h-[calc(100vh-56px)] md:min-h-screen">
        {/* Topbar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="font-semibold tracking-tight">Area riservata</div>
            {/* spazio per azioni globali / utente */}
            <div className="text-sm text-neutral-500">v1.0</div>
          </div>
        </div>

        {/* Page body */}
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
