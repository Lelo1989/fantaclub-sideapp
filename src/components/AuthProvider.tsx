// src/components/AuthProvider.tsx
"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import logger from "@/lib/logger";

type AuthCtx = { user: User | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ user: null, loading: true });

export function useAuth() {
  return useContext(Ctx);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off: (() => void) | undefined;
    try {
      off = onAuthStateChanged(auth, (u) => {
        logger.info("[AuthProvider] Auth state changed", u);
        setUser(u);
        setLoading(false);
      });
    } catch (error) {
      logger.error("[AuthProvider] onAuthStateChanged error", error);
      setLoading(false);
    }
    if (!off) {
      logger.error("[AuthProvider] onAuthStateChanged did not return a handler");
      setLoading(false);
    }
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          logger.warn("[AuthProvider] auth loading timeout");
          return false;
        }
        return prev;
      });
    }, 5000);
    return () => {
      if (off) {
        off();
      }
      clearTimeout(timeout);
    };
  }, []);

  return <Ctx.Provider value={{ user, loading }}>{children}</Ctx.Provider>;
}
