import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <header className="mb-6">
        <div className="mb-3 inline-flex rounded-lg bg-blue-600/15 p-2 text-blue-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-slate-400">Génère un token de réinitialisation.</p>
      </header>
      <ForgotPasswordForm />
    </section>
  );
}
