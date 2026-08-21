import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { GrantCard } from "@/features/grants/components/grant-card";
import { GrantSortSelect } from "@/features/grants/components/grant-sort-select";
import { hidesClosedGrants, SORT_LABELS } from "@/features/grants/services/grant-service";
import type { GrantListItem, GrantSort } from "@/features/grants/types/grant";
import type { Paginated } from "@/lib/repositories/base-repository";

interface GrantResultListProps {
  readonly result: Paginated<GrantListItem>;
  readonly sort: GrantSort;
  /** Path the pagination links point at, without a query string. */
  readonly basePath: string;
  /**
   * The page's current query string. Pagination rebuilds the whole thing —
   * constructing `?sort=&page=` by hand silently drops every active filter,
   * so page 2 of a filtered list would show unfiltered results.
   */
  readonly currentQuery?: string;
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
}

/**
 * Results, sorting and pagination for every surface that lists grants — the
 * main directory, a country, a category, an agency. One implementation so the
 * empty state and paging behave identically wherever a reader lands.
 */
export function GrantResultList({
  result,
  sort,
  basePath,
  currentQuery,
  emptyTitle = "No grants match this view yet",
  emptyDescription = "The database is still being populated from official government sources. Browse another category in the meantime, or tell us what you are looking for.",
}: GrantResultListProps) {
  const showingFrom = (result.page - 1) * result.pageSize + 1;
  const showingTo = Math.min(result.page * result.pageSize, result.total);

  const pageHref = (page: number) => {
    const params = new URLSearchParams(currentQuery ?? "");
    params.set("sort", sort);
    params.set("page", String(page));

    return `${basePath}?${params.toString()}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-4">
        <p className="font-mono text-xs tracking-wide text-muted-foreground tabular-nums">
          {result.total === 0
            ? "No grants"
            : `${showingFrom}–${showingTo} of ${result.total} grants`}
        </p>
        <GrantSortSelect value={sort} labels={SORT_LABELS} currentQuery={currentQuery ?? ""} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={emptyTitle}
          description={
            hidesClosedGrants(sort)
              ? `${emptyDescription} Grants that have already closed are hidden by this sort order.`
              : emptyDescription
          }
          className="mt-10"
          actions={
            <>
              {/* Named for what it does: the reader may simply be looking at a
                  sort order that filtered everything out. */}
              {hidesClosedGrants(sort) && (
                <Button asChild>
                  <Link href={`${basePath}?sort=newest`}>Include closed grants</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href={routes.categories}>Browse categories</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={routes.contact}>Contact us</Link>
              </Button>
            </>
          }
        />
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-4">
            {result.items.map((grant) => (
              <li key={grant.id}>
                <GrantCard grant={grant} />
              </li>
            ))}
          </ul>

          {result.pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
              {result.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={pageHref(result.page - 1)} rel="prev">
                    Previous
                  </Link>
                </Button>
              ) : (
                // A disabled anchor is still focusable and still navigates, so
                // the unavailable direction is rendered as a real button.
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}

              <p className="font-mono text-xs text-muted-foreground tabular-nums">
                Page {result.page} of {result.pageCount}
              </p>

              {result.page < result.pageCount ? (
                <Button asChild variant="outline">
                  <Link href={pageHref(result.page + 1)} rel="next">
                    Next
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next
                </Button>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
