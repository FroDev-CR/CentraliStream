import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/admin/status-badges";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface AccountRow {
  id: string;
  email: string;
  status: string;
  paid_through: string | null;
  max_profiles: number;
  services: { name: string; color: string | null } | null;
  account_profiles: { id: string; status: string }[];
}

export default async function InventarioPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("streaming_accounts")
    .select(
      "id, email, status, paid_through, max_profiles, services(name, color), account_profiles(id, status)",
    )
    .order("created_at", { ascending: false });

  const accounts = (data as AccountRow[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Banco de cuentas"
        description="Tu inventario real de cuentas y perfiles."
        action={
          <Link
            href="/admin/inventario/nueva"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            + Agregar cuenta
          </Link>
        }
      />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Servicio</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Perfiles</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Pagada hasta</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      No hay cuentas todavía. Agregá la primera.
                    </td>
                  </tr>
                ) : (
                  accounts.map((a) => {
                    const free = a.account_profiles.filter(
                      (p) => p.status === "available",
                    ).length;
                    const total = a.account_profiles.length;
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/50"
                      >
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-2 font-medium"
                            style={{ color: a.services?.color ?? undefined }}
                          >
                            {a.services?.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                          {a.email}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {free} libres
                          </span>{" "}
                          <span className="text-zinc-400">/ {total}</span>
                        </td>
                        <td className="px-5 py-3">
                          <AccountStatusBadge status={a.status as never} />
                        </td>
                        <td className="px-5 py-3 text-zinc-500">
                          {formatDate(a.paid_through)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
