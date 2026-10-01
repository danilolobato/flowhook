import type { Database } from "@/lib/supabase/database.types";
import type { StoredApiKey, WebhookEvent, Workflow, WorkflowStep } from "@/lib/types";

type WorkflowRow = Database["public"]["Tables"]["workflows"]["Row"];
type WebhookEventRow = Database["public"]["Tables"]["webhook_events"]["Row"];
type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"];

export function rowToWorkflow(row: WorkflowRow): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    trigger: row.trigger,
    steps: Array.isArray(row.steps) ? (row.steps as unknown as readonly WorkflowStep[]) : [],
    runsToday: row.runs_today,
    runsTotal: row.runs_total,
    successRate: Number(row.success_rate),
    avgDurationMs: row.avg_duration_ms,
    lastRunAt: row.last_run_at,
    createdAt: row.created_at,
  };
}

export function rowToWebhookEvent(row: WebhookEventRow, workflowName: string): WebhookEvent {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    workflowName,
    endpoint: row.endpoint,
    method: row.method,
    status: row.status,
    statusCode: row.status_code,
    durationMs: row.duration_ms,
    attempts: row.attempts,
    receivedAt: row.received_at,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    errorMessage: row.error_message,
  };
}

export function rowToStoredApiKey(row: ApiKeyRow): StoredApiKey {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scope: row.scope,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}