"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (response.ok) {
      setMessage("Mot de passe mis à jour. Tu peux te reconnecter.");
    } else {
      const body = await response.json().catch(() => ({}));
      setMessage(body?.error ?? "Impossible de réinitialiser le mot de passe.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-slate-300">Token</label>
        <input
          type="text"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-300">Nouveau mot de passe</label>
        <input
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
      </button>

      {message && <p className="text-sm text-slate-300">{message}</p>}

      <p className="text-sm text-slate-400">
        Retour à{" "}
        <Link href="/login" className="text-slate-200 hover:text-white">
          la connexion
        </Link>
      </p>
    </form>
  );
}
