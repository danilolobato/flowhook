import Link from "next/link";
import { Show } from "@clerk/nextjs";
import {
  ArrowRight,
  BellRing,
  Filter,
  GitBranch,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Webhook,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface Capability {
  readonly title: string;
  readonly body: string;
  readonly icon: typeof Zap;
}

const CAPABILITIES: readonly Capability[] = [
  {
    title: "Recibe cualquier webhook",
    body: "Te damos una URL única por automatización. Pégala en Stripe, Shopify o tu propia API y empieza a recibir eventos al instante.",
    icon: Webhook,
  },
  {
    title: "Filtra antes de actuar",
    body: "Define condiciones en lenguaje claro —importe mayor que, país igual a— y deja pasar sólo lo que importa.",
    icon: Filter,
  },
  {
    title: "Reintenta sin que lo pidas",
    body: "Si el destino falla, reintentamos con espera progresiva durante 24 horas y te avisamos si sigue caído.",
    icon: RotateCcw,
  },
  {
    title: "Revisa cada ejecución",
    body: "Guardamos el payload, la respuesta y el tiempo de cada paso. Puedes reenviar un evento con un clic.",
    icon: ScrollText,
  },
  {
    title: "Ramifica el flujo",
    body: "Una misma entrada puede disparar varias acciones en paralelo o seguir caminos distintos según el dato.",
    icon: GitBranch,
  },
  {
    title: "Entérate cuando algo se rompe",
    body: "Alertas por correo o Slack en cuanto una automatización supera el umbral de errores que definas.",
    icon: BellRing,
  },
];

interface Step {
  readonly title: string;
  readonly body: string;
}

const STEPS: readonly Step[] = [
  {
    title: "Copia tu URL de entrada",
    body: "Cada automatización nace con un endpoint propio, firmado y listo para recibir tráfico.",
  },
  {
    title: "Encadena filtros y acciones",
    body: "Arrastra los pasos en el editor. Puedes probar con un evento real antes de publicar.",
  },
  {
    title: "Publica y observa",
    body: "El panel muestra ejecuciones, errores y latencia en cuanto llega el primer evento.",
  },
];

function FlowNode({
  label,
  service,
  icon: Icon,
  tone,
}: {
  readonly label: string;
  readonly service: string;
  readonly icon: typeof Zap;
  readonly tone: "accent" | "neutral" | "success";
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-[#0F1522] px-3.5 py-3">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md border",
          tone === "accent" && "border-[#7C6BFF]/35 bg-[#7C6BFF]/12 text-[#BFB4FF]",
          tone === "neutral" && "border-white/10 bg-white/5 text-[#A8B2C4]",
          tone === "success" && "border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#86EFAC]",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-[#E6EAF2]">{label}</p>
        <p className="truncate text-[11px] text-[#7A8398]">{service}</p>
      </div>
    </div>
  );
}

export default function HomePage(): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-[#0B0F1A]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B0F1A]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-[#7C6BFF]">
              <Zap className="size-4 text-white" aria-hidden />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight">Flowhook</span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] text-[#8B95A9] md:flex">
            <a href="#capacidades" className="transition-colors hover:text-[#E6EAF2]">
              Qué puedes hacer
            </a>
            <a href="#como-funciona" className="transition-colors hover:text-[#E6EAF2]">
              Cómo funciona
            </a>
            <a href="#precios" className="transition-colors hover:text-[#E6EAF2]">
              Precios
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="rounded-md px-3 py-1.5 text-[13px] text-[#C3CBDA] transition-colors hover:bg-white/5 hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-[#7C6BFF] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#6B57FF]"
              >
                Crear cuenta
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#7C6BFF] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#6B57FF]"
              >
                Ir al panel
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Show>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <h1 className="font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
                El trabajo repetitivo se hace solo.
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[#98A2B6]">
                Flowhook escucha los eventos de tus herramientas y ejecuta la respuesta que tú
                definas: avisar al equipo, crear el registro, cobrar, sincronizar. Sin servidores y
                sin escribir una línea de código.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#7C6BFF] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#6B57FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F1A]"
                >
                  Crear mi primera automatización
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-white/12 px-5 py-3 text-sm text-[#C3CBDA] transition-colors hover:border-white/25 hover:text-white"
                >
                  Ver una demo
                </Link>
              </div>

              <p className="mt-5 text-[13px] text-[#6F7890]">
                Plan gratuito con 1.000 ejecuciones al mes. No pedimos tarjeta.
              </p>
            </div>

            {/* Visual: una automatización real, con el mismo lenguaje del producto */}
            <div className="rounded-2xl border border-white/10 bg-[#121826] p-5 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-[#E6EAF2]">Cobro fallido a Slack</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4ADE80]/25 bg-[#4ADE80]/10 px-2.5 py-1 text-[11px] text-[#86EFAC]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#4ADE80]" aria-hidden />
                  Activo
                </span>
              </div>

              <div className="mt-5 space-y-2">
                <FlowNode
                  label="Un pago es rechazado"
                  service="Stripe · invoice.payment_failed"
                  icon={Webhook}
                  tone="accent"
                />
                <div className="ml-[1.9rem] h-4 w-px bg-white/12" aria-hidden />
                <FlowNode
                  label="Sólo si el importe supera 50 €"
                  service="Condición"
                  icon={Filter}
                  tone="neutral"
                />
                <div className="ml-[1.9rem] h-4 w-px bg-white/12" aria-hidden />
                <FlowNode
                  label="Avisar en #finanzas"
                  service="Slack · mensaje con el cliente y el importe"
                  icon={BellRing}
                  tone="success"
                />
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/8 bg-white/8 text-center">
                <div className="bg-[#0F1522] px-2 py-3">
                  <dt className="text-[11px] text-[#7A8398]">Ejecuciones hoy</dt>
                  <dd className="mt-1 font-mono text-sm text-[#E6EAF2]">128</dd>
                </div>
                <div className="bg-[#0F1522] px-2 py-3">
                  <dt className="text-[11px] text-[#7A8398]">Éxito</dt>
                  <dd className="mt-1 font-mono text-sm text-[#86EFAC]">99,2 %</dd>
                </div>
                <div className="bg-[#0F1522] px-2 py-3">
                  <dt className="text-[11px] text-[#7A8398]">Latencia media</dt>
                  <dd className="mt-1 font-mono text-sm text-[#E6EAF2]">412 ms</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Capacidades */}
        <section id="capacidades" className="border-t border-white/8 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-[24ch] font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Todo lo que hace falta entre el evento y la acción
            </h2>
            <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-[#8B95A9]">
              No es un editor bonito con la fontanería sin resolver. Reintentos, trazas y control de
              errores vienen incluidos desde el primer flujo.
            </p>

            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((capability) => (
                <div key={capability.title} className="bg-[#0F1522] p-6">
                  <capability.icon className="size-5 text-[#7C6BFF]" aria-hidden />
                  <h3 className="mt-4 text-[15px] font-semibold text-[#E6EAF2]">
                    {capability.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#8B95A9]">
                    {capability.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona: aquí la numeración sí es una secuencia real */}
        <section id="como-funciona" className="border-t border-white/8 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              De cero a producción en tres pasos
            </h2>

            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="border-t border-white/12 pt-5">
                  <span className="font-mono text-[13px] text-[#7C6BFF]">Paso {index + 1}</span>
                  <h3 className="mt-3 text-lg font-semibold text-[#E6EAF2]">{step.title}</h3>
                  <p className="mt-2 max-w-[42ch] text-[14px] leading-relaxed text-[#8B95A9]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className="border-t border-white/8 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Pagas por lo que ejecutas
            </h2>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                {
                  name: "Gratis",
                  price: "0 €",
                  detail: "1.000 ejecuciones al mes",
                  perks: ["3 automatizaciones", "Historial de 7 días", "Reintentos básicos"],
                  featured: false,
                },
                {
                  name: "Equipo",
                  price: "29 €",
                  detail: "50.000 ejecuciones al mes",
                  perks: [
                    "Automatizaciones ilimitadas",
                    "Historial de 90 días",
                    "Alertas en Slack y correo",
                  ],
                  featured: true,
                },
                {
                  name: "Empresa",
                  price: "A medida",
                  detail: "Volumen y SLA negociados",
                  perks: ["Dominio propio", "Registro de auditoría", "Soporte con SLA"],
                  featured: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "rounded-xl border p-6",
                    plan.featured
                      ? "border-[#7C6BFF]/45 bg-[#121826]"
                      : "border-white/10 bg-[#0F1522]",
                  )}
                >
                  <p className="text-[13px] text-[#8B95A9]">{plan.name}</p>
                  <p className="mt-3 font-display text-3xl font-semibold text-white">
                    {plan.price}
                    {plan.price !== "A medida" && (
                      <span className="ml-1 text-sm font-normal text-[#7A8398]">/mes</span>
                    )}
                  </p>
                  <p className="mt-1 text-[13px] text-[#7A8398]">{plan.detail}</p>

                  <ul className="mt-6 space-y-2.5 text-[13px] text-[#A8B2C4]">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#7C6BFF]" aria-hidden />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/sign-up"
                    className={cn(
                      "mt-7 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors",
                      plan.featured
                        ? "bg-[#7C6BFF] text-white hover:bg-[#6B57FF]"
                        : "border border-white/12 text-[#C3CBDA] hover:border-white/25 hover:text-white",
                    )}
                  >
                    {plan.name === "Empresa" ? "Hablar con ventas" : "Empezar gratis"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 text-[13px] text-[#6F7890] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Flowhook. Proyecto de portafolio.</p>
          <div className="flex gap-6">
            <a href="#capacidades" className="transition-colors hover:text-[#E6EAF2]">
              Producto
            </a>
            <a href="#precios" className="transition-colors hover:text-[#E6EAF2]">
              Precios
            </a>
            <Link href="/sign-in" className="transition-colors hover:text-[#E6EAF2]">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}