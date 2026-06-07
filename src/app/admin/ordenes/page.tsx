import { db } from "@/lib/supabase/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/admin/status-badges";
import { formatCRC, formatDate } from "@/lib/utils";

interface OrderRow {
  id: string;
  code: string;
  kind: "purchase" | "credit_topup";
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  products: { name: string } | null;
}

export default async function OrdenesPage() {
  const supabase = db();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, code, kind, amount, status, payment_method, created_at, profiles(full_name, email), products(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (data as OrderRow[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Órdenes"
        description="Compras y recargas. Las pendientes esperan confirmación de SINPE."
      />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Detalle</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Concepto</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Pago</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      Aún no hay órdenes.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-5 py-3 font-mono font-medium">
                        {o.code}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                        {o.profiles?.full_name ?? o.profiles?.email ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                        {o.kind === "credit_topup" ? (
                          <Badge tone="blue">Recarga de créditos</Badge>
                        ) : (
                          (o.products?.name ?? "—")
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {formatCRC(o.amount)}
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {o.payment_method === "credits" ? "Créditos" : "SINPE"}
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={o.status as never} />
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {formatDate(o.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
