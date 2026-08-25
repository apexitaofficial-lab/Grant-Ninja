import "server-only";

import { cache } from "react";

import { clientEnv } from "@/config/env";
import type { SiteAddress } from "@/features/seo/lib/json-ld";
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

/**
 * Zendesk Web Widget key, or null when support chat is switched off.
 *
 * Not a secret — it is served to every visitor in the page source — but it
 * lives in settings so the account can be changed or the widget disabled
 * without a deploy (D8).
 */
export async function getZendeskWidgetKey(): Promise<string | null> {
  const settings = await loadSettings();

  return emptyToNull(asString(settings.get("zendesk_widget_key"), ""));
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
 * The `sameAs` array for Organization JSON-LD, generated from the database
 * rather than a constant.
 *
 * Every enabled profile is emitted, not only the primary ones.
 *
 * D7 originally restricted this to primary profiles on the theory that
 * low-authority directories dilute the entity signal. The client has since
 * required the full supplied list as a milestone condition, and the theory does
 * not really survive contact with how `sameAs` works: it is a set of identity
 * claims, and a profile that genuinely belongs to the organization is a true
 * claim whatever the host's authority. `isPrimary` still drives which profiles
 * the footer leads with, which is where the ranking actually mattered.
 *
 * Duplicates are removed because two identical `sameAs` entries describe the
 * same claim twice and read as sloppy markup.
 */
export async function getSameAsUrls(): Promise<readonly string[]> {
  const profiles = await loadSameAs();

  return [...new Set(profiles.map((profile) => profile.url))];
}

/**
 * The organization's postal address, when settings actually record one.
 *
 * Returns null unless a street and a locality are both present. A partial
 * address in Organization JSON-LD is worse than none: it asserts a physical
 * presence that cannot be checked, which is precisely the kind of claim
 * structured data is penalised for.
 */
export async function getSiteAddress(): Promise<SiteAddress | null> {
  const settings = await loadSettings();
  const raw = settings.get("contact_address");

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const read = (key: string): string | null => {
    const value = record[key];

    return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
  };

  const address: SiteAddress = {
    streetAddress: read("line1"),
    addressLocality: read("city"),
    addressRegion: read("region"),
    postalCode: read("postal_code"),
    addressCountry: read("country_code"),
  };

  return address.streetAddress === null || address.addressLocality === null ? null : address;
}

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}
