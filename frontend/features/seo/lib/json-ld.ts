import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
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

/**
 * The site's own postal address, when one has been recorded in settings.
 *
 * Kept separate from `SiteIdentity` because it is optional in a way the rest of
 * the identity is not: the site works, and the Organization schema is valid,
 * with no address at all.
 */
export interface SiteAddress {
  readonly streetAddress: string | null;
  readonly addressLocality: string | null;
  readonly addressRegion: string | null;
  readonly postalCode: string | null;
  readonly addressCountry: string | null;
}

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

/**
 * Stable identifiers for the two site-wide entities.
 *
 * Everything else in the graph points at these rather than restating them, so
 * a search engine resolves one organization for the whole site. Exported
 * because per-page builders need to reference them by the identical string —
 * an `@id` that differs by a character is a second, unrelated entity.
 */
export function organizationId(siteUrl: string): string {
  return `${siteUrl}#organization`;
}

export function webSiteId(siteUrl: string): string {
  return `${siteUrl}#website`;
}

/** A postal address, only when enough of one has actually been recorded. */
function buildPostalAddress(address: SiteAddress | null): JsonLdObject | null {
  if (address === null) {
    return null;
  }

  // Street plus locality is the minimum that describes a real place. Emitting
  // a lone country, or a city with nothing else, claims a physical presence
  // the settings do not actually establish.
  if (address.streetAddress === null || address.addressLocality === null) {
    return null;
  }

  return compact({
    "@type": "PostalAddress",
    streetAddress: address.streetAddress,
    addressLocality: address.addressLocality,
    addressRegion: address.addressRegion,
    postalCode: address.postalCode,
    addressCountry: address.addressCountry,
  });
}

/**
 * A Google Maps link for an address that is complete enough to find.
 *
 * Built from the same fields the PostalAddress uses, so the pin and the printed
 * address can never disagree. Returns null whenever the address itself is not
 * emitted — a map link to a partial address points somewhere wrong, which is
 * worse than no link.
 */
function buildMapUrl(address: SiteAddress | null): string | null {
  if (address === null || address.streetAddress === null || address.addressLocality === null) {
    return null;
  }

  const query = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ]
    .filter((part): part is string => part !== null && part !== "")
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * The organization entity for the whole site.
 *
 * Emitted once, from the root layout, and referenced by `@id` everywhere else —
 * so this is the only definition and the Contact page adds no Organization of
 * its own. A second block would create a competing entity for the same `@id`,
 * which is the failure mode the shared `@id` exists to prevent.
 *
 * Property set follows the pattern used across the group's sites: identity
 * (name, url, logo), reachability (email, telephone, address, hasMap),
 * relationship (parentOrganization), subject matter (knowsAbout) and identity
 * corroboration (sameAs). Google names contact details and a postal address as
 * the signals that indicate real-world presence.
 *
 * Everything is omitted rather than invented when its value is unknown, which
 * is why `telephone` and `address` simply disappear until they are entered in
 * Settings.
 */
export function buildOrganizationSchema(
  identity: SiteIdentity,
  sameAs: readonly string[],
  address: SiteAddress | null = null,
): JsonLdObject {
  return compact({
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": organizationId(identity.url),
    name: identity.name,
    legalName: identity.legalName,
    url: identity.url,
    // An ImageObject rather than a bare URL: it states explicitly that this is
    // an image resource, which is the form Google's own examples use.
    logo: {
      "@type": "ImageObject",
      url: absolute(identity.logoUrl, identity.url),
    },
    // Google reads `image` for the entity card; the logo is the only image the
    // organization actually has.
    image: absolute(identity.logoUrl, identity.url),
    description: identity.description,
    email: identity.contactEmail,
    telephone: identity.contactPhone,
    address: buildPostalAddress(address),
    hasMap: buildMapUrl(address),
    parentOrganization: {
      "@type": "Organization",
      name: siteConfig.parentOrganization.name,
      url: siteConfig.parentOrganization.url,
    },
    knowsAbout: [...siteConfig.knowsAbout],
    sameAs: [...sameAs],
    // Kept alongside the top-level email and telephone rather than instead of
    // them: the flat properties are what Google's Organization documentation
    // reads, while ContactPoint carries the intent of the channel.
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

export function dataCatalogId(siteUrl: string): string {
  return `${siteUrl}#datacatalog`;
}

/**
 * The grants directory as a catalogue of data.
 *
 * Grant pages have always emitted `includedInDataCatalog` pointing at "Grant
 * Ninja grants database" — a catalogue that was named but never actually
 * defined anywhere. This is that definition, so the reference resolves instead
 * of dangling.
 *
 * `provider` restates the organisation inline, with its address and telephone,
 * rather than referencing `#organization` by id. That is deliberate and it is
 * what the sibling site does: an Organization carrying a postal address and a
 * telephone is what Google's Local Business feature check looks for, and a bare
 * `@id` reference carries neither. It is not a competing definition of the
 * site's organisation — it has no `@id`, so it cannot contradict the canonical
 * one in the root layout.
 */
export function buildDataCatalogSchema(
  identity: SiteIdentity,
  address: SiteAddress | null = null,
): JsonLdObject {
  return compact({
    "@context": CONTEXT,
    "@type": "DataCatalog",
    "@id": dataCatalogId(identity.url),
    name: `${identity.name} grants database`,
    description:
      "Directory of federal, state and international research grants, compiled from " +
      "official government and agency sources and updated continuously.",
    url: absolute(routes.grants, identity.url),
    provider: compact({
      "@type": "Organization",
      name: identity.name,
      url: identity.url,
      email: identity.contactEmail,
      telephone: identity.contactPhone,
      address: buildPostalAddress(address),
      hasMap: buildMapUrl(address),
    }),
    publisher: { "@id": organizationId(identity.url) },
    isAccessibleForFree: true,
    inLanguage: "en",
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
    "@id": webSiteId(identity.url),
    name: identity.name,
    url: identity.url,
    description: identity.description,
    inLanguage: "en",
    publisher: { "@id": organizationId(identity.url) },
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

/**
 * The home page as an entity.
 *
 * `WebSite` describes the site; this describes the one page at its root, and
 * gives the FAQ block something to hang off. Both are needed for the graph to
 * be complete — a WebSite with no WebPage has no landing node.
 */
export function buildHomePageSchema(
  identity: SiteIdentity,
  options: { readonly hasFaq: boolean },
): JsonLdObject {
  return compact({
    "@context": CONTEXT,
    "@type": "WebPage",
    "@id": `${identity.url}#webpage`,
    url: identity.url,
    name: identity.defaultMetaTitle,
    description: identity.description,
    isPartOf: { "@id": webSiteId(identity.url) },
    about: { "@id": organizationId(identity.url) },
    primaryImageOfPage: absolute(identity.logoUrl, identity.url),
    inLanguage: "en",
    // Only claim the FAQ is the page's main entity when it is actually there.
    mainEntity: options.hasFaq ? { "@id": `${identity.url}#faq` } : null,
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

export function buildFaqSchema(
  items: readonly FaqItem[],
  /** Supply when another node references the FAQ, so the reference resolves. */
  id?: string,
): JsonLdObject | null {
  // FAQPage markup must reflect questions actually visible on the page.
  if (items.length === 0) {
    return null;
  }

  return compact({
    "@context": CONTEXT,
    "@type": "FAQPage",
    "@id": id ?? null,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
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
/**
 * The five `@id`s a grant page uses.
 *
 * The page describes several things at once — a funding programme, the write-up
 * of it, the structured record behind it, and the page itself. Each is a
 * distinct entity and each needs its own identifier; giving two of them the
 * same `@id` merges them into one contradictory node.
 */
function grantIds(url: string) {
  return {
    grant: `${url}#grant`,
    article: `${url}#article`,
    dataset: `${url}#dataset`,
    webpage: `${url}#webpage`,
    breadcrumb: `${url}#breadcrumb`,
  } as const;
}

/** The funder, as a reusable node rather than three near-identical copies. */
function funderNode(grant: GrantDetail, siteUrl: string): JsonLdObject {
  return compact({
    "@type": "Organization",
    name: grant.organization.name,
    url:
      grant.organization.slug === ""
        ? null
        : absolute(routes.agency(grant.organization.slug), siteUrl),
  });
}

function grantDescription(grant: GrantDetail): string | null {
  return grant.shortDescription ?? grant.summary ?? grant.fullDescription;
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
  const ids = grantIds(url);
  const hasAmount = grant.minimumAmount !== null || grant.maximumAmount !== null;

  return compact({
    "@context": CONTEXT,
    "@type": "MonetaryGrant",
    "@id": ids.grant,
    name: grant.title,
    description: grantDescription(grant),
    url,
    identifier: grant.slug,
    funder: funderNode(grant, identity.url),
    amount: hasAmount
      ? compact({
          "@type": "MonetaryAmount",
          currency: grant.currency,
          minValue: grant.minimumAmount,
          maxValue: grant.maximumAmount,
        })
      : null,
    // Grant Ninja lists the programme; the agency funds it. `provider` is the
    // listing party, `funder` the paying one.
    provider: { "@id": organizationId(identity.url) },
    mainEntityOfPage: { "@id": ids.webpage },
  });
}

/** Google truncates headlines past 110 characters; some notice titles run long. */
function headline(title: string): string {
  return title.length <= 110 ? title : `${title.slice(0, 107).trimEnd()}…`;
}

/**
 * A reference to the site organization that also carries its type and name.
 *
 * Same `@id`, so this is still one node rather than a second organization —
 * JSON-LD merges nodes sharing an identifier. Repeating the type and name means
 * a consumer that does not resolve `@id` across separate script blocks still
 * reads a usable author and publisher, which is what Google's "recommended
 * field" warnings on Article are actually complaining about.
 */
function publisherNode(identity: SiteIdentity): JsonLdObject {
  return {
    "@id": organizationId(identity.url),
    "@type": "Organization",
    name: identity.name,
  };
}

/**
 * The application window as an ISO 8601 interval.
 *
 * `temporalCoverage` is what a Dataset uses to say which period its data
 * describes, and for a grant that is exactly the window applications are open.
 * Open-ended windows are expressed with a trailing separator, which the format
 * allows; a grant with neither date has no coverage to state.
 */
function temporalCoverage(grant: GrantDetail): string | null {
  const from = grant.opensAt?.slice(0, 10) ?? null;
  const to = grant.closesAt?.slice(0, 10) ?? null;

  if (from === null && to === null) {
    return null;
  }

  return `${from ?? ".."}/${to ?? ".."}`;
}

/**
 * The page as a written work.
 *
 * Defensible because the page *is* editorial output: Grant Ninja compiles the
 * notice into a summary, an eligibility section and answer capsules, and
 * maintains it. So the author is Grant Ninja, not the funding agency — the
 * agency wrote the notice, not this page.
 *
 * `datePublished` is omitted rather than defaulted when a grant has never been
 * published, because a publication date for something unpublished is a
 * fabrication, and dates are the property Google most readily distrusts.
 */
export function buildGrantArticleSchema(grant: GrantDetail, identity: SiteIdentity): JsonLdObject {
  const url = absolute(routes.grant(grant.slug), identity.url);
  const ids = grantIds(url);

  return compact({
    "@context": CONTEXT,
    "@type": "Article",
    "@id": ids.article,
    headline: headline(grant.title),
    name: grant.title,
    description: grantDescription(grant),
    url,
    mainEntityOfPage: { "@id": ids.webpage },
    about: { "@id": ids.grant },
    author: publisherNode(identity),
    publisher: publisherNode(identity),
    isPartOf: { "@id": webSiteId(identity.url) },
    datePublished: grant.publishedAt,
    dateModified: grant.updatedAt,
    inLanguage: "en",
    // Google recommends an image. There is no per-grant artwork, so this is the
    // site's configured sharing image or nothing — a logo standing in for a
    // photograph of the subject is the kind of filler that makes the rest of
    // the markup less trustworthy. Setting the OpenGraph image in admin
    // settings fills this in everywhere at once.
    image: identity.ogImageUrl === null ? null : absolute(identity.ogImageUrl, identity.url),
    // Categories are the page's real subject terms, not invented keywords.
    keywords: grant.categories.map((category) => category.name),
  });
}

/**
 * The grant as a structured record.
 *
 * A single grant is a thin fit for `Dataset` — the type describes a body of
 * records, and this is one row. It is emitted because the client asked for it
 * explicitly, and every property here is literally true of the record: it is
 * based on the official notice, it covers a known area, and it measures the
 * fields listed. Nothing is added to fill the type out.
 *
 * `distribution` is deliberately absent. There is no downloadable file, and
 * inventing one is how a Dataset becomes a lie about what is available.
 */
export function buildGrantDatasetSchema(grant: GrantDetail, identity: SiteIdentity): JsonLdObject {
  const url = absolute(routes.grant(grant.slug), identity.url);
  const ids = grantIds(url);

  // Only the fields this record actually carries a value for.
  const measured = [
    grant.minimumAmount !== null ? "Minimum award" : null,
    grant.maximumAmount !== null ? "Maximum award" : null,
    grant.opensAt !== null ? "Opening date" : null,
    grant.closesAt !== null ? "Closing date" : null,
    grant.eligibility !== null ? "Eligibility criteria" : null,
    "Funding agency",
    "Geographic scope",
  ].filter((entry): entry is string => entry !== null);

  const spatial =
    grant.state === null ? grant.country.name : `${grant.state.name}, ${grant.country.name}`;

  return compact({
    "@context": CONTEXT,
    "@type": "Dataset",
    "@id": ids.dataset,
    name: grant.title,
    description: grantDescription(grant),
    url,
    identifier: grant.slug,
    about: { "@id": ids.grant },
    creator: funderNode(grant, identity.url),
    publisher: publisherNode(identity),
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: `${identity.name} grants database`,
      url: absolute(routes.grants, identity.url),
    },
    // The record was transcribed from a specific notice. This is the single
    // most honest thing a Dataset can say about a compiled record, and it
    // doubles as the reference page identifying what this record describes.
    isBasedOn: grant.officialUrl,
    sameAs: grant.officialUrl,
    spatialCoverage: spatial,
    // The application window — literally the period this record covers.
    temporalCoverage: temporalCoverage(grant),
    variableMeasured: measured,
    keywords: grant.categories.map((category) => category.name),
    datePublished: grant.publishedAt,
    dateModified: grant.updatedAt,
    // True, and worth stating: reading this record costs nothing and needs no
    // account. Google recommends it and it is one of the few Dataset
    // properties a grant listing can answer without qualification.
    isAccessibleForFree: true,
    // The audit trail's version number for this record, which is what a
    // Dataset `version` means.
    version: grant.version,
    inLanguage: "en",
    // No `distribution` and no `license`. There is no downloadable file, and no
    // data licence has been agreed — inventing either would misstate what is
    // actually on offer, which is the one thing Dataset markup must not do.
  });
}

/**
 * The page itself — the node that ties the others together.
 *
 * Carries no rich result of its own. It exists so `isPartOf`, `about` and
 * `breadcrumb` resolve to something, which is what turns four separate scripts
 * into one connected graph.
 */
export function buildGrantWebPageSchema(grant: GrantDetail, identity: SiteIdentity): JsonLdObject {
  const url = absolute(routes.grant(grant.slug), identity.url);
  const ids = grantIds(url);

  return compact({
    "@context": CONTEXT,
    "@type": "WebPage",
    "@id": ids.webpage,
    url,
    name: grant.title,
    description: grantDescription(grant),
    isPartOf: { "@id": webSiteId(identity.url) },
    about: { "@id": ids.grant },
    breadcrumb: { "@id": ids.breadcrumb },
    inLanguage: "en",
    datePublished: grant.publishedAt,
    dateModified: grant.updatedAt,
  });
}

/** A page-scoped BreadcrumbList, addressable so `WebPage.breadcrumb` resolves. */
export function buildGrantBreadcrumbSchema(
  trail: readonly BreadcrumbEntry[],
  grant: GrantDetail,
  identity: SiteIdentity,
): JsonLdObject {
  const url = absolute(routes.grant(grant.slug), identity.url);

  return {
    ...buildBreadcrumbSchema(trail, identity.url),
    "@id": grantIds(url).breadcrumb,
  };
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
