import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSinpeMessage } from "@/lib/sinpe/parser";
import { fulfillOrder } from "@/lib/sinpe/fulfill";

/**
 * Webhook que recibe los SMS de SINPE reenviados por la app Android.
 *
 * Seguridad: header  Authorization: Bearer <SINPE_WEBHOOK_SECRET>
 *
 * Body JSON esperado (flexible):
 *   { "message": "<texto completo del SMS>", "receivedAt"?: "ISO", "from"?: "..." }
 *
 * Flujo:
 *   1. Autentica por secreto.
 *   2. Parsea el SMS.
 *   3. Guarda el mensaje (idempotente por hash).
 *   4. Busca orden PENDIENTE cuyo code == detalle y monto suficiente.
 *   5. Si casa -> marca pagada -> libera (fulfillOrder). Si no -> queda 'unmatched'.
 */
export async function POST(request: Request) {
  // 1. Auth
  const auth = request.headers.get("authorization") ?? "";
  const secret = process.env.SINPE_WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { message?: string; receivedAt?: string; from?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = (body.message ?? "").toString();
  if (!raw.trim()) {
    return NextResponse.json({ error: "Falta 'message'" }, { status: 400 });
  }

  const admin = createAdminClient();
  const parsed = parseSinpeMessage(raw);
  const receivedAt = body.receivedAt ?? new Date().toISOString();

  // 3. Idempotencia: hash del contenido
  const externalId = createHash("sha256")
    .update(raw + "|" + receivedAt)
    .digest("hex");

  const { data: existing } = await admin
    .from("sinpe_messages")
    .select("id")
    .eq("external_id", externalId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Guardar mensaje
  const { data: msg, error: insertErr } = await admin
    .from("sinpe_messages")
    .insert({
      raw_text: raw,
      sender_name: parsed.sender_name ?? body.from ?? null,
      amount: parsed.amount,
      detail: parsed.detail ?? parsed.orderCode,
      reference: parsed.reference,
      external_id: externalId,
      received_at: receivedAt,
      status: "unmatched",
    })
    .select("id")
    .single();

  if (insertErr || !msg) {
    return NextResponse.json(
      { error: "No se pudo guardar el mensaje" },
      { status: 500 },
    );
  }

  // 4. Intentar casar con una orden pendiente
  const code = parsed.orderCode;
  if (!code) {
    return NextResponse.json({ ok: true, matched: false, reason: "sin código" });
  }

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("code", code)
    .eq("status", "pending")
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ ok: true, matched: false, reason: "orden no encontrada" });
  }

  // Validar monto (si lo pudimos parsear)
  if (parsed.amount != null && Number(parsed.amount) < Number(order.amount)) {
    return NextResponse.json({
      ok: true,
      matched: false,
      reason: "monto insuficiente",
    });
  }

  // 5. Casar: marcar mensaje + orden, y liberar
  await admin
    .from("sinpe_messages")
    .update({ status: "matched", matched_order_id: order.id })
    .eq("id", msg.id);

  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      sinpe_message_id: msg.id,
    })
    .eq("id", order.id);

  const result = await fulfillOrder(admin, order.id);

  return NextResponse.json({
    ok: true,
    matched: true,
    orderCode: code,
    fulfilled: result.ok,
    fulfillError: result.error,
  });
}
