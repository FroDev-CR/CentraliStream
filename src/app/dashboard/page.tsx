import { isSupabaseConfigured } from "@/lib/config";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCRC } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/dashboard");

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {profile.full_name ?? "cliente"} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Saldo disponible: {formatCRC(profile.credit_balance)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Panel admin
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
        <p className="font-medium">La tienda y tus cuentas vienen en la Fase 2.</p>
        <p className="mt-1 text-sm">
          Catálogo, compras, recarga de créditos, soporte y solicitudes.
        </p>
      </div>
    </div>
  );
}
