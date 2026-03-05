/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { useCallback, useEffect, useMemo, useState } from "react";

type StatsPayload = {
  kpis: {
    currentBalance: number;
    totalProfit: number;
    totalLoss: number;
    netPnl: number;
    winRate: number;
    avgRR: number;
    profitFactor: number;
    currentDrawdown: number;
    tradeCount: number;
    disciplineScore: number;
  };
  discipline: {
    score: number;
    planFollowRate: number;
    emotionalControl: number;
    revengeCount: number;
    fomoCount: number;
    entries: number;
  };
  propFirm: {
    enabled: boolean;
    dailyLossPercent: number;
    totalDrawdownPercent: number;
    maxDailyDrawdown: number;
    maxTotalDrawdown: number;
    dailyAlert: boolean;
    totalAlert: boolean;
    objectiveProgress: number;
    objectiveRemaining: number;
    currentBalance: number;
    targetBalance: number;
    accountName: string;
    currency: string;
  } | null;
  equityCurve: Array<{ date: string; balance: number }>;
  strategyBreakdown: Array<{ name: string; value: number }>;
  sessionBreakdown: Array<{ name: string; value: number }>;
};

type Account = { _id: string; name: string };

export function StatsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<StatsPayload | null>(null);

  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pair, setPair] = useState("");
  const [strategy, setStrategy] = useState("");
  const [session, setSession] = useState("");
  const [result, setResult] = useState("");

  const loadAccounts = async () => {
    const response = await fetch("/api/accounts", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setAccounts(body.data ?? []);
  };

  const loadStats = useCallback(async () => {
    const params = new URLSearchParams();
    if (accountId) params.set("accountId", accountId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (pair) params.set("pair", pair);
    if (strategy) params.set("strategy", strategy);
    if (session) params.set("session", session);
    if (result) params.set("result", result);

    const response = await fetch(`/api/stats?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setStats(body.data);
  }, [accountId, from, to, pair, strategy, session, result]);

  useEffect(() => {
    void loadAccounts();
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const bestStrategies = useMemo(() => (stats?.strategyBreakdown ?? []).slice().sort((a, b) => b.value - a.value), [stats]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h1 className="mb-3 text-lg font-semibold">Statistiques avancées</h1>
        <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-7">
          <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">Tous les comptes</option>
            {accounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.name}
              </option>
            ))}
          </select>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input value={pair} onChange={(event) => setPair(event.target.value.toUpperCase())} placeholder="Paire" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input value={strategy} onChange={(event) => setStrategy(event.target.value)} placeholder="Stratégie" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <select value={session} onChange={(event) => setSession(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">Toutes sessions</option>
            <option value="asia">Asie</option>
            <option value="london">Londres</option>
            <option value="new-york">New-York</option>
            <option value="overlap">Overlap</option>
          </select>
          <select value={result} onChange={(event) => setResult(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">Tous résultats</option>
            <option value="winner">Gagnants</option>
            <option value="loser">Perdants</option>
            <option value="breakeven">Breakeven</option>
          </select>
        </div>
      </section>

      <DashboardCharts equityCurve={stats?.equityCurve ?? []} strategyBreakdown={stats?.strategyBreakdown ?? []} sessionBreakdown={stats?.sessionBreakdown ?? []} />

      {stats?.propFirm?.enabled && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Conformité Prop Firm</h2>
            <span className="font-mono text-sm text-blue-300">{stats.propFirm.objectiveProgress.toFixed(0)}%</span>
          </div>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${Math.max(0, Math.min(100, stats.propFirm.objectiveProgress))}%` }} />
          </div>
          <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-4">
            <p>DD journalier: {stats.propFirm.dailyLossPercent.toFixed(2)}% / {stats.propFirm.maxDailyDrawdown.toFixed(2)}%</p>
            <p>DD global: {stats.propFirm.totalDrawdownPercent.toFixed(2)}% / {stats.propFirm.maxTotalDrawdown.toFixed(2)}%</p>
            <p>Actuel: {stats.propFirm.currentBalance.toFixed(0)}</p>
            <p>Restant: {stats.propFirm.objectiveRemaining.toFixed(0)}</p>
          </div>
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Score discipline</p>
          <p className="mt-2 font-mono text-lg text-violet-300">{(stats?.discipline.score ?? 0).toFixed(0)} / 100</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Respect du plan</p>
          <p className="mt-2 font-mono text-lg">{(stats?.discipline.planFollowRate ?? 0).toFixed(0)}%</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Contrôle émotionnel</p>
          <p className="mt-2 font-mono text-lg">{(stats?.discipline.emotionalControl ?? 0).toFixed(0)}%</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Revenge trading</p>
          <p className="mt-2 font-mono text-lg text-rose-300">{stats?.discipline.revengeCount ?? 0}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">FOMO détecté</p>
          <p className="mt-2 font-mono text-lg text-amber-300">{stats?.discipline.fomoCount ?? 0}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Classement stratégies</div>
        <div className="divide-y divide-slate-800">
          {bestStrategies.map((row) => (
            <div key={row.name} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate-200">{row.name}</span>
              <span className={`font-mono ${row.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{row.value.toFixed(2)}</span>
            </div>
          ))}
          {!bestStrategies.length && <div className="px-4 py-8 text-center text-sm text-slate-400">Aucune donnée statistique pour ces filtres.</div>}
        </div>
      </section>
    </div>
  );
}
