import { stripTrackingParams } from "@/lib/url";

/**
 * Seed data for the `same_as_profiles` settings table.
 *
 * This file is the source that the initial database migration loads. Once the
 * Admin Settings page exists, the database becomes authoritative and the
 * Organization JSON-LD reads `sameAs` from there — never from this constant.
 * MASTER_PROJECT_SPEC.md §62.
 *
 * Only `primary` profiles belong in Organization JSON-LD. Low-authority
 * directories dilute the entity signal, so they are stored but not emitted.
 */

export type SocialPlatform =
  | "linkedin"
  | "x"
  | "trustpilot"
  | "g2"
  | "clutch"
  | "youtube"
  | "crunchbase"
  | "goodfirms"
  | "trustindex"
  | "about_me"
  | "provenexpert"
  | "nextdoor"
  | "smartcustomer"
  | "inhersight"
  | "productreview";

export interface SocialProfileSeed {
  readonly platform: SocialPlatform;
  readonly label: string;
  readonly url: string;
  /** Emitted in Organization JSON-LD `sameAs`. */
  readonly isPrimary: boolean;
  readonly displayOrder: number;
  readonly enabled: boolean;
}

export const socialProfileSeeds: readonly SocialProfileSeed[] = [
  {
    platform: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/grant-ninja/",
    isPrimary: true,
    displayOrder: 1,
    enabled: true,
  },
  {
    platform: "x",
    label: "X",
    url: "https://x.com/TheGrantNinja",
    isPrimary: true,
    displayOrder: 2,
    enabled: true,
  },
  {
    platform: "trustpilot",
    label: "Trustpilot",
    url: "https://www.trustpilot.com/review/grant.ninja",
    isPrimary: true,
    displayOrder: 3,
    enabled: true,
  },
  {
    platform: "g2",
    label: "G2",
    url: "https://www.g2.com/products/8f5df393-f5b5-42d3-97dc-b4ac317b9d54/reviews",
    isPrimary: true,
    displayOrder: 4,
    enabled: true,
  },
  {
    platform: "clutch",
    label: "Clutch",
    url: "https://clutch.co/profile/grant-ninja",
    isPrimary: true,
    displayOrder: 5,
    enabled: true,
  },
  {
    platform: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com/@GrantNinja",
    isPrimary: true,
    displayOrder: 6,
    enabled: true,
  },
  {
    platform: "crunchbase",
    label: "Crunchbase",
    url: "https://www.crunchbase.com/organization/grant-ninja",
    isPrimary: true,
    displayOrder: 7,
    enabled: true,
  },

  // Secondary — stored and editable, deliberately excluded from `sameAs`.
  {
    platform: "goodfirms",
    label: "GoodFirms",
    url: "https://www.goodfirms.co/company/grant-ninja",
    isPrimary: false,
    displayOrder: 8,
    enabled: true,
  },
  {
    platform: "trustindex",
    label: "Trustindex",
    url: "https://www.trustindex.io/reviews/grant.ninja",
    isPrimary: false,
    displayOrder: 9,
    enabled: true,
  },
  {
    platform: "about_me",
    label: "about.me",
    url: "https://about.me/grantninja",
    isPrimary: false,
    displayOrder: 10,
    enabled: true,
  },
  {
    platform: "provenexpert",
    label: "ProvenExpert",
    url: "https://www.provenexpert.com/en-us/grantninja/",
    isPrimary: false,
    displayOrder: 11,
    enabled: true,
  },
  {
    platform: "nextdoor",
    label: "Nextdoor",
    url: "https://nextdoor.com/page/grant-ninja-fort-worth-tx",
    isPrimary: false,
    displayOrder: 12,
    enabled: true,
  },
  {
    platform: "smartcustomer",
    label: "SmartCustomer",
    url: "https://www.smartcustomer.com/reviews/grant.ninja",
    isPrimary: false,
    displayOrder: 13,
    enabled: true,
  },
  {
    platform: "inhersight",
    label: "InHerSight",
    url: "https://www.inhersight.com/company/339834/ratings",
    isPrimary: false,
    displayOrder: 14,
    enabled: true,
  },
];

/**
 * Sanitizes seed URLs at module load so a tracking parameter can never reach
 * the database through the migration path.
 */
export function getSanitizedSocialProfiles(): readonly SocialProfileSeed[] {
  return socialProfileSeeds.flatMap((profile) => {
    const url = stripTrackingParams(profile.url);

    return url === null ? [] : [{ ...profile, url }];
  });
}

/** The `sameAs` array for Organization JSON-LD — primary, enabled, ordered. */
export function getSameAsUrls(): readonly string[] {
  return getSanitizedSocialProfiles()
    .filter((profile) => profile.isPrimary && profile.enabled)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((profile) => profile.url);
}
