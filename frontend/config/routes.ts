/**
 * Every public URL in one place — MASTER_PROJECT_SPEC.md §21/§22/§101.
 *
 * ---------------------------------------------------------------------------
 * Multi-country URL strategy
 * ---------------------------------------------------------------------------
 * Three rules keep the structure stable as countries are added:
 *
 * 1. A grant's URL is global and permanent: `/grants/[slug]`.
 *    Grant pages are the platform's primary SEO and LLMO asset, so their URL
 *    must never change — not when a country is added, not when a grant is
 *    recategorised. Slugs are therefore globally unique; a collision across
 *    countries is resolved at insert time by suffixing (for example
 *    `innovation-fund` and `innovation-fund-ireland`).
 *
 * 2. Country is a first-class namespace: `/countries/[country]/...`.
 *    Browsing scoped to a country nests underneath it, which means a new
 *    country adds routes rather than changing any existing one. No redesign
 *    is required at 5 countries or at 50.
 *
 * 3. ISO short codes are permanent redirects, not a parallel site.
 *    `/us` -> `/countries/united-states`, `/ie` -> `/countries/ireland`.
 *    These are generated from `countries.iso_code`, so a new country gets its
 *    shortcut automatically. The long form is always the canonical URL, which
 *    keeps short codes from creating duplicate content.
 *
 * Rejected: prefixing the whole site (`/us/grants/...`). That pattern belongs
 * to multi-language sites, forces a country segment onto a US-first MVP,
 * duplicates every category and agency page per country, and would still need
 * a home for genuinely cross-border grants.
 */

export const routes = {
  home: "/",
  about: "/about",
  services: "/services",
  contact: "/contact",
  search: "/search",

  // Rule 1 — global and permanent.
  grants: "/grants",
  grant: (slug: string) => `/grants/${slug}`,

  // Rule 2 — country namespace.
  countries: "/countries",
  country: (country: string) => `/countries/${country}`,
  countryGrants: (country: string) => `/countries/${country}/grants`,
  countryCategory: (country: string, category: string) =>
    `/countries/${country}/categories/${category}`,
  states: (country: string) => `/countries/${country}/states`,
  state: (country: string, state: string) => `/countries/${country}/states/${state}`,
  stateGrants: (country: string, state: string) => `/countries/${country}/states/${state}/grants`,

  categories: "/categories",
  category: (slug: string) => `/categories/${slug}`,

  // Public URLs say "agency"; the database entity is `organizations`.
  // This module is the single translation point between the two.
  agencies: "/agencies",
  agency: (slug: string) => `/agencies/${slug}`,

  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",

  admin: {
    root: "/admin",
    grants: "/admin/grants",
    categories: "/admin/categories",
    countries: "/admin/countries",
    agencies: "/admin/agencies",
    crawler: "/admin/crawler",
    duplicates: "/admin/duplicates",
    settings: "/admin/settings",
    login: "/admin/login",
  },
} as const;

/**
 * Rule 3 — resolves `/us` style shortcuts. Middleware calls this and issues a
 * 301 to the canonical country URL. Backed by `countries.iso_code` in the
 * database; the map below is only the MVP fallback used before the table is
 * populated.
 */
export const ISO_CODE_FALLBACK: Readonly<Record<string, string>> = {
  us: "united-states",
  ie: "ireland",
  au: "australia",
  ca: "canada",
  gb: "united-kingdom",
};

export function resolveCountryShortcut(
  isoCode: string,
  lookup: Readonly<Record<string, string>> = ISO_CODE_FALLBACK,
): string | null {
  const slug = lookup[isoCode.toLowerCase()];

  return slug === undefined ? null : routes.country(slug);
}
