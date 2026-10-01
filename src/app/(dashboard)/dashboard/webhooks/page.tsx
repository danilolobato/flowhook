"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Copy,
  Pause,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { useSession } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase/client";
import { rowToWebhookEvent } from "@/lib/supabase/mappers";
import type { Database } from "@/lib/supabase/database.types";
import type { EventStatus, WebhookEvent } from "@/lib/types";
import {
  EVENT_STATUS_THEME,
  cn,
  copyToClipboard,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  truncateId,
} from "@/lib/utils";

type WebhookEventRow = Database["public"]["Tables"]["webhook_events"]["Row"];

type StatusFilter = EventStatus | "all";

const FILTERS: readonly { readonly value: StatusFilter; readonly label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "success", label: "Exitosos" },
  { value: "failed", label: "Fallidos" },
  { value: "pending", label: "Pendientes" },
];

export default function WebhooksPage(): React.JSX.Element {
  const supabase = useSupabaseClient();
  const { isLoaded: isSessionLoaded } = useSession();
  const [events, setEvents] = useState<readonly WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const workflowNamesRef = useRef<Map<string, string>>(new Map());

  // Carga inicial: nombres de las automatizaciones (para mostrarlos en la
  // tabla sin tener que hacer un join) y los últimos 100 eventos.
  useEffect(() => {
    if (!isSessionLoaded) return;
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setLoadError(null);

      const [{ data: workflows, error: workflowsError }, { data: rows, error: eventsError }] =
        await Promise.all([
          supabase.from("workflows").select("id, name"),
          supabase
            .from("webhook_events")
            .select("*")
            .order("received_at", { ascending: false })
            .limit(100),
        ]);

      if (cancelled) return;

      const firstError = workflowsError ?? eventsError;
      if (firstError) {
        setLoadError(firstError.message);
        setIsLoading(false);
        return;
      }

      const nameMap = new Map<string, string>((workflows ?? []).map((w) => [w.id, w.name]));
      workflowNamesRef.current = nameMap;

      setEvents(
        (rows ?? []).map((row) =>
          rowToWebhookEvent(row, nameMap.get(row.workflow_id) ?? "Automatización eliminada"),
        ),
      );
      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [supabase, isSessionLoaded]);

  // Tiempo real: nuevos eventos entran arriba de la tabla; los que cambian
  // de estado (p. ej. de "pendiente" a "fallido" tras un reintento) se
  // actualizan en el sitio. Se desconecta cuando el usuario pausa "en vivo".
  useEffect(() => {
    if (!isLive || !isSessionLoaded) return;

    const channel = supabase
      .channel("webhook_events-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "webhook_events" },
        (payload) => {
          const row = payload.new as WebhookEventRow;
          const name = workflowNamesRef.current.get(row.workflow_id) ?? "Automatización";
          setEvents((previous) => [rowToWebhookEvent(row, name), ...previous]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "webhook_events" },
        (payload) => {
          const row = payload.new as WebhookEventRow;
          const name = workflowNamesRef.current.get(row.workflow_id) ?? "Automatización";
          const updated = rowToWebhookEvent(row, name);
          setEvents((previous) =>
            previous.map((event) => (event.id === updated.id ? updated : event)),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, isLive, isSessionLoaded]);

  const counts = useMemo<Record<StatusFilter, number>>(() => {
    return {
      all: events.length,
      success: events.filter((e) => e.status === "success").length,
      failed: events.filter((e) => e.status === "failed").length,
      pending: events.filter((e) => e.status === "pending").length,
    };
  }, [events]);

  const visibleEvents = useMemo<readonly WebhookEvent[]>(() => {
    const needle = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const matchesQuery =
        needle.length === 0 ||
        event.id.toLowerCase().includes(needle) ||
        event.workflowName.toLowerCase().includes(needle) ||
        event.endpoint.toLowerCase().includes(needle);

      return matchesStatus && matchesQuery;
    });
  }, [events, statusFilter, query]);

  async function handleCopyPayload(event: WebhookEvent): Promise<void> {
    const ok = await copyToClipboard(JSON.stringify(event.payload, null, 2));
    if (ok) {
      setCopiedId(event.id);
      window.setTimeout(() => setCopiedId(null), 1_800);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">Eventos</h1>
          <p className="mt-1.5 text-[14px] text-[#8B95A9]">
            Cada webhook que ha entrado, con su respuesta y su payload completo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsLive((previous) => !previous)}
          aria-pressed={isLive}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF]",
            isLive
              ? "border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#86EFAC]"
              : "border-white/[0.12] bg-white/5 text-[#C3CBDA] hover:bg-white/10",
          )}
        >
          {isLive ? (
            <>
              <span className="size-1.5 animate-pulse rounded-full bg-[#4ADE80]" aria-hidden />
              Actualizando en vivo
            </>
          ) : (
            <>
              <Play className="size-3.5" aria-hidden />
              Reanudar actualización
            </>
          )}
        </button>
      </div>

      {loadError && (
        <p className="mt-4 rounded-lg border border-[#FB7185]/25 bg-[#FB7185]/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#FDA4AF]">
          No se pudieron cargar los eventos desde Supabase ({loadError}). Revisa que Third Party
          Auth → Clerk esté activado.
        </p>
      )}

      {/* Filtros */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Filtrar eventos por estado"
          className="flex rounded-lg border border-white/10 bg-[#0F1522] p-1"
        >
          {FILTERS.map((filter) => {
            const isSelected = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12.5px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF]",
                  isSelected
                    ? "bg-white/10 font-medium text-white"
                    : "text-[#8B95A9] hover:text-[#E6EAF2]",
                )}
              >
                {filter.label}
                <span className="ml-1.5 font-mono text-[11px] text-[#6F7890]">
                  {counts[filter.value]}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative flex min-w-[15rem] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 size-3.5 text-[#6F7890]" aria-hidden />
          <span className="sr-only">Buscar por identificador, automatización o endpoint</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por id, automatización o endpoint"
            className="w-full rounded-lg border border-white/10 bg-[#0F1522] py-2 pl-9 pr-3 text-[13px] text-[#E6EAF2] placeholder:text-[#6F7890] focus:border-[#7C6BFF]/60 focus:outline-none focus:ring-1 focus:ring-[#7C6BFF]/40"
          />
        </label>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] px-3.5 py-2 text-[13px] text-[#C3CBDA] transition-colors hover:bg-white/5"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden />
          Últimas 24 h
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Tabla */}
      <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#0F1522]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11.5px] text-[#7A8398]">
                <th scope="col" className="w-10 px-4 py-3" />
                <th scope="col" className="px-2 py-3 font-medium">Estado</th>
                <th scope="col" className="px-4 py-3 font-medium">Evento</th>
                <th scope="col" className="px-4 py-3 font-medium">Automatización</th>
                <th scope="col" className="px-4 py-3 font-medium">Respuesta</th>
                <th scope="col" className="px-4 py-3 font-medium">Duración</th>
                <th scope="col" className="px-4 py-3 font-medium">Intentos</th>
                <th scope="col" className="px-4 py-3 font-medium">Recibido</th>
              </tr>
            </thead>

            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-white/5">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                    </td>
                  </tr>
                ))}

              {!isLoading && visibleEvents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-[14px] font-medium text-[#E6EAF2]">
                      Ningún evento coincide con este filtro
                    </p>
                    <p className="mx-auto mt-2 max-w-[44ch] text-[13px] leading-relaxed text-[#8B95A9]">
                      Prueba a quitar la búsqueda o a ampliar el rango de fechas.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("all");
                      }}
                      className="mt-5 rounded-lg border border-white/[0.12] px-3.5 py-2 text-[13px] text-[#C3CBDA] transition-colors hover:bg-white/5"
                    >
                      Quitar filtros
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading &&
                visibleEvents.map((event) => {
                  const theme = EVENT_STATUS_THEME[event.status];
                  const isExpanded = expandedId === event.id;

                  return (
                    <Fragment key={event.id}>
                      <tr
                        className={cn(
                          "border-b border-white/5 text-[13px] transition-colors",
                          isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.025]",
                        )}
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : event.id)}
                            aria-expanded={isExpanded}
                            aria-label={`Ver detalle del evento ${event.id}`}
                            className="rounded p-1 text-[#7A8398] transition-colors hover:bg-white/5 hover:text-[#E6EAF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF]"
                          >
                            <ChevronDown
                              className={cn("size-4 transition-transform", isExpanded && "rotate-180")}
                              aria-hidden
                            />
                          </button>
                        </td>

                        <td className="px-2 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                              theme.chip,
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                theme.dot,
                                event.status === "pending" && "animate-pulse",
                              )}
                              aria-hidden
                            />
                            {theme.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] text-[#C3CBDA]">
                            {truncateId(event.id)}
                          </span>
                          <span className="ml-2 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[#7A8398]">
                            {event.method}
                          </span>
                        </td>

                        <td className="max-w-[16rem] truncate px-4 py-3 text-[#E6EAF2]">
                          {event.workflowName}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "font-mono text-[12px]",
                              event.statusCode === null
                                ? "text-[#7A8398]"
                                : event.statusCode < 400
                                  ? "text-[#86EFAC]"
                                  : "text-[#FDA4AF]",
                            )}
                          >
                            {event.statusCode ?? "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-[12px] text-[#A8B2C4]">
                          {event.durationMs > 0 ? formatDuration(event.durationMs) : "—"}
                        </td>

                        <td className="px-4 py-3 font-mono text-[12px] text-[#A8B2C4]">
                          {event.attempts}
                        </td>

                        <td className="px-4 py-3 text-[12px] text-[#8B95A9]">
                          <time dateTime={event.receivedAt} title={formatDateTime(event.receivedAt)}>
                            {formatRelativeTime(event.receivedAt)}
                          </time>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b border-white/[0.08] bg-[#0B0F1A]">
                          <td colSpan={8} className="px-6 py-5">
                            {event.errorMessage && (
                              <p className="mb-4 rounded-lg border border-[#FB7185]/25 bg-[#FB7185]/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#FDA4AF]">
                                {event.errorMessage}
                              </p>
                            )}

                            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                              <div>
                                <p className="mb-2 text-[12px] text-[#7A8398]">Payload recibido</p>
                                <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-[#0F1522] p-4 font-mono text-[12px] leading-relaxed text-[#C3CBDA]">
                                  {JSON.stringify(event.payload, null, 2)}
                                </pre>
                              </div>

                              <dl className="space-y-3 text-[12.5px]">
                                <div>
                                  <dt className="text-[#7A8398]">Endpoint</dt>
                                  <dd className="mt-0.5 break-all font-mono text-[#E6EAF2]">
                                    {event.endpoint}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-[#7A8398]">Identificador</dt>
                                  <dd className="mt-0.5 break-all font-mono text-[#E6EAF2]">
                                    {event.id}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-[#7A8398]">Fecha exacta</dt>
                                  <dd className="mt-0.5 text-[#E6EAF2]">
                                    {formatDateTime(event.receivedAt)}
                                  </dd>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => void handleCopyPayload(event)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] px-3 py-1.5 text-[12px] text-[#C3CBDA] transition-colors hover:bg-white/5"
                                  >
                                    <Copy className="size-3.5" aria-hidden />
                                    {copiedId === event.id ? "Copiado" : "Copiar payload"}
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-md border border-[#7C6BFF]/40 bg-[#7C6BFF]/[0.15] px-3 py-1.5 text-[12px] text-[#BFB4FF] transition-colors hover:bg-[#7C6BFF]/25"
                                  >
                                    <RefreshCw className="size-3.5" aria-hidden />
                                    Reenviar evento
                                  </button>

                                  {event.status === "pending" && (
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] px-3 py-1.5 text-[12px] text-[#C3CBDA] transition-colors hover:bg-white/5"
                                    >
                                      <Pause className="size-3.5" aria-hidden />
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              </dl>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-[#6F7890]">
        Mostrando {visibleEvents.length} de {events.length} eventos. El plan actual conserva el
        historial 90 días.
      </p>
    </div>
  );
}