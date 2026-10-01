/**
 * Tipos de dominio compartidos entre servidor y cliente.
 * Espejan el esquema de las tablas de Supabase (`workflows`, `webhook_events`).
 */

export type WorkflowStatus = "active" | "paused" | "draft";

export type EventStatus = "success" | "failed" | "pending";

export type TriggerKind = "webhook" | "schedule" | "manual";

export interface WorkflowStep {
  readonly id: string;
  readonly label: string;
  readonly kind: "trigger" | "filter" | "action";
  /** Servicio o integración asociada, p. ej. "Stripe", "Slack". */
  readonly service: string;
}

export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: WorkflowStatus;
  readonly trigger: TriggerKind;
  readonly steps: readonly WorkflowStep[];
  /** Ejecuciones en las últimas 24 h. */
  readonly runsToday: number;
  /** Ejecuciones totales desde la creación. */
  readonly runsTotal: number;
  /** Porcentaje de éxito entre 0 y 100. */
  readonly successRate: number;
  /** Duración media de ejecución en milisegundos. */
  readonly avgDurationMs: number;
  /** ISO 8601. `null` si nunca se ejecutó. */
  readonly lastRunAt: string | null;
  readonly createdAt: string;
}

export interface WebhookEvent {
  readonly id: string;
  readonly workflowId: string;
  readonly workflowName: string;
  readonly endpoint: string;
  readonly method: "POST" | "PUT" | "PATCH" | "GET";
  readonly status: EventStatus;
  /** Código HTTP devuelto por el destino. `null` mientras está pendiente. */
  readonly statusCode: number | null;
  readonly durationMs: number;
  readonly attempts: number;
  readonly receivedAt: string;
  readonly payload: Record<string, unknown>;
  /** Mensaje de error legible cuando `status === "failed"`. */
  readonly errorMessage: string | null;
}

export type ApiKeyScope = "read" | "write" | "full";

/**
 * Forma que sólo existe justo al crear una clave: incluye el secreto en
 * texto plano. Nunca se guarda así ni se vuelve a mostrar después.
 */
export interface ApiKey {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly secret: string;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
  readonly scope: ApiKeyScope;
}

/**
 * Lo que se guarda y se lista de verdad: nunca contiene el secreto en claro,
 * porque en la base de datos sólo existe `hashed_secret`.
 */
export interface StoredApiKey {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly scope: ApiKeyScope;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
}