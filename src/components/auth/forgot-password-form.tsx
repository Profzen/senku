"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setToken("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const body = await response.json().catch(() => ({}));

    if (response.ok) {
      setMessage("Si le compte existe, un lien de réinitialisation a été généré.");
      if (body?.data?.resetToken) {
        setToken(body.data.resetToken);
      }
    } else {
      setMessage("Une erreur est survenue.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-slate-300">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Envoi..." : "Générer le lien de réinitialisation"}
      </button>

      {message && <p className="text-sm text-slate-300">{message}</p>}
      {token && (
        <div className="rounded-lg border border-amber-600/40 bg-amber-600/10 p-3 text-xs text-amber-200">
          Token de dev: {token}
          <div className="mt-2">
            Utilise ce token sur la page <Link className="underline" href="/reset-password">reset-password</Link>.
          </div>
        </div>
      )}
    </form>
  );
}
