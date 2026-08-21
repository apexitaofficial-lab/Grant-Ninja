import type { MetadataRoute } from "next";

import { getRobotsSettings, getSiteIdentity } from "@/features/shared/services/settings-service";

/**
 * Driven by settings so indexing can be switched off from the admin panel
 * without a deploy — which is what you want the hour before launch, and the
 * hour after something goes wrong.
 */
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [identity, settings] = await Promise.all([getSiteIdentity(), getRobotsSettings()]);

  const sitemapUrl = new URL("/sitemap.xml", identity.url).toString();

  if (!settings.allowIndexing) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: sitemapUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search result pages are thin and duplicate the listing they filter.
        disallow: [...settings.disallowPaths],
      },
    ],
    sitemap: sitemapUrl,
    host: identity.url,
  };
}
