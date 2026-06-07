import { db } from "@/lib/supabase/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NewTicketForm, ReplyForm } from "./forms";

interface TicketRow {
  id: string;
  subject: string | null;
  status: string;
  created_at: string;
  support_messages: {
    id: string;
    body: string;
    is_admin: boolean;
    created_at: string;
  }[];
}

export default async function SoportePage() {
  const profile = await requireUser();
  const supabase = db();

  const { data } = await supabase
    .from("support_tickets")
    .select(
      "id, subject, status, created_at, support_messages(id, body, is_admin, created_at)",
    )
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  const tickets = (data as TicketRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Soporte</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Escribinos y te respondemos por acá.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 font-semibold">Abrir una conversación</h2>
        <NewTicketForm />
      </div>

      <div className="space-y-4">
        {tickets.map((t) => {
          const msgs = [...t.support_messages].sort(
            (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
          );
          return (
            <div
              key={t.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">{t.subject ?? "Soporte"}</span>
                <Badge tone={t.status === "closed" ? "neutral" : "green"}>
                  {t.status === "closed" ? "Cerrado" : "Abierto"}
                </Badge>
              </div>
              <div className="space-y-2">
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.is_admin
                        ? "bg-zinc-100 dark:bg-zinc-800"
                        : "ml-auto bg-red-50 dark:bg-red-950/40"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p className="mt-1 text-[10px] text-zinc-400">
                      {m.is_admin ? "Soporte" : "Vos"} ·{" "}
                      {formatDate(m.created_at)}
                    </p>
                  </div>
                ))}
              </div>
              {t.status !== "closed" && <ReplyForm ticketId={t.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
