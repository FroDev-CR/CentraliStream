"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingCart,
  Smartphone,
  Tags,
  Wrench,
  Menu,
  X,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/inventario", label: "Banco de cuentas", icon: Boxes },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/ordenes", label: "Órdenes", icon: ShoppingCart },
  { href: "/admin/sinpe", label: "SINPE", icon: Smartphone },
  { href: "/admin/productos", label: "Productos", icon: Tags },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: Wrench },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {links.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="px-5 py-5">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            Centralia<span className="text-red-600">Admin</span>
          </Link>
        </div>
        <NavLinks />
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            ← Ver como cliente
          </Link>
        </div>
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between px-5 py-5">
              <span className="text-lg font-bold tracking-tight">
                Centralia<span className="text-red-600">Admin</span>
              </span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
              <Link
                href="/dashboard"
                className="block rounded-lg px-3 py-2 text-sm text-zinc-500"
              >
                ← Ver como cliente
              </Link>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior móvil */}
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <button onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold tracking-tight">
            Centralia<span className="text-red-600">Admin</span>
          </span>
          <UserButton />
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
