import type { Metadata } from "next";
import Link from "next/link";
import { CircleSlash, Plus } from "lucide-react";

import { WorkflowCard } from "@/components/dashboard/WorkflowCard";
import { toggleWorkflowStatus } from "@/app/(dashboard)/dashboard/actions";
import { rowToWorkflow } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Workflow } from "@/lib/types";
import { formatDuration, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Automatizaciones",
};

interface Metric {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

function buildMetrics(workflows: readonly Workflow[]): readonly Metric[] {
  const active = workflows.filter((w) => w.status === "active");
  const paused = workflows.filter((w) => w.status === "paused");
  const runsToday = workflows.reduce((total, w) => total + w.runsToday, 0);
  const rated = workflows.filter((w) => w.runsTotal > 0);
  const successRate =
    rated.length > 0 ? rated.reduce((total, w) => total + w.successRate, 0) / rated.length : 0;
  const avgDuration =
    rated.length > 0 ? rated.reduce((total, w) => total + w.avgDurationMs, 0) / rated.length : 0;

  return [
    {
      label: "Automatizaciones activas",
      value: `${active.length} de ${workflows.length}`,
      hint: paused.length > 0 ? `${paused.length} en pausa.` : "Todas en marcha.",
    },
    {
      label: "Ejecuciones hoy",
      value: formatNumber(runsToday),
      hint: "Suma de las últimas 24 horas de cada automatización.",
    },
    {
      label: "Tasa de éxito",
      value: rated.length > 0 ? `${successRate.toFixed(1).replace(".", ",")} %` : "—",
      hint:
        rated.length > 0
          ? "Media de las automatizaciones con al menos una ejecución."
          : "Todavía no hay ejecuciones registradas.",
    },
    {
      label: "Latencia media",
      value: rated.length > 0 ? formatDuration(avgDuration) : "—",
      hint: "Medida de extremo a extremo del flujo.",
    },
  ];
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .order("last_run_at", { ascending: false, nullsFirst: false });

  const workflows: readonly Workflow[] = error ? [] : (data ?? []).map(rowToWorkflow);
  const metrics = buildMetrics(workflows);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            Tus automatizaciones
          </h1>
          <p className="mt-1.5 text-[14px] text-[#8B95A9]">
            Estado y rendimiento de cada flujo en las últimas 24 horas.
          </p>
        </div>

        <Link
          href="/dashboard/workflows/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#7C6BFF] px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#6B57FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F1A]"
        >
          <Plus className="size-4" aria-hidden />
          Crear automatización
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-lg border border-[#FB7185]/25 bg-[#FB7185]/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#FDA4AF]">
          No se pudieron cargar las automatizaciones desde Supabase ({error.message}). Revisa que
          Third Party Auth → Clerk esté activado en tu proyecto.
        </p>
      )}

      <dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[#0F1522] p-5">
            <dt className="text-[12.5px] text-[#8B95A9]">{metric.label}</dt>
            <dd className="mt-2 font-display text-2xl font-semibold text-white">{metric.value}</dd>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#6F7890]">{metric.hint}</p>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold text-[#E6EAF2]">Todas las automatizaciones</h2>

        {workflows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/[0.12] bg-[#0F1522] p-12 text-center">
            <CircleSlash className="mx-auto size-6 text-[#6F7890]" aria-hidden />
            <p className="mt-4 text-[15px] font-medium text-[#E6EAF2]">
              Todavía no hay nada automatizado
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-[#8B95A9]">
              Empieza conectando una herramienta y eligiendo qué debe pasar cuando reciba un evento.
            </p>
            <Link
              href="/dashboard/workflows/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#7C6BFF] px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#6B57FF]"
            >
              <Plus className="size-4" aria-hidden />
              Crear la primera
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onToggleStatus={toggleWorkflowStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}