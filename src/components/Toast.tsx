// src/components/Toast.tsx
"use client";
import { useEffect, useState } from "react";
let pushToast: (msg: string) => void;
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { pushToast = (m) => { setMsg(m); setTimeout(()=>setMsg(null), 2500); }; }, []);
  if (!msg) return null;
  return <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded">{msg}</div>;
}
export function toast(m: string) { pushToast?.(m); }
