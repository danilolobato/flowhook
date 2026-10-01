import { NextResponse } from "next/server";

import type { Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKFLOW_ID_PATTERN = /^wf_[a-f0-9]{12}$/;
const MAX_BODY_BYTES = 256 * 1024;

type IngestMethod = "POST" | "PUT" | "PATCH";

interface RouteContext {
  readonly params: Promise<{ workflowId: string }>;
}

type PayloadResult =
  | { readonly ok: true; readonly payload: Json }
  | { readonly ok: false; readonly response: NextResponse };

async function readPayload(request: Request): Promise<PayloadResult> {
  const text = await request.text();

  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "El payload supera el máximo de 256 KB." },
        { status: 413 },
      ),
    };
  }

  if (text.length === 0) return { ok: true, payload: {} };

  try {
    return { ok: true, payload: JSON.parse(text) as Json };
  } catch {
    // No es JSON válido: lo guardamos tal cual para no perder el evento.
    return { ok: true, payload: { raw: text } };
  }
}

async function handleIngest(
  request: Request,
  context: RouteContext,
  method: IngestMethod,
): Promise<NextResponse> {
  const startedAt = Date.now();
  const { workflowId } = await context.params;

  if (!WORKFLOW_ID_PATTERN.test(workflowId)) {
    return NextResponse.json({ error: "Automatización no encontrada." }, { status: 404 });
  }

  const supabase = createAdminClient();

  const { data: workflow, error: lookupError } = await supabase
    .from("workflows")
    .select("id, owner_id, status, runs_today, runs_total, success_rate, avg_duration_ms")
    .eq("id", workflowId)
    .maybeSingle();

  if (lookupError) {
    console.error("[hooks] Error al buscar la automatización:", lookupError.message);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }

  if (!workflow) {
    return NextResponse.json({ error: "Automatización no encontrada." }, { status: 404 });
  }

  if (workflow.status !== "active") {
    return NextResponse.json(
      { error: "La automatización no está activa. Actívala desde el panel." },
      { status: 409 },
    );
  }

  const parsed = await readPayload(request);
  if (!parsed.ok) return parsed.response;

  const durationMs = Math.max(1, Date.now() - startedAt);

  const { data: event, error: insertError } = await supabase
    .from("webhook_events")
    .insert({
      owner_id: workflow.owner_id,
      workflow_id: workflow.id,
      endpoint: new URL(request.url).pathname,
      method,
      status: "success",
      status_code: 200,
      duration_ms: durationMs,
      attempts: 1,
      payload: parsed.payload,
    })
    .select("id")
    .single();

  if (insertError || !event) {
    console.error("[hooks] Error al guardar el evento:", insertError?.message);
    return NextResponse.json({ error: "No se pudo registrar el evento." }, { status: 500 });
  }

  // Métricas de la automatización (media móvil). Lectura + escritura simple:
  // suficiente para un portafolio; con mucho tráfico conviene una función SQL atómica.
  const previousTotal = workflow.runs_total;
  const total = previousTotal + 1;

  const { error: updateError } = await supabase
    .from("workflows")
    .update({
      runs_today: workflow.runs_today + 1,
      runs_total: total,
      success_rate: Math.round(((Number(workflow.success_rate) * previousTotal + 100) / total) * 100) / 100,
      avg_duration_ms: Math.round((workflow.avg_duration_ms * previousTotal + durationMs) / total),
      last_run_at: new Date().toISOString(),
    })
    .eq("id", workflow.id);

  if (updateError) {
    console.error("[hooks] Error al actualizar métricas:", updateError.message);
  }

  return NextResponse.json({ ok: true, eventId: event.id }, { status: 200 });
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  return handleIngest(request, context, "POST");
}

export async function PUT(request: Request, context: RouteContext): Promise<NextResponse> {
  return handleIngest(request, context, "PUT");
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  return handleIngest(request, context, "PATCH");
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { workflowId } = await context.params;

  return NextResponse.json(
    {
      ok: true,
      workflowId,
      message:
        "Esta es la URL de entrada de una automatización. Para registrar un evento real, envía una petición POST, PUT o PATCH con un cuerpo JSON — visitarla en el navegador no cuenta como un evento.",
    },
    { status: 200 },
  );
}