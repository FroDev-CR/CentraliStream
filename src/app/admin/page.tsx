import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/admin/status-badges";
import { formatCRC, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Order } from "@/lib/types";

async function count(table: string, filter?: (q: any) => any) {
  const supabase = await createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    customers,
    accounts,
    freeProfiles,
    pendingOrders,
    unmatchedSinpe,
    pendingRequests,
  ] = await Promise.all([
    count("profiles", (q) => q.eq("role", "customer")),
    count("streaming_accounts"),
    count("account_profiles", (q) => q.eq("status", "available")),
    count("orders", (q) => q.eq("status", "pending")),
    count("sinpe_messages", (q) => q.eq("status", "unmatched")),
    count("service_requests", (q) => q.eq("status", "pending")),
  ]);

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Vista general del negocio en tiempo real."
      />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Clientes" value={customers} />
          <StatCard label="Cuentas en inventario" value={accounts} />
          <StatCard
            label="Perfiles libres"
            value={freeProfiles}
            tone={freeProfiles === 0 ? "bad" : "good"}
            hint="Disponibles para vender"
          />
          <StatCard
            label="Órdenes pendientes"
            value={pendingOrders}
            tone={pendingOrders > 0 ? "warn" : "default"}
          />
          <StatCard
            label="SINPE sin casar"
            value={unmatchedSinpe}
            tone={unmatchedSinpe > 0 ? "warn" : "default"}
            hint="Requieren revisión"
          />
          <StatCard
            label="Solicitudes pendientes"
            value={pendingRequests}
            tone={pendingRequests > 0 ? "warn" : "default"}
          />
        </div>

        <Card>
          <CardHeader
            title="Órdenes recientes"
            action={
              <Link
                href="/admin/ordenes"
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Ver todas
              </Link>
            }
          />
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {(recentOrders as Order[] | null)?.length ? (
              (recentOrders as Order[]).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium">{o.code}</span>
                    <Badge tone={o.kind === "credit_topup" ? "blue" : "neutral"}>
                      {o.kind === "credit_topup" ? "Recarga" : "Compra"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{formatCRC(o.amount)}</span>
                    <OrderStatusBadge status={o.status} />
                    <span className="text-zinc-400">
                      {formatDate(o.created_at)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-sm text-zinc-400">
                Aún no hay órdenes.
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
