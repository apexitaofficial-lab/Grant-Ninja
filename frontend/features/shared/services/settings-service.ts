import "server-only";

import { cache } from "react";

import { clientEnv } from "@/config/env";
import type { SameAsProfile } from "@/features/shared/repositories/settings-repository";
import { settingsRepository } from "@/features/shared/repositories/settings-repository";
import { logger } from "@/lib/logger";

/**
 * Typed access to site settings.
 *
 * Wrapped in React `cache` so a page that needs settings in three places —
 * metadata, JSON-LD, the footer — reads them once per request.
 *
 * Every getter falls back to a sane default. A settings table that is
 * unreachable must degrade to a working page, not a blank one.
 */

export interface SiteIdentity {
  readonly name: string;
  readonly url: string;
  readonly logoUrl: string;
  readonly description: string;
  readonly defaultMetaTitle: string;
  readonly contactEmail: string | null;
  readonly contactPhone: string | null;
}

export interface RobotsSettings {
  readonly allowIndexing: boolean;
  readonly disallowPaths: readonly string[];
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, fallback: readonly string[]): readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? (value as readonly string[])
    : fallback;
}

const loadSettings = cache(async () => {
  try {
    return await settingsRepository.getPublicSettings();
  } catch (error) {
    logger.error("Settings unavailable, using defaults", error, {
      feature: "shared",
      action: "loadSettings",
    });

    return new Map<string, unknown>();
  }
});

const loadSameAs = cache(async (): Promise<readonly SameAsProfile[]> => {
  try {
    return await settingsRepository.listSameAsProfiles();
  } catch (error) {
    logger.error("sameAs profiles unavailable", error, {
      feature: "shared",
      action: "loadSameAs",
    });

    return [];
  }
});

export async function getSiteIdentity(): Promise<SiteIdentity> {
  const settings = await loadSettings();

  const name = asString(settings.get("site_name"), clientEnv.NEXT_PUBLIC_SITE_NAME);
  const description = asString(
    settings.get("default_meta_description"),
    "Discover research grants from government agencies worldwide.",
  );

  return {
    name,
    // The origin stays an environment concern: it differs per deployment and
    // must be known before the database is reachable.
    url: clientEnv.NEXT_PUBLIC_SITE_URL,
    logoUrl: asString(settings.get("logo_url"), "/logo-wordmark.png"),
    description,
    defaultMetaTitle: asString(settings.get("default_meta_title"), name),
    contactEmail: emptyToNull(asString(settings.get("contact_email"), "")),
    contactPhone: emptyToNull(asString(settings.get("contact_phone"), "")),
  };
}

export async function getRobotsSettings(): Promise<RobotsSettings> {
  const settings = await loadSettings();

  return {
    allowIndexing: asBoolean(settings.get("robots_allow_indexing"), true),
    disallowPaths: asStringArray(settings.get("robots_disallow_paths"), ["/admin"]),
  };
}

export async function getLlmsTxtOverride(): Promise<string | null> {
  const settings = await loadSettings();

  return emptyToNull(asString(settings.get("llms_txt"), ""));
}

/** Every enabled profile, for the footer. */
export async function getSocialProfiles(): Promise<readonly SameAsProfile[]> {
  return loadSameAs();
}

/**
 * The `sameAs` array for Organization JSON-LD — primary profiles only (D7),
 * generated from the database rather than a constant.
 */
export async function getSameAsUrls(): Promise<readonly string[]> {
  const profiles = await loadSameAs();

  return profiles.filter((profile) => profile.isPrimary).map((profile) => profile.url);
}

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}
