"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/db";
import { requireAdmin } from "@/lib/auth";

/** Crea una cuenta de streaming en el inventario con N perfiles libres. */
export async function createStreamingAccount(formData: FormData) {
  await requireAdmin();
  const supabase = db();

  const service_id = String(formData.get("service_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  const numProfiles = Math.max(1, Number(formData.get("num_profiles") ?? 5));
  const cost = formData.get("cost") ? Number(formData.get("cost")) : null;
  const paid_through = String(formData.get("paid_through") ?? "") || null;

  if (!service_id || !email || !password) {
    throw new Error("Servicio, correo y contraseña son obligatorios");
  }

  const { data: account, error } = await supabase
    .from("streaming_accounts")
    .insert({
      service_id,
      email,
      password,
      label,
      cost,
      paid_through,
      max_profiles: numProfiles,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !account) throw new Error(error?.message ?? "No se pudo crear");

  // Crear los perfiles
  const profiles = Array.from({ length: numProfiles }, (_, i) => ({
    account_id: account.id,
    profile_label: `Perfil ${i + 1}`,
    status: "available" as const,
  }));
  await supabase.from("account_profiles").insert(profiles);

  revalidatePath("/admin/inventario");
  redirect("/admin/inventario");
}
