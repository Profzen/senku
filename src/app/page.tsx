export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/20 p-2 text-blue-400">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 19h16" />
              <path d="M6 16l4-5 3 3 5-6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Senku</h1>
            <p className="text-sm text-slate-400">Journal de trading professionnel</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-blue-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 15V9" />
                <path d="M12 15V6" />
                <path d="M16 15v-3" />
              </svg>
            </div>
            <h2 className="mb-1 text-sm font-semibold">Dashboard</h2>
            <p className="text-sm text-slate-400">KPIs, équité, drawdown et vue globale de performance.</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-violet-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 20h16" />
                <path d="M8 20V10" />
                <path d="M12 20V6" />
                <path d="M16 20v-8" />
              </svg>
            </div>
            <h2 className="mb-1 text-sm font-semibold">Statistiques</h2>
            <p className="text-sm text-slate-400">Analyse par stratégie, session, instrument et risque.</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-emerald-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6l4 2" />
              </svg>
            </div>
            <h2 className="mb-1 text-sm font-semibold">Discipline</h2>
            <p className="text-sm text-slate-400">Journal psychologique et suivi du respect du plan.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
