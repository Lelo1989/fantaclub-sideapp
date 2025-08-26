// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "./theme-fm.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "FantaClub SideApp",
  description: "Gestione stile FM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen antialiased fm">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
