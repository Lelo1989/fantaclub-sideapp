// server component
import type { Metadata } from "next";
import "./globals.css";
import "./theme-fm.css";          // 👈 aggiungi questa riga

export const metadata: Metadata = {
  title: "FantaClub SideApp",
  description: "Gestione stile FM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      {/* attiva/disattiva la skin cambiando "fm" */}
      <body className="min-h-screen antialiased fm">{children}</body>
    </html>
  );
}
