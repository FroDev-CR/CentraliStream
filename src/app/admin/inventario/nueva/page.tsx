import Link from "next/link";
import { db } from "@/lib/supabase/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { createStreamingAccount } from "@/lib/actions/inventory";
import type { Service } from "@/lib/types";

export default async function NuevaCuentaPage() {
  const supabase = db();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  const services = (data as Service[] | null) ?? [];

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <>
      <PageHeader
        title="Agregar cuenta"
        description="Nueva cuenta al banco de inventario."
        action={
          <Link
            href="/admin/inventario"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Volver
          </Link>
        }
      />
      <div className="p-8">
        <Card className="max-w-xl p-6">
          <form action={createStreamingAccount} className="space-y-4">
            <div>
              <label className={labelClass}>Servicio</label>
              <select name="service_id" required className={inputClass}>
                <option value="">Elegí un servicio…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Correo de la cuenta</label>
                <input name="email" type="email" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contraseña</label>
                <input name="password" required className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Cantidad de perfiles</label>
                <input
                  name="num_profiles"
                  type="number"
                  defaultValue={5}
                  min={1}
                  max={10}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Costo (opcional)</label>
                <input name="cost" type="number" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Pagada hasta (opcional)</label>
                <input name="paid_through" type="date" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Etiqueta interna (opcional)</label>
                <input name="label" className={inputClass} />
              </div>
            </div>

            <button className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
              Crear cuenta + perfiles
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
