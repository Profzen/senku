import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/signout-button";
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Cog,
  WalletCards,
} from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const menu = [
  { href: "/dashboard", label: "Tableau de bord", icon: ChartNoAxesCombined },
  { href: "/trades", label: "Trade", icon: ClipboardList },
  { href: "/accounts", label: "Comptes", icon: WalletCards },
  { href: "/settings", label: "Paramètres", icon: Cog },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-slate-800 bg-slate-900 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-5">
            <CircleDollarSign className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-base font-bold">Senku</p>
              <p className="text-xs text-slate-400">Journal de trading</p>
            </div>
          </div>
          <nav className="space-y-1 p-3">
            {menu.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-800 p-3">
            <SignOutButton />
          </div>
        </aside>
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
