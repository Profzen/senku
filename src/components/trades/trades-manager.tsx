/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { CheckCircle2, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { exportTradesCsv, exportTradesPdf, exportTradesXlsx } from "@/lib/client-trade-exports";

type Account = { _id: string; name: string; currency: string };

type TradeStatus = "open" | "closed";
type CloseReason = "tp" | "sl" | "retractation";

type Trade = {
  _id: string;
  accountId: string;
  date: string;
  pair: string;
  orderType: "buy" | "sell";
  lot: number;
  setup: string;
  strategy: string;
  rpt: number;
  rrRatio: number;
  stopLoss?: number;
  takeProfit?: number;
  status?: TradeStatus;
  closeReason?: CloseReason;
  issue?: string;
  resultDollar?: number;
  resultPercent?: number;
  observation?: string;
  entryBalance?: number;
  closedAt?: string;
};

type CreateTradeForm = {
  accountId: string;
  date: string;
  pair: string;
  orderType: "buy" | "sell";
  lot: number;
  setup: string;
  strategy: string;
  rpt: number;
  rrRatio: number;
  stopLoss: number;
  takeProfit: number;
  observation: string;
};

type CloseTradeForm = {
  closeReason: CloseReason;
  resultDollar: number;
  observation: string;
};

const fieldClass = "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100";
const buttonBase = "h-10 rounded-lg px-4 text-sm font-medium";

const initialCreateForm: CreateTradeForm = {
  accountId: "",
  date: new Date().toISOString().slice(0, 16),
  pair: "EURUSD",
  orderType: "buy",
  lot: 0.1,
  setup: "Inversion de structure",
  strategy: "Price Action",
  rpt: 1,
  rrRatio: 2,
  stopLoss: 0,
  takeProfit: 0,
  observation: "",
};

const initialCloseForm: CloseTradeForm = {
  closeReason: "tp",
  resultDollar: 0,
  observation: "",
};

const money = (value?: number, currency = "USD") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value ?? 0);

export function TradesManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [createForm, setCreateForm] = useState<CreateTradeForm>(initialCreateForm);
  const [closeForm, setCloseForm] = useState<CloseTradeForm>(initialCloseForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterPair, setFilterPair] = useState("");
  const [filterOrderType, setFilterOrderType] = useState("");
  const [filterIssue, setFilterIssue] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/accounts", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    const items = body.data ?? [];
    setAccounts(items);
    if (!createForm.accountId && items.length) {
      setCreateForm((prev) => ({ ...prev, accountId: items[0]._id }));
    }
  }, [createForm.accountId]);

  const loadTrades = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterAccountId) params.set("accountId", filterAccountId);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    if (filterPair) params.set("pair", filterPair);
    if (filterOrderType) params.set("orderType", filterOrderType);
    if (filterIssue) params.set("issue", filterIssue);
    if (filterStatus) params.set("status", filterStatus);

    const response = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setTrades(body.data ?? []);
  }, [filterAccountId, filterFrom, filterTo, filterPair, filterOrderType, filterIssue, filterStatus]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const pairOptions = useMemo(() => Array.from(new Set(trades.map((trade) => trade.pair))).sort(), [trades]);

  const visibleTrades = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let rows = trades;
    if (normalizedSearch) {
      rows = rows.filter((trade) => {
        const haystack = [trade.pair, trade.strategy, trade.setup, trade.observation]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    const sorted = [...rows];
    switch (sortBy) {
      case "date_asc":
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "result_desc":
        sorted.sort((a, b) => (b.resultDollar ?? 0) - (a.resultDollar ?? 0));
        break;
      case "result_asc":
        sorted.sort((a, b) => (a.resultDollar ?? 0) - (b.resultDollar ?? 0));
        break;
      case "pair_asc":
        sorted.sort((a, b) => a.pair.localeCompare(b.pair));
        break;
      case "pair_desc":
        sorted.sort((a, b) => b.pair.localeCompare(a.pair));
        break;
      case "status":
        sorted.sort((a, b) => {
          const statusA = a.status ?? "closed";
          const statusB = b.status ?? "closed";
          if (statusA === statusB) return new Date(b.date).getTime() - new Date(a.date).getTime();
          return statusA === "open" ? -1 : 1;
        });
        break;
      case "date_desc":
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
    }

    return sorted;
  }, [trades, searchTerm, sortBy]);

  const resetCreateForm = () => {
    setEditingTradeId(null);
    setCreateForm((prev) => ({ ...initialCreateForm, accountId: prev.accountId || accounts[0]?._id || "" }));
  };

  const onSubmitCreate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...createForm,
      date: new Date(createForm.date).toISOString(),
      pair: createForm.pair.toUpperCase(),
    };

    const response = await fetch(editingTradeId ? `/api/trades/${editingTradeId}` : "/api/trades", {
      method: editingTradeId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Impossible d'enregistrer la transaction.");
      setLoading(false);
      return;
    }

    await loadTrades();
    resetCreateForm();
    setIsCreateOpen(false);
    setLoading(false);
  };

  const onDelete = async (id: string) => {
    const response = await fetch(`/api/trades/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    await loadTrades();
    if (editingTradeId === id) {
      resetCreateForm();
      setIsCreateOpen(false);
    }
  };

  const onEdit = (trade: Trade) => {
    setEditingTradeId(trade._id);
    setCreateForm({
      accountId: trade.accountId,
      date: new Date(trade.date).toISOString().slice(0, 16),
      pair: trade.pair,
      orderType: trade.orderType,
      lot: trade.lot,
      setup: trade.setup,
      strategy: trade.strategy,
      rpt: trade.rpt,
      rrRatio: trade.rrRatio,
      stopLoss: trade.stopLoss ?? 0,
      takeProfit: trade.takeProfit ?? 0,
      observation: trade.observation ?? "",
    });
    setIsCreateOpen(true);
    setError("");
  };

  const onStartClose = (tradeId: string) => {
    setClosingTradeId(tradeId);
    setCloseForm(initialCloseForm);
    setError("");
  };

  const onCloseTrade = async (event: FormEvent) => {
    event.preventDefault();
    if (!closingTradeId) return;

    setLoading(true);
    setError("");

    const response = await fetch(`/api/trades/${closingTradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "close",
        closeReason: closeForm.closeReason,
        resultDollar: closeForm.resultDollar,
        observation: closeForm.observation,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Impossible de clôturer la transaction.");
      setLoading(false);
      return;
    }

    setClosingTradeId(null);
    await loadTrades();
    setLoading(false);
  };

  const tradeRowsForExport = visibleTrades.map((trade) => ({
    date: trade.date,
    pair: trade.pair,
    orderType: trade.orderType,
    strategy: trade.strategy,
    session: (trade.status ?? "closed") === "open" ? "EN COURS" : "CLÔTURÉ",
    rrRatio: trade.rrRatio,
    issue: trade.issue ?? "-",
    resultDollar: trade.resultDollar ?? 0,
  }));

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Filtres des transactions</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => exportTradesCsv(tradeRowsForExport)} className={`${buttonBase} border border-slate-700 text-slate-200 hover:bg-slate-800`}>
              Exporter CSV
            </button>
            <button type="button" onClick={() => void exportTradesXlsx(tradeRowsForExport)} className={`${buttonBase} border border-slate-700 text-slate-200 hover:bg-slate-800`}>
              Exporter Excel
            </button>
            <button type="button" onClick={() => exportTradesPdf(tradeRowsForExport)} className={`${buttonBase} border border-slate-700 text-slate-200 hover:bg-slate-800`}>
              Exporter PDF
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Compte</label>
            <select value={filterAccountId} onChange={(event) => setFilterAccountId(event.target.value)} className={fieldClass}>
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
            <input type="date" value={filterFrom} onChange={(event) => setFilterFrom(event.target.value)} className={fieldClass} />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Date de fin</label>
            <input type="date" value={filterTo} onChange={(event) => setFilterTo(event.target.value)} className={fieldClass} />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Actif</label>
            <select value={filterPair} onChange={(event) => setFilterPair(event.target.value)} className={fieldClass}>
              <option value="">Tous les actifs</option>
              {pairOptions.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Type d&apos;ordre</label>
            <select value={filterOrderType} onChange={(event) => setFilterOrderType(event.target.value)} className={fieldClass}>
              <option value="">Tous</option>
              <option value="buy">Achat</option>
              <option value="sell">Vente</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Issue de clôture</label>
            <select value={filterIssue} onChange={(event) => setFilterIssue(event.target.value)} className={fieldClass}>
              <option value="">Toutes</option>
              <option value="tp">TP atteint</option>
              <option value="sl">SL touché</option>
              <option value="retractation">Rétractation</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Statut</label>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className={fieldClass}>
              <option value="">Tous</option>
              <option value="open">En cours</option>
              <option value="closed">Clôturé</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Recherche rapide</label>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className={fieldClass} placeholder="Actif, stratégie, setup..." />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-slate-400">Trier par</label>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className={fieldClass}>
              <option value="date_desc">Date (récent → ancien)</option>
              <option value="date_asc">Date (ancien → récent)</option>
              <option value="result_desc">Résultat ($ décroissant)</option>
              <option value="result_asc">Résultat ($ croissant)</option>
              <option value="pair_asc">Actif (A → Z)</option>
              <option value="pair_desc">Actif (Z → A)</option>
              <option value="status">Statut (En cours d&apos;abord)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              if (isCreateOpen && !editingTradeId) {
                setIsCreateOpen(false);
                return;
              }
              setIsCreateOpen(true);
              if (!editingTradeId) resetCreateForm();
            }}
            className={`${buttonBase} inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500`}
          >
            <Plus className="h-4 w-4" />
            Nouveau trade
          </button>
          <h2 className="text-sm font-semibold">Historique des transactions</h2>
          <p className="text-xs text-slate-400">{visibleTrades.length} résultat(s)</p>
        </div>

        {isCreateOpen && (
          <div className="border-b border-slate-800 bg-slate-950/60 p-4">
            <form onSubmit={onSubmitCreate} className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Compte</label>
                <select value={createForm.accountId} onChange={(event) => setCreateForm((prev) => ({ ...prev, accountId: event.target.value }))} className={fieldClass} required>
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Date d&apos;entrée</label>
                <input type="datetime-local" value={createForm.date} onChange={(event) => setCreateForm((prev) => ({ ...prev, date: event.target.value }))} className={fieldClass} required />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Actif</label>
                <input value={createForm.pair} onChange={(event) => setCreateForm((prev) => ({ ...prev, pair: event.target.value.toUpperCase() }))} className={fieldClass} required />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Ordre</label>
                <select value={createForm.orderType} onChange={(event) => setCreateForm((prev) => ({ ...prev, orderType: event.target.value as "buy" | "sell" }))} className={fieldClass}>
                  <option value="buy">Achat</option>
                  <option value="sell">Vente</option>
                </select>
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Lot</label>
                <input type="number" step="0.01" value={createForm.lot} onChange={(event) => setCreateForm((prev) => ({ ...prev, lot: Number(event.target.value) }))} className={fieldClass} required />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Setup</label>
                <input value={createForm.setup} onChange={(event) => setCreateForm((prev) => ({ ...prev, setup: event.target.value }))} className={fieldClass} required />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Stratégie</label>
                <input value={createForm.strategy} onChange={(event) => setCreateForm((prev) => ({ ...prev, strategy: event.target.value }))} className={fieldClass} required />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">RPT (risque/trade)</label>
                <input type="number" step="0.01" value={createForm.rpt} onChange={(event) => setCreateForm((prev) => ({ ...prev, rpt: Number(event.target.value) }))} className={fieldClass} required />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">Ratio R/R</label>
                <input type="number" step="0.01" value={createForm.rrRatio} onChange={(event) => setCreateForm((prev) => ({ ...prev, rrRatio: Number(event.target.value) }))} className={fieldClass} required />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">SL (niveau)</label>
                <input type="number" step="0.0001" value={createForm.stopLoss} onChange={(event) => setCreateForm((prev) => ({ ...prev, stopLoss: Number(event.target.value) }))} className={fieldClass} />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-slate-400">TP (niveau)</label>
                <input type="number" step="0.0001" value={createForm.takeProfit} onChange={(event) => setCreateForm((prev) => ({ ...prev, takeProfit: Number(event.target.value) }))} className={fieldClass} />
              </div>
              <div className="xl:col-span-4">
                <label className="mb-1 block text-xs text-slate-400">Observation d&apos;entrée</label>
                <input value={createForm.observation} onChange={(event) => setCreateForm((prev) => ({ ...prev, observation: event.target.value }))} className={fieldClass} />
              </div>

              {error && <p className="text-xs text-rose-400 md:col-span-2 xl:col-span-4">{error}</p>}

              <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
                <button type="submit" disabled={loading} className={`${buttonBase} bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60`}>
                  {editingTradeId ? "Mettre à jour" : "Lancer le trade (en cours)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetCreateForm();
                  }}
                  className={`${buttonBase} border border-slate-700 text-slate-200 hover:bg-slate-800`}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {closingTradeId && (
          <div className="border-b border-slate-800 bg-amber-500/5 p-4">
            <form onSubmit={onCloseTrade} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Pourquoi clôturer ?</label>
                <select value={closeForm.closeReason} onChange={(event) => setCloseForm((prev) => ({ ...prev, closeReason: event.target.value as CloseReason }))} className={fieldClass}>
                  <option value="tp">TP atteint</option>
                  <option value="sl">SL touché</option>
                  <option value="retractation">Rétractation (fausse analyse)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Résultat en dollars (+/-)</label>
                <input type="number" step="0.01" value={closeForm.resultDollar} onChange={(event) => setCloseForm((prev) => ({ ...prev, resultDollar: Number(event.target.value) }))} className={fieldClass} required />
              </div>
              <div className="md:col-span-2 xl:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">Observation de clôture (obligatoire)</label>
                <input
                  value={closeForm.observation}
                  onChange={(event) => setCloseForm((prev) => ({ ...prev, observation: event.target.value }))}
                  className={fieldClass}
                  required
                  minLength={2}
                />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
                <button type="submit" disabled={loading} className={`${buttonBase} inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60`}>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmer la clôture
                </button>
                <button type="button" onClick={() => setClosingTradeId(null)} className={`${buttonBase} inline-flex items-center gap-2 border border-slate-700 text-slate-200 hover:bg-slate-800`}>
                  <XCircle className="h-4 w-4" />
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3 p-3 xl:hidden">
          {visibleTrades.map((trade) => {
            const accountCurrency = accounts.find((a) => a._id === trade.accountId)?.currency ?? "USD";
            const status = trade.status ?? "closed";
            const resultType =
              typeof trade.resultDollar !== "number" ? "-" : trade.resultDollar > 0 ? "Gain" : trade.resultDollar < 0 ? "Perte" : "Neutre";

            return (
              <article key={trade._id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{trade.pair} · {trade.orderType.toUpperCase()}</p>
                    <p className="text-xs text-slate-400">{new Date(trade.date).toLocaleString("fr-FR")}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${status === "open" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                    {status === "open" ? "En cours" : "Clôturé"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <p><span className="text-slate-400">Lot:</span> {trade.lot}</p>
                  <p><span className="text-slate-400">R/R:</span> {trade.rrRatio.toFixed(2)}</p>
                  <p><span className="text-slate-400">RPT:</span> {trade.rpt.toFixed(2)}</p>
                  <p><span className="text-slate-400">Issue:</span> {trade.closeReason === "tp" ? "TP atteint" : trade.closeReason === "sl" ? "SL touché" : trade.closeReason === "retractation" ? "Rétractation" : "-"}</p>
                  <p className="col-span-2 break-words"><span className="text-slate-400">Observation:</span> {trade.observation || "-"}</p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                    resultType === "Gain"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : resultType === "Perte"
                        ? "bg-rose-500/20 text-rose-200"
                        : "bg-slate-800 text-slate-200"
                  }`}>
                    {resultType}
                  </span>
                  <p className={`font-mono text-sm ${typeof trade.resultDollar === "number" && trade.resultDollar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {typeof trade.resultDollar === "number" ? money(trade.resultDollar, accountCurrency) : "-"}
                    {typeof trade.resultPercent === "number" ? ` · ${trade.resultPercent.toFixed(2)}%` : ""}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  {status === "open" && (
                    <button onClick={() => onStartClose(trade._id)} className="rounded-md border border-emerald-700 p-2 text-emerald-300 hover:text-emerald-200" title="Clôturer">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => onEdit(trade)} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white" title="Éditer">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(trade._id)} className="rounded-md border border-slate-700 p-2 text-rose-400 hover:text-rose-300" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}

          {!visibleTrades.length && <p className="rounded-lg border border-slate-800 px-4 py-8 text-center text-sm text-slate-400">Aucune transaction trouvée.</p>}
        </div>

        <div className="hidden xl:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Date entrée</th>
                <th className="px-4 py-3">Actif</th>
                <th className="px-4 py-3">Ordre</th>
                <th className="px-4 py-3 text-right">Lot</th>
                <th className="px-4 py-3 text-right">RPT</th>
                <th className="px-4 py-3 text-right">R/R</th>
                <th className="px-4 py-3 text-right">SL</th>
                <th className="px-4 py-3 text-right">TP</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Type résultat</th>
                <th className="px-4 py-3 text-right">Résultat $</th>
                <th className="px-4 py-3 text-right">Résultat %</th>
                <th className="px-4 py-3">Observation</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrades.map((trade) => {
                const accountCurrency = accounts.find((a) => a._id === trade.accountId)?.currency ?? "USD";
                const resultType =
                  typeof trade.resultDollar !== "number" ? "-" : trade.resultDollar > 0 ? "Gain" : trade.resultDollar < 0 ? "Perte" : "Neutre";

                return (
                  <tr key={trade._id} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{new Date(trade.date).toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3">{trade.pair}</td>
                    <td className="px-4 py-3 uppercase">{trade.orderType}</td>
                    <td className="px-4 py-3 text-right font-mono">{trade.lot}</td>
                    <td className="px-4 py-3 text-right font-mono">{trade.rpt.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono">{trade.rrRatio.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono">{trade.stopLoss ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-mono">{trade.takeProfit ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        (trade.status ?? "closed") === "open" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"
                      }`}>
                        {(trade.status ?? "closed") === "open" ? "En cours" : "Clôturé"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {trade.closeReason ? (
                        <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
                          {trade.closeReason === "tp" ? "TP atteint" : trade.closeReason === "sl" ? "SL touché" : "Rétractation"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        resultType === "Gain"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : resultType === "Perte"
                            ? "bg-rose-500/20 text-rose-200"
                            : "bg-slate-800 text-slate-200"
                      }`}>
                        {resultType}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${typeof trade.resultDollar === "number" && trade.resultDollar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {typeof trade.resultDollar === "number" ? money(trade.resultDollar, accountCurrency) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{typeof trade.resultPercent === "number" ? `${trade.resultPercent.toFixed(2)}%` : "-"}</td>
                    <td className="max-w-[260px] truncate px-4 py-3" title={trade.observation ?? ""}>{trade.observation || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(trade.status ?? "closed") === "open" && (
                          <button onClick={() => onStartClose(trade._id)} className="rounded-md border border-emerald-700 p-2 text-emerald-300 hover:text-emerald-200" title="Clôturer">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => onEdit(trade)} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white" title="Éditer">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(trade._id)} className="rounded-md border border-slate-700 p-2 text-rose-400 hover:text-rose-300" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!visibleTrades.length && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={15}>
                    Aucune transaction trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
