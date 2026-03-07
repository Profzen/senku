"use client";

import { ChartNoAxesCombined, ClipboardList, Cog, Loader2, WalletCards } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const menu = [
  { href: "/dashboard", label: "Tableau de bord", icon: ChartNoAxesCombined },
  { href: "/trades", label: "Trade", icon: ClipboardList },
  { href: "/accounts", label: "Comptes", icon: WalletCards },
  { href: "/settings", label: "Paramètres", icon: Cog },
];

export function SidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isNavigating = pendingHref !== null && pathname !== pendingHref;

  return (
    <nav className="space-y-1 p-3">
      {menu.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const isPending = isNavigating && pendingHref === item.href;

        return (
          <button
            key={item.href}
            type="button"
            disabled={isNavigating || isActive}
            onClick={() => {
              if (isNavigating || isActive) return;
              setPendingHref(item.href);
              router.push(item.href);
            }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            } disabled:opacity-70`}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
