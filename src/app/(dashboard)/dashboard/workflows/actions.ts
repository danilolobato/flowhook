"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

interface CreateWorkflowInput {
  readonly name: string;
  readonly description: string;
}

/** Crea una automatización activa con un disparador por webhook. Devuelve su id. */
export async function createWorkflow(input: CreateWorkflowInput): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("No has iniciado sesión.");

  const name = input.name.trim();
  if (name.length === 0) throw new Error("Ponle un nombre a la automatización.");
  if (name.length > 80) throw new Error("El nombre no puede pasar de 80 caracteres.");

  const steps: Json = [
    { id: "s1", label: "Recibir webhook", kind: "trigger", service: "Webhook" },
  ];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      owner_id: userId,
      name,
      description: input.description.trim(),
      status: "active",
      trigger: "webhook",
      steps,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la automatización: ${error?.message ?? "error desconocido"}`);
  }

  revalidatePath("/dashboard");

  return data.id;
}