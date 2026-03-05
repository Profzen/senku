import { RegisterForm } from "@/components/auth/register-form";
import { UserRoundPlus } from "lucide-react";

export default function RegisterPage() {
  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <header className="mb-6">
        <div className="mb-3 inline-flex rounded-lg bg-blue-600/15 p-2 text-blue-400">
          <UserRoundPlus className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Créer un compte Senku</h1>
        <p className="mt-1 text-sm text-slate-400">Démarre ton journal de trading professionnel.</p>
      </header>
      <RegisterForm />
    </section>
  );
}
