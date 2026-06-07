import { AdminShell } from "@/components/admin/admin-shell";
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

  return <AdminShell>{children}</AdminShell>;
}
