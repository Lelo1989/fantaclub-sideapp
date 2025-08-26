'use client';

import { useEffect, useState } from 'react';

/**
 * Dock di debug che non provoca hydration mismatch:
 * - non rende nulla in SSR
 * - non rende nulla al 1° render client (prima del mount)
 * - si attiva solo se NEXT_PUBLIC_DEBUG === "1"
 */
export default function DebugDock(props: { children?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    // attivalo solo se hai messo NEXT_PUBLIC_DEBUG=1
    if (process.env.NEXT_PUBLIC_DEBUG === '1') {
      setEnabled(true);
      try {
        // opzionale: esponi il flag globale per altri log
        (window as any).FC_DEBUG = true;
      } catch {}
    }
  }, []);

  // SSR: mounted = false → null (markup identico server/client)
  // 1° render client: mounted = false → null (no mismatch)
  if (!mounted || !enabled) return null;

  return (
    <div
      // se proprio vuoi zittire qualsiasi micro differenza, puoi aggiungere:
      // suppressHydrationWarning
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,.6)',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: 8,
        fontSize: 12,
        maxWidth: 340,
        backdropFilter: 'blur(6px)',
      }}
    >
      {props.children}
    </div>
  );
}
