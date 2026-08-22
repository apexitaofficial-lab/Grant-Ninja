import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type GrantStatus = Database["public"]["Enums"]["grant_status"];
type GrantFundingType = Database["public"]["Enums"]["grant_funding_type"];

export interface AdminGrantListItem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: GrantStatus;
  readonly aiConfidence: number | null;
  readonly organizationName: string;
  readonly maximumAmount: number | null;
  readonly currency: string;
  readonly closesAt: string | null;
  readonly updatedAt: string;
  readonly categoryNames: readonly string[];
}

export interface AdminGrantDetail extends AdminGrantListItem {
  readonly shortDescription: string | null;
  readonly fullDescription: string | null;
  readonly eligibility: string | null;
  readonly fundingAmount: number | null;
  readonly minimumAmount: number | null;
  readonly grantType: GrantFundingType;
  readonly officialUrl: string | null;
  readonly applicationUrl: string | null;
  readonly sourceUrl: string | null;
  readonly opensAt: string | null;
  readonly featured: boolean;
  readonly currentVersion: number;
  readonly publishedAt: string | null;
  readonly countryName: string;
}

export interface GrantHistoryEntry {
  readonly id: string;
  readonly action: string;
  readonly description: string | null;
  readonly performedByType: string;
  readonly createdAt: string;
}

export interface AdminGrantCounts {
  readonly pendingReview: number;
  readonly published: number;
  readonly draft: number;
  readonly archived: number;
}

/**
 * The columns `admin_save_grant` understands, in database naming.
 *
 * Narrower than `Record<string, unknown>` on purpose: the function reads keys
 * out of the JSON patch, so a typo in a key name would silently do nothing
 * rather than fail. Naming them here makes that a compile error.
 */
export interface GrantPatch {
  readonly title?: string;
  readonly short_description?: string | null;
  readonly full_description?: string | null;
  readonly eligibility?: string | null;
  readonly funding_amount?: number | null;
  readonly minimum_amount?: number | null;
  readonly maximum_amount?: number | null;
  readonly official_url?: string | null;
  readonly application_url?: string | null;
  readonly opens_at?: string | null;
  readonly closes_at?: string | null;
  readonly grant_type?: GrantFundingType;
  readonly featured?: boolean;
}

/**
 * Extra views the dashboard links into.
 *
 * `unverified` and `closing` are not statuses — they are questions asked of
 * published grants. The dashboard counts them, so the list has to be able to
 * show the same set, or those counters are numbers with nowhere to go.
 */
export type AdminGrantView = "unverified" | "closing";

export const CLOSING_SOON_DAYS = 14;

export interface AdminGrantQuery {
  readonly status?: GrantStatus;
  readonly view?: AdminGrantView;
  readonly search?: string;
  readonly page?: number;
  readonly perPage?: number;
}

type Embedded<T> = T | T[] | null;

function toOne<T>(value: Embedded<T>): T | null {
  if (value === null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

interface RawCategoryLink {
  readonly category: Embedded<{ readonly name: string }>;
}

function categoryNames(links: RawCategoryLink[] | null): readonly string[] {
  return (links ?? [])
    .map((link) => toOne(link.category)?.name)
    .filter((name): name is string => typeof name === "string");
}

const LIST_COLUMNS = `
  id, title, slug, status, ai_confidence, maximum_amount, currency, closes_at, updated_at,
  organization:organizations ( name ),
  category_links:grant_category_relations ( category:grant_categories ( name ) )
`;

const DETAIL_COLUMNS = `
  ${LIST_COLUMNS},
  short_description, full_description, eligibility, funding_amount, minimum_amount,
  grant_type, official_url, application_url, source_url, opens_at, featured,
  current_version, published_at,
  country:countries ( name )
`;

/**
 * Grants as an operator sees them: every status, not just published.
 *
 * The public repository relies on RLS to hide drafts. This one is reached only
 * from admin pages, where the `grants_editor_write` policy grants an editor
 * read access to every row — so the same table answers both without either
 * query repeating the other's rule.
 *
 * Writes go through database functions rather than PostgREST updates. A direct
 * update would change the grant without writing a version snapshot or a history
 * entry, because nothing does that automatically — see migration 0022.
 */
export class GrantAdminRepository extends BaseRepository {
  protected readonly entityName = "AdminGrant";

  async list(query: AdminGrantQuery): Promise<{
    readonly items: readonly AdminGrantListItem[];
    readonly total: number;
  }> {
    const supabase = await createSupabaseServerClient();
    const perPage = query.perPage ?? 20;
    const page = Math.max(1, query.page ?? 1);
    const from = (page - 1) * perPage;

    let builder = supabase
      .from("grants")
      .select(LIST_COLUMNS, { count: "exact" })
      .is("deleted_at", null);

    if (query.status !== undefined) {
      builder = builder.eq("status", query.status);
    }

    // Both views only make sense for published grants — an unverified draft is
    // not a problem, and a draft closing next week is not urgent. The
    // definitions match `admin-stats-repository` exactly, so the count on the
    // dashboard and the rows on this page can never disagree.
    if (query.view === "unverified") {
      builder = builder.eq("status", "published").is("last_verified_at", null);
    }

    if (query.view === "closing") {
      const now = new Date();
      const soon = new Date(now.getTime() + CLOSING_SOON_DAYS * 86_400_000);

      builder = builder
        .eq("status", "published")
        .gte("closes_at", now.toISOString())
        .lte("closes_at", soon.toISOString());
    }

    if (query.search !== undefined && query.search.trim() !== "") {
      // `ilike` rather than the full-text index: an operator searching the
      // admin list is usually pasting part of a title they already know.
      builder = builder.ilike("title", `%${query.search.trim()}%`);
    }

    const { data, error, count } = await builder
      .order("updated_at", { ascending: false })
      .range(from, from + perPage - 1);

    if (error) {
      this.unwrap({ data: null, error }, "list");
    }

    return {
      items: (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        status: row.status,
        aiConfidence: row.ai_confidence,
        organizationName: toOne(row.organization)?.name ?? "Unknown agency",
        maximumAmount: row.maximum_amount,
        currency: row.currency,
        closesAt: row.closes_at,
        updatedAt: row.updated_at,
        categoryNames: categoryNames(row.category_links),
      })),
      total: count ?? 0,
    };
  }

  async countsByStatus(): Promise<AdminGrantCounts> {
    const supabase = await createSupabaseServerClient();

    const countFor = async (status: GrantStatus): Promise<number> => {
      const { count } = await supabase
        .from("grants")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", status);

      return count ?? 0;
    };

    const [pendingReview, published, draft, archived] = await Promise.all([
      countFor("pending_review"),
      countFor("published"),
      countFor("draft"),
      countFor("archived"),
    ]);

    return { pendingReview, published, draft, archived };
  }

  async findById(id: string): Promise<AdminGrantDetail | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("grants")
      .select(DETAIL_COLUMNS)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      this.unwrap({ data: null, error }, "findById");
    }

    if (data === null) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      status: data.status,
      aiConfidence: data.ai_confidence,
      organizationName: toOne(data.organization)?.name ?? "Unknown agency",
      countryName: toOne(data.country)?.name ?? "",
      maximumAmount: data.maximum_amount,
      minimumAmount: data.minimum_amount,
      fundingAmount: data.funding_amount,
      currency: data.currency,
      closesAt: data.closes_at,
      opensAt: data.opens_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at,
      categoryNames: categoryNames(data.category_links),
      shortDescription: data.short_description,
      fullDescription: data.full_description,
      eligibility: data.eligibility,
      grantType: data.grant_type,
      officialUrl: data.official_url,
      applicationUrl: data.application_url,
      sourceUrl: data.source_url,
      featured: data.featured,
      currentVersion: data.current_version,
    };
  }

  async listHistory(grantId: string, limit = 20): Promise<readonly GrantHistoryEntry[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("grant_history")
      .select("id, action, description, performed_by_type, created_at")
      .eq("grant_id", grantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      this.unwrap({ data: null, error }, "listHistory");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      description: row.description,
      performedByType: row.performed_by_type,
      createdAt: row.created_at,
    }));
  }

  async save(grantId: string, patch: GrantPatch, reason: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.rpc("admin_save_grant", {
      p_grant_id: grantId,
      // `Json` requires an index signature, which `GrantPatch` deliberately
      // lacks — an index signature would accept any key and lose the typo
      // protection that is the whole point of naming the columns. The
      // conversion is confined to this line, which is what the repository
      // layer is for.
      p_patch: patch as Record<string, Json>,
      p_change_reason: reason,
    });

    if (error) {
      this.unwrap({ data: null, error }, "save");
    }
  }

  async setStatus(grantId: string, status: GrantStatus, reason: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.rpc("admin_set_grant_status", {
      p_grant_id: grantId,
      p_status: status,
      p_reason: reason,
    });

    if (error) {
      this.unwrap({ data: null, error }, "setStatus");
    }
  }

  async softDelete(grantId: string, reason: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.rpc("admin_delete_grant", {
      p_grant_id: grantId,
      p_reason: reason,
    });

    if (error) {
      this.unwrap({ data: null, error }, "softDelete");
    }
  }
}

export const grantAdminRepository = new GrantAdminRepository();
