import { db } from "@/lib/supabase/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCRC } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  type: "profile" | "full_account";
  price: number;
  duration_days: number;
  is_active: boolean;
  services: { name: string; color: string | null } | null;
}

export default async function ProductosPage() {
  const supabase = db();
  const { data } = await supabase
    .from("products")
    .select("id, name, type, price, duration_days, is_active, services(name, color)")
    .order("sort_order", { ascending: true });

  const products = (data as ProductRow[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Productos"
        description="Lo que el cliente ve y compra en la tienda."
        action={
          <span className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:bg-zinc-800">
            + Crear producto (próximamente)
          </span>
        }
      />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Producto</th>
                  <th className="px-5 py-3 font-medium">Servicio</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Precio</th>
                  <th className="px-5 py-3 font-medium">Duración</th>
                  <th className="px-5 py-3 font-medium">Activo</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      No hay productos. Corré el seed o creá uno.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                        {p.services?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={p.type === "profile" ? "purple" : "blue"}>
                          {p.type === "profile" ? "Perfil" : "Cuenta completa"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {formatCRC(p.price)}
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {p.duration_days} días
                      </td>
                      <td className="px-5 py-3">
                        {p.is_active ? (
                          <Badge tone="green">Sí</Badge>
                        ) : (
                          <Badge tone="neutral">No</Badge>
                        )}
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
