import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AdminRole = Database["public"]["Enums"]["admin_role"];

export interface AdminProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: AdminRole;
  readonly isActive: boolean;
  readonly avatarUrl: string | null;
  readonly lastLoginAt: string | null;
}

export class AdminUserRepository extends BaseRepository {
  protected readonly entityName = "Administrator";

  /**
   * The signed-in operator's profile.
   *
   * `admin_self_read` lets a user read their own row, so this works with the
   * ordinary session client — no elevated key needed to answer "who am I".
   */
  async findById(userId: string): Promise<AdminProfile | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, display_name, role, status, avatar_url, last_login_at")
      .eq("id", userId)
      .maybeSingle();

    const row = this.unwrapMaybe({ data, error }, "findById");

    return row === null
      ? null
      : {
          id: row.id,
          email: row.email,
          displayName: row.display_name,
          role: row.role,
          isActive: row.status === "active",
          avatarUrl: row.avatar_url,
          lastLoginAt: row.last_login_at,
        };
  }

  /** Records a successful sign-in. Failure here must never block the login. */
  async touchLastLogin(userId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);
  }
}

export const adminUserRepository = new AdminUserRepository();
