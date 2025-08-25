// src/app/(protected)/layout.tsx
import AuthGate from "@/components/AuthGate";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
