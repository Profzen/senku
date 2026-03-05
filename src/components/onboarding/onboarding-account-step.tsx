"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingAccountStep() {
  const router = useRouter();
  const [name, setName] = useState("Mon compte");
  const [broker, setBroker] = useState("FTMO");
  const [type, setType] = useState<"personal" | "prop" | "challenge" | "virtual">("personal");
  const [currency, setCurrency] = useState("USD");
  const [initialBalance, setInitialBalance] = useState(10000);
  const [targetBalance, setTargetBalance] = useState(12000);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        broker,
        type,
        currency,
        initialBalance,
        targetBalance,
        status: "active",
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Impossible de créer le compte.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-slate-400">Nom du compte</label>
        <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Broker</label>
        <input value={broker} onChange={(event) => setBroker(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Type</label>
          <select value={type} onChange={(event) => setType(event.target.value as "personal" | "prop" | "challenge" | "virtual")} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="personal">Personnel</option>
            <option value="prop">Prop Firm</option>
            <option value="challenge">Challenge</option>
            <option value="virtual">Test</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Devise</label>
          <input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Solde initial</label>
          <input type="number" min={0} value={initialBalance} onChange={(event) => setInitialBalance(Number(event.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Objectif</label>
          <input type="number" min={0} value={targetBalance} onChange={(event) => setTargetBalance(Number(event.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
        </div>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
        {loading ? "Création..." : "Terminer la configuration"}
      </button>
    </form>
  );
}
