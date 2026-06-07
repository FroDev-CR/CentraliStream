"use client";

import { useRef, useTransition } from "react";
import { createSupportTicket, sendSupportMessage } from "@/lib/actions/requests";

export function NewTicketForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={ref}
      action={(fd) =>
        startTransition(async () => {
          await createSupportTicket(fd);
          ref.current?.reset();
        })
      }
      className="space-y-2"
    >
      <input
        name="subject"
        placeholder="Asunto (opcional)"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      <textarea
        name="body"
        required
        rows={3}
        placeholder="¿En qué te ayudamos?"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      <button
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
}

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={ref}
      action={(fd) =>
        startTransition(async () => {
          await sendSupportMessage(fd);
          ref.current?.reset();
        })
      }
      className="mt-3 flex gap-2"
    >
      <input type="hidden" name="ticket_id" value={ticketId} />
      <input
        name="body"
        required
        placeholder="Escribí un mensaje…"
        className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      <button
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
}
