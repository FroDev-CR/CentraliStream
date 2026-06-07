"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/supabase/db";

async function uid(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  return userId;
}

/** El cliente solicita cambio de PIN o de nombre de perfil. */
export async function createServiceRequest(formData: FormData) {
  const userId = await uid();
  const supabase = db();

  const type = String(formData.get("type") ?? "");
  const requested_value = String(formData.get("requested_value") ?? "").trim();
  const entitlement_id = String(formData.get("entitlement_id") ?? "") || null;
  const account_profile_id =
    String(formData.get("account_profile_id") ?? "") || null;

  if (type !== "pin_change" && type !== "profile_name_change") {
    throw new Error("Tipo inválido");
  }
  if (!requested_value) throw new Error("Indicá el valor solicitado");

  const { error } = await supabase.from("service_requests").insert({
    customer_id: userId,
    type,
    requested_value,
    entitlement_id,
    account_profile_id,
    status: "pending",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

/** Abre un ticket de soporte con el primer mensaje. */
export async function createSupportTicket(formData: FormData) {
  const userId = await uid();
  const supabase = db();

  const subject = String(formData.get("subject") ?? "").trim() || "Soporte";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Escribí tu mensaje");

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ customer_id: userId, subject, status: "open" })
    .select("id")
    .single();
  if (error || !ticket) throw new Error(error?.message ?? "No se pudo crear");

  await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    sender_id: userId,
    is_admin: false,
    body,
  });

  revalidatePath("/dashboard/soporte");
}

/** Envía un mensaje en un ticket existente (verifica que sea del cliente). */
export async function sendSupportMessage(formData: FormData) {
  const userId = await uid();
  const supabase = db();

  const ticket_id = String(formData.get("ticket_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!ticket_id || !body) throw new Error("Mensaje vacío");

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", ticket_id)
    .eq("customer_id", userId)
    .maybeSingle();
  if (!ticket) throw new Error("Ticket no encontrado");

  const { error } = await supabase.from("support_messages").insert({
    ticket_id,
    sender_id: userId,
    is_admin: false,
    body,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/soporte`);
}
