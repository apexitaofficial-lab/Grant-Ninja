import type { MetadataRoute } from "next";

import { routes } from "@/config/routes";
import { listGrants } from "@/features/grants/services/grant-service";
import {
  listCategories,
  listCountries,
  listOrganizations,
} from "@/features/shared/services/reference-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";
import { logger } from "@/lib/logger";

/**
 * Generated from the database, not a static list.
 *
 * Only published content appears — Row Level Security already restricts these
 * reads to it. Admin and search-result URLs are excluded by never being added:
 * a sitemap that advertises a noindex page wastes crawl budget.
 */

// Sitemaps cap at 50,000 URLs. Splitting into an index is a later concern;
// this bound stops a runaway query long before that becomes urgent.
const MAX_GRANTS = 5_000;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const identity = await getSiteIdentity();
  const absolute = (path: string) => new URL(path, identity.url).toString();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absolute(routes.home), changeFrequency: "daily", priority: 1 },
    { url: absolute(routes.grants), changeFrequency: "daily", priority: 0.9 },
    { url: absolute(routes.countries), changeFrequency: "weekly", priority: 0.7 },
    { url: absolute(routes.categories), changeFrequency: "weekly", priority: 0.7 },
    { url: absolute(routes.agencies), changeFrequency: "weekly", priority: 0.7 },
    { url: absolute(routes.about), changeFrequency: "monthly", priority: 0.5 },
    { url: absolute(routes.services), changeFrequency: "monthly", priority: 0.6 },
    { url: absolute(routes.contact), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [grants, countries, categories, organizations] = await Promise.all([
      // `newest` rather than the default: a sitemap must list every published
      // grant, including ones whose application window has closed.
      listGrants({ page: 1, pageSize: MAX_GRANTS, sort: "newest" }),
      listCountries(),
      listCategories(),
      listOrganizations(),
    ]);

    return [
      ...staticEntries,
      ...grants.items.map((grant) => ({
        url: absolute(routes.grant(grant.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...countries.map((country) => ({
        url: absolute(routes.country(country.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...categories.map((category) => ({
        url: absolute(routes.category(category.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...organizations.map((organization) => ({
        url: absolute(routes.agency(organization.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    // A broken database must not produce an empty sitemap: search engines read
    // that as "everything was removed". Serving the static pages is safer.
    logger.error("Sitemap fell back to static entries", error, {
      feature: "seo",
      action: "sitemap",
    });

    return staticEntries;
  }
}
