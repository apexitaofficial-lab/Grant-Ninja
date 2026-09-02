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
   * The "Schedule a Call" destination — the group's shared booking page, the same
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

/**
 * The one label for every link into the funding-services page.
 *
 * There were four, all pointing at `/services`: "See how funding works" on the
 * grant page and the about page, "How funding works" in the hero, and "See how
 * it works" in the funding block. Three of them named no subject at all, so
 * what you would get after clicking depended on the paragraph above the
 * button — and on a grant page, sitting under the agency's own application
 * links, "see how it works" reads as though it explains *that grant*.
 *
 * Naming grant funding fixes that, and keeping it in one place is what stops a
 * fifth wording appearing the next time a page is written.
 *
 * Title Case, like every other clickable label on the public site. That is a
 * house style rather than a typographic law — articles, coordinating
 * conjunctions and short prepositions stay lowercase unless they lead the
 * phrase, which is why this is "How Grant Funding Works" and the grant page
 * says "Apply on the Agency Site".
 *
 * The ALL-CAPS mono eyebrows ("APPLICATION WINDOW", "WHO CAN APPLY") are
 * deliberately outside this rule: those are a styling treatment applied in
 * CSS, so their source text never reaches the screen as written.
 */
export const FUNDING_CTA_LABEL = "Learn How Grant Funding Works";

/**
 * Its counterpart: the label for every link that starts a conversation about
 * funding, rather than explaining it.
 *
 * These two are almost always rendered side by side, so they have to divide
 * the work between them visibly. "Learn how…" and "Talk to our team" only did
 * that if you already knew the second one was about funding — it named a team
 * without saying what for, which on a page carrying several kinds of enquiry
 * is the reader's problem to solve rather than ours.
 *
 * Naming funding in both makes the pair read as one choice with two doors:
 * read about it, or speak to someone about it.
 */
export const FUNDING_CONTACT_CTA_LABEL = "Talk to Our Funding Team";

export const mainNav: readonly NavItem[] = [
  { label: "Browse Grants", href: routes.grants },
  { label: "Countries", href: routes.countries },
  { label: "Categories", href: routes.categories },
  { label: "Our Services", href: routes.services },
  { label: "About", href: routes.about },
  { label: "Contact Us", href: routes.contact },
];

export const footerNav: readonly FooterSection[] = [
  {
    title: "Company",
    items: [
      { label: "About", href: routes.about },
      { label: "Our Services", href: routes.services },
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
  /*
   * There was an "AI" column here listing /sitemap.xml, /llms.txt and
   * /robots.txt. They are addressed to crawlers and assistants, not to the
   * person reading the footer, and putting them in the navigation asked a
   * visitor to make sense of three files that mean nothing to them.
   *
   * Removing the links costs nothing: none of the three is discovered by being
   * linked. robots.txt and llms.txt are fetched from fixed paths by
   * convention, and robots.txt names the sitemap itself. All three remain
   * served exactly as before — see app/sitemap.ts, app/robots.ts and
   * app/llms.txt/route.ts.
   */
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
