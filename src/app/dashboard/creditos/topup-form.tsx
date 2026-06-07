"use client";

import { useState, useTransition } from "react";
import { createTopupOrder } from "@/lib/actions/orders";
import { formatCRC } from "@/lib/utils";

const PRESETS = [3000, 5000, 10000, 20000];

export function TopupForm() {
  const [amount, setAmount] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const finalAmount = custom ? Number(custom) : amount;

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await createTopupOrder(finalAmount);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setAmount(p);
              setCustom("");
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              !custom && amount === p
                ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-950/40"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {formatCRC(p)}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Otro monto (₡)"
        className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={pending || !finalAmount || finalAmount < 500}
        className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        Recargar {finalAmount ? formatCRC(finalAmount) : ""} por SINPE
      </button>
    </div>
  );
}
