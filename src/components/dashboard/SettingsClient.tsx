"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import { createApiKey, revokeApiKey } from "@/app/(dashboard)/dashboard/settings/actions";
import type { ApiKey, ApiKeyScope, StoredApiKey } from "@/lib/types";
import { cn, copyToClipboard, formatDateTime, formatRelativeTime } from "@/lib/utils";

type NotificationChannel = "failures" | "digest" | "quota";

const CHANNELS: readonly {
  readonly id: NotificationChannel;
  readonly title: string;
  readonly body: string;
}[] = [
  {
    id: "failures",
    title: "Avisarme cuando una automatización falle",
    body: "Recibirás un correo en cuanto un flujo agote sus reintentos.",
  },
  {
    id: "digest",
    title: "Enviarme un resumen diario",
    body: "Ejecuciones, errores y latencia del día anterior, cada mañana a las 08:00.",
  },
  {
    id: "quota",
    title: "Avisarme al llegar al 80 % del plan",
    body: "Para que puedas ampliar antes de que se detengan las ejecuciones.",
  },
];

const SCOPE_LABEL: Readonly<Record<ApiKeyScope, string>> = {
  read: "Sólo lectura",
  write: "Lectura y escritura",
  full: "Acceso total",
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
  readonly label: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1522]",
        checked ? "border-[#7C6BFF] bg-[#7C6BFF]" : "border-white/[0.15] bg-white/[0.08]",
      )}
    >
      <span
        className={cn(
          "absolute top-[0.1875rem] rounded-full bg-white transition-transform",
          checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
        style={{ height: "1.125rem", width: "1.125rem" }}
        aria-hidden
      />
    </button>
  );
}

/** Banner que muestra el secreto en texto plano una única vez, justo tras crearlo. */
function NewSecretBanner({
  apiKey,
  onDismiss,
}: {
  readonly apiKey: ApiKey;
  readonly onDismiss: () => void;
}): React.JSX.Element {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  async function handleCopy(): Promise<void> {
    const ok = await copyToClipboard(apiKey.secret);
    if (ok) {
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1_800);
    }
  }

  return (
    <div className="mx-5 mt-4 rounded-lg border border-[#7C6BFF]/35 bg-[#7C6BFF]/[0.08] p-4">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#BFB4FF]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#E6EAF2]">
            Copia tu clave ahora: no se va a volver a mostrar
          </p>
          <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-md border border-white/10 bg-[#0B0F1A] px-3 py-2 font-mono text-[12px] text-[#C3CBDA]">
            {apiKey.secret}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.15] px-3 py-1.5 text-[12px] text-[#E6EAF2] transition-colors hover:bg-white/5"
            >
              {isCopied ? (
                <Check className="size-3.5 text-[#86EFAC]" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )}
              {isCopied ? "Copiada" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] text-[#8B95A9] transition-colors hover:bg-white/5 hover:text-[#E6EAF2]"
            >
              Ya la copié, cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeyRow({
  apiKey,
  onRevoke,
}: {
  readonly apiKey: StoredApiKey;
  readonly onRevoke: (id: string) => void;
}): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  function handleRevoke(): void {
    startTransition(async () => {
      try {
        await revokeApiKey(apiKey.id);
        onRevoke(apiKey.id);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "No se pudo revocar la clave.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.08] px-5 py-4 last:border-b-0">
      <div className="min-w-[10rem] flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-medium text-[#E6EAF2]">{apiKey.name}</p>
          <span className="rounded border border-white/[0.12] px-1.5 py-0.5 text-[10.5px] text-[#8B95A9]">
            {SCOPE_LABEL[apiKey.scope]}
          </span>
        </div>
        <p className="mt-1 text-[11.5px] text-[#6F7890]" suppressHydrationWarning>
          Creada el {formatDateTime(apiKey.createdAt)} · Último uso{" "}
          {formatRelativeTime(apiKey.lastUsedAt)}
        </p>
      </div>

      <code className="min-w-0 flex-1 truncate rounded-md border border-white/[0.08] bg-[#0B0F1A] px-3 py-2 font-mono text-[12px] text-[#C3CBDA]">
        {apiKey.prefix}_{"•".repeat(24)}
      </code>

      {isConfirming ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#FB7185]/40 bg-[#FB7185]/15 px-3 py-1.5 text-[12px] font-medium text-[#FDA4AF] transition-colors hover:bg-[#FB7185]/25 disabled:opacity-50"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isPending}
            className="rounded-md p-1.5 text-[#7A8398] transition-colors hover:bg-white/5 hover:text-[#E6EAF2]"
            aria-label="Cancelar"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          aria-label={`Revocar la clave ${apiKey.name}`}
          className="rounded-md p-2 text-[#7A8398] transition-colors hover:bg-[#FB7185]/10 hover:text-[#FDA4AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185]"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

function CreateKeyForm({
  onCreated,
  onCancel,
}: {
  readonly onCreated: (apiKey: ApiKey) => void;
  readonly onCancel: () => void;
}): React.JSX.Element {
  const [name, setName] = useState<string>("");
  const [scope, setScope] = useState<ApiKeyScope>("read");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const created = await createApiKey(name, scope);
        onCreated(created);
        setName("");
        setScope("read");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "No se pudo crear la clave.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-5 mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-white/10 bg-[#0B0F1A] p-4"
    >
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
        <span className="text-[12px] text-[#8B95A9]">Nombre</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Producción"
          required
          maxLength={60}
          className="rounded-md border border-white/10 bg-[#0F1522] px-3 py-2 text-[13px] text-[#E6EAF2] placeholder:text-[#6F7890] focus:border-[#7C6BFF]/60 focus:outline-none focus:ring-1 focus:ring-[#7C6BFF]/40"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-[#8B95A9]">Alcance</span>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as ApiKeyScope)}
          className="rounded-md border border-white/10 bg-[#0F1522] px-3 py-2 text-[13px] text-[#E6EAF2] focus:border-[#7C6BFF]/60 focus:outline-none focus:ring-1 focus:ring-[#7C6BFF]/40"
        >
          <option value="read">Sólo lectura</option>
          <option value="write">Lectura y escritura</option>
          <option value="full">Acceso total</option>
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#7C6BFF] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#6B57FF] disabled:opacity-60"
        >
          {isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          Crear
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-[13px] text-[#8B95A9] transition-colors hover:bg-white/5 hover:text-[#E6EAF2]"
        >
          Cancelar
        </button>
      </div>

      {error && (
        <p className="w-full text-[12px] text-[#FDA4AF]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

interface SettingsClientProps {
  readonly userFullName: string | null;
  readonly userEmail: string | null;
  readonly initialApiKeys: readonly StoredApiKey[];
  readonly loadError: string | null;
}

export function SettingsClient({
  userFullName,
  userEmail,
  initialApiKeys,
  loadError,
}: SettingsClientProps): React.JSX.Element {
  const [apiKeys, setApiKeys] = useState<readonly StoredApiKey[]>(initialApiKeys);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [justCreated, setJustCreated] = useState<ApiKey | null>(null);
  const [channels, setChannels] = useState<Record<NotificationChannel, boolean>>({
    failures: true,
    digest: false,
    quota: true,
  });

  function handleCreated(apiKey: ApiKey): void {
    setApiKeys((previous) => [
      { id: apiKey.id, name: apiKey.name, prefix: apiKey.prefix, scope: apiKey.scope, createdAt: apiKey.createdAt, lastUsedAt: apiKey.lastUsedAt },
      ...previous,
    ]);
    setJustCreated(apiKey);
    setIsCreating(false);
  }

  function handleRevoked(id: string): void {
    setApiKeys((previous) => previous.filter((key) => key.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-white">Ajustes</h1>
      <p className="mt-1.5 text-[14px] text-[#8B95A9]">
        Credenciales, avisos y datos de tu espacio de trabajo.
      </p>

      {/* Cuenta */}
      <section className="mt-8 rounded-xl border border-white/10 bg-[#0F1522]">
        <header className="border-b border-white/[0.08] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#E6EAF2]">Tu cuenta</h2>
        </header>
        <div className="px-5 py-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12px] text-[#7A8398]">Nombre</dt>
              <dd className="mt-1 text-[13.5px] text-[#E6EAF2]">{userFullName ?? "Sin nombre"}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-[#7A8398]">Correo</dt>
              <dd className="mt-1 break-all text-[13.5px] text-[#E6EAF2]">{userEmail ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-[#6F7890]">
            El nombre y la contraseña se cambian desde el menú de tu avatar, arriba a la derecha.
          </p>
        </div>
      </section>

      {/* Endpoint de entrada */}
      <section className="mt-6 rounded-xl border border-white/10 bg-[#0F1522]">
        <header className="px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#E6EAF2]">URL de entrada</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#8B95A9]">
            Cada automatización tiene su propia URL. Entra a una desde el panel de Automatizaciones
            para copiarla.
          </p>
        </header>
      </section>

      {/* Claves API */}
      <section className="mt-6 rounded-xl border border-white/10 bg-[#0F1522]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#E6EAF2]">
              <KeyRound className="size-4 text-[#7C6BFF]" aria-hidden />
              Claves de API
            </h2>
            <p className="mt-1 text-[12.5px] text-[#8B95A9]">
              Úsalas para crear y lanzar automatizaciones desde tu propio código.
            </p>
          </div>
          {!isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C6BFF] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#6B57FF]"
            >
              <Plus className="size-3.5" aria-hidden />
              Nueva clave
            </button>
          )}
        </header>

        {loadError && (
          <p className="mx-5 mt-4 rounded-lg border border-[#FB7185]/25 bg-[#FB7185]/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#FDA4AF]">
            No se pudieron cargar las claves desde Supabase ({loadError}).
          </p>
        )}

        {isCreating && <CreateKeyForm onCreated={handleCreated} onCancel={() => setIsCreating(false)} />}

        {justCreated && (
          <NewSecretBanner apiKey={justCreated} onDismiss={() => setJustCreated(null)} />
        )}

        {apiKeys.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[#8B95A9]">
            Todavía no has creado ninguna clave.
          </p>
        ) : (
          <div className="mt-2">
            {apiKeys.map((apiKey) => (
              <ApiKeyRow key={apiKey.id} apiKey={apiKey} onRevoke={handleRevoked} />
            ))}
          </div>
        )}

        <p className="border-t border-white/[0.08] px-5 py-3 text-[11.5px] text-[#6F7890]">
          La clave completa sólo se muestra al crearla. Si la pierdes, revócala y crea una nueva.
        </p>
      </section>

      {/* Avisos */}
      <section className="mt-6 rounded-xl border border-white/10 bg-[#0F1522]">
        <header className="border-b border-white/[0.08] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#E6EAF2]">Avisos</h2>
        </header>
        <div>
          {CHANNELS.map((channel) => (
            <div
              key={channel.id}
              className="flex items-start justify-between gap-6 border-b border-white/[0.08] px-5 py-4 last:border-b-0"
            >
              <div>
                <p className="text-[13.5px] text-[#E6EAF2]">{channel.title}</p>
                <p className="mt-1 max-w-[52ch] text-[12.5px] leading-relaxed text-[#8B95A9]">
                  {channel.body}
                </p>
              </div>
              <Toggle
                checked={channels[channel.id]}
                label={channel.title}
                onChange={(next) => setChannels((previous) => ({ ...previous, [channel.id]: next }))}
              />
            </div>
          ))}
        </div>
        <p className="border-t border-white/[0.08] px-5 py-3 text-[11.5px] text-[#6F7890]">
          Estas preferencias todavía sólo viven en esta pantalla: falta guardarlas en la base de
          datos para que persistan entre sesiones.
        </p>
      </section>

      {/* Zona de riesgo */}
      <section className="mt-6 rounded-xl border border-[#FB7185]/25 bg-[#FB7185]/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#FDA4AF]" aria-hidden />
            <div>
              <h2 className="text-[15px] font-semibold text-[#E6EAF2]">Borrar el espacio</h2>
              <p className="mt-1 max-w-[52ch] text-[12.5px] leading-relaxed text-[#8B95A9]">
                Se eliminan las automatizaciones, el historial de eventos y las claves. No se puede
                deshacer.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[#FB7185]/40 px-4 py-2 text-[13px] font-medium text-[#FDA4AF] transition-colors hover:bg-[#FB7185]/10"
          >
            Borrar el espacio
          </button>
        </div>
      </section>
    </div>
  );
}

export default SettingsClient;