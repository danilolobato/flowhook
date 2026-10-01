"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Clock,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Timer,
  Webhook,
  Zap,
} from "lucide-react";

import type { Workflow, WorkflowStatus, WorkflowStep } from "@/lib/types";
import {
  WORKFLOW_STATUS_THEME,
  cn,
  formatDuration,
  formatNumber,
  formatRelativeTime,
} from "@/lib/utils";

interface WorkflowCardProps {
  readonly workflow: Workflow;
  /** Se invoca al pulsar activar/pausar. Puede ser una Server Action. */
  readonly onToggleStatus?: (id: string, next: WorkflowStatus) => Promise<void> | void;
}

const STEP_ICON: Readonly<Record<WorkflowStep["kind"], typeof Zap>> = {
  trigger: Zap,
  filter: Filter,
  action: ArrowRight,
};

export function WorkflowCard({ workflow, onToggleStatus }: WorkflowCardProps): React.JSX.Element {
  const [status, setStatus] = useState<WorkflowStatus>(workflow.status);
  const [isPending, startTransition] = useTransition();

  const theme = WORKFLOW_STATUS_THEME[status];
  const isActive = status === "active";
  const isDraft = status === "draft";

  function handleToggle(): void {
    const next: WorkflowStatus = isActive ? "paused" : "active";
    setStatus(next);
    startTransition(async () => {
      await onToggleStatus?.(workflow.id, next);
    });
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-xl border border-white/8 bg-[#121826] p-5",
        "transition-colors hover:border-white/15",
        isDraft && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/dashboard/workflows/${workflow.id}`}
            className="rounded-sm text-[15px] font-semibold leading-snug text-[#E6EAF2] outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121826] hover:text-white"
          >
            {workflow.name}
          </Link>
          <p className="mt-1 max-w-[46ch] text-[13px] leading-relaxed text-[#8B95A9]">
            {workflow.description}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            theme.chip,
          )}
        >
          <span
            className={cn("size-1.5 rounded-full", theme.dot, isActive && "animate-pulse")}
            aria-hidden
          />
          {theme.label}
        </span>
      </div>

      <ol className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {workflow.steps.map((step, index) => {
          const Icon = STEP_ICON[step.kind];
          return (
            <li key={step.id} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-[#39415A]">·</span>}
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1 text-[11px] text-[#A8B2C4]">
                <Icon className="size-3 text-[#7C6BFF]" aria-hidden />
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/8 bg-white/8">
        <div className="bg-[#0F1522] px-3 py-2.5">
          <dt className="text-[11px] text-[#7A8398]">Hoy</dt>
          <dd className="mt-0.5 font-mono text-sm text-[#E6EAF2]">
            {formatNumber(workflow.runsToday)}
          </dd>
        </div>
        <div className="bg-[#0F1522] px-3 py-2.5">
          <dt className="text-[11px] text-[#7A8398]">Éxito</dt>
          <dd
            className={cn(
              "mt-0.5 font-mono text-sm",
              workflow.successRate >= 95
                ? "text-[#86EFAC]"
                : workflow.successRate > 0
                  ? "text-[#FCD34D]"
                  : "text-[#7A8398]",
            )}
          >
            {workflow.successRate > 0 ? `${workflow.successRate.toFixed(1)} %` : "—"}
          </dd>
        </div>
        <div className="bg-[#0F1522] px-3 py-2.5">
          <dt className="flex items-center gap-1 text-[11px] text-[#7A8398]">
            <Timer className="size-3" aria-hidden />
            Media
          </dt>
          <dd className="mt-0.5 font-mono text-sm text-[#E6EAF2]">
            {workflow.avgDurationMs > 0 ? formatDuration(workflow.avgDurationMs) : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
        <p className="flex items-center gap-1.5 text-[11px] text-[#7A8398]">
          {workflow.trigger === "webhook" ? (
            <Webhook className="size-3.5" aria-hidden />
          ) : (
            <Clock className="size-3.5" aria-hidden />
          )}
          <span suppressHydrationWarning>
            {workflow.lastRunAt === null
              ? "Todavía no se ha ejecutado"
              : `Última ejecución ${formatRelativeTime(workflow.lastRunAt)}`}
          </span>
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending || isDraft}
            aria-label={isActive ? `Pausar ${workflow.name}` : `Activar ${workflow.name}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121826]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              isActive
                ? "border-white/10 bg-white/5 text-[#C3CBDA] hover:bg-white/10"
                : "border-[#7C6BFF]/40 bg-[#7C6BFF]/15 text-[#BFB4FF] hover:bg-[#7C6BFF]/25",
            )}
          >
            {isActive ? (
              <>
                <Pause className="size-3.5" aria-hidden />
                Pausar
              </>
            ) : (
              <>
                <Play className="size-3.5" aria-hidden />
                Activar
              </>
            )}
          </button>

          <button
            type="button"
            aria-label={`Más opciones de ${workflow.name}`}
            className="rounded-md p-1.5 text-[#7A8398] transition-colors hover:bg-white/5 hover:text-[#E6EAF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF]"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

export default WorkflowCard;