'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { signOut } from '@/lib/auth';
import { handleLogout } from '@/lib/logout';

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
  const router = useRouter();
  const { role } = useUserRole();
  const isAdmin = role === 'admin';

  const adminItems: NavItem[] = useMemo(
    () =>
      isAdmin
        ? [
            {
              href: '/admin',
              label: 'Admin',
              match: (p) => p === '/admin',
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
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>v1.0</span>
              <button
                className="px-2 py-1 rounded-md border hover:bg-neutral-100"
                onClick={() => handleLogout(router, signOut)}
              >
                Esci
              </button>
            </div>
          </div>
        </div>

        {/* Page body */}
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
