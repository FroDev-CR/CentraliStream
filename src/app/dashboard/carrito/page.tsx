"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { checkoutCart, type CheckoutResult } from "@/lib/actions/orders";
import { formatCRC } from "@/lib/utils";

export default function CarritoPage() {
  const { items, remove, clear, total } = useCart();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function checkout() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await checkoutCart(items.map((i) => i.id));
        setResult(res);
        clear();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h1 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
            ✓ {result.released} cuenta(s) liberada(s)
          </h1>
          {result.failed.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <p className="font-medium">No se pudieron liberar:</p>
              <ul className="mt-1 list-inside list-disc">
                {result.failed.map((f, i) => (
                  <li key={i}>
                    {f.name} — {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Ver mis cuentas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          El carrito está vacío.{" "}
          <Link href="/dashboard/tienda" className="text-red-600 hover:underline">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <p className="font-medium">{i.service}</p>
                <p className="text-sm text-zinc-500">{i.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCRC(i.price)}</span>
                <button
                  onClick={() => remove(i.id)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                  aria-label="Quitar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">{formatCRC(total)}</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={checkout}
            disabled={pending}
            className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Procesando…" : "Finalizar compra"}
          </button>
          <p className="text-center text-xs text-zinc-400">
            En modo prueba, las cuentas se liberan al instante.
          </p>
        </div>
      )}
    </div>
  );
}
