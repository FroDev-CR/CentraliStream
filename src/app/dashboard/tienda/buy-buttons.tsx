"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { buyWithCredits } from "@/lib/actions/orders";
import { useCart } from "@/components/cart/cart-context";

export function BuyButtons({
  productId,
  name,
  service,
  price,
}: {
  productId: string;
  name: string;
  service: string;
  price: number;
}) {
  const { add, remove, has } = useCart();
  const inCart = has(productId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function buyCredits() {
    setError(null);
    startTransition(async () => {
      try {
        await buyWithCredits(productId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          inCart
            ? remove(productId)
            : add({ id: productId, name, service, price })
        }
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          inCart
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        {inCart ? (
          <>
            <Check className="h-4 w-4" /> En el carrito
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Agregar al carrito
          </>
        )}
      </button>
      <button
        onClick={buyCredits}
        disabled={pending}
        className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Comprar con créditos
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
