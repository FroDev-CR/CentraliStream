"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/supabase/db";
import { fulfillOrder } from "@/lib/sinpe/fulfill";
import { requireUser } from "@/lib/auth";

const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";

async function newOrderCode(): Promise<string> {
  const supabase = db();
  const { data, error } = await supabase.rpc("generate_order_code");
  if (error || !data) {
    return "CENT-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  return data as string;
}

/** Compra con SINPE: crea orden pendiente y manda a instrucciones de pago. */
export async function createPurchaseOrder(productId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const supabase = db();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_active", true)
    .single();
  if (!product) throw new Error("Producto no disponible");

  const code = await newOrderCode();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      code,
      customer_id: userId,
      kind: "purchase",
      product_id: product.id,
      amount: product.price,
      payment_method: "sinpe",
      status: TEST_MODE ? "paid" : "pending",
      paid_at: TEST_MODE ? new Date().toISOString() : null,
      expires_at: expires.toISOString(),
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(error?.message ?? "No se pudo crear");

  // Modo prueba: liberar al instante sin esperar el SMS.
  if (TEST_MODE) {
    const r = await fulfillOrder(supabase, order.id);
    if (!r.ok) {
      await supabase.from("orders").update({ status: "pending" }).eq("id", order.id);
      throw new Error(r.error ?? "Sin inventario disponible");
    }
  }

  redirect(`/dashboard/orden/${code}`);
}

/** Recarga de créditos vía SINPE. */
export async function createTopupOrder(amount: number) {
  if (!amount || amount < 500) throw new Error("Monto mínimo ₡500");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const supabase = db();

  const code = await newOrderCode();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      code,
      customer_id: userId,
      kind: "credit_topup",
      amount,
      payment_method: "sinpe",
      status: TEST_MODE ? "paid" : "pending",
      paid_at: TEST_MODE ? new Date().toISOString() : null,
      expires_at: expires.toISOString(),
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(error?.message ?? "No se pudo crear");

  if (TEST_MODE) {
    await fulfillOrder(supabase, order.id); // suma los créditos
  }

  redirect(`/dashboard/orden/${code}`);
}

/** Compra usando saldo de créditos: se libera al instante. */
export async function buyWithCredits(productId: string) {
  const profile = await requireUser();
  const supabase = db();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_active", true)
    .single();
  if (!product) throw new Error("Producto no disponible");

  if (Number(profile.credit_balance) < Number(product.price)) {
    throw new Error("Saldo insuficiente");
  }

  const code = await newOrderCode();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      code,
      customer_id: profile.id,
      kind: "purchase",
      product_id: product.id,
      amount: product.price,
      payment_method: "credits",
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(error?.message ?? "No se pudo crear la orden");

  const result = await fulfillOrder(supabase, order.id);
  if (!result.ok) {
    await supabase.from("orders").update({ status: "pending" }).eq("id", order.id);
    throw new Error(result.error ?? "No hay inventario disponible");
  }

  const newBalance = Number(profile.credit_balance) - Number(product.price);
  await supabase.from("profiles").update({ credit_balance: newBalance }).eq("id", profile.id);
  await supabase.from("credit_transactions").insert({
    customer_id: profile.id,
    type: "purchase",
    amount: -Number(product.price),
    balance_after: newBalance,
    order_id: order.id,
    note: `Compra: ${product.name}`,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard?ok=compra");
}

export interface CheckoutResult {
  released: number;
  failed: { name: string; reason: string }[];
}

/**
 * Checkout del carrito. En modo prueba libera cada cuenta al instante.
 * Devuelve cuántas se liberaron y cuáles fallaron (sin inventario).
 */
export async function checkoutCart(
  productIds: string[],
): Promise<CheckoutResult> {
  const profile = await requireUser();
  const supabase = db();
  const result: CheckoutResult = { released: 0, failed: [] };

  for (const productId of productIds) {
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single();
    if (!product) {
      result.failed.push({ name: "Producto", reason: "No disponible" });
      continue;
    }

    const code = await newOrderCode();
    const { data: order } = await supabase
      .from("orders")
      .insert({
        code,
        customer_id: profile.id,
        kind: "purchase",
        product_id: product.id,
        amount: product.price,
        payment_method: "sinpe",
        status: "paid",
        paid_at: new Date().toISOString(),
        admin_note: TEST_MODE ? "Liberada en modo prueba" : null,
      })
      .select("id")
      .single();

    if (!order) {
      result.failed.push({ name: product.name, reason: "No se pudo crear" });
      continue;
    }

    const r = await fulfillOrder(supabase, order.id);
    if (r.ok) {
      result.released += 1;
    } else {
      await supabase.from("orders").update({ status: "pending" }).eq("id", order.id);
      result.failed.push({ name: product.name, reason: r.error ?? "Sin inventario" });
    }
  }

  revalidatePath("/dashboard");
  return result;
}
