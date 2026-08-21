import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Site settings and sameAs profiles.
 *
 * Decision D8: nothing in the settings contract may be hardcoded in a
 * component. Row Level Security exposes only `is_public` keys to anonymous
 * readers, so a private key cannot leak into a public page by accident.
 */

export interface SameAsProfile {
  readonly platform: string;
  readonly label: string;
  readonly url: string;
  readonly isPrimary: boolean;
}

export type SettingsMap = ReadonlyMap<string, unknown>;

export class SettingsRepository extends BaseRepository {
  protected readonly entityName = "Settings";

  async getPublicSettings(): Promise<SettingsMap> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.from("system_settings").select("key, value");

    if (error) {
      this.unwrap({ data: null, error }, "getPublicSettings");
    }

    return new Map((data ?? []).map((row) => [row.key, row.value]));
  }

  /**
   * Enabled profiles, ordered. Only `isPrimary` entries belong in Organization
   * JSON-LD — low-authority directories dilute the entity signal (D7).
   */
  async listSameAsProfiles(): Promise<readonly SameAsProfile[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("same_as_profiles")
      .select("platform, label, url, is_primary")
      .order("display_order", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listSameAsProfiles");
    }

    return (data ?? []).map((row) => ({
      platform: row.platform,
      label: row.label,
      url: row.url,
      isPrimary: row.is_primary,
    }));
  }
}

export const settingsRepository = new SettingsRepository();
