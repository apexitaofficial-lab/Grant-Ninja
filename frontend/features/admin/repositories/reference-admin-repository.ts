import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type EntityStatus = Database["public"]["Enums"]["entity_status"];
type OrganizationType = Database["public"]["Enums"]["organization_type"];

export interface AdminCountry {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly isoCode: string;
  readonly currency: string;
  readonly description: string | null;
  readonly status: EntityStatus;
  readonly grantCount: number;
  readonly organizationCount: number;
}

export interface AdminCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly sortOrder: number;
  readonly status: EntityStatus;
  readonly grantCount: number;
}

export interface AdminAgency {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly organizationType: OrganizationType;
  readonly website: string | null;
  readonly description: string | null;
  readonly status: EntityStatus;
  readonly grantCount: number;
  readonly countryName: string;
}

/** A pickable reference row, scoped to the country it belongs to. */
export interface ReferenceOption {
  readonly id: string;
  readonly name: string;
  readonly countryId: string;
}

type Embedded<T> = T | T[] | null;

function toOne<T>(value: Embedded<T>): T | null {
  if (value === null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** The three entities share a rename path, so they share a repository. */
export type ReferenceEntity = "country" | "category" | "organization";

export class ReferenceAdminRepository extends BaseRepository {
  protected readonly entityName = "AdminReference";

  async listCountries(): Promise<readonly AdminCountry[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("countries")
      .select(
        "id, name, slug, iso_code, currency, description, status, grant_count, organization_count",
      )
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listCountries");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isoCode: row.iso_code,
      currency: row.currency,
      description: row.description,
      status: row.status,
      grantCount: row.grant_count,
      organizationCount: row.organization_count,
    }));
  }

  async listCategories(): Promise<readonly AdminCategory[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("grant_categories")
      .select("id, name, slug, description, icon, sort_order, status, grant_count")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listCategories");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      sortOrder: row.sort_order,
      status: row.status,
      grantCount: row.grant_count,
    }));
  }

  /**
   * Every agency and state as a flat option list, each tagged with its country.
   *
   * Loaded whole rather than fetched per country. Both sets are small — around
   * 150 agencies and 52 states — and shipping them once lets the grant form
   * narrow the agency list the instant the country changes, instead of showing
   * a spinner between two dropdowns that depend on each other.
   */
  async listGrantFormOptions(): Promise<{
    readonly agencies: readonly ReferenceOption[];
    readonly states: readonly ReferenceOption[];
  }> {
    const supabase = await createSupabaseServerClient();

    const [agencies, states] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, country_id")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("states")
        .select("id, name, country_id")
        .order("name", { ascending: true }),
    ]);

    if (agencies.error) {
      this.unwrap({ data: null, error: agencies.error }, "listGrantFormOptions");
    }

    if (states.error) {
      this.unwrap({ data: null, error: states.error }, "listGrantFormOptions");
    }

    const toOptions = (
      rows: readonly { id: string; name: string; country_id: string }[],
    ): readonly ReferenceOption[] =>
      rows.map((row) => ({ id: row.id, name: row.name, countryId: row.country_id }));

    return {
      agencies: toOptions(agencies.data ?? []),
      states: toOptions(states.data ?? []),
    };
  }

  /**
   * Agencies are paginated and searchable because there are 148 of them after
   * the grants.gov sync, and a single list of that length is unusable.
   */
  async listAgencies(query: {
    readonly search?: string;
    readonly page?: number;
    readonly perPage?: number;
  }): Promise<{ readonly items: readonly AdminAgency[]; readonly total: number }> {
    const supabase = await createSupabaseServerClient();
    const perPage = query.perPage ?? 25;
    const page = Math.max(1, query.page ?? 1);
    const from = (page - 1) * perPage;

    let builder = supabase
      .from("organizations")
      .select(
        "id, name, slug, organization_type, website, description, status, grant_count, country:countries ( name )",
        { count: "exact" },
      )
      .is("deleted_at", null);

    if (query.search !== undefined && query.search.trim() !== "") {
      builder = builder.ilike("name", `%${query.search.trim()}%`);
    }

    const { data, error, count } = await builder
      .order("grant_count", { ascending: false })
      .order("name", { ascending: true })
      .range(from, from + perPage - 1);

    if (error) {
      this.unwrap({ data: null, error }, "listAgencies");
    }

    return {
      items: (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        organizationType: row.organization_type,
        website: row.website,
        description: row.description,
        status: row.status,
        grantCount: row.grant_count,
        countryName: toOne(row.country)?.name ?? "",
      })),
      total: count ?? 0,
    };
  }

  /**
   * Fields other than the slug. The slug goes through `renameSlug` because it
   * is a published URL and changing it has to write a redirect.
   *
   * One method per table rather than one generic one: the three tables have
   * genuinely different columns, and Supabase's generated types are per-table,
   * so a shared `Record<string, unknown>` would only typecheck by discarding
   * the column checking that makes these worth having.
   */
  async updateCountry(
    id: string,
    patch: {
      readonly name: string;
      readonly currency: string;
      readonly description: string | null;
      readonly status: EntityStatus;
    },
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("countries").update(patch).eq("id", id);

    if (error) {
      this.unwrap({ data: null, error }, "updateCountry");
    }
  }

  async updateCategory(
    id: string,
    patch: {
      readonly name: string;
      readonly description: string | null;
      readonly icon: string | null;
      readonly sort_order: number;
      readonly status: EntityStatus;
    },
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("grant_categories").update(patch).eq("id", id);

    if (error) {
      this.unwrap({ data: null, error }, "updateCategory");
    }
  }

  async updateAgency(
    id: string,
    patch: {
      readonly name: string;
      readonly website: string | null;
      readonly description: string | null;
      readonly organization_type: OrganizationType;
      readonly status: EntityStatus;
    },
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("organizations").update(patch).eq("id", id);

    if (error) {
      this.unwrap({ data: null, error }, "updateAgency");
    }
  }

  /** Returns the redirect that was created, or null when the slug was unchanged. */
  async renameSlug(
    entity: ReferenceEntity,
    id: string,
    newSlug: string,
    oldPath: string,
    newPath: string,
  ): Promise<string | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("admin_rename_slug", {
      p_entity: entity,
      p_id: id,
      p_new_slug: newSlug,
      p_old_path: oldPath,
      p_new_path: newPath,
    });

    if (error) {
      this.unwrap({ data: null, error }, "renameSlug");
    }

    return typeof data === "string" ? data : null;
  }

  async countRedirects(): Promise<number> {
    const supabase = await createSupabaseServerClient();

    const { count } = await supabase
      .from("seo_redirects")
      .select("id", { count: "exact", head: true })
      .eq("enabled", true);

    return count ?? 0;
  }
}

export const referenceAdminRepository = new ReferenceAdminRepository();
