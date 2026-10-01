import "server-only";

import { createServerClient } from "@supabase/ssr";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
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
 * Cliente de servidor ligado a la sesión de Clerk mediante cabeceras globales.
 * Úsalo en Server Components, Server Actions y Route Handlers.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = readEnv();
  const cookieStore = await cookies();
  const { getToken } = await auth();
  
  // Obtenemos el token de plantilla de Clerk para Supabase (si usas una template, ej: "supabase")
  // O simplemente getToken() si configuras la autenticación por cabecera Bearer
  const token = await getToken({ template: "supabase" }).catch(() => null);

  return createServerClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` falla en Server Components de sólo lectura.
          // Es seguro ignorarlo: el middleware ya refresca la sesión.
        }
      },
    },
  });
}

/**
 * Cliente con `service_role`: ignora RLS.
 * Sólo para tareas de servidor (cron, ingesta de webhooks entrantes).
 * Nunca lo importes desde un componente de cliente.
 */
export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }

  return createServerClient<Database>(url, serviceRoleKey, {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
  });
}