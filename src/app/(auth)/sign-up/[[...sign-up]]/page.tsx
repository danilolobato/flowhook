import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta y lanza tu primera automatización en minutos.",
};

export default function SignUpPage(): React.JSX.Element {
  return (
    <div className="w-full max-w-[26rem]">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          Crea tu cuenta
        </h1>
        <p className="mt-2 text-[14px] text-[#8B95A9]">
          El plan gratuito incluye 1.000 ejecuciones al mes. No pedimos tarjeta.
        </p>
      </div>

      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-[#121826] border border-white/10",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
        }}
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}