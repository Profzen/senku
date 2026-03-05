import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LockKeyhole } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <header className="mb-6">
        <div className="mb-3 inline-flex rounded-lg bg-blue-600/15 p-2 text-blue-400">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Réinitialiser le mot de passe</h1>
        <p className="mt-1 text-sm text-slate-400">Entre le token reçu puis ton nouveau mot de passe.</p>
      </header>
      <ResetPasswordForm />
    </section>
  );
}
