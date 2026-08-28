import type { Database } from "@/types/database";

/**
 * Domain shapes for the grants feature.
 *
 * Deliberately narrower than the generated row types: the UI receives only the
 * fields it renders, so adding a column to `grants` does not silently widen
 * what reaches the browser.
 */

export type GrantStatus = Database["public"]["Enums"]["grant_status"];
export type GrantFundingType = Database["public"]["Enums"]["grant_funding_type"];

export interface GrantOrganizationRef {
  readonly name: string;
  readonly slug: string;
}

export interface GrantCountryRef {
  readonly name: string;
  readonly slug: string;
  readonly isoCode: string;
}

export interface GrantStateRef {
  readonly name: string;
  readonly slug: string;
}

export interface GrantCategoryRef {
  readonly name: string;
  readonly slug: string;
  readonly isPrimary: boolean;
}

/** The projection rendered by a grant card in any listing. */
export interface GrantListItem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly fundingAmount: number | null;
  readonly minimumAmount: number | null;
  readonly maximumAmount: number | null;
  readonly currency: string;
  readonly grantType: GrantFundingType;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
  readonly featured: boolean;
  readonly isFederal: boolean;
  readonly organization: GrantOrganizationRef;
  readonly country: GrantCountryRef;
  readonly state: GrantStateRef | null;
  readonly categories: readonly GrantCategoryRef[];
}

/** Everything the detail page needs, on top of the listing projection. */
export interface GrantDetail extends GrantListItem {
  readonly fullDescription: string | null;
  readonly eligibility: string | null;
  readonly officialUrl: string | null;
  readonly applicationUrl: string | null;
  readonly publishedAt: string | null;
  readonly lastVerifiedAt: string | null;
  readonly updatedAt: string;
  /** Audit-trail revision number. Surfaced as the Dataset's `version`. */
  readonly version: number;
  readonly summary: string | null;
  readonly answerCapsules: readonly GrantAnswerCapsule[];
  readonly faqs: readonly GrantFaq[];
  readonly documents: readonly GrantDocument[];
}

export interface GrantAnswerCapsule {
  readonly question: string;
  readonly answer: string;
}

export interface GrantFaq {
  readonly question: string;
  readonly answer: string;
}

export interface GrantDocument {
  readonly title: string;
  readonly fileUrl: string;
  readonly documentType: string | null;
}

export type GrantSort = "closing_soon" | "newest" | "funding_high" | "recently_updated";

/** Where a grant's money comes from. Maps to the `is_federal`/`is_private` flags. */
export type GrantFundingSource = "federal" | "state" | "private";

/** Derived from the application window, not stored — see `utils/deadline.ts`. */
export type GrantWindowFilter = "open" | "closing_soon" | "upcoming" | "closed";

export interface GrantFilters {
  readonly countrySlug?: string;
  readonly stateSlug?: string;
  readonly organizationSlug?: string;
  /** Multiple categories widen the result set: a grant matching any one qualifies. */
  readonly categorySlugs?: readonly string[];
  readonly fundingSources?: readonly GrantFundingSource[];
  readonly window?: GrantWindowFilter;
  /**
   * Bounds apply to the award ceiling. A grant that has not published an
   * amount cannot be compared, so it is excluded while these are set — the
   * filter panel says so rather than letting results silently disappear.
   */
  readonly minFunding?: number;
  readonly maxFunding?: number;
  readonly search?: string;
}

export interface GrantListQuery extends GrantFilters {
  readonly page: number;
  readonly pageSize: number;
  readonly sort: GrantSort;
}
