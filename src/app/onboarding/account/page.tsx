import { OnboardingAccountStep } from "@/components/onboarding/onboarding-account-step";
import { Layers3 } from "lucide-react";

export default function OnboardingAccountPage() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-blue-600/20 p-2 text-blue-400">
          <Layers3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Configuration initiale</h1>
          <p className="text-sm text-slate-400">Crée ton premier compte de trading pour démarrer.</p>
        </div>
      </div>
      <OnboardingAccountStep />
    </div>
  );
}
