import { db } from "@/lib/supabase/db";
import { requireUser } from "@/lib/auth";
import { formatCRC, formatDate } from "@/lib/utils";
import { TopupForm } from "./topup-form";

interface TxnRow {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  note: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  topup: "Recarga",
  purchase: "Compra",
  refund: "Reembolso",
  adjustment: "Ajuste",
};

export default async function CreditosPage() {
  const profile = await requireUser();
  const supabase = db();

  const { data } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const txns = (data as TxnRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Créditos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tu saldo: <strong>{formatCRC(profile.credit_balance)}</strong>
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Recargar saldo</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Elegí un monto y pagalo por SINPE. Al confirmarse, se suma a tu saldo.
        </p>
        <TopupForm />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Movimientos
        </h2>
        {txns.length === 0 ? (
          <p className="text-sm text-zinc-400">Sin movimientos todavía.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <tbody>
                {txns.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {TYPE_LABEL[t.type] ?? t.type}
                      </div>
                      {t.note && (
                        <div className="text-xs text-zinc-400">{t.note}</div>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        t.amount >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {t.amount >= 0 ? "+" : ""}
                      {formatCRC(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-400">
                      {formatDate(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
