import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/supabase/db";
import { requireUserId } from "@/lib/auth";
import { formatCRC } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/status-badges";
import { OrderPoller } from "./poller";
import type { Order } from "@/lib/types";

const SINPE_NUMBER = process.env.NEXT_PUBLIC_SINPE_NUMBER ?? "8888-8888";
const SINPE_NAME = process.env.NEXT_PUBLIC_SINPE_NAME ?? "Centralia Streaming";

export default async function OrdenPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const userId = await requireUserId();
  const supabase = db();
  const { data } = await supabase
    .from("orders")
    .select("*, products(name)")
    .eq("code", code)
    .eq("customer_id", userId)
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order & { products: { name: string } | null };
  const done = order.status === "fulfilled";
  const pending = order.status === "pending";

  return (
    <div className="mx-auto max-w-lg">
      {pending && <OrderPoller />}

      <Link
        href="/dashboard/tienda"
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Volver a la tienda
      </Link>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">
            {order.kind === "credit_topup"
              ? "Recarga de créditos"
              : (order.products?.name ?? "Compra")}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

        {done ? (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              ✓ ¡Pago confirmado y liberado!
            </p>
            <Link
              href="/dashboard"
              className="mt-2 inline-block text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
            >
              Ver mis cuentas
            </Link>
          </div>
        ) : pending ? (
          <>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
              Hacé un <strong>SINPE Móvil</strong> con estos datos exactos:
            </p>
            <dl className="mt-4 space-y-3">
              <Row label="Número">
                <span className="font-mono text-lg font-bold">{SINPE_NUMBER}</span>
              </Row>
              <Row label="A nombre de">{SINPE_NAME}</Row>
              <Row label="Monto">
                <span className="font-bold">{formatCRC(order.amount)}</span>
              </Row>
              <Row label="Detalle (¡importante!)">
                <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-lg font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {order.code}
                </span>
              </Row>
            </dl>
            <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/50">
              Poné el código <strong>{order.code}</strong> en el detalle del SINPE.
              Apenas confirmemos el pago, esto se libera automáticamente. Esta
              página se actualiza sola.
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">
            Estado de la orden: {order.status}. Si creés que es un error,
            contactá soporte.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
