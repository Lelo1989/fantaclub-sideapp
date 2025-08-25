"use client";

import { Goal } from "lucide-react";

/**
 * Campo da calcio (mezza vista) statico, solo estetico.
 * Usa SVG, quindi è super leggero e responsive.
 */
export default function Pitch() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-emerald-900/40">
      {/* Intestazione */}
      <div className="absolute top-2 left-2 flex items-center gap-2 text-white/80 text-xs">
        <Goal className="w-4 h-4" />
        <span>Schema tattico (placeholder)</span>
      </div>

      {/* Rapporto 4:5 per ricordare FM (altezza maggiore) */}
      <div className="aspect-[4/5] w-full">
        <svg viewBox="0 0 100 120" className="h-full w-full">
          {/* Sfondo prato */}
          <defs>
            <pattern id="grass" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#064e3b" />
              <rect width="10" height="5" fill="#065f46" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="120" fill="url(#grass)" />

          {/* Linee campo */}
          <g stroke="white" strokeOpacity="0.85" strokeWidth="0.6" fill="none">
            {/* Linea laterale (mezza) */}
            <rect x="2.5" y="2.5" width="95" height="115" rx="2" />
            {/* Area di rigore */}
            <rect x="2.5" y="30" width="30" height="60" />
            {/* Area piccola */}
            <rect x="2.5" y="45" width="12" height="30" />
            {/* Porta */}
            <rect x="2.5" y="56" width="3" height="18" />
            {/* Dischetto e semicerchio */}
            <circle cx="32.5" cy="60" r="1.2" fill="white" />
            <path d="M32.5 40 a20 20 0 0 1 0 40" />
            {/* Linea di fondo */}
            <line x1="2.5" y1="2.5" x2="2.5" y2="117.5" />
          </g>

          {/* Segnaposto pedine (solo visual, niente drag&drop per ora) */}
          <g>
            {[
              { x: 22, y: 60 },  // GK
              { x: 38, y: 30 },  // D
              { x: 38, y: 90 },  // D
              { x: 58, y: 45 },  // C
              { x: 58, y: 75 },  // C
              { x: 78, y: 60 },  // A
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3.6" fill="#22d3ee" opacity="0.9" />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
