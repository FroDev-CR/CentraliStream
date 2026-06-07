import { Badge } from "@/components/ui/badge";
import type {
  OrderStatus,
  AccountStatus,
  ProfileStatus,
  RequestStatus,
  SinpeStatus,
} from "@/lib/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map = {
    pending: { tone: "amber" as const, label: "Pendiente" },
    paid: { tone: "blue" as const, label: "Pagada" },
    fulfilled: { tone: "green" as const, label: "Liberada" },
    rejected: { tone: "red" as const, label: "Rechazada" },
    cancelled: { tone: "neutral" as const, label: "Cancelada" },
    expired: { tone: "neutral" as const, label: "Expirada" },
  };
  const s = map[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const map = {
    active: { tone: "green" as const, label: "Activa" },
    expiring: { tone: "amber" as const, label: "Por vencer" },
    expired: { tone: "red" as const, label: "Vencida" },
    problem: { tone: "red" as const, label: "Problema" },
    disabled: { tone: "neutral" as const, label: "Deshabilitada" },
  };
  const s = map[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  const map = {
    available: { tone: "green" as const, label: "Libre" },
    reserved: { tone: "amber" as const, label: "Reservado" },
    sold: { tone: "blue" as const, label: "Vendido" },
    disabled: { tone: "neutral" as const, label: "Deshabilitado" },
  };
  const s = map[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const map = {
    pending: { tone: "amber" as const, label: "Pendiente" },
    in_progress: { tone: "blue" as const, label: "En proceso" },
    done: { tone: "green" as const, label: "Resuelta" },
    rejected: { tone: "red" as const, label: "Rechazada" },
  };
  const s = map[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function SinpeStatusBadge({ status }: { status: SinpeStatus }) {
  const map = {
    unmatched: { tone: "amber" as const, label: "Sin casar" },
    matched: { tone: "green" as const, label: "Casado" },
    ignored: { tone: "neutral" as const, label: "Ignorado" },
  };
  const s = map[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
