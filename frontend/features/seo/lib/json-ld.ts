import { routes } from "@/config/routes";
import type { GrantDetail } from "@/features/grants/types/grant";
import type { FaqItem } from "@/features/shared/repositories/faq-repository";
import type { SiteIdentity } from "@/features/shared/services/settings-service";

/**
 * Structured data generators.
 *
 * Pure functions: they take data and return a plain object, so what a page
 * emits can be reasoned about — and eventually tested — without rendering it.
 *
 * Rule followed throughout: never emit a property schema.org does not define,
 * and never emit one we cannot fill honestly. A wrong `sameAs` or an invented
 * property is worse than an absent one, because it teaches a search engine
 * something false about the entity.
 */

export type JsonLdObject = Record<string, unknown>;

const CONTEXT = "https://schema.org";

function absolute(path: string, siteUrl: string): string {
  return new URL(path, siteUrl).toString();
}

/** Drops null, undefined and empty arrays so no empty keys reach the output. */
function compact(input: JsonLdObject): JsonLdObject {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }

      return !(Array.isArray(value) && value.length === 0);
    }),
  );
}

// ---------------------------------------------------------------------------
// Site-wide
// ---------------------------------------------------------------------------

export function buildOrganizationSchema(
  identity: SiteIdentity,
  sameAs: readonly string[],
): JsonLdObject {
  return compact({
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": `${identity.url}#organization`,
    name: identity.name,
    url: identity.url,
    logo: absolute(identity.logoUrl, identity.url),
    description: identity.description,
    sameAs: [...sameAs],
    contactPoint:
      identity.contactEmail === null && identity.contactPhone === null
        ? null
        : compact({
            "@type": "ContactPoint",
            contactType: "customer support",
            email: identity.contactEmail,
            telephone: identity.contactPhone,
          }),
  });
}

/**
 * WebSite plus SearchAction. The target must point at the real search URL —
 * `/grants?q=` — or Google will advertise a search box that does not work.
 */
export function buildWebSiteSchema(identity: SiteIdentity): JsonLdObject {
  return compact({
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": `${identity.url}#website`,
    name: identity.name,
    url: identity.url,
    description: identity.description,
    publisher: { "@id": `${identity.url}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absolute(routes.grants, identity.url)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

// ---------------------------------------------------------------------------
// Per page
// ---------------------------------------------------------------------------

export interface BreadcrumbEntry {
  readonly name: string;
  readonly path: string;
}

export function buildBreadcrumbSchema(
  trail: readonly BreadcrumbEntry[],
  siteUrl: string,
): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absolute(entry.path, siteUrl),
    })),
  };
}

export function buildFaqSchema(items: readonly FaqItem[]): JsonLdObject | null {
  // FAQPage markup must reflect questions actually visible on the page.
  if (items.length === 0) {
    return null;
  }

  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * schema.org has no bare "Grant" type; `MonetaryGrant` is the closest fit and
 * the one Google documents.
 *
 * It has no property for an application deadline, so the closing date is not
 * expressible here. That is why the date is also rendered as visible text, in
 * the key-facts table and in an answer capsule — those are what an assistant
 * reads when the structured data cannot carry the fact.
 */
export function buildGrantSchema(grant: GrantDetail, identity: SiteIdentity): JsonLdObject {
  const url = absolute(routes.grant(grant.slug), identity.url);
  const hasAmount = grant.minimumAmount !== null || grant.maximumAmount !== null;

  return compact({
    "@context": CONTEXT,
    "@type": "MonetaryGrant",
    "@id": url,
    name: grant.title,
    description: grant.shortDescription ?? grant.summary,
    url,
    identifier: grant.slug,
    funder: compact({
      "@type": "Organization",
      name: grant.organization.name,
      url:
        grant.organization.slug === ""
          ? null
          : absolute(routes.agency(grant.organization.slug), identity.url),
    }),
    amount: hasAmount
      ? compact({
          "@type": "MonetaryAmount",
          currency: grant.currency,
          minValue: grant.minimumAmount,
          maxValue: grant.maximumAmount,
        })
      : null,
    provider: { "@id": `${identity.url}#organization` },
  });
}

export interface CollectionEntry {
  readonly name: string;
  readonly path: string;
}

/** Used by the directory and scoped listing pages. */
export function buildCollectionPageSchema(
  input: {
    readonly name: string;
    readonly description: string | null;
    readonly path: string;
    readonly items: readonly CollectionEntry[];
    readonly total: number;
  },
  siteUrl: string,
): JsonLdObject {
  return compact({
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absolute(input.path, siteUrl),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.total,
      itemListElement: input.items.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.name,
        url: absolute(entry.path, siteUrl),
      })),
    },
  });
}
