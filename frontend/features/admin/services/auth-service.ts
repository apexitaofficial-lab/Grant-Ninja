import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { routes } from "@/config/routes";
import type { AdminProfile, AdminRole } from "@/features/admin/repositories/admin-user-repository";
import { adminUserRepository } from "@/features/admin/repositories/admin-user-repository";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Authorization for the admin portal.
 *
 * The database enforces this too — every admin policy calls
 * `is_admin_at_least()`. These helpers exist so a page can fail *early and
 * legibly* rather than rendering a shell full of empty queries that RLS
 * silently filtered to nothing.
 */

/** Highest first. Used to compare capability without hardcoding comparisons. */
const ROLE_RANK: Readonly<Record<AdminRole, number>> = {
  super_admin: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const ROLE_LABELS: Readonly<Record<AdminRole, string>> = {
  super_admin: "Super admin",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function hasAtLeast(role: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/**
 * The current operator, or null. Cached per request so a layout, a page and a
 * component asking the same question cost one round trip.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminProfile | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return null;
  }

  try {
    return await adminUserRepository.findById(user.id);
  } catch (error) {
    logger.error("Could not load admin profile", error, {
      feature: "admin",
      action: "getCurrentAdmin",
      userId: user.id,
    });

    return null;
  }
});

/**
 * Gate for admin pages.
 *
 * A signed-in account that is `inactive` — which is how every new account
 * starts (migration 0017) — is treated as not an administrator at all. It is
 * sent to the login screen with an explanation rather than a blank dashboard.
 */
export async function requireAdmin(minimumRole: AdminRole = "viewer"): Promise<AdminProfile> {
  const admin = await getCurrentAdmin();

  if (admin === null) {
    redirect(routes.admin.login);
  }

  if (!admin.isActive) {
    redirect(`${routes.admin.login}?status=inactive`);
  }

  if (!hasAtLeast(admin.role, minimumRole)) {
    redirect(`${routes.admin.root}?denied=1`);
  }

  return admin;
}
