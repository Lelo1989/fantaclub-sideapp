"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!user) { router.replace("/login"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.exists() ? (snap.data() as any).role : null;
      if (role === "admin") setOk(true);
      else router.replace("/dashboard");
    })();
  }, [user, loading, router]);

  if (!ok) return (
    <div className="min-h-screen grid place-items-center">
      <p>Verifica permessi…</p>
    </div>
  );

  return <>{children}</>;
}
