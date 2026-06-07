import { db } from "@/lib/supabase/db";
import { formatCRC } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BuyButtons } from "./buy-buttons";

interface ProductRow {
  id: string;
  name: string;
  type: "profile" | "full_account";
  price: number;
  duration_days: number;
  description: string | null;
  service_id: string;
  services: { name: string; color: string | null } | null;
}

export default async function TiendaPage() {
  const supabase = db();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, type, price, duration_days, description, service_id, services(name, color)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const products = (data as ProductRow[] | null) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Tienda</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Elegí tu servicio. Pagás con SINPE o con tu saldo de créditos.
      </p>

      {products.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-400">
          No hay productos disponibles por ahora.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold"
                  style={{ color: p.services?.color ?? undefined }}
                >
                  {p.services?.name}
                </span>
                <Badge tone={p.type === "profile" ? "purple" : "blue"}>
                  {p.type === "profile" ? "Perfil" : "Cuenta completa"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {p.name}
              </p>
              {p.description && (
                <p className="mt-1 text-xs text-zinc-400">{p.description}</p>
              )}
              <div className="mt-3 text-2xl font-bold">
                {formatCRC(p.price)}
                <span className="text-sm font-normal text-zinc-400">
                  {" "}
                  / {p.duration_days} días
                </span>
              </div>
              <div className="mt-auto pt-4">
                <BuyButtons
                  productId={p.id}
                  name={p.name}
                  service={p.services?.name ?? ""}
                  price={p.price}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
