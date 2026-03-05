import { OnboardingTradeStep } from "@/components/onboarding/onboarding-trade-step";
import { ReceiptText } from "lucide-react";

type Props = {
  searchParams: Promise<{ accountId?: string }>;
};

export default async function OnboardingTradePage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-blue-600/20 p-2 text-blue-400">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Onboarding — Étape 2/2</h1>
          <p className="text-sm text-slate-400">Ajoute ton premier trade pour initialiser les statistiques.</p>
        </div>
      </div>
      <OnboardingTradeStep accountIdFromQuery={params.accountId ?? null} />
    </div>
  );
}
