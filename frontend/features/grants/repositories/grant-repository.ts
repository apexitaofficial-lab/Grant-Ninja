import "server-only";

import type {
  GrantCategoryRef,
  GrantDetail,
  GrantFundingSource,
  GrantListItem,
  GrantListQuery,
  GrantWindowFilter,
} from "@/features/grants/types/grant";
import { CLOSING_SOON_DAYS } from "@/features/grants/utils/deadline";
import type { Paginated } from "@/lib/repositories/base-repository";
import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The only place that knows how grants are stored.
 *
 * Row Level Security already restricts anonymous reads to published,
 * non-deleted rows, so these queries do not repeat that filter — a second copy
 * of that rule is a second place to get it wrong.
 */

const LIST_COLUMNS = `
  id, title, slug, short_description, funding_amount, minimum_amount, maximum_amount,
  currency, grant_type, opens_at, closes_at, featured, is_federal,
  organization:organizations!inner ( name, slug ),
  country:countries!inner ( name, slug, iso_code ),
  state:states ( name, slug ),
  category_links:grant_category_relations ( is_primary, category:grant_categories ( name, slug ) )
`;

/**
 * Used when filtering by category. Both joins become `!inner` so the filter
 * can address `category_links.category.slug` — PostgREST cannot filter through
 * a left join. The trade-off is that the embedded array then contains only the
 * matching category, which is what the page is scoped to anyway.
 */
const LIST_COLUMNS_BY_CATEGORY = `
  id, title, slug, short_description, funding_amount, minimum_amount, maximum_amount,
  currency, grant_type, opens_at, closes_at, featured, is_federal,
  organization:organizations!inner ( name, slug ),
  country:countries!inner ( name, slug, iso_code ),
  state:states ( name, slug ),
  category_links:grant_category_relations!inner ( is_primary, category:grant_categories!inner ( name, slug ) )
`;

const DETAIL_COLUMNS = `
  ${LIST_COLUMNS},
  full_description, eligibility, official_url, application_url,
  published_at, last_verified_at, updated_at, current_version,
  ai_content:grant_ai_content ( summary ),
  capsules:grant_answer_capsules ( question, answer, position ),
  documents:grant_documents ( title, file_url, document_type, sort_order )
`;

// ---------------------------------------------------------------------------
// Driver-edge shapes.
//
// PostgREST returns embedded resources as an object or an array depending on
// how it resolves the relationship, and the generated types cannot express the
// shape of an arbitrary select string. These interfaces describe what the two
// queries above actually return, and `toOne` absorbs the object/array
// ambiguity. The cast is confined to this file — isolating the database is
// precisely what the repository layer is for.
// ---------------------------------------------------------------------------

type Embedded<T> = T | T[] | null;

function toOne<T>(value: Embedded<T>): T | null {
  if (value === null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

interface RawCategoryLink {
  readonly is_primary: boolean;
  readonly category: Embedded<{ readonly name: string; readonly slug: string }>;
}

interface RawListRow {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly short_description: string | null;
  readonly funding_amount: number | null;
  readonly minimum_amount: number | null;
  readonly maximum_amount: number | null;
  readonly currency: string;
  readonly grant_type: GrantListItem["grantType"];
  readonly opens_at: string | null;
  readonly closes_at: string | null;
  readonly featured: boolean;
  readonly is_federal: boolean;
  readonly organization: Embedded<{ readonly name: string; readonly slug: string }>;
  readonly country: Embedded<{
    readonly name: string;
    readonly slug: string;
    readonly iso_code: string;
  }>;
  readonly state: Embedded<{ readonly name: string; readonly slug: string }>;
  readonly category_links: readonly RawCategoryLink[] | null;
}

interface RawDetailRow extends RawListRow {
  readonly full_description: string | null;
  readonly eligibility: string | null;
  readonly official_url: string | null;
  readonly application_url: string | null;
  readonly published_at: string | null;
  readonly last_verified_at: string | null;
  readonly updated_at: string;
  readonly current_version: number;
  readonly ai_content: Embedded<{ readonly summary: string | null }>;
  readonly capsules:
    | readonly { readonly question: string; readonly answer: string; readonly position: number }[]
    | null;
  readonly documents:
    | readonly {
        readonly title: string;
        readonly file_url: string;
        readonly document_type: string | null;
        readonly sort_order: number;
      }[]
    | null;
}

/** Primary category first — it is what breadcrumbs and scoped URLs use. */
function toCategories(links: readonly RawCategoryLink[] | null): GrantCategoryRef[] {
  return (links ?? [])
    .flatMap((link) => {
      const category = toOne(link.category);

      return category === null
        ? []
        : [{ name: category.name, slug: category.slug, isPrimary: link.is_primary }];
    })
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

function toListItem(row: RawListRow): GrantListItem {
  const organization = toOne(row.organization);
  const country = toOne(row.country);
  const state = toOne(row.state);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    fundingAmount: row.funding_amount,
    minimumAmount: row.minimum_amount,
    maximumAmount: row.maximum_amount,
    currency: row.currency,
    grantType: row.grant_type,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    featured: row.featured,
    isFederal: row.is_federal,
    organization: {
      name: organization?.name ?? "Unknown agency",
      slug: organization?.slug ?? "",
    },
    country: {
      name: country?.name ?? "",
      slug: country?.slug ?? "",
      isoCode: country?.iso_code ?? "",
    },
    state: state === null ? null : { name: state.name, slug: state.slug },
    categories: toCategories(row.category_links),
  };
}

function toDetail(row: RawDetailRow): GrantDetail {
  return {
    ...toListItem(row),
    fullDescription: row.full_description,
    eligibility: row.eligibility,
    officialUrl: row.official_url,
    applicationUrl: row.application_url,
    publishedAt: row.published_at,
    lastVerifiedAt: row.last_verified_at,
    updatedAt: row.updated_at,
    version: row.current_version,
    summary: toOne(row.ai_content)?.summary ?? null,
    answerCapsules: (row.capsules ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(({ question, answer }) => ({ question, answer })),
    faqs: [],
    documents: (row.documents ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((document) => ({
        title: document.title,
        fileUrl: document.file_url,
        documentType: document.document_type,
      })),
  };
}

/**
 * Minimal surface of the query builder these helpers need. Typing it this way
 * avoids importing PostgREST's generic filter type, which changes shape with
 * every `select` string.
 */
type FilterValue = string | number | boolean;

interface FilterableBuilder<T> {
  gt(column: string, value: FilterValue): T;
  lt(column: string, value: FilterValue): T;
  gte(column: string, value: FilterValue): T;
  lte(column: string, value: FilterValue): T;
  or(filters: string): T;
}

/**
 * `is_federal` and `is_private` are independent flags; "state" means neither.
 * Selecting several sources widens the set, so they are combined with OR.
 */
function applyFundingSourceFilter<T extends FilterableBuilder<T>>(
  builder: T,
  sources: readonly GrantFundingSource[],
): T {
  if (sources.length === 0) {
    return builder;
  }

  const clauses = sources.map((source) => {
    switch (source) {
      case "federal":
        return "is_federal.eq.true";
      case "private":
        return "is_private.eq.true";
      case "state":
        return "and(is_federal.eq.false,is_private.eq.false)";
    }
  });

  return builder.or(clauses.join(","));
}

/**
 * Window state is derived from `closes_at`/`opens_at` at query time rather than
 * stored, so it can never go stale — but it also means each option is a date
 * comparison rather than an equality check.
 */
function applyWindowFilter<T extends FilterableBuilder<T>>(
  builder: T,
  window: GrantWindowFilter | undefined,
): T {
  if (window === undefined) {
    return builder;
  }

  const now = new Date();
  const nowIso = now.toISOString();

  switch (window) {
    case "open":
      // Accepting applications now: already opened, not yet closed.
      return builder
        .or(`closes_at.gte.${nowIso},closes_at.is.null`)
        .or(`opens_at.lte.${nowIso},opens_at.is.null`);
    case "closing_soon": {
      const cutoff = new Date(now.getTime() + CLOSING_SOON_DAYS * 86_400_000).toISOString();

      return builder.gte("closes_at", nowIso).lte("closes_at", cutoff);
    }
    case "upcoming":
      return builder.gt("opens_at", nowIso);
    case "closed":
      return builder.lt("closes_at", nowIso);
  }
}

export class GrantRepository extends BaseRepository {
  protected readonly entityName = "Grant";

  async list(query: GrantListQuery): Promise<Paginated<GrantListItem>> {
    const supabase = await createSupabaseServerClient();
    const { from, to } = this.toRange(query);

    const categorySlugs = query.categorySlugs ?? [];
    const columns = categorySlugs.length === 0 ? LIST_COLUMNS : LIST_COLUMNS_BY_CATEGORY;

    let builder = supabase.from("grants").select(columns, { count: "exact" });

    // Filters on embedded resources address the *alias*, not the table name.
    if (query.countrySlug !== undefined) {
      builder = builder.eq("country.slug", query.countrySlug);
    }

    if (query.stateSlug !== undefined) {
      builder = builder.eq("state.slug", query.stateSlug);
    }

    if (query.organizationSlug !== undefined) {
      builder = builder.eq("organization.slug", query.organizationSlug);
    }

    if (categorySlugs.length > 0) {
      // Several categories widen the set: a grant in any of them qualifies.
      builder = builder.in("category_links.category.slug", [...categorySlugs]);
    }

    builder = applyFundingSourceFilter(builder, query.fundingSources ?? []);
    builder = applyWindowFilter(builder, query.window);

    // Award-ceiling bounds. Grants with no published amount cannot be compared
    // and are excluded while a bound is set; the panel states this.
    if (query.minFunding !== undefined) {
      builder = builder.gte("maximum_amount", query.minFunding);
    }

    if (query.maxFunding !== undefined) {
      builder = builder.lte("maximum_amount", query.maxFunding);
    }

    if (query.search !== undefined && query.search.trim() !== "") {
      builder = builder.textSearch("search_vector", query.search.trim(), {
        type: "websearch",
        config: "english",
      });
    }

    switch (query.sort) {
      case "closing_soon": {
        // A closed grant is not "closing soon" — ordering by closes_at alone
        // puts the most stale results at the top of the default view. Grants
        // whose window has passed are excluded from this sort; they remain
        // reachable through the other sorts, search and their own URL.
        const nowIso = new Date().toISOString();
        builder = builder
          .or(`closes_at.gte.${nowIso},closes_at.is.null`)
          // Undated grants sort last: they carry no urgency signal at all.
          .order("closes_at", { ascending: true, nullsFirst: false });
        break;
      }
      case "funding_high":
        builder = builder.order("maximum_amount", { ascending: false, nullsFirst: false });
        break;
      case "recently_updated":
        builder = builder.order("updated_at", { ascending: false });
        break;
      case "newest":
        builder = builder.order("published_at", { ascending: false, nullsFirst: false });
        break;
    }

    const { data, error, count } = await builder.range(from, to);

    if (error) {
      this.unwrap({ data: null, error }, "list");
    }

    const rows = (data ?? []) as unknown as RawListRow[];

    return this.toPaginated(rows.map(toListItem), count ?? 0, query);
  }

  async findBySlug(slug: string): Promise<GrantDetail | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("grants")
      .select(DETAIL_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    const row = this.unwrapMaybe({ data, error }, "findBySlug");

    return row === null ? null : toDetail(row as unknown as RawDetailRow);
  }

  /**
   * Related grants: same primary category, excluding this grant.
   *
   * Resolved in two steps rather than one deeply-filtered query. PostgREST can
   * only filter on a directly embedded resource, and `grant_categories` sits
   * two levels down behind the join table — the single-query version fails
   * with PGRST108.
   */
  async findRelated(grant: GrantDetail, limit: number): Promise<readonly GrantListItem[]> {
    const primary = grant.categories.find((category) => category.isPrimary) ?? grant.categories[0];

    if (primary === undefined) {
      return [];
    }

    const supabase = await createSupabaseServerClient();

    const { data: links, error: linkError } = await supabase
      .from("grant_category_relations")
      .select("grant_id, category:grant_categories!inner ( slug )")
      .eq("category.slug", primary.slug)
      .neq("grant_id", grant.id)
      .limit(limit * 3);

    if (linkError) {
      this.unwrap({ data: null, error: linkError }, "findRelated.links");
    }

    const ids = (links ?? []).map((link) => link.grant_id);

    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("grants")
      .select(LIST_COLUMNS)
      .in("id", ids)
      .limit(limit);

    if (error) {
      this.unwrap({ data: null, error }, "findRelated");
    }

    return ((data ?? []) as unknown as RawListRow[]).map(toListItem);
  }
}

export const grantRepository = new GrantRepository();
