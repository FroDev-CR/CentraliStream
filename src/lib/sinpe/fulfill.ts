import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Libera una orden ya pagada:
 *  - purchase de perfil   -> asigna un perfil libre del servicio + entitlement
 *  - purchase de cuenta   -> asigna todos los perfiles de una cuenta libre
 *  - credit_topup         -> suma saldo al cliente
 *
 * Devuelve { ok, error } y deja la orden en 'fulfilled' o 'paid' (si no hubo stock).
 * Usa el admin client (service_role) — solo en el servidor.
 */
export async function fulfillOrder(
  admin: SupabaseClient,
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, error: "Orden no encontrada" };
  if (order.status === "fulfilled")
    return { ok: true }; // idempotente

  // ----- Recarga de créditos -----
  if (order.kind === "credit_topup") {
    const { data: profile } = await admin
      .from("profiles")
      .select("credit_balance")
      .eq("id", order.customer_id)
      .single();
    const newBalance = Number(profile?.credit_balance ?? 0) + Number(order.amount);

    await admin
      .from("profiles")
      .update({ credit_balance: newBalance })
      .eq("id", order.customer_id);

    await admin.from("credit_transactions").insert({
      customer_id: order.customer_id,
      type: "topup",
      amount: order.amount,
      balance_after: newBalance,
      order_id: order.id,
      note: "Recarga vía SINPE",
    });

    await markFulfilled(admin, order.id);
    return { ok: true };
  }

  // ----- Compra de producto -----
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("id", order.product_id)
    .single();

  if (!product) return { ok: false, error: "Producto no encontrado" };

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + (product.duration_days ?? 30));

  if (product.type === "profile") {
    // Buscar un perfil libre de cualquier cuenta del servicio
    const { data: profile } = await admin
      .from("account_profiles")
      .select("id, account_id, streaming_accounts!inner(service_id)")
      .eq("status", "available")
      .eq("streaming_accounts.service_id", product.service_id)
      .limit(1)
      .maybeSingle();

    if (!profile) {
      return { ok: false, error: "Sin perfiles libres en inventario" };
    }

    await admin
      .from("account_profiles")
      .update({ status: "sold", assigned_customer_id: order.customer_id })
      .eq("id", profile.id);

    await admin.from("entitlements").insert({
      customer_id: order.customer_id,
      order_id: order.id,
      product_id: product.id,
      account_id: profile.account_id,
      account_profile_id: profile.id,
      ends_at: endsAt.toISOString(),
    });
  } else {
    // Cuenta completa: una cuenta activa con todos sus perfiles libres
    const { data: account } = await admin
      .from("streaming_accounts")
      .select("id, account_profiles(id, status)")
      .eq("service_id", product.service_id)
      .eq("status", "active")
      .limit(20);

    const freeAccount = account?.find((a: any) =>
      a.account_profiles.every((p: any) => p.status === "available"),
    );

    if (!freeAccount) {
      return { ok: false, error: "Sin cuentas completas libres en inventario" };
    }

    await admin
      .from("account_profiles")
      .update({ status: "sold", assigned_customer_id: order.customer_id })
      .eq("account_id", freeAccount.id);

    await admin.from("entitlements").insert({
      customer_id: order.customer_id,
      order_id: order.id,
      product_id: product.id,
      account_id: freeAccount.id,
      ends_at: endsAt.toISOString(),
    });
  }

  await markFulfilled(admin, order.id);
  return { ok: true };
}

async function markFulfilled(admin: SupabaseClient, orderId: string) {
  await admin
    .from("orders")
    .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
    .eq("id", orderId);
}
