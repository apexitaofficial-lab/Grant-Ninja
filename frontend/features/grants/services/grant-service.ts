import "server-only";

import { grantRepository } from "@/features/grants/repositories/grant-repository";
import type {
  GrantDetail,
  GrantListItem,
  GrantListQuery,
  GrantSort,
} from "@/features/grants/types/grant";
import { faqRepository } from "@/features/shared/repositories/faq-repository";
import { logger } from "@/lib/logger";
import type { Paginated } from "@/lib/repositories/base-repository";

/**
 * Business rules for grants. Repositories fetch; this decides.
 */

export const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const RELATED_GRANT_COUNT = 4;

const SORT_VALUES: readonly GrantSort[] = [
  "closing_soon",
  "newest",
  "funding_high",
  "recently_updated",
];

export const SORT_LABELS: Readonly<Record<GrantSort, string>> = {
  closing_soon: "Closing Soonest",
  newest: "Recently Added",
  funding_high: "Largest Funding",
  recently_updated: "Recently Updated",
};

/**
 * `closing_soon` hides grants whose window has passed, which is right for the
 * main directory — the question there is what you can still apply for.
 *
 * A country, category or agency page answers a different question: what does
 * this body fund. Defaulting those to `closing_soon` makes an agency whose
 * only grants have closed look empty, so they pass `newest` instead.
 */
export function parseSort(
  value: string | undefined,
  fallback: GrantSort = "closing_soon",
): GrantSort {
  return SORT_VALUES.find((sort) => sort === value) ?? fallback;
}

/** True when the active sort is suppressing grants that have already closed. */
export function hidesClosedGrants(sort: GrantSort): boolean {
  return sort === "closing_soon";
}

/** Clamps user-supplied paging so a crafted URL cannot request 10,000 rows. */
export function parsePagination(
  page: string | undefined,
  pageSize?: string,
): {
  page: number;
  pageSize: number;
} {
  const parsedPage = Number.parseInt(page ?? "1", 10);
  const parsedSize = Number.parseInt(pageSize ?? String(DEFAULT_PAGE_SIZE), 10);

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize:
      Number.isFinite(parsedSize) && parsedSize > 0
        ? Math.min(parsedSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE,
  };
}

export async function listGrants(query: GrantListQuery): Promise<Paginated<GrantListItem>> {
  return grantRepository.list(query);
}

/**
 * Composes the grant with its FAQs. They live in a polymorphic table that
 * cannot be embedded from the grants query, so the join happens here — the
 * service orchestrates repositories, the repositories stay single-purpose.
 */
export async function getGrantBySlug(slug: string): Promise<GrantDetail | null> {
  const grant = await grantRepository.findBySlug(slug);

  if (grant === null) {
    return null;
  }

  const faqs = await faqRepository.listFor("grant", grant.id);

  return { ...grant, faqs };
}

/**
 * Related grants are supporting content, so a failure here degrades to an
 * empty section rather than taking down the grant page around it. The error is
 * still logged — it is swallowed for the reader, not for us.
 */
export async function getRelatedGrants(grant: GrantDetail): Promise<readonly GrantListItem[]> {
  try {
    return await grantRepository.findRelated(grant, RELATED_GRANT_COUNT);
  } catch (error) {
    logger.error("Related grants unavailable", error, {
      feature: "grants",
      action: "getRelatedGrants",
      grantSlug: grant.slug,
    });

    return [];
  }
}

/**
 * The category shown in breadcrumbs and on the card. Falls back to the first
 * category so a grant mid-import, before its primary is set, still renders.
 */
export function getPrimaryCategory(grant: GrantListItem) {
  return grant.categories.find((category) => category.isPrimary) ?? grant.categories[0] ?? null;
}
