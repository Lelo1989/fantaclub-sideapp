// src/app/(protected)/layout.tsx
import React from "react";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
