import { clientEnv } from "@/config/env";
import { routes } from "@/config/routes";

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export interface FooterSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

/**
 * Site-wide identity and navigation — MASTER_PROJECT_SPEC.md §19/§25.
 * Values that a non-developer may need to change belong in `system_settings`
 * once the database exists; this file holds only structural defaults.
 */
export const siteConfig = {
  name: clientEnv.NEXT_PUBLIC_SITE_NAME,
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
  tagline: "The World's Most Extensive Research Grants Database",
  description:
    "Discover thousands of research grants from government agencies around the world " +
    "while accessing funding solutions that help your business grow faster.",
  locale: "en_US",
} as const;

export const mainNav: readonly NavItem[] = [
  { label: "Browse Grants", href: routes.grants },
  { label: "Countries", href: routes.countries },
  { label: "Categories", href: routes.categories },
  { label: "Services", href: routes.services },
  { label: "About", href: routes.about },
  { label: "Contact", href: routes.contact },
];

export const footerNav: readonly FooterSection[] = [
  {
    title: "Company",
    items: [
      { label: "About", href: routes.about },
      { label: "Services", href: routes.services },
      { label: "Contact", href: routes.contact },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Browse Grants", href: routes.grants },
      { label: "Countries", href: routes.countries },
      { label: "Categories", href: routes.categories },
      { label: "Agencies", href: routes.agencies },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy Policy", href: routes.privacy },
      { label: "Terms", href: routes.terms },
      { label: "Cookies", href: routes.cookies },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "Sitemap", href: "/sitemap.xml" },
      { label: "llms.txt", href: "/llms.txt" },
      { label: "robots.txt", href: "/robots.txt" },
    ],
  },
];

/**
 * Social profiles are no longer read from here.
 *
 * They live in the `same_as_profiles` table and are read through
 * `features/shared/services/settings-service.ts`, so the footer and the
 * Organization `sameAs` array always agree and both are editable from the
 * admin panel (D7). `config/social-profiles.ts` remains only as the seed
 * source for the migration.
 */
