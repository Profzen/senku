/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Account = {
  _id: string;
  name: string;
  broker: string;
  type: "personal" | "prop" | "challenge" | "virtual";
  currency: string;
  initialBalance: number;
  currentBalance: number;
  targetBalance?: number;
  status: "active" | "inactive" | "passed" | "failed";
  createdAt?: string;
};

type AccountForm = {
  name: string;
  broker: string;
  type: Account["type"];
  currency: string;
  initialBalance: number;
  targetBalance: number;
  status: Account["status"];
};

const initialForm: AccountForm = {
  name: "",
  broker: "",
  type: "personal",
  currency: "USD",
  initialBalance: 10000,
  targetBalance: 12000,
  status: "active",
};

const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

const accountTypeLabel: Record<Account["type"], string> = {
  personal: "Personnel",
  prop: "Prop Firm",
  challenge: "Challenge",
  virtual: "Test",
};

const accountStatusLabel: Record<Account["status"], string> = {
  active: "Actif",
  inactive: "Inactif",
  passed: "Validé",
  failed: "Échoué",
};

export function AccountsManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    const response = await fetch("/api/accounts", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setAccounts(body.data ?? []);
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(editingId ? `/api/accounts/${editingId}` : "/api/accounts", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Impossible de sauvegarder le compte.");
      setLoading(false);
      return;
    }

    await loadAccounts();
    resetForm();
    setLoading(false);
  };

  const onDelete = async (id: string) => {
    const response = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    await loadAccounts();
    if (editingId === id) resetForm();
  };

  const onEdit = (account: Account) => {
    setEditingId(account._id);
    setForm({
      name: account.name,
      broker: account.broker,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance,
      targetBalance: account.targetBalance ?? account.initialBalance,
      status: account.status,
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">{editingId ? "Modifier le compte" : "Nouveau compte"}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-200">
              Annuler
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nom du compte</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Broker</label>
            <input
              value={form.broker}
              onChange={(event) => setForm((prev) => ({ ...prev, broker: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Type</label>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Account["type"] }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="personal">Personnel</option>
                <option value="prop">Prop Firm</option>
                <option value="challenge">Challenge</option>
                <option value="virtual">Test</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Statut</label>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Account["status"] }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="passed">Validé</option>
                <option value="failed">Échoué</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Devise</label>
              <input
                value={form.currency}
                onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Solde initial</label>
              <input
                type="number"
                min={0}
                value={form.initialBalance}
                onChange={(event) => setForm((prev) => ({ ...prev, initialBalance: Number(event.target.value) }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Objectif du compte</label>
            <input
              type="number"
              min={0}
              value={form.targetBalance}
              onChange={(event) => setForm((prev) => ({ ...prev, targetBalance: Number(event.target.value) }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              required
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {editingId ? "Mettre à jour" : "Créer le compte"}
          </button>
        </form>
      </section>

      <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Comptes de trading</h2>
        </div>
        <div className="space-y-3 p-3 lg:hidden">
          {accounts.map((account) => (
            <article key={account._id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{account.name}</p>
                  <p className="text-xs text-slate-400">{accountTypeLabel[account.type]} · {account.broker}</p>
                </div>
                <span className="text-xs text-slate-300">{accountStatusLabel[account.status]}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 text-xs text-slate-300">
                <p><span className="text-slate-400">Créé le:</span> {account.createdAt ? new Date(account.createdAt).toLocaleDateString("fr-FR") : "-"}</p>
                <p><span className="text-slate-400">Solde initial:</span> {money(account.initialBalance, account.currency)}</p>
                <p><span className="text-slate-400">Solde actuel:</span> {money(account.currentBalance, account.currency)}</p>
                <p><span className="text-slate-400">Objectif:</span> {money(account.targetBalance ?? account.initialBalance, account.currency)}</p>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => onEdit(account)} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white" title="Éditer">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(account._id)} className="rounded-md border border-slate-700 p-2 text-rose-400 hover:text-rose-300" title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
          {!accounts.length && <p className="rounded-lg border border-slate-800 px-4 py-10 text-center text-sm text-slate-400">Aucun compte trouvé.</p>}
        </div>

        <div className="hidden lg:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Créé le</th>
                <th className="px-4 py-3">Solde initial</th>
                <th className="px-4 py-3">Solde actuel</th>
                <th className="px-4 py-3">Objectif</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account._id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-4 py-3 font-medium">{account.name}</td>
                  <td className="px-4 py-3 text-xs">{accountTypeLabel[account.type]}</td>
                  <td className="px-4 py-3">{account.broker}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{account.createdAt ? new Date(account.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
                  <td className="px-4 py-3 font-mono">{money(account.initialBalance, account.currency)}</td>
                  <td className="px-4 py-3 font-mono">{money(account.currentBalance, account.currency)}</td>
                  <td className="px-4 py-3 font-mono">{money(account.targetBalance ?? account.initialBalance, account.currency)}</td>
                  <td className="px-4 py-3 text-xs">{accountStatusLabel[account.status]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(account)} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white" title="Éditer">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(account._id)} className="rounded-md border border-slate-700 p-2 text-rose-400 hover:text-rose-300" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!accounts.length && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={9}>
                    Aucun compte trouvé.
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
