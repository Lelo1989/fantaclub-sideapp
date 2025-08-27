// src/hooks/useUserRole.ts
"use client";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type UserDoc = {
  role?: "admin" | "manager";
};

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<"admin" | "manager" | null>(null);

  useEffect(() => {
    let canceled = false;

    if (!user) {
      setRole(null);
      return;
    }

    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (canceled) return;
      const data = snap.exists() ? (snap.data() as UserDoc) : null;
      setRole(data?.role ?? "manager");
    })();

    return () => {
      canceled = true;
    };
  }, [user]);

  return role;
}
