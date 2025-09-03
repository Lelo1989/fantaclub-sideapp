"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showLoginLink, setShowLoginLink] = useState(false);

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [loading, user, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setShowLoginLink(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

  return (
    <main className="min-h-screen grid place-items-center gap-2">
      <p>Reindirizzamento…</p>
      {showLoginLink && (
        <a href="/login" className="underline">
          Vai al login
        </a>
      )}
    </main>
  );
}
