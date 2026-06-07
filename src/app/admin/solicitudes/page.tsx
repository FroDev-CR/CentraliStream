import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/admin/status-badges";
import { formatDate } from "@/lib/utils";

interface RequestRow {
  id: string;
  type: "pin_change" | "profile_name_change";
  requested_value: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

export default async function SolicitudesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("id, type, requested_value, status, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  const requests = (data as RequestRow[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Solicitudes"
        description="Cambios de PIN y de nombre de perfil pedidos por los clientes."
      />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Valor solicitado</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      No hay solicitudes pendientes.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-5 py-3 text-zinc-700 dark:text-zinc-200">
                        {r.profiles?.full_name ?? r.profiles?.email ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={r.type === "pin_change" ? "amber" : "purple"}>
                          {r.type === "pin_change"
                            ? "Cambio de PIN"
                            : "Cambio de nombre"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-600 dark:text-zinc-300">
                        {r.requested_value ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <RequestStatusBadge status={r.status as never} />
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {formatDate(r.created_at)}
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
