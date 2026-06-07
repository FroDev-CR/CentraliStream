import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { isSupabaseConfigured } from "@/lib/config";
import { SetupNotice } from "@/components/setup-notice";
import { requireUser } from "@/lib/auth";
import { formatCRC } from "@/lib/utils";
import { DashboardNav } from "@/components/dashboard/nav";
import { CartProvider } from "@/components/cart/cart-context";
import { CartButton } from "@/components/cart/cart-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen">
        <SetupNotice />
      </div>
    );
  }

  const profile = await requireUser();

  return (
    <CartProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <Link
              href="/dashboard"
              className="shrink-0 font-bold tracking-tight"
            >
              Centralia<span className="text-red-600">Streaming</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard/creditos"
                className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 sm:text-sm dark:bg-emerald-950/50 dark:text-emerald-400"
              >
                {formatCRC(profile.credit_balance)}
              </Link>
              <CartButton />
              {profile.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden text-sm font-medium text-zinc-500 hover:text-zinc-900 sm:block dark:hover:text-zinc-100"
                >
                  Admin
                </Link>
              )}
              <UserButton />
            </div>
          </div>
          <DashboardNav />
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </CartProvider>
  );
}
