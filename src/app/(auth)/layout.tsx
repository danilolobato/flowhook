import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col bg-[#0B0F1A]">
      <header className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-[#7C6BFF]">
            <Zap className="size-4 text-white" aria-hidden />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">Flowhook</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">{children}</main>

      <footer className="px-6 pb-8 text-center text-[12px] text-[#6F7890]">
        Protegido por Clerk. Nunca almacenamos tu contraseña.
      </footer>
    </div>
  );
}