"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, LayoutGrid, Menu, Settings, Webhook, X, Zap } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: typeof LayoutGrid;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Automatizaciones", icon: LayoutGrid },
  { href: "/dashboard/webhooks", label: "Eventos", icon: Webhook },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
];

/** Ejecuciones incluidas en el plan gratuito. Ajusta si añades planes de pago. */
const PLAN_LIMIT = 1_000;

interface SidebarProps {
  /** Eventos con status "pending", para el badge junto a "Eventos". */
  readonly pendingEventsCount?: number;
  /** Suma de runs_total de todas las automatizaciones del usuario. */
  readonly executionsUsed?: number;
}

function NavLinks({
  onNavigate,
  pendingEventsCount = 0,
}: {
  readonly onNavigate?: () => void;
  readonly pendingEventsCount?: number;
}): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const badge = item.href === "/dashboard/webhooks" && pendingEventsCount > 0
          ? String(pendingEventsCount)
          : null;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF]",
              isActive
                ? "bg-white/[0.08] font-medium text-white"
                : "text-[#8B95A9] hover:bg-white/5 hover:text-[#E6EAF2]",
            )}
          >
            <item.icon
              className={cn("size-4 shrink-0", isActive ? "text-[#7C6BFF]" : "text-current")}
              aria-hidden
            />
            <span className="flex-1">{item.label}</span>
            {badge && (
              <span className="rounded-full bg-[#FBBF24]/[0.15] px-1.5 py-0.5 font-mono text-[10px] text-[#FCD34D]">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  onNavigate,
  pendingEventsCount,
  executionsUsed,
}: {
  readonly onNavigate?: () => void;
  readonly pendingEventsCount: number;
  readonly executionsUsed: number;
}): React.JSX.Element {
  const usagePercent = Math.min(100, Math.round((executionsUsed / PLAN_LIMIT) * 100));

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-[#7C6BFF]">
            <Zap className="size-4 text-white" aria-hidden />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">Flowhook</span>
        </Link>
      </div>

      <div className="flex-1 px-3">
        <NavLinks onNavigate={onNavigate} pendingEventsCount={pendingEventsCount} />
      </div>

      <div className="m-3 rounded-lg border border-white/10 bg-[#0F1522] p-3.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-1.5 text-[#8B95A9]">
            <Activity className="size-3.5" aria-hidden />
            Ejecuciones
          </span>
          <span className="font-mono text-[#C3CBDA]">
            {formatNumber(executionsUsed)} / {formatNumber(PLAN_LIMIT)}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-[#7C6BFF]" style={{ width: `${usagePercent}%` }} />
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-[#6F7890]">
          Tu plan gratuito incluye {formatNumber(PLAN_LIMIT)} ejecuciones al mes.
        </p>
      </div>
    </div>
  );
}

export function Sidebar({
  pendingEventsCount = 0,
  executionsUsed = 0,
}: SidebarProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      {/* Escritorio */}
      <aside className="hidden w-60 shrink-0 border-r border-white/[0.08] bg-[#0D1220] lg:block">
        <div className="sticky top-0 h-dvh">
          <SidebarBody pendingEventsCount={pendingEventsCount} executionsUsed={executionsUsed} />
        </div>
      </aside>

      {/* Móvil */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
        className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-[#7C6BFF] text-white shadow-lg shadow-black/50 lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-white/10 bg-[#0D1220]">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-5 rounded-md p-1.5 text-[#8B95A9] hover:bg-white/5 hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarBody
              onNavigate={() => setIsOpen(false)}
              pendingEventsCount={pendingEventsCount}
              executionsUsed={executionsUsed}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;