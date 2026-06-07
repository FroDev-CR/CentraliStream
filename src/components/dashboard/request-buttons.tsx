"use client";

import { useState, useTransition } from "react";
import { createServiceRequest } from "@/lib/actions/requests";

export function RequestButtons({
  entitlementId,
  accountProfileId,
}: {
  entitlementId: string;
  accountProfileId: string;
}) {
  const [open, setOpen] = useState<null | "pin_change" | "profile_name_change">(
    null,
  );
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!open) return;
    setError(null);
    const fd = new FormData();
    fd.set("type", open);
    fd.set("requested_value", value);
    fd.set("entitlement_id", entitlementId);
    fd.set("account_profile_id", accountProfileId);
    startTransition(async () => {
      try {
        await createServiceRequest(fd);
        setDone(true);
        setOpen(null);
        setValue("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  if (done) {
    return (
      <p className="mt-3 text-xs text-emerald-600">
        ✓ Solicitud enviada. Te avisamos cuando esté lista.
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      {open ? (
        <div className="space-y-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              open === "pin_change" ? "Nuevo PIN" : "Nuevo nombre de perfil"
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={pending || !value}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Enviar
            </button>
            <button
              onClick={() => setOpen(null)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setOpen("pin_change")}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cambiar PIN
          </button>
          <button
            onClick={() => setOpen("profile_name_change")}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cambiar nombre
          </button>
        </div>
      )}
    </div>
  );
}
