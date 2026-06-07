import Link from "next/link";
import { db } from "@/lib/supabase/db";
import { requireUser } from "@/lib/auth";
import { formatCRC, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/admin/status-badges";
import { RequestButtons } from "@/components/dashboard/request-buttons";

interface EntitlementRow {
  id: string;
  ends_at: string;
  status: string;
  account_profile_id: string | null;
  products: { name: string } | null;
  streaming_accounts: {
    email: string;
    password: string;
    services: { name: string; color: string | null } | null;
  } | null;
  account_profiles: {
    profile_label: string | null;
    profile_name: string | null;
    pin: string | null;
  } | null;
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const profile = await requireUser();
  const supabase = db();

  const { data: ent } = await supabase
    .from("entitlements")
    .select(
      "id, ends_at, status, account_profile_id, products(name), streaming_accounts(email, password, services(name, color)), account_profiles(profile_label, profile_name, pin)",
    )
    .eq("customer_id", profile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const entitlements = (ent as EntitlementRow[] | null) ?? [];

  const { data: pend } = await supabase
    .from("orders")
    .select("id, code, amount, status, kind")
    .eq("customer_id", profile.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      {ok === "compra" && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          ✓ ¡Compra realizada con créditos! Abajo está tu acceso.
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hola, {profile.full_name ?? "👋"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Saldo: {formatCRC(profile.credit_balance)} ·{" "}
          <Link href="/dashboard/tienda" className="text-red-600 hover:underline">
            Ir a la tienda
          </Link>
        </p>
      </div>

      {/* Órdenes pendientes de pago */}
      {pend && pend.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Pendientes de pago
          </h2>
          <div className="space-y-2">
            {pend.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/orden/${o.code}`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30"
              >
                <span className="font-mono font-medium">{o.code}</span>
                <span>{formatCRC(o.amount)}</span>
                <OrderStatusBadge status={o.status as never} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cuentas activas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Mis cuentas activas
        </h2>
        {entitlements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
            Todavía no tenés cuentas.{" "}
            <Link href="/dashboard/tienda" className="text-red-600 hover:underline">
              Comprá la primera
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {entitlements.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        e.streaming_accounts?.services?.color ?? undefined,
                    }}
                  >
                    {e.streaming_accounts?.services?.name ?? "Cuenta"}
                  </span>
                  <Badge tone="green">Activa</Badge>
                </div>

                <dl className="mt-3 space-y-1.5 text-sm">
                  <CredRow label="Correo" value={e.streaming_accounts?.email} />
                  <CredRow
                    label="Contraseña"
                    value={e.streaming_accounts?.password}
                  />
                  {e.account_profiles && (
                    <>
                      <CredRow
                        label="Perfil"
                        value={
                          e.account_profiles.profile_name ??
                          e.account_profiles.profile_label
                        }
                      />
                      <CredRow label="PIN" value={e.account_profiles.pin} />
                    </>
                  )}
                </dl>

                <p className="mt-3 text-xs text-zinc-400">
                  Vence: {formatDate(e.ends_at)}
                </p>

                {e.account_profile_id && (
                  <RequestButtons
                    entitlementId={e.id}
                    accountProfileId={e.account_profile_id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CredRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono font-medium">{value ?? "—"}</dd>
    </div>
  );
}
