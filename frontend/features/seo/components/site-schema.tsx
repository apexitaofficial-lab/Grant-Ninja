import { JsonLd } from "@/components/shared/json-ld";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/features/seo/lib/json-ld";
import {
  getSameAsUrls,
  getSiteAddress,
  getSiteIdentity,
} from "@/features/shared/services/settings-service";

/**
 * Organization and WebSite schema, emitted once in the root layout.
 *
 * This is the only place either is built. Every per-page schema references them
 * by `@id` rather than repeating them, so a search engine resolves one
 * organization entity for the whole site instead of one per page — and there is
 * no second definition anywhere that could contradict this one.
 *
 * `sameAs` and the address both come from the database, so the profiles in the
 * footer and the profiles in the markup cannot drift apart.
 */
export async function SiteSchema() {
  const [identity, sameAs, address] = await Promise.all([
    getSiteIdentity(),
    getSameAsUrls(),
    getSiteAddress(),
  ]);

  return (
    <JsonLd
      schemas={[buildOrganizationSchema(identity, sameAs, address), buildWebSiteSchema(identity)]}
    />
  );
}
