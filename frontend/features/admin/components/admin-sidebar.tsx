"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { adminNavigation } from "@/features/admin/config/navigation";
import type { AdminRole } from "@/features/admin/repositories/admin-user-repository";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  readonly role: AdminRole;
  /** Ranks are compared on the server; this is the resolved allow-list. */
  readonly visibleHrefs: readonly string[];
}

/**
 * Portal navigation.
 *
 * Client Component only because it highlights the current route. Role
 * filtering happens on the server — hiding a link in the browser would be
 * decoration, and the real gate is the layout plus RLS.
 */
export function AdminSidebar({ visibleHrefs }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex h-full flex-col gap-8 p-5">
      <Link href="/" className="inline-block">
        <Logo height={26} />
      </Link>

      <div className="flex flex-col gap-7">
        {adminNavigation.map((section) => {
          const items = section.items.filter((item) => visibleHrefs.includes(item.href));

          if (items.length === 0) {
            return null;
          }

          return (
            <div key={section.title}>
              <h2 className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {section.title}
              </h2>
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                  if (item.comingSoon === true) {
                    return (
                      <li key={item.href}>
                        <span
                          className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                          aria-disabled="true"
                        >
                          {item.label}
                          <Badge variant="outline" className="text-[9px] tracking-wide uppercase">
                            Soon
                          </Badge>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
