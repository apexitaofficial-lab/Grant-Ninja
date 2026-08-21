import type { SocialPlatform } from "@/config/social-profiles";

/**
 * Contract for the `system_settings` table and the Admin Settings page.
 *
 * Defined before the migration on purpose: this type is what the schema and
 * the admin form are both built from, so the three cannot drift apart.
 * MASTER_PROJECT_SPEC.md Part 3A `system_settings`, Part 5A §24.
 *
 * Nothing listed here may be hardcoded in a component. Values are read through
 * a settings repository and cached; `config/site.ts` holds only the structural
 * defaults needed before the database is reachable.
 */

export interface BrandingSettings {
  readonly siteName: string;
  /** Path or storage URL. Falls back to `/Logo.png`. */
  readonly logoUrl: string;
  readonly faviconUrl: string;
  /** Hex or oklch. Overrides the `--primary` token at runtime. */
  readonly primaryColor: string;
}

export interface ContactSettings {
  readonly email: string;
  readonly phone: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly region: string | null;
  readonly postalCode: string | null;
  readonly countryCode: string | null;
}

export interface SocialSettings {
  readonly platform: SocialPlatform;
  readonly label: string;
  readonly url: string;
  /** Only primary profiles are emitted in Organization JSON-LD `sameAs`. */
  readonly isPrimary: boolean;
  readonly displayOrder: number;
  readonly enabled: boolean;
}

export interface SeoSettings {
  readonly defaultMetaTitle: string;
  readonly defaultMetaDescription: string;
  readonly defaultOgImageUrl: string | null;
  readonly canonicalOrigin: string;
  /** Raw body served at /llms.txt. */
  readonly llmsTxt: string;
  readonly robotsAllowIndexing: boolean;
  readonly robotsDisallowPaths: readonly string[];
}

export interface AnalyticsSettings {
  readonly googleAnalyticsId: string | null;
  readonly googleSearchConsoleVerification: string | null;
}

export interface AiSettings {
  readonly model: string;
  /**
   * Confidence at or above which extracted grants publish automatically.
   * Anything below routes to the admin review queue.
   * MASTER_PROJECT_SPEC.md Part 5B §32.
   */
  readonly autoPublishConfidenceThreshold: number;
}

export interface SiteSettings {
  readonly branding: BrandingSettings;
  readonly contact: ContactSettings;
  readonly social: readonly SocialSettings[];
  readonly seo: SeoSettings;
  readonly analytics: AnalyticsSettings;
  readonly ai: AiSettings;
}

/** Agreed default — see AiSettings.autoPublishConfidenceThreshold. */
export const DEFAULT_AUTO_PUBLISH_CONFIDENCE = 85;
