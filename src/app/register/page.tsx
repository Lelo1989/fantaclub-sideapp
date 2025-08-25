// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { signUpEmail } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await signUpEmail({ email, password, displayName });
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e.message ?? "Errore di registrazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border p-4 rounded">
        <h1 className="text-xl font-bold">Registrati</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div>
          <label className="block text-sm">Nome visualizzato</label>
          <input
            className="w-full border rounded px-2 py-1"
            value={displayName} onChange={(e) => setDisplayName(e.target.value)} required
          />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input
            className="w-full border rounded px-2 py-1"
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input
            className="w-full border rounded px-2 py-1"
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          />
        </div>
        <button
          disabled={loading}
          className="w-full py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {loading ? "Creo account..." : "Crea account"}
        </button>
        <p className="text-sm">
          Hai già un account?{" "}
          <Link className="text-blue-600 underline" href="/login">Accedi</Link>
        </p>
      </form>
    </main>
  );
}
