"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { accountIdFromQuery: string | null };

type Account = { _id: string; name: string };

export function OnboardingTradeStep({ accountIdFromQuery }: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState(accountIdFromQuery ?? "");
  const [pair, setPair] = useState("EURUSD");
  const [resultDollar, setResultDollar] = useState(50);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/accounts", { cache: "no-store" });
      if (!response.ok) return;
      const body = await response.json();
      const items = body.data ?? [];
      setAccounts(items);
      setAccountId((previous) => previous || accountIdFromQuery || items[0]?._id || "");
    })();
  }, [accountIdFromQuery]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        date: new Date().toISOString(),
        pair,
        orderType: "buy",
        lot: 0.1,
        setup: "Breakout",
        strategy: "Breakout",
        session: "london",
        rpt: 1,
        rrRatio: 2,
        issue: resultDollar >= 0 ? "tp" : "sl",
        resultDollar,
        resultPercent: resultDollar / 100,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Impossible de créer le trade.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required>
        {accounts.map((account) => (
          <option key={account._id} value={account._id}>
            {account.name}
          </option>
        ))}
      </select>
      <input value={pair} onChange={(event) => setPair(event.target.value.toUpperCase())} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
      <input type="number" step="0.01" value={resultDollar} onChange={(event) => setResultDollar(Number(event.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
        {loading ? "Enregistrement..." : "Ajouter mon premier trade"}
      </button>
    </form>
  );
}
