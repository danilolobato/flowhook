import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Accede a tu panel de automatizaciones.",
};

export default function SignInPage(): React.JSX.Element {
  return (
    <div className="w-full max-w-[26rem]">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          Vuelve a tus flujos
        </h1>
        <p className="mt-2 text-[14px] text-[#8B95A9]">
          Entra para ver qué ha ejecutado Flowhook mientras no estabas.
        </p>
      </div>

      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-[#121826] border border-white/10",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
        }}
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}