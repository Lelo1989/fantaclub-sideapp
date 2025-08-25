// src/hooks/useUserRole.ts
"use client";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<"admin"|"manager"|null>(null);
  useEffect(() => { (async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    setRole((snap.data() as any)?.role ?? "manager");
  })(); }, [user]);
  return role;
}
