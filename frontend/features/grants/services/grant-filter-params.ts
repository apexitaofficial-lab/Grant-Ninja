import type {
  GrantFilters,
  GrantFundingSource,
  GrantWindowFilter,
} from "@/features/grants/types/grant";

/**
 * The contract between the URL and the query.
 *
 * Parsing lives here rather than in a page so the filter panel, the listing
 * page and any future surface agree on what `?window=open&source=federal`
 * means. Anything unrecognised is dropped: a crafted URL should narrow the
 * results or do nothing, never error.
 */

export const FILTER_PARAM_KEYS = [
  "q",
  "category",
  "source",
  "window",
  "min",
  "max",
  "sort",
] as const;

const FUNDING_SOURCES: readonly GrantFundingSource[] = ["federal", "state", "private"];
const WINDOWS: readonly GrantWindowFilter[] = ["open", "closing_soon", "upcoming", "closed"];

export const FUNDING_SOURCE_LABELS: Readonly<Record<GrantFundingSource, string>> = {
  federal: "Federal",
  state: "State or Local",
  private: "Private or Foundation",
};

export const WINDOW_LABELS: Readonly<Record<GrantWindowFilter, string>> = {
  open: "Accepting Applications",
  closing_soon: "Closing Within 14 Days",
  upcoming: "Not Yet Open",
  closed: "Closed",
};

type ParamSource = Pick<URLSearchParams, "getAll" | "get">;

/**
 * Rebuilds `URLSearchParams` from Next's resolved `searchParams` object.
 *
 * Repeated keys arrive as an array, and losing them would collapse
 * `?category=a&category=b` into one value. Every listing page needs this, so
 * it lives here rather than being copied into each one.
 */
export function toSearchParams(
  input: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}

function parsePositiveNumber(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseGrantFilters(params: ParamSource): GrantFilters {
  const categorySlugs = params.getAll("category").filter((slug) => slug.trim() !== "");
  const fundingSources = params
    .getAll("source")
    .filter((source): source is GrantFundingSource =>
      FUNDING_SOURCES.includes(source as GrantFundingSource),
    );
  const windowValue = params.get("window");
  const search = params.get("q")?.trim();

  const minFunding = parsePositiveNumber(params.get("min"));
  const maxFunding = parsePositiveNumber(params.get("max"));

  return {
    ...(categorySlugs.length > 0 ? { categorySlugs } : {}),
    ...(fundingSources.length > 0 ? { fundingSources } : {}),
    ...(windowValue !== null && WINDOWS.includes(windowValue as GrantWindowFilter)
      ? { window: windowValue as GrantWindowFilter }
      : {}),
    // Reversed bounds are a typo, not an instruction to return nothing.
    ...(minFunding !== undefined ? { minFunding } : {}),
    ...(maxFunding !== undefined && (minFunding === undefined || maxFunding >= minFunding)
      ? { maxFunding }
      : {}),
    ...(search !== undefined && search !== "" ? { search } : {}),
  };
}

/** Whether anything is narrowing the result set, for the "clear" affordance. */
export function countActiveFilters(filters: GrantFilters): number {
  return (
    (filters.categorySlugs?.length ?? 0) +
    (filters.fundingSources?.length ?? 0) +
    (filters.window === undefined ? 0 : 1) +
    (filters.minFunding === undefined ? 0 : 1) +
    (filters.maxFunding === undefined ? 0 : 1)
  );
}

/** True when a bound is set that hides grants with no published amount. */
export function excludesUnpricedGrants(filters: GrantFilters): boolean {
  return filters.minFunding !== undefined || filters.maxFunding !== undefined;
}
