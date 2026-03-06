/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { emitAccountsChanged, onAccountsChanged } from "@/lib/client-events";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [deletingAccountLoading, setDeletingAccountLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/accounts", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    setAccounts(body.data ?? []);
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    return onAccountsChanged(() => {
      void loadAccounts();
    });
  }, [loadAccounts]);

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
    emitAccountsChanged();
    resetForm();
    setLoading(false);
  };

  const onDelete = (id: string) => {
    setDeletingAccountId(id);
  };

  const confirmDeleteAccount = async () => {
    if (!deletingAccountId) return;

    setDeletingAccountLoading(true);
    const response = await fetch(`/api/accounts/${deletingAccountId}`, { method: "DELETE" });
    if (!response.ok) {
      setDeletingAccountLoading(false);
      return;
    }
    await loadAccounts();
    emitAccountsChanged();
    if (editingId === deletingAccountId) resetForm();
    setDeletingAccountId(null);
    setDeletingAccountLoading(false);
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

  const deletingAccount = deletingAccountId ? accounts.find((item) => item._id === deletingAccountId) : null;

  return (
    <div className="min-w-0 grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Traitement..." : editingId ? "Mettre à jour" : "Créer le compte"}
          </button>
        </form>
      </section>

      <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Comptes de trading</h2>
        </div>
        <div className="space-y-3 p-3 2xl:hidden">
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
                <button disabled={loading || deletingAccountLoading} onClick={() => onEdit(account)} className="rounded-md border border-slate-700 p-2 text-slate-300 hover:text-white disabled:opacity-60" title="Éditer">
                  <Pencil className="h-4 w-4" />
                </button>
                <button disabled={loading || deletingAccountLoading} onClick={() => onDelete(account._id)} className="rounded-md border border-slate-700 p-2 text-rose-400 hover:text-rose-300 disabled:opacity-60" title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
          {!accounts.length && <p className="rounded-lg border border-slate-800 px-4 py-10 text-center text-sm text-slate-400">Aucun compte trouvé.</p>}
        </div>

        <div className="hidden 2xl:block">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-2 py-2">Nom</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Broker</th>
                <th className="px-2 py-2">Créé le</th>
                <th className="px-2 py-2">Solde initial</th>
                <th className="px-2 py-2">Solde actuel</th>
                <th className="px-2 py-2">Objectif</th>
                <th className="px-2 py-2">Statut</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account._id} className="border-t border-slate-800 text-slate-200">
                  <td className="px-2 py-2 font-medium">{account.name}</td>
                  <td className="px-2 py-2 text-xs">{accountTypeLabel[account.type]}</td>
                  <td className="px-2 py-2">{account.broker}</td>
                  <td className="px-2 py-2 text-xs text-slate-400">{account.createdAt ? new Date(account.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
                  <td className="px-2 py-2 font-mono">{money(account.initialBalance, account.currency)}</td>
                  <td className="px-2 py-2 font-mono">{money(account.currentBalance, account.currency)}</td>
                  <td className="px-2 py-2 font-mono">{money(account.targetBalance ?? account.initialBalance, account.currency)}</td>
                  <td className="px-2 py-2 text-xs">{accountStatusLabel[account.status]}</td>
                  <td className="px-2 py-2">
                    <div className="flex justify-end gap-1">
                      <button disabled={loading || deletingAccountLoading} onClick={() => onEdit(account)} className="rounded-md border border-slate-700 p-1.5 text-slate-300 hover:text-white disabled:opacity-60" title="Éditer">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button disabled={loading || deletingAccountLoading} onClick={() => onDelete(account._id)} className="rounded-md border border-slate-700 p-1.5 text-rose-400 hover:text-rose-300 disabled:opacity-60" title="Supprimer">
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

      <ConfirmDialog
        open={Boolean(deletingAccountId)}
        title="Confirmer la suppression"
        message={`Voulez-vous vraiment supprimer le compte${deletingAccount?.name ? ` \"${deletingAccount.name}\"` : ""} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onCancel={() => setDeletingAccountId(null)}
        isLoading={deletingAccountLoading}
        onConfirm={() => {
          void confirmDeleteAccount();
        }}
      />
    </div>
  );
}
