/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { BrainCircuit, Pencil, Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Psychology = {
  emotionalState?: number;
  confidence?: "low" | "medium" | "high";
  planFollowed?: "yes" | "no" | "partial";
  error?: string;
  lesson?: string;
  mood?: string;
};

type Trade = {
  _id: string;
  date: string;
  pair: string;
  strategy: string;
  resultDollar?: number;
  psychology?: Psychology;
};

const money = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function JournalManager() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Psychology>({});

  const [pair, setPair] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTrades = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("limit", "150");
    if (pair) params.set("pair", pair);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const response = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return;

    const body = await response.json();
    setTrades(body.data ?? []);
  }, [pair, from, to]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const filteredTrades = useMemo(() => {
    if (!planFilter) return trades;
    return trades.filter((trade) => trade.psychology?.planFollowed === planFilter);
  }, [trades, planFilter]);

  const beginEdit = (trade: Trade) => {
    setEditingId(trade._id);
    setForm({
      emotionalState: trade.psychology?.emotionalState,
      confidence: trade.psychology?.confidence,
      planFollowed: trade.psychology?.planFollowed,
      error: trade.psychology?.error ?? "",
      lesson: trade.psychology?.lesson ?? "",
      mood: trade.psychology?.mood ?? "",
    });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
    setError("");
  };

  const savePsychology = async (tradeId: string) => {
    setSaving(true);
    setError("");

    const response = await fetch(`/api/trades/${tradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ psychology: form }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Impossible de sauvegarder le journal psychologique.");
      setSaving(false);
      return;
    }

    await loadTrades();
    setSaving(false);
    cancelEdit();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-200">
          <BrainCircuit className="h-4 w-4 text-violet-400" />
          <h1 className="text-sm font-semibold">Journal psychologique</h1>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <input value={pair} onChange={(event) => setPair(event.target.value.toUpperCase())} placeholder="Paire" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Date de début</label>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Date de fin</label>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
          </div>
          <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <option value="">Plan: tous</option>
            <option value="yes">Plan respecté</option>
            <option value="partial">Plan partiel</option>
            <option value="no">Plan non respecté</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Entrées psychologiques par trade</h2>
        </div>

        <div className="space-y-3 p-4">
          {filteredTrades.map((trade) => {
            const isEditing = editingId === trade._id;

            return (
              <article key={trade._id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {trade.pair} · {trade.strategy}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(trade.date).toLocaleString("fr-FR")} · {money(trade.resultDollar ?? 0)}
                    </p>
                  </div>
                  {!isEditing ? (
                    <button type="button" onClick={() => beginEdit(trade)} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white" title="Éditer psychologie">
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => savePsychology(trade._id)} disabled={saving} className="rounded-md border border-emerald-700 p-2 text-emerald-300 hover:text-emerald-200 disabled:opacity-60" title="Sauvegarder">
                        <Save className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={cancelEdit} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white" title="Annuler">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-3">
                    <p>Plan: {trade.psychology?.planFollowed ?? "non renseigné"}</p>
                    <p>Émotion: {trade.psychology?.emotionalState ?? "-"}/10</p>
                    <p>Confiance: {trade.psychology?.confidence ?? "-"}</p>
                    <p className="md:col-span-3">Erreur: {trade.psychology?.error ?? "-"}</p>
                    <p className="md:col-span-3">Leçon: {trade.psychology?.lesson ?? "-"}</p>
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-3">
                    <select value={form.planFollowed ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, planFollowed: event.target.value as Psychology["planFollowed"] }))} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                      <option value="">Plan non défini</option>
                      <option value="yes">Oui</option>
                      <option value="partial">Partiel</option>
                      <option value="no">Non</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.emotionalState ?? ""}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          emotionalState: event.target.value ? Number(event.target.value) : undefined,
                        }))
                      }
                      placeholder="Émotion 1-10"
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                    <select value={form.confidence ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, confidence: event.target.value as Psychology["confidence"] }))} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                      <option value="">Confiance non définie</option>
                      <option value="low">Faible</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Élevée</option>
                    </select>
                    <input value={form.error ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, error: event.target.value }))} placeholder="Erreur détectée (FOMO, revenge...)" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 md:col-span-3" />
                    <input value={form.lesson ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, lesson: event.target.value }))} placeholder="Leçon apprise" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 md:col-span-2" />
                    <input value={form.mood ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, mood: event.target.value }))} placeholder="Humeur" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
                  </div>
                )}
              </article>
            );
          })}

          {!filteredTrades.length && <p className="py-6 text-center text-sm text-slate-400">Aucune entrée trouvée pour ces filtres.</p>}
        </div>
      </section>

      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
