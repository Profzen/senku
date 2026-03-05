"use client";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BrainCircuit, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

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
  preferences?: {
    notifications: boolean;
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

type TradeRow = {
  _id: string;
  date: string;
  pair: string;
  orderType: string;
  strategy: string;
  rrRatio: number;
  issue: string;
  resultDollar: number;
  session: string;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function DashboardPageClient() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [accounts, setAccounts] = useState<Array<{ _id: string; name: string }>>([]);

  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pair, setPair] = useState("");
  const [strategy, setStrategy] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    const loadAccounts = async () => {
      const response = await fetch("/api/accounts", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const body = await response.json();
      const loadedAccounts = body.data ?? [];
      setAccounts(loadedAccounts);
      if (!accountId && loadedAccounts.length) {
        setAccountId(loadedAccounts[0]._id);
      }
    };

    void loadAccounts();
  }, [accountId]);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const load = async () => {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (pair) params.set("pair", pair);
      if (strategy) params.set("strategy", strategy);
      if (sessionFilter) params.set("session", sessionFilter);
      if (result) params.set("result", result);

      const [statsResponse, tradesResponse] = await Promise.all([
        fetch(`/api/stats?${params.toString()}`),
        fetch(`/api/trades?${params.toString()}`),
      ]);

      if (statsResponse.ok) {
        const statsBody = await statsResponse.json();
        setStats(statsBody.data);
      }

      if (tradesResponse.ok) {
        const tradesBody = await tradesResponse.json();
        setTrades(tradesBody.data ?? []);
      }
    };

    void load();
  }, [session?.user?.id, accountId, from, to, pair, strategy, sessionFilter, result]);

  const kpis = useMemo(
    () =>
      stats?.kpis ?? {
        currentBalance: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnl: 0,
        winRate: 0,
        avgRR: 0,
        profitFactor: 0,
        currentDrawdown: 0,
        tradeCount: 0,
        disciplineScore: 0,
      },
    [stats],
  );

  const propFirm = stats?.propFirm;

  return (
    <div className="space-y-4">
      {status === "loading" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">Chargement de la session...</div>
      )}

      <header className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-slate-400">Vue globale des performances Senku</p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-7">
          <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <option value="">Tous les comptes</option>
            {accounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.name}
              </option>
            ))}
          </select>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          <input value={pair} onChange={(event) => setPair(event.target.value.toUpperCase())} placeholder="Paire" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          <input value={strategy} onChange={(event) => setStrategy(event.target.value)} placeholder="Stratégie" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          <select value={sessionFilter} onChange={(event) => setSessionFilter(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <option value="">Toutes sessions</option>
            <option value="asia">Asie</option>
            <option value="london">Londres</option>
            <option value="new-york">New-York</option>
            <option value="overlap">Overlap</option>
          </select>
          <select value={result} onChange={(event) => setResult(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <option value="">Tous résultats</option>
            <option value="winner">Gagnants</option>
            <option value="loser">Perdants</option>
            <option value="breakeven">Breakeven</option>
          </select>
        </div>
      </section>

      {stats?.preferences?.notifications !== false && propFirm?.enabled && (propFirm.dailyAlert || propFirm.totalAlert) && (
        <section className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3">
          <div className="flex items-start gap-2 text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div className="text-sm">
              <p className="font-medium">Alerte conformité Prop Firm</p>
              <p className="text-xs text-rose-200/90">
                {propFirm.dailyAlert
                  ? `Drawdown journalier ${propFirm.dailyLossPercent.toFixed(2)}% / limite ${propFirm.maxDailyDrawdown.toFixed(2)}%`
                  : null}
                {propFirm.dailyAlert && propFirm.totalAlert ? " · " : ""}
                {propFirm.totalAlert
                  ? `Drawdown global ${propFirm.totalDrawdownPercent.toFixed(2)}% / limite ${propFirm.maxTotalDrawdown.toFixed(2)}%`
                  : null}
              </p>
            </div>
          </div>
        </section>
      )}

      {propFirm?.enabled && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Objectif compte Prop Firm</h2>
              <p className="text-xs text-slate-400">{propFirm.accountName}</p>
            </div>
            <span className="font-mono text-sm text-blue-300">{propFirm.objectiveProgress.toFixed(0)}%</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${Math.max(0, Math.min(100, propFirm.objectiveProgress))}%` }} />
          </div>
          <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-4">
            <p>Actuel: <span className="font-mono">{formatMoney(propFirm.currentBalance)}</span></p>
            <p>Cible: <span className="font-mono">{formatMoney(propFirm.targetBalance)}</span></p>
            <p>Restant: <span className="font-mono text-amber-300">{formatMoney(propFirm.objectiveRemaining)}</span></p>
            <p>DD global: <span className="font-mono text-rose-300">{propFirm.totalDrawdownPercent.toFixed(2)}%</span></p>
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Solde actuel</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="font-mono text-lg">{formatMoney(kpis.currentBalance)}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>P&L net</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <p className={`font-mono text-lg ${kpis.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatMoney(kpis.netPnl)}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Win Rate</span>
            <Target className="h-4 w-4 text-violet-500" />
          </div>
          <p className="font-mono text-lg">{kpis.winRate.toFixed(1)}%</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Avg R:R</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <p className="font-mono text-lg">{kpis.avgRR.toFixed(2)}</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Drawdown</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="font-mono text-lg text-rose-400">-{kpis.currentDrawdown.toFixed(2)}%</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Score discipline</span>
            <BrainCircuit className="h-4 w-4 text-violet-400" />
          </div>
          <p className="font-mono text-lg text-violet-300">{kpis.disciplineScore.toFixed(0)} / 100</p>
        </article>
      </section>

      <DashboardCharts
        equityCurve={stats?.equityCurve ?? []}
        strategyBreakdown={stats?.strategyBreakdown ?? []}
        sessionBreakdown={stats?.sessionBreakdown ?? []}
      />

      <section className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold">Trades récents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Paire</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Stratégie</th>
                <th className="px-4 py-3">R:R</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 8).map((trade) => (
                <tr key={trade._id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{new Date(trade.date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{trade.pair}</td>
                  <td className="px-4 py-3 uppercase">{trade.orderType}</td>
                  <td className="px-4 py-3">{trade.strategy}</td>
                  <td className="px-4 py-3 font-mono">{trade.rrRatio.toFixed(2)}</td>
                  <td className="px-4 py-3 uppercase">{trade.issue}</td>
                  <td className={`px-4 py-3 font-mono ${trade.resultDollar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatMoney(trade.resultDollar)}
                  </td>
                </tr>
              ))}
              {!trades.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={7}>
                    Aucun trade trouvé. Ajoute ton premier trade via l&apos;API pour alimenter le dashboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ArrowDownRight className="h-4 w-4" />
          Données chargées depuis les routes API et MongoDB.
        </div>
      </footer>
    </div>
  );
}
