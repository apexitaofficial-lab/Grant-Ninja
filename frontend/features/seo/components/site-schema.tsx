import { JsonLd } from "@/components/shared/json-ld";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/features/seo/lib/json-ld";
import { getSameAsUrls, getSiteIdentity } from "@/features/shared/services/settings-service";

/**
 * Organization and WebSite schema, emitted once in the root layout.
 *
 * Every per-page schema references these by `@id` rather than repeating them,
 * so a search engine resolves one organization entity for the whole site
 * instead of one per page.
 *
 * `sameAs` comes from the database (D7) — the seven primary profiles only.
 */
export async function SiteSchema() {
  const [identity, sameAs] = await Promise.all([getSiteIdentity(), getSameAsUrls()]);

  return (
    <JsonLd schemas={[buildOrganizationSchema(identity, sameAs), buildWebSiteSchema(identity)]} />
  );
}
