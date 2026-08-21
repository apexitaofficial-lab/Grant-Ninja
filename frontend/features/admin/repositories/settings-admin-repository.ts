import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export interface AdminSettingRow {
  readonly key: string;
  readonly value: Json;
  readonly groupName: string;
  readonly description: string | null;
  readonly isPublic: boolean;
}

export interface AdminSocialProfile {
  readonly id: string;
  readonly platform: string;
  readonly label: string;
  readonly url: string;
  readonly isPrimary: boolean;
  readonly displayOrder: number;
  readonly enabled: boolean;
}

/**
 * Settings as an administrator sees them — private keys included.
 *
 * The public repository reads the same table but sees only `is_public` rows,
 * because that is what RLS exposes to anonymous readers. Both go through the
 * user's own session, so this one returns everything only when the signed-in
 * account really is an admin.
 */
export class SettingsAdminRepository extends BaseRepository {
  protected readonly entityName = "AdminSettings";

  async listAll(): Promise<readonly AdminSettingRow[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value, group_name, description, is_public")
      .order("group_name", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listAll");
    }

    return (data ?? []).map((row) => ({
      key: row.key,
      value: row.value,
      groupName: row.group_name,
      description: row.description,
      isPublic: row.is_public,
    }));
  }

  /**
   * Writes changed values.
   *
   * An update per key rather than an upsert: every key already exists (they
   * are seeded), and `update` cannot accidentally create a key from a typo
   * that would then sit in the table forever, unread by anything.
   */
  async updateValues(values: ReadonlyMap<string, Json>): Promise<void> {
    const supabase = await createSupabaseServerClient();

    for (const [key, value] of values) {
      const { error } = await supabase.from("system_settings").update({ value }).eq("key", key);

      if (error) {
        this.unwrap({ data: null, error }, `updateValues:${key}`);
      }
    }
  }

  async listSocialProfiles(): Promise<readonly AdminSocialProfile[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("same_as_profiles")
      .select("id, platform, label, url, is_primary, display_order, enabled")
      .order("display_order", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listSocialProfiles");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      platform: row.platform,
      label: row.label,
      url: row.url,
      isPrimary: row.is_primary,
      displayOrder: row.display_order,
      enabled: row.enabled,
    }));
  }

  async updateSocialProfile(
    id: string,
    patch: {
      readonly url?: string;
      readonly isPrimary?: boolean;
      readonly enabled?: boolean;
    },
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("same_as_profiles")
      .update({
        ...(patch.url === undefined ? {} : { url: patch.url }),
        ...(patch.isPrimary === undefined ? {} : { is_primary: patch.isPrimary }),
        ...(patch.enabled === undefined ? {} : { enabled: patch.enabled }),
      })
      .eq("id", id);

    if (error) {
      this.unwrap({ data: null, error }, "updateSocialProfile");
    }
  }
}

export const settingsAdminRepository = new SettingsAdminRepository();
