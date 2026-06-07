import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { SinpeStatusBadge } from "@/components/admin/status-badges";
import { formatCRC, formatDate } from "@/lib/utils";
import type { SinpeMessage } from "@/lib/types";

export default async function SinpePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sinpe_messages")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(100);

  const messages = (data as SinpeMessage[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Mensajes SINPE"
        description="Lo que llega del banco vía el webhook. Los 'sin casar' necesitan revisión manual."
      />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Remitente</th>
                  <th className="px-5 py-3 font-medium">Monto</th>
                  <th className="px-5 py-3 font-medium">Detalle</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Recibido</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      Aún no llegan mensajes SINPE. El webhook está en{" "}
                      <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                        /api/webhooks/sinpe
                      </code>
                      .
                    </td>
                  </tr>
                ) : (
                  messages.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-5 py-3 text-zinc-700 dark:text-zinc-200">
                        {m.sender_name ?? "—"}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {m.amount != null ? formatCRC(m.amount) : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-600 dark:text-zinc-300">
                        {m.detail ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <SinpeStatusBadge status={m.status} />
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {formatDate(m.received_at)}
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
