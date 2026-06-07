import { db } from "@/lib/supabase/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCRC, formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export default async function ClientesPage() {
  const supabase = db();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const customers = (data as Profile[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes registrados.`}
      />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Teléfono</th>
                  <th className="px-5 py-3 font-medium">Nombre SINPE</th>
                  <th className="px-5 py-3 font-medium">Saldo</th>
                  <th className="px-5 py-3 font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      Aún no hay clientes.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {c.full_name ?? "—"}
                        {c.is_blocked && (
                          <Badge tone="red" className="ml-2">
                            Bloqueado
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                        {c.email ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                        {c.phone ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                        {c.sinpe_name ?? "—"}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {formatCRC(c.credit_balance)}
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {formatDate(c.created_at)}
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
