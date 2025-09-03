// src/components/AuthProvider.tsx
"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthCtx = { user: User | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ user: null, loading: true });

export function useAuth() {
  return useContext(Ctx);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      console.log("[AuthProvider] Auth state changed", u);
      setUser(u);
      setLoading(false);
    });
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("[AuthProvider] auth loading timeout");
          return false;
        }
        return prev;
      });
    }, 5000);
    return () => {
      off();
      clearTimeout(timeout);
    };
  }, []);

  return <Ctx.Provider value={{ user, loading }}>{children}</Ctx.Provider>;
}
