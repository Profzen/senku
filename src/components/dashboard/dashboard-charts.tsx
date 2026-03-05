"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EquityPoint = { date: string; balance: number };
type BreakdownPoint = { name: string; value: number };

type DashboardChartsProps = {
  equityCurve: EquityPoint[];
  strategyBreakdown: BreakdownPoint[];
};

export function DashboardCharts({ equityCurve, strategyBreakdown }: DashboardChartsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-3">
        <h3 className="mb-3 text-sm font-semibold text-slate-100">Courbe d&apos;équité</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={equityCurve}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-3">
        <h3 className="mb-3 text-sm font-semibold text-slate-100">Performance par stratégie</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={strategyBreakdown}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
