import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/config/routes";
import { GrantFilterPanel } from "@/features/grants/components/grant-filter-panel";
import { GrantFiltersDrawer } from "@/features/grants/components/grant-filters-drawer";
import { GrantResultList } from "@/features/grants/components/grant-result-list";
import { GrantSearchField } from "@/features/grants/components/grant-search-field";
import {
  countActiveFilters,
  parseGrantFilters,
  toSearchParams,
} from "@/features/grants/services/grant-filter-params";
import { listGrants, parsePagination, parseSort } from "@/features/grants/services/grant-service";
import { listCategories } from "@/features/shared/services/reference-service";

export const metadata: Metadata = {
  title: "Browse Research Grants",
  description:
    "Every research grant in the Grant Ninja database, with funding amounts, eligibility and closing dates from official government sources.",
  alternates: { canonical: routes.grants },
};

interface GrantsPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GrantsPage({ searchParams }: GrantsPageProps) {
  const params = toSearchParams(await searchParams);

  const sort = parseSort(params.get("sort") ?? undefined);
  const { page, pageSize } = parsePagination(params.get("page") ?? undefined);
  const filters = parseGrantFilters(params);
  const activeCount = countActiveFilters(filters);

  const [result, categories] = await Promise.all([
    listGrants({ ...filters, page, pageSize, sort }),
    listCategories(),
  ]);

  const search = filters.search;
  const currentQuery = params.toString();
  const filterCategories = categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    grantCount: category.grantCount,
  }));

  return (
    <>
      <PageHeader
        title="Research Grants"
        description="Funding from government agencies and research councils, updated from official sources. Sorted by closing date so the ones you can still apply for come first."
      />

      <Container className="pb-24">
        {/*
          No Suspense and no `useSearchParams()` anywhere below. The server has
          already parsed the query string, so it is passed down as a plain prop
          — which keeps these as ordinary client components that server-render
          and hydrate normally.
        */}
        <GrantSearchField
          className="mb-6"
          initialValue={search ?? ""}
          currentQuery={currentQuery}
        />

        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          {/* Persistent on desktop, a drawer below it — spec §56. */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <GrantFilterPanel
                categories={filterCategories}
                selected={filters}
                activeCount={activeCount}
                currentQuery={currentQuery}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 lg:hidden">
              <GrantFiltersDrawer
                categories={filterCategories}
                selected={filters}
                activeCount={activeCount}
                currentQuery={currentQuery}
              />
            </div>

            <GrantResultList
              result={result}
              sort={sort}
              basePath={routes.grants}
              currentQuery={params.toString()}
              emptyTitle={
                search === undefined
                  ? activeCount > 0
                    ? "No grants match these filters"
                    : "No grants match this view yet"
                  : `Nothing found for “${search}”`
              }
              emptyDescription={
                activeCount > 0
                  ? "Try removing a filter — narrowing by amount and window together rules out most of the database."
                  : search === undefined
                    ? "The database is still being populated from official government sources. Browse by category in the meantime, or tell us what you are looking for."
                    : "Try a broader term — an agency name, a field of research, or the technology you work on."
              }
            />
          </div>
        </div>
      </Container>
    </>
  );
}
