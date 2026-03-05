/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Account = { _id: string; name: string; currency: string };

type Trade = {
  _id: string;
  accountId: string;
  date: string;
  pair: string;
  orderType: "buy" | "sell";
  lot: number;
  setup: string;
  strategy: string;
  session: "asia" | "london" | "new-york" | "overlap";
  rrRatio: number;
  issue: "tp" | "sl" | "be" | "partial" | "manual";
  resultDollar: number;
  resultPercent: number;
};

type TradeForm = {
  accountId: string;
  date: string;
  pair: string;
  orderType: "buy" | "sell";
  lot: number;
  setup: string;
  strategy: string;
  session: "asia" | "london" | "new-york" | "overlap";
  rpt: number;
  rrRatio: number;
  issue: "tp" | "sl" | "be" | "partial" | "manual";
  resultDollar: number;
  resultPercent: number;
};

const initialForm: TradeForm = {
  accountId: "",
  date: new Date().toISOString().slice(0, 16),
  pair: "EURUSD",
  orderType: "buy",
  lot: 0.1,
  setup: "Breakout",
  strategy: "Breakout",
  session: "london",
  rpt: 1,
  rrRatio: 2,
  issue: "tp",
  resultDollar: 50,
  resultPercent: 0.5,
};

const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function TradesManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState<TradeForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterPair, setFilterPair] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterSession, setFilterSession] = useState("");

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/accounts", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    const items = body.data ?? [];
    setAccounts(items);
    if (!form.accountId && items.length) {
      setForm((prev) => ({ ...prev, accountId: items[0]._id }));
    }
  }, [form.accountId]);

  const loadTrades = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterAccountId) params.set("accountId", filterAccountId);
    if (filterPair) params.set("pair", filterPair);
    if (filterStrategy) params.set("strategy", filterStrategy);
    if (filterSession) params.set("session", filterSession);

    const response = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setTrades(body.data ?? []);
  }, [filterAccountId, filterPair, filterStrategy, filterSession]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const pairOptions = useMemo(() => Array.from(new Set(trades.map((trade) => trade.pair))).sort(), [trades]);
  const strategyOptions = useMemo(() => Array.from(new Set(trades.map((trade) => trade.strategy))).sort(), [trades]);

  const resetForm = () => {
    setEditingId(null);
    setForm((prev) => ({ ...initialForm, accountId: prev.accountId || accounts[0]?._id || "" }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      date: new Date(form.date).toISOString(),
    };

    const response = await fetch(editingId ? `/api/trades/${editingId}` : "/api/trades", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Impossible de sauvegarder le trade.");
      setLoading(false);
      return;
    }

    await loadTrades();
    resetForm();
    setLoading(false);
  };

  const onDelete = async (id: string) => {
    const response = await fetch(`/api/trades/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    await loadTrades();
    if (editingId === id) resetForm();
  };

  const onEdit = (trade: Trade) => {
    setEditingId(trade._id);
    setForm({
      accountId: trade.accountId,
      date: new Date(trade.date).toISOString().slice(0, 16),
      pair: trade.pair,
      orderType: trade.orderType,
      lot: trade.lot,
      setup: trade.setup,
      strategy: trade.strategy,
      session: trade.session,
      rpt: 1,
      rrRatio: trade.rrRatio,
      issue: trade.issue,
      resultDollar: trade.resultDollar,
      resultPercent: trade.resultPercent,
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold">Filtres trades</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <select value={filterAccountId} onChange={(event) => setFilterAccountId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">Tous les comptes</option>
            {accounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.name}
              </option>
            ))}
          </select>
          <select value={filterPair} onChange={(event) => setFilterPair(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">Toutes les paires</option>
            {pairOptions.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
          <select value={filterStrategy} onChange={(event) => setFilterStrategy(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">Toutes les stratégies</option>
            {strategyOptions.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
          <select value={filterSession} onChange={(event) => setFilterSession(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="">Toutes les sessions</option>
            <option value="asia">Asie</option>
            <option value="london">Londres</option>
            <option value="new-york">New-York</option>
            <option value="overlap">Overlap</option>
          </select>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editingId ? "Éditer le trade" : "Nouveau trade"}</h2>
            {editingId && (
              <button onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-200" type="button">
                Annuler
              </button>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <select
              value={form.accountId}
              onChange={(event) => setForm((prev) => ({ ...prev, accountId: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            >
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name}
                </option>
              ))}
            </select>
            <input type="datetime-local" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.pair} onChange={(event) => setForm((prev) => ({ ...prev, pair: event.target.value.toUpperCase() }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <select value={form.orderType} onChange={(event) => setForm((prev) => ({ ...prev, orderType: event.target.value as TradeForm["orderType"] }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.setup} onChange={(event) => setForm((prev) => ({ ...prev, setup: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input value={form.strategy} onChange={(event) => setForm((prev) => ({ ...prev, strategy: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.01" value={form.lot} onChange={(event) => setForm((prev) => ({ ...prev, lot: Number(event.target.value) }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <select value={form.session} onChange={(event) => setForm((prev) => ({ ...prev, session: event.target.value as TradeForm["session"] }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="asia">Asie</option>
                <option value="london">Londres</option>
                <option value="new-york">New-York</option>
                <option value="overlap">Overlap</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.1" value={form.rpt} onChange={(event) => setForm((prev) => ({ ...prev, rpt: Number(event.target.value) }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
              <input type="number" step="0.1" value={form.rrRatio} onChange={(event) => setForm((prev) => ({ ...prev, rrRatio: Number(event.target.value) }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.issue} onChange={(event) => setForm((prev) => ({ ...prev, issue: event.target.value as TradeForm["issue"] }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="tp">TP</option>
                <option value="sl">SL</option>
                <option value="be">BE</option>
                <option value="partial">Partiel</option>
                <option value="manual">Manuel</option>
              </select>
              <input type="number" step="0.01" value={form.resultPercent} onChange={(event) => setForm((prev) => ({ ...prev, resultPercent: Number(event.target.value) }))} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />
            </div>
            <input type="number" step="0.01" value={form.resultDollar} onChange={(event) => setForm((prev) => ({ ...prev, resultDollar: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" required />

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
              <Plus className="h-4 w-4" />
              {editingId ? "Mettre à jour" : "Ajouter le trade"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold">Historique des trades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Paire</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Stratégie</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Résultat</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade._id} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{new Date(trade.date).toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3">{trade.pair}</td>
                    <td className="px-4 py-3 uppercase">{trade.orderType}</td>
                    <td className="px-4 py-3">{trade.strategy}</td>
                    <td className="px-4 py-3 uppercase text-xs">{trade.session}</td>
                    <td className="px-4 py-3 uppercase text-xs">{trade.issue}</td>
                    <td className={`px-4 py-3 font-mono ${trade.resultDollar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{money(trade.resultDollar)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(trade)} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white" title="Éditer">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(trade._id)} className="rounded-md border border-slate-700 p-2 text-rose-400 hover:text-rose-300" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!trades.length && (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={8}>
                      Aucun trade trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
