"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { createWorkflow } from "@/app/(dashboard)/dashboard/workflows/actions";

export default function NewWorkflowPage(): React.JSX.Element {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const id = await createWorkflow({ name, description });
        router.push(`/dashboard/workflows/${id}`);
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "No se pudo crear la automatización.",
        );
      }
    });
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#8B95A9] transition-colors hover:text-[#E6EAF2]"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Volver a automatizaciones
      </Link>

      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-white">
        Nueva automatización
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[#8B95A9]">
        Al crearla te damos una URL propia. Cualquier servicio que le envíe una petición generará un
        evento que verás en tiempo real.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-xl border border-white/10 bg-[#0F1522] p-6"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#E6EAF2]">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p. ej. Cobro fallido a Slack"
            required
            maxLength={80}
            autoFocus
            className="rounded-lg border border-white/10 bg-[#0B0F1A] px-3.5 py-2.5 text-[14px] text-[#E6EAF2] placeholder:text-[#6F7890] focus:border-[#7C6BFF]/60 focus:outline-none focus:ring-1 focus:ring-[#7C6BFF]/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[#E6EAF2]">
            Descripción <span className="font-normal text-[#6F7890]">(opcional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qué debería pasar cuando llegue un evento"
            rows={3}
            maxLength={240}
            className="resize-none rounded-lg border border-white/10 bg-[#0B0F1A] px-3.5 py-2.5 text-[14px] text-[#E6EAF2] placeholder:text-[#6F7890] focus:border-[#7C6BFF]/60 focus:outline-none focus:ring-1 focus:ring-[#7C6BFF]/40"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-[#FB7185]/25 bg-[#FB7185]/[0.08] px-3.5 py-2.5 text-[12.5px] text-[#FDA4AF]"
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7C6BFF] px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#6B57FF] disabled:opacity-60"
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Crear automatización
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg px-4 py-2.5 text-[13.5px] text-[#8B95A9] transition-colors hover:bg-white/5 hover:text-[#E6EAF2]"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}