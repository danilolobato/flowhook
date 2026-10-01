import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { EventStatus, WorkflowStatus } from "@/lib/types";

/** Combina clases de Tailwind resolviendo conflictos (la última gana). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 1234567 -> "1.234.567" */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
}

/** 842 -> "842 ms" · 4200 -> "4,2 s" */
export function formatDuration(ms: number): string {
  if (ms < 1_000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1).replace(".", ",")} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1_000);
  return `${minutes} min ${seconds} s`;
}

/** Fecha absoluta corta: "14 sep, 09:32". */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Tiempo relativo: "hace 4 min", "hace 2 h". */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (iso === null) return "Sin ejecuciones";

  const diffSeconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1_000);
  const units: readonly [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 30],
    ["month", 12],
    ["year", Number.POSITIVE_INFINITY],
  ];

  const formatter = new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" });
  let value = diffSeconds;

  for (const [unit, limit] of units) {
    if (Math.abs(value) < limit) return formatter.format(Math.round(value), unit);
    value /= limit;
  }

  return formatter.format(Math.round(value), "year");
}

/** Trunca un identificador largo: "evt_9f2c...a71b". */
export function truncateId(id: string, head = 10, tail = 4): string {
  if (id.length <= head + tail + 3) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

/** Copia texto al portapapeles. Devuelve `false` si el navegador lo bloquea. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

interface StatusTheme {
  readonly label: string;
  /** Clases del chip contenedor. */
  readonly chip: string;
  /** Clase de color del punto indicador. */
  readonly dot: string;
}

export const WORKFLOW_STATUS_THEME: Readonly<Record<WorkflowStatus, StatusTheme>> = {
  active: {
    label: "Activo",
    chip: "border-[#4ADE80]/25 bg-[#4ADE80]/10 text-[#86EFAC]",
    dot: "bg-[#4ADE80]",
  },
  paused: {
    label: "Pausado",
    chip: "border-[#FBBF24]/25 bg-[#FBBF24]/10 text-[#FCD34D]",
    dot: "bg-[#FBBF24]",
  },
  draft: {
    label: "Borrador",
    chip: "border-white/10 bg-white/5 text-[#8B95A9]",
    dot: "bg-[#8B95A9]",
  },
};

export const EVENT_STATUS_THEME: Readonly<Record<EventStatus, StatusTheme>> = {
  success: {
    label: "Exitoso",
    chip: "border-[#4ADE80]/25 bg-[#4ADE80]/10 text-[#86EFAC]",
    dot: "bg-[#4ADE80]",
  },
  failed: {
    label: "Fallido",
    chip: "border-[#FB7185]/25 bg-[#FB7185]/10 text-[#FDA4AF]",
    dot: "bg-[#FB7185]",
  },
  pending: {
    label: "Pendiente",
    chip: "border-[#FBBF24]/25 bg-[#FBBF24]/10 text-[#FCD34D]",
    dot: "bg-[#FBBF24]",
  },
};