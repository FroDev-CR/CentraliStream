import { Sidebar } from "@/components/admin/sidebar";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
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

  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
