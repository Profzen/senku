import { LoginForm } from "@/components/auth/login-form";
import { ChartNoAxesCombined } from "lucide-react";

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <header className="mb-6">
        <div className="mb-3 inline-flex rounded-lg bg-blue-600/15 p-2 text-blue-400">
          <ChartNoAxesCombined className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Connexion Senku</h1>
        <p className="mt-1 text-sm text-slate-400">Accède à ton dashboard de trading.</p>
      </header>
      <LoginForm initialEmail={resolvedSearchParams.email} initialReason={resolvedSearchParams.reason} />
    </section>
  );
}
