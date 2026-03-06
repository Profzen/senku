/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { JournalManager } from "@/components/journal/journal-manager";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { onAccountsChanged, onTradesChanged } from "@/lib/client-events";

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
  };
  equityCurve: Array<{ date: string; balance: number }>;
  strategyBreakdown: Array<{ name: string; value: number }>;
};

type TradeRow = {
  _id: string;
  date: string;
  pair: string;
  orderType: string;
  strategy: string;
  rrRatio: number;
  issue?: string;
  resultDollar?: number;
  status?: "open" | "closed";
};

type DashboardTab = "overview" | "journal" | "calendar";

const fieldClass = "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100";
const tabButtonClass = "h-10 rounded-lg px-4 text-sm font-medium";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function DashboardPageClient() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [accounts, setAccounts] = useState<Array<{ _id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pair, setPair] = useState("");
  const [strategy, setStrategy] = useState("");
  const [result, setResult] = useState("");

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/accounts", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    const loadedAccounts = body.data ?? [];
    setAccounts(loadedAccounts);
    if (!accountId && loadedAccounts.length) {
      setAccountId(loadedAccounts[0]._id);
    }
  }, [accountId]);

  const loadDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;

    const params = new URLSearchParams();
    if (accountId) params.set("accountId", accountId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (pair) params.set("pair", pair);
    if (strategy) params.set("strategy", strategy);
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
  }, [session?.user?.id, accountId, from, to, pair, strategy, result]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const disposeTrades = onTradesChanged(() => {
      void loadDashboardData();
    });
    const disposeAccounts = onAccountsChanged(() => {
      void loadAccounts();
      void loadDashboardData();
    });

    return () => {
      disposeTrades();
      disposeAccounts();
    };
  }, [loadAccounts, loadDashboardData]);

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
      },
    [stats],
  );

  const calendarRows = useMemo(() => {
    const map = new Map<string, { trades: number; closed: number; pnl: number }>();

    for (const trade of trades) {
      const key = new Date(trade.date).toISOString().slice(0, 10);
      const current = map.get(key) ?? { trades: 0, closed: 0, pnl: 0 };
      current.trades += 1;
      if ((trade.status ?? "closed") === "closed") {
        current.closed += 1;
        current.pnl += trade.resultDollar ?? 0;
      }
      map.set(key, current);
    }

    return Array.from(map.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 20);
  }, [trades]);

  return (
    <div className="min-w-0 space-y-4">
      {status === "loading" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">Chargement de la session...</div>
      )}

      <header className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3">
          <h1 className="text-lg font-semibold">Tableau de bord</h1>
          <p className="text-xs text-slate-400">Espace unifié: vue globale, journal et calendrier.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Compte</label>
            <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className={fieldClass}>
              <option value="">Tous les comptes</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Date de début</label>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={fieldClass} />
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Date de fin</label>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={fieldClass} />
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Actif</label>
            <input value={pair} onChange={(event) => setPair(event.target.value.toUpperCase())} className={fieldClass} placeholder="EURUSD" />
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Stratégie</label>
            <input value={strategy} onChange={(event) => setStrategy(event.target.value)} className={fieldClass} placeholder="Price Action" />
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Résultat</label>
            <select value={result} onChange={(event) => setResult(event.target.value)} className={fieldClass}>
              <option value="">Tous</option>
              <option value="winner">Gagnants</option>
              <option value="loser">Perdants</option>
              <option value="breakeven">À l&apos;équilibre</option>
            </select>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveTab("overview")} className={`${tabButtonClass} ${activeTab === "overview" ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-200 hover:bg-slate-800"}`}>
            Vue générale
          </button>
          <button type="button" onClick={() => setActiveTab("journal")} className={`${tabButtonClass} ${activeTab === "journal" ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-200 hover:bg-slate-800"}`}>
            Journal
          </button>
          <button type="button" onClick={() => setActiveTab("calendar")} className={`${tabButtonClass} ${activeTab === "calendar" ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-200 hover:bg-slate-800"}`}>
            Calendrier
          </button>
        </div>
      </section>

      {activeTab === "overview" && (
        <>
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
                <span>Résultat net</span>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </div>
              <p className={`font-mono text-lg ${kpis.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatMoney(kpis.netPnl)}</p>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Taux de réussite</span>
                <Target className="h-4 w-4 text-violet-500" />
              </div>
              <p className="font-mono text-lg">{kpis.winRate.toFixed(1)}%</p>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Ratio gain/risque moyen</span>
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
              <p className="font-mono text-lg">{kpis.avgRR.toFixed(2)}</p>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Repli maximal</span>
                <ShieldAlert className="h-4 w-4 text-rose-500" />
              </div>
              <p className="font-mono text-lg text-rose-400">-{kpis.currentDrawdown.toFixed(2)}%</p>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Nombre de transactions</span>
                <Activity className="h-4 w-4 text-violet-400" />
              </div>
              <p className="font-mono text-lg text-violet-300">{kpis.tradeCount}</p>
            </article>
          </section>

          <DashboardCharts equityCurve={stats?.equityCurve ?? []} strategyBreakdown={stats?.strategyBreakdown ?? []} />

          <section className="rounded-xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold">Transactions récentes</h2>
            </div>
            <div className="space-y-3 p-3 xl:hidden">
              {trades.slice(0, 10).map((trade) => (
                <article key={trade._id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{trade.pair} · {trade.orderType.toUpperCase()}</p>
                      <p className="text-xs text-slate-400">{new Date(trade.date).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${(trade.status ?? "closed") === "open" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                      {(trade.status ?? "closed") === "open" ? "En cours" : "Clôturé"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300"><span className="text-slate-400">Stratégie:</span> {trade.strategy}</p>
                  <p className="text-xs text-slate-300"><span className="text-slate-400">R/R:</span> {trade.rrRatio.toFixed(2)}</p>
                  <p className="text-xs text-slate-300"><span className="text-slate-400">Issue:</span> {trade.issue || "-"}</p>
                  <p className={`mt-2 font-mono text-sm ${typeof trade.resultDollar === "number" && trade.resultDollar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {typeof trade.resultDollar === "number" ? formatMoney(trade.resultDollar) : "-"}
                  </p>
                </article>
              ))}
              {!trades.length && <p className="rounded-lg border border-slate-800 px-4 py-8 text-center text-sm text-slate-400">Aucune transaction trouvée pour ces filtres.</p>}
            </div>

            <div className="hidden xl:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actif</th>
                    <th className="px-4 py-3">Ordre</th>
                    <th className="px-4 py-3">Stratégie</th>
                    <th className="px-4 py-3">R/R</th>
                    <th className="px-4 py-3">Issue</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 10).map((trade) => (
                    <tr key={trade._id} className="border-t border-slate-800 text-slate-200">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{new Date(trade.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3">{trade.pair}</td>
                      <td className="px-4 py-3 uppercase">{trade.orderType}</td>
                      <td className="px-4 py-3">{trade.strategy}</td>
                      <td className="px-4 py-3 font-mono">{trade.rrRatio.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {trade.issue ? <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-xs">{trade.issue}</span> : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${(trade.status ?? "closed") === "open" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                          {(trade.status ?? "closed") === "open" ? "En cours" : "Clôturé"}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${typeof trade.resultDollar === "number" && trade.resultDollar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {typeof trade.resultDollar === "number" ? formatMoney(trade.resultDollar) : "-"}
                      </td>
                    </tr>
                  ))}
                  {!trades.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={8}>
                        Aucune transaction trouvée pour ces filtres.
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
              Données synchronisées avec les API et MongoDB.
            </div>
          </footer>
        </>
      )}

      {activeTab === "journal" && <JournalManager />}

      {activeTab === "calendar" && (
        <section className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <CalendarDays className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold">Calendrier des performances</h2>
          </div>
          <div className="space-y-3 p-3 lg:hidden">
            {calendarRows.map((row) => (
              <article key={row.date} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm font-semibold text-slate-100">{new Date(row.date).toLocaleDateString("fr-FR")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <p><span className="text-slate-400">Transactions:</span> {row.trades}</p>
                  <p><span className="text-slate-400">Clôturées:</span> {row.closed}</p>
                </div>
                <p className={`mt-2 font-mono text-sm ${row.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatMoney(row.pnl)}</p>
              </article>
            ))}
            {!calendarRows.length && <p className="rounded-lg border border-slate-800 px-4 py-8 text-center text-sm text-slate-400">Aucune donnée calendrier sur la période sélectionnée.</p>}
          </div>

          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Transactions</th>
                  <th className="px-4 py-3">Transactions clôturées</th>
                  <th className="px-4 py-3">Résultat journalier</th>
                </tr>
              </thead>
              <tbody>
                {calendarRows.map((row) => (
                  <tr key={row.date} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3 font-mono">{new Date(row.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">{row.trades}</td>
                    <td className="px-4 py-3">{row.closed}</td>
                    <td className={`px-4 py-3 font-mono ${row.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatMoney(row.pnl)}</td>
                  </tr>
                ))}
                {!calendarRows.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={4}>
                      Aucune donnée calendrier sur la période sélectionnée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
