import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.JSX.Element> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [user, supabase] = await Promise.all([currentUser(), createClient()]);
  const displayName = user?.firstName ?? user?.username ?? "tu espacio";

  const [{ count: pendingEventsCount }, { data: workflows }] = await Promise.all([
    supabase
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("workflows").select("runs_total"),
  ]);

  const executionsUsed = (workflows ?? []).reduce((total, w) => total + w.runs_total, 0);

  return (
    <div className="flex min-h-dvh bg-[#0B0F1A]">
      <Sidebar pendingEventsCount={pendingEventsCount ?? 0} executionsUsed={executionsUsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/[0.08] bg-[#0B0F1A]/[0.85] px-5 backdrop-blur">
          <label className="relative hidden flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 size-3.5 text-[#6F7890]" aria-hidden />
            <span className="sr-only">Buscar automatizaciones y eventos</span>
            <input
              type="search"
              placeholder="Buscar automatizaciones o eventos"
              className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0F1522] py-1.5 pl-9 pr-3 text-[13px] text-[#E6EAF2] placeholder:text-[#6F7890] focus:border-[#7C6BFF]/60 focus:outline-none focus:ring-1 focus:ring-[#7C6BFF]/40"
            />
          </label>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[13px] text-[#8B95A9] md:inline">
              Hola, {displayName}
            </span>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                  userButtonPopoverCard: "bg-[#121826] border border-white/10",
                },
              }}
            />
          </div>
        </header>

        <main className="flex-1 px-5 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}