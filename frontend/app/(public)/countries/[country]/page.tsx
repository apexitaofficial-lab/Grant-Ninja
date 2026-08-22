import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { StatRow } from "@/components/shared/stat-row";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { GrantResultList } from "@/features/grants/components/grant-result-list";
import {
  FUNDING_SOURCE_LABELS,
  parseGrantFilters,
  toSearchParams,
} from "@/features/grants/services/grant-filter-params";
import { listGrants, parsePagination, parseSort } from "@/features/grants/services/grant-service";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqSchema,
} from "@/features/seo/lib/json-ld";
import { getEntityFaqs } from "@/features/shared/services/faq-service";
import {
  getCountry,
  getFundingBreakdown,
  listStates,
} from "@/features/shared/services/reference-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

interface CountryPageProps {
  readonly params: Promise<{ country: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const country = await getCountry(slug);

  if (country === null) {
    return { title: "Country not found", robots: { index: false, follow: true } };
  }

  return {
    title: `Research grants in ${country.name}`,
    description:
      country.description ??
      `Browse research grants available in ${country.name}, sourced from official government agencies.`,
    alternates: { canonical: routes.country(country.slug) },
  };
}

export default async function CountryPage({ params, searchParams }: CountryPageProps) {
  const { country: slug } = await params;
  const country = await getCountry(slug);

  if (country === null) {
    notFound();
  }

  const query = await searchParams;
  // Scoped pages show what a body funds, including grants that have closed.
  const sort = parseSort(single(query["sort"]), "newest");
  const { page, pageSize } = parsePagination(single(query["page"]));

  // The funding-level cards link back to this page with `?source=federal`, so
  // it has to parse filters rather than only sort and page — otherwise the
  // links change the URL and the list stays exactly as it was.
  const filters = parseGrantFilters(toSearchParams(query));

  const [result, states, faqs, funding] = await Promise.all([
    listGrants({ ...filters, page, pageSize, sort, countrySlug: country.slug }),
    listStates(country.slug),
    getEntityFaqs("country", country.id),
    getFundingBreakdown(country.id),
  ]);

  const identity = await getSiteIdentity();

  // Every state is listed, including the ones with nothing yet: each is a real
  // page, and a visitor looking for Texas should find Texas rather than be
  // told it does not exist. The count on each is the honest signal about
  // what is there.
  const statesWithGrants = states.filter((state) => state.grantCount > 0).length;

  return (
    <>
      <JsonLd
        schemas={[
          buildCollectionPageSchema(
            {
              name: `Research grants in ${country.name}`,
              description: country.description,
              path: routes.country(country.slug),
              items: result.items.map((grant) => ({
                name: grant.title,
                path: routes.grant(grant.slug),
              })),
              total: result.total,
            },
            identity.url,
          ),
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: "Countries", path: routes.countries },
              { name: country.name, path: routes.country(country.slug) },
            ],
            identity.url,
          ),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title={`Research grants in ${country.name}`}
        description={country.description ?? undefined}
        breadcrumb={
          <EntityBreadcrumb
            trail={[{ label: "Countries", href: routes.countries }, { label: country.name }]}
          />
        }
      />

      <Container className="pb-24">
        <StatRow
          className="mb-10"
          stats={[
            { label: "Published grants", value: country.grantCount },
            { label: "Agencies", value: country.organizationCount },
            { label: "Currency", value: country.currency, isText: true },
          ]}
        />

        {/* Where the money comes from. Only rendered when the split is
            meaningful — a country with one funding level does not need a
            breakdown of one row. */}
        {funding.federal + funding.state + funding.private > 0 && (
          <section aria-labelledby="funding-levels" className="mb-12">
            <h2
              id="funding-levels"
              className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
            >
              By level of government
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              <FundingLevel
                label="Federal"
                description="National agencies"
                count={funding.federal}
                href={`${routes.country(country.slug)}?source=federal`}
              />
              {/* Deliberately not labelled with a "states covered" count.
                  `state_id` marks where a grant applies, not who funds it — a
                  federal grant restricted to one state carries it too — so
                  that figure next to a "state and local" total would imply
                  state funding that is not there. Coverage is stated under
                  "browse by state", where it means what it says. */}
              <FundingLevel
                label="State and local"
                description="Programmes funded by state or city government"
                count={funding.state}
                href={`${routes.country(country.slug)}?source=state`}
              />
              <FundingLevel
                label="Private"
                description="Foundations and trusts"
                count={funding.private}
                href={`${routes.country(country.slug)}?source=private`}
              />
            </ul>
          </section>
        )}

        {states.length > 0 && (
          <section aria-labelledby="states" className="mb-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
              <h2
                id="states"
                className="font-mono text-xs tracking-widest text-muted-foreground uppercase"
              >
                Browse by state
              </h2>
              <p className="font-mono text-xs text-muted-foreground tabular-nums">
                {statesWithGrants} of {states.length} with grants
              </p>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {states.map((state) => (
                <li key={state.slug}>
                  {/* States with nothing yet are dimmed rather than removed.
                      They are real pages worth reaching, and the count is the
                      honest signal — a full-strength button reading zero would
                      promise something the page cannot deliver. */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={state.grantCount === 0 ? "opacity-55" : undefined}
                  >
                    <Link href={routes.state(country.slug, state.slug)}>
                      {state.name}
                      <span className="ml-1 font-mono text-xs text-muted-foreground tabular-nums">
                        {state.grantCount}
                      </span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* An active filter has to be visible and reversible. Arriving from a
            funding-level card and seeing a shorter list with no explanation
            reads as missing data rather than as a filter doing its job. */}
        {(filters.fundingSources ?? []).length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-card border border-border bg-muted/30 px-4 py-3">
            <span className="text-sm">
              Showing{" "}
              <strong>
                {(filters.fundingSources ?? [])
                  .map((source) => FUNDING_SOURCE_LABELS[source].toLowerCase())
                  .join(", ")}
              </strong>{" "}
              grants only
            </span>
            <Link
              href={routes.country(country.slug)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Show all
            </Link>
          </div>
        )}

        <GrantResultList
          result={result}
          sort={sort}
          basePath={routes.country(country.slug)}
          currentQuery={toSearchParams(query).toString()}
          emptyTitle={`No published grants in ${country.name} yet`}
          emptyDescription="This country is in the database but its government sources have not been crawled yet. Browse another country in the meantime."
        />

        <FaqSection items={faqs} headingId="country-faq" className="mt-20" />
      </Container>
    </>
  );
}

/**
 * One level of government, as a way in rather than a statistic.
 *
 * A count with nowhere to go tells someone there are 23 federal grants and
 * leaves them to find them; each of these links straight to that filtered
 * list. Zero is rendered rather than hidden — "no private funding recorded"
 * is itself an answer, and a missing row would just read as an oversight.
 */
function FundingLevel({
  label,
  description,
  count,
  href,
}: {
  readonly label: string;
  readonly description: string;
  readonly count: number;
  readonly href: string;
}) {
  const content = (
    <>
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span className="mt-1 block font-mono text-2xl font-semibold tabular-nums">
        {count.toLocaleString("en-US")}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
        {description}
      </span>
    </>
  );

  if (count === 0) {
    return (
      <li className="rounded-card border border-border p-4 opacity-60">
        <span className="block">{content}</span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className="block rounded-card border border-border p-4 transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {content}
      </Link>
    </li>
  );
}
