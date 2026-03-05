"use client";

import { BellRing, Save, Settings2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Preferences = {
  theme: "dark" | "light";
  dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy";
  notifications: boolean;
  timezone: string;
  currency: string;
};

const initialPreferences: Preferences = {
  theme: "dark",
  dateFormat: "dd/MM/yyyy",
  notifications: true,
  timezone: "UTC",
  currency: "USD",
};

export function PreferencesManager() {
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch("/api/user/preferences", { cache: "no-store" });
      if (response.ok) {
        const body = await response.json();
        setPreferences(body.data);
      }
      setLoading(false);
    };

    void load();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    const response = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    if (response.ok) {
      setMessage("Préférences mises à jour.");
    } else {
      setMessage("Impossible de sauvegarder les préférences.");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-200">
          <Settings2 className="h-4 w-4 text-blue-400" />
          <h1 className="text-sm font-semibold">Préférences utilisateur</h1>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Chargement...</p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Thème</label>
              <select
                value={preferences.theme}
                onChange={(event) => setPreferences((prev) => ({ ...prev, theme: event.target.value as Preferences["theme"] }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Format date</label>
              <select
                value={preferences.dateFormat}
                onChange={(event) => setPreferences((prev) => ({ ...prev, dateFormat: event.target.value as Preferences["dateFormat"] }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Timezone</label>
              <input
                value={preferences.timezone}
                onChange={(event) => setPreferences((prev) => ({ ...prev, timezone: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Devise</label>
              <input
                value={preferences.currency}
                onChange={(event) => setPreferences((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <BellRing className="h-4 w-4 text-violet-400" />
                <span>Activer les alertes notifications (Prop Firm et conformité)</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(event) => setPreferences((prev) => ({ ...prev, notifications: event.target.checked }))}
                  className="ml-auto h-4 w-4"
                />
              </label>
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60">
                <Save className="h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              {message && <span className="text-sm text-slate-300">{message}</span>}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
