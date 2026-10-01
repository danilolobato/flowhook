"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";
import { rowToStoredApiKey } from "@/lib/supabase/mappers";
import type { ApiKey, ApiKeyScope } from "@/lib/types";

function generateSecret(): { secret: string; prefix: string; hash: string } {
  const secret = `flw_${crypto.randomBytes(24).toString("base64url")}`;
  const prefix = secret.slice(0, 12);
  const hash = crypto.createHash("sha256").update(secret).digest("hex");
  return { secret, prefix, hash };
}

/**
 * Crea una clave y devuelve el secreto en texto plano.
 * Es la ÚNICA vez que el secreto sale del servidor: sólo se guarda su hash.
 */
export async function createApiKey(name: string, scope: ApiKeyScope): Promise<ApiKey> {
  const { userId } = await auth();
  if (!userId) throw new Error("No has iniciado sesión.");

  const trimmedName = name.trim();
  if (trimmedName.length === 0) throw new Error("Ponle un nombre a la clave.");

  const { secret, prefix, hash } = generateSecret();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ owner_id: userId, name: trimmedName, prefix, hashed_secret: hash, scope })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la clave: ${error?.message ?? "error desconocido"}`);
  }

  revalidatePath("/dashboard/settings");

  return { ...rowToStoredApiKey(data), secret };
}

export async function revokeApiKey(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("No has iniciado sesión.");

  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").delete().eq("id", id).eq("owner_id", userId);

  if (error) {
    throw new Error(`No se pudo revocar la clave: ${error.message}`);
  }

  revalidatePath("/dashboard/settings");
}