import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * Countries, categories and agencies.
 *
 * One repository rather than three: they are the same shape of read — an
 * ordered list of slugged reference rows with a denormalized grant count — and
 * three near-identical classes would drift. Row Level Security already limits
 * these to `status = 'active'`.
 */

export type OrganizationType = Database["public"]["Enums"]["organization_type"];

export interface CountrySummary {
  /** Needed to look up polymorphic children such as FAQs. */
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly isoCode: string;
  readonly currency: string;
  readonly description: string | null;
  readonly grantCount: number;
  readonly organizationCount: number;
}

export interface CategorySummary {
  /** Needed to look up polymorphic children such as FAQs. */
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly grantCount: number;
}

export interface OrganizationSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly organizationType: OrganizationType;
  readonly website: string | null;
  readonly logoUrl: string | null;
  readonly description: string | null;
  readonly countryName: string;
  readonly countrySlug: string;
  readonly grantCount: number;
}

export interface StateSummary {
  readonly name: string;
  readonly slug: string;
  readonly code: string | null;
  readonly grantCount: number;
}

export interface PlatformStatistics {
  readonly grants: number;
  readonly countries: number;
  readonly organizations: number;
  readonly categories: number;
}

type Embedded<T> = T | T[] | null;

function toOne<T>(value: Embedded<T>): T | null {
  if (value === null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export class ReferenceRepository extends BaseRepository {
  protected readonly entityName = "Reference data";

  // --- countries -----------------------------------------------------------

  async listCountries(): Promise<readonly CountrySummary[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("countries")
      .select("id, name, slug, iso_code, currency, description, grant_count, organization_count")
      // Countries with grants first: an empty country is not worth the top slot.
      .order("grant_count", { ascending: false })
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
      grantCount: row.grant_count,
      organizationCount: row.organization_count,
    }));
  }

  async findCountry(slug: string): Promise<CountrySummary | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("countries")
      .select("id, name, slug, iso_code, currency, description, grant_count, organization_count")
      .eq("slug", slug)
      .maybeSingle();

    const row = this.unwrapMaybe({ data, error }, "findCountry");

    return row === null
      ? null
      : {
          id: row.id,
          name: row.name,
          slug: row.slug,
          isoCode: row.iso_code,
          currency: row.currency,
          description: row.description,
          grantCount: row.grant_count,
          organizationCount: row.organization_count,
        };
  }

  async listStates(countrySlug: string): Promise<readonly StateSummary[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("states")
      .select("name, slug, code, grant_count, country:countries!inner ( slug )")
      .eq("country.slug", countrySlug)
      .order("name", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listStates");
    }

    return (data ?? []).map((row) => ({
      name: row.name,
      slug: row.slug,
      code: row.code,
      grantCount: row.grant_count,
    }));
  }

  /** Scoped by country: state slugs are unique per country, not globally. */
  async findState(countrySlug: string, stateSlug: string): Promise<StateSummary | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("states")
      .select("name, slug, code, grant_count, country:countries!inner ( slug )")
      .eq("country.slug", countrySlug)
      .eq("slug", stateSlug)
      .maybeSingle();

    const row = this.unwrapMaybe({ data, error }, "findState");

    return row === null
      ? null
      : { name: row.name, slug: row.slug, code: row.code, grantCount: row.grant_count };
  }

  // --- categories ----------------------------------------------------------

  async listCategories(): Promise<readonly CategorySummary[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("grant_categories")
      .select("id, name, slug, description, icon, grant_count")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listCategories");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      grantCount: row.grant_count,
    }));
  }

  async findCategory(slug: string): Promise<CategorySummary | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("grant_categories")
      .select("id, name, slug, description, icon, grant_count")
      .eq("slug", slug)
      .maybeSingle();

    const row = this.unwrapMaybe({ data, error }, "findCategory");

    return row === null
      ? null
      : {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          icon: row.icon,
          grantCount: row.grant_count,
        };
  }

  // --- organizations (public URLs call these "agencies") -------------------

  async listOrganizations(): Promise<readonly OrganizationSummary[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("organizations")
      .select(
        "id, name, slug, organization_type, website, logo_url, description, grant_count, country:countries!inner ( name, slug )",
      )
      .order("grant_count", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listOrganizations");
    }

    return (data ?? []).map(toOrganizationSummary);
  }

  async findOrganization(slug: string): Promise<OrganizationSummary | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("organizations")
      .select(
        "id, name, slug, organization_type, website, logo_url, description, grant_count, country:countries!inner ( name, slug )",
      )
      .eq("slug", slug)
      .maybeSingle();

    const row = this.unwrapMaybe({ data, error }, "findOrganization");

    return row === null ? null : toOrganizationSummary(row);
  }

  // --- statistics ----------------------------------------------------------

  /**
   * Homepage counters. Uses `head: true` so Postgres returns the count without
   * transferring any rows.
   */
  async getStatistics(): Promise<PlatformStatistics> {
    const supabase = await createSupabaseServerClient();

    const [grants, countries, organizations, categories] = await Promise.all([
      supabase.from("grants").select("id", { count: "exact", head: true }),
      supabase.from("countries").select("id", { count: "exact", head: true }),
      supabase.from("organizations").select("id", { count: "exact", head: true }),
      supabase.from("grant_categories").select("id", { count: "exact", head: true }),
    ]);

    return {
      grants: grants.count ?? 0,
      countries: countries.count ?? 0,
      organizations: organizations.count ?? 0,
      categories: categories.count ?? 0,
    };
  }
}

interface RawOrganizationRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly organization_type: OrganizationType;
  readonly website: string | null;
  readonly logo_url: string | null;
  readonly description: string | null;
  readonly grant_count: number;
  readonly country: Embedded<{ readonly name: string; readonly slug: string }>;
}

function toOrganizationSummary(row: RawOrganizationRow): OrganizationSummary {
  const country = toOne(row.country);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    organizationType: row.organization_type,
    website: row.website,
    logoUrl: row.logo_url,
    description: row.description,
    countryName: country?.name ?? "",
    countrySlug: country?.slug ?? "",
    grantCount: row.grant_count,
  };
}

export const referenceRepository = new ReferenceRepository();
