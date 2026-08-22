import { routes } from "@/config/routes";
import type { AdminRole } from "@/features/admin/repositories/admin-user-repository";

export interface AdminNavItem {
  readonly label: string;
  readonly href: string;
  /** Lowest role that may see this. Items above the operator are hidden. */
  readonly minimumRole: AdminRole;
  /** Not yet implemented — rendered as a disabled placeholder. */
  readonly comingSoon?: boolean;
}

export interface AdminNavSection {
  readonly title: string;
  readonly items: readonly AdminNavItem[];
}

/**
 * The sidebar — MASTER_PROJECT_SPEC.md Part 5A §3.
 *
 * Sections that do not exist yet are listed and disabled rather than omitted,
 * so the shape of the portal is visible from day one and nobody wonders
 * whether a link is missing or merely unbuilt.
 */
export const adminNavigation: readonly AdminNavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: routes.admin.root, minimumRole: "viewer" }],
  },
  {
    title: "Content",
    items: [
      { label: "Grants", href: routes.admin.grants, minimumRole: "editor" },
      { label: "Countries", href: routes.admin.countries, minimumRole: "editor" },
      { label: "Categories", href: routes.admin.categories, minimumRole: "editor" },
      { label: "Agencies", href: routes.admin.agencies, minimumRole: "editor" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Crawler", href: routes.admin.crawler, minimumRole: "viewer" },
      { label: "Duplicates", href: routes.admin.duplicates, minimumRole: "editor" },
      { label: "Messages", href: routes.admin.messages, minimumRole: "editor" },
      { label: "Settings", href: routes.admin.settings, minimumRole: "admin" },
    ],
  },
];
