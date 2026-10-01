import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CopyField } from "@/components/dashboard/CopyField";
import { createClient } from "@/lib/supabase/server";
import {
  EVENT_STATUS_THEME,
  WORKFLOW_STATUS_THEME,
  cn,
  formatRelativeTime,
  truncateId,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Automatización",
};

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function WorkflowDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from("workflows")
    .select("id, name, description, status, runs_total, last_run_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !workflow) notFound();

  const { data: events } = await supabase
    .from("webhook_events")
    .select("id, status, status_code, received_at")
    .eq("workflow_id", workflow.id)
    .order("received_at", { ascending: false })
    .limit(5);

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const ingestUrl = `${protocol}://${host}/api/hooks/${workflow.id}`;

  const curlExample = [
    `curl -X POST "${ingestUrl}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"type":"prueba","mensaje":"Hola desde curl"}'`,
  ].join("\n");

  const theme = WORKFLOW_STATUS_THEME[workflow.status];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#8B95A9] transition-colors hover:text-[#E6EAF2]"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Volver a automatizaciones
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            {workflow.name}
          </h1>
          {workflow.description && (
            <p className="mt-1.5 max-w-[60ch] text-[14px] leading-relaxed text-[#8B95A9]">
              {workflow.description}
            </p>
          )}
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            theme.chip,
          )}
        >
          <span className={cn("size-1.5 rounded-full", theme.dot)} aria-hidden />
          {theme.label}
        </span>
      </div>

      <section className="mt-8 rounded-xl border border-white/10 bg-[#0F1522]">
        <header className="border-b border-white/[0.08] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#E6EAF2]">URL de entrada</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8B95A9]">
            Envía una petición POST, PUT o PATCH a esta dirección. Cada una queda registrada como
            un evento.
          </p>
        </header>
        <div className="space-y-4 px-5 py-4">
          <CopyField label="la URL de entrada" value={ingestUrl} />
          <div>
            <p className="mb-2 text-[12px] text-[#7A8398]">Pruébalo desde tu terminal</p>
            <CopyField label="el comando curl" value={curlExample} multiline />
          </div>
        </div>
        <p className="border-t border-white/[0.08] px-5 py-3 text-[11.5px] leading-relaxed text-[#6F7890]">
          Quien tenga esta URL puede enviar eventos: trátala como un secreto. Si la automatización
          está pausada, la URL responde 409 y no registra nada.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-[#0F1522]">
        <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#E6EAF2]">Últimos eventos</h2>
          <Link
            href="/dashboard/webhooks"
            className="text-[12.5px] text-[#BFB4FF] transition-colors hover:text-white"
          >
            Ver todos
          </Link>
        </header>

        {!events || events.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[#8B95A9]">
            Todavía no ha llegado ningún evento. Ejecuta el comando de arriba y aparecerá aquí.
          </p>
        ) : (
          <ul>
            {events.map((event) => {
              const eventTheme = EVENT_STATUS_THEME[event.status];
              return (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3 last:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        eventTheme.chip,
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", eventTheme.dot)} aria-hidden />
                      {eventTheme.label}
                    </span>
                    <span className="font-mono text-[12px] text-[#C3CBDA]">{truncateId(event.id)}</span>
                  </span>
                  <span className="text-[12px] text-[#8B95A9]" suppressHydrationWarning>
                    {formatRelativeTime(event.received_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}