import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flowhook · Automatiza tu trabajo sin escribir código",
    template: "%s · Flowhook",
  },
  description:
    "Conecta tus herramientas, lanza automatizaciones con webhooks y revisa cada evento en un solo panel.",
};

export const viewport: Viewport = {
  themeColor: "#0B0F1A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <ClerkProvider
      localization={esES}
      appearance={{
        variables: {
          colorPrimary: "#7C6BFF",
          colorBackground: "#121826",
          colorForeground: "#E6EAF2",
          colorMutedForeground: "#8B95A9",
          colorInput: "#0F1522",
          colorInputForeground: "#E6EAF2",
          borderRadius: "0.6rem",
        },
        elements: {
          card: "border border-white/10 shadow-2xl shadow-black/40",
          headerTitle: "font-display",
          formButtonPrimary:
            "bg-[#7C6BFF] hover:bg-[#6B57FF] text-white normal-case font-medium",
          footerActionLink: "text-[#BFB4FF] hover:text-white",
        },
      }}
    >
      <html lang="es" className="dark">
        <body
          className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-dvh bg-[#0B0F1A] font-sans text-[#E6EAF2] antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}