"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";
import type { WorkflowStatus } from "@/lib/types";

/**
 * Cambia el estado de una automatización.
 * Se pasa como prop a <WorkflowCard /> desde un Server Component.
 */
export async function toggleWorkflowStatus(id: string, next: WorkflowStatus): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("No has iniciado sesión.");

  const supabase = await createClient();

  const { error } = await supabase
    .from("workflows")
    .update({ status: next })
    .eq("id", id)
    .eq("owner_id", userId);

  if (error) {
    throw new Error(`No se pudo actualizar la automatización: ${error.message}`);
  }

  revalidatePath("/dashboard");
}