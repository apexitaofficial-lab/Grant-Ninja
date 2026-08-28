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

  /**
   * The "Book a Call" destination — the group's shared booking page, the same
   * one the sibling site AusGrant links to from its own contact page.
   *
   * It redirects to a Google Calendar appointment schedule. Linking to the
   * redirect rather than the calendar is deliberate on their side too: the
   * schedule can be repointed centrally without every site that links to it
   * needing a change.
   *
   * No tracking parameters. A `utm_source` on an outbound link of this kind
   * misattributes the visit and follows the person into the booking flow, and
   * this project strips them everywhere else for the same reason.
   *
   * Read by `/bookings`, which is the only thing that references it. Every
   * button on the site points at that route, so changing the destination is
   * this one line.
   */
  bookingUrl: "https://www.swansonreed.com/bookings",

  /**
   * Official contact details.
   *
   * Used when the matching `system_settings` row is empty, which it currently
   * is for all three. Settings still win, so any of these can be corrected from
   * the admin panel without a deploy — this is the documented default so the
   * details are never simply missing from the page or from the Organization
   * schema.
   *
   * The address and telephone are the group's Fort Worth office, shared with
   * the sibling site AusGrant. Confirmed by the client rather than inferred.
   */
  contactEmail: "hello@grant.ninja",
  contactPhone: "+1-512-333-2076",
  contactAddress: {
    line1: "1120 South Freeway, Suite 123C",
    city: "Fort Worth",
    region: "TX",
    postalCode: "76104",
    countryCode: "US",
  },

  /**
   * Grant Ninja is a Swanson Reed initiative; grant.ninja itself directs
   * enquiries to Swanson Reed partners, and the sibling site AusGrant declares
   * the same parent. Stated here rather than inline so it can be removed in one
   * place if the relationship is ever described differently.
   */
  parentOrganization: {
    name: "Swanson Reed",
    url: "https://www.swansonreed.com",
  },

  /**
   * Subject areas the site demonstrably covers. Every entry is a topic the
   * directory actually holds grants for — this is an entity signal, not a
   * keyword list, and padding it with terms the site does not cover is how a
   * knowsAbout claim stops being true.
   */
  knowsAbout: [
    "Research grants",
    "Government grants",
    "R&D tax credits",
    "Innovation funding",
    "SBIR",
    "STTR",
  ],
} as const;

export const mainNav: readonly NavItem[] = [
  { label: "Browse Grants", href: routes.grants },
  { label: "Countries", href: routes.countries },
  { label: "Categories", href: routes.categories },
  { label: "Services", href: routes.services },
  { label: "About", href: routes.about },
  { label: "Contact Us", href: routes.contact },
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
