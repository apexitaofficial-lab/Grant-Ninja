import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import { adminNavigation } from "@/features/admin/config/navigation";
import { hasAtLeast, requireAdmin } from "@/features/admin/services/auth-service";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Grant Ninja Admin" },
  robots: { index: false, follow: false },
};

/**
 * The authorization gate for the whole portal.
 *
 * Sits in a `(dashboard)` route group so the login screen, which shares the
 * `/admin` prefix, is not wrapped by it — a gate that redirected the login
 * page to itself would loop.
 *
 * Middleware has already confirmed *someone* is signed in. This decides
 * whether they are an active administrator, which needs the database.
 */
export default async function AdminDashboardLayout({ children }: { readonly children: ReactNode }) {
  const admin = await requireAdmin("viewer");

  // Resolved server-side: the sidebar receives an allow-list, never the logic.
  const visibleHrefs = adminNavigation.flatMap((section) =>
    section.items
      .filter((item) => hasAtLeast(admin.role, item.minimumRole))
      .map((item) => item.href),
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/30 lg:block">
        <div className="sticky top-0">
          <AdminSidebar role={admin.role} visibleHrefs={visibleHrefs} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar admin={admin} />
        <main id="main-content" className="flex-1 p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
