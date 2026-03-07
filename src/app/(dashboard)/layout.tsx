import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/signout-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { CircleDollarSign } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-slate-800 bg-slate-900 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-5">
            <CircleDollarSign className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-base font-bold">Senku</p>
              <p className="text-xs text-slate-400">Journal de trading</p>
            </div>
          </div>
          <SidebarNav />
          <div className="border-t border-slate-800 p-3">
            <SignOutButton />
          </div>
        </aside>
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
