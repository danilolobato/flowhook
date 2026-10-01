"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

function readEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
    );
  }

  return { url, anonKey };
}

/**
 * Cliente anónimo para componentes de cliente sin sesión (datos públicos).
 */
export function createClient(): SupabaseClient<Database> {
  const { url, anonKey } = readEnv();
  return createBrowserClient<Database>(url, anonKey);
}

/**
 * Cliente autenticado: inyecta el token de Clerk en cada petición para que las
 * políticas RLS puedan leer `auth.jwt()->>'sub'` como el id del usuario.
 *
 * Requiere activar la integración nativa Clerk ↔ Supabase en el panel de Supabase
 * (Authentication → Third-party Auth → Clerk).
 */
export function useSupabaseClient(): SupabaseClient<Database> {
  const { session } = useSession();

  return useMemo<SupabaseClient<Database>>(() => {
    const { url, anonKey } = readEnv();

    return createBrowserClient<Database>(url, anonKey, {
      accessToken: async (): Promise<string | null> => {
        if (!session) return null;
        return session.getToken();
      },
    });
  }, [session]);
}