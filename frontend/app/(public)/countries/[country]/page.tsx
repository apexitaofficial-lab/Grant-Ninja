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
import { toSearchParams } from "@/features/grants/services/grant-filter-params";
import { listGrants, parsePagination, parseSort } from "@/features/grants/services/grant-service";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqSchema,
} from "@/features/seo/lib/json-ld";
import { getEntityFaqs } from "@/features/shared/services/faq-service";
import { getCountry, listStates } from "@/features/shared/services/reference-service";
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

  const [result, states, faqs] = await Promise.all([
    listGrants({ page, pageSize, sort, countrySlug: country.slug }),
    listStates(country.slug),
    getEntityFaqs("country", country.id),
  ]);

  const identity = await getSiteIdentity();

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

        {/* Only shown when the country actually has regions — an empty
            "browse by state" section is a dead end (open question Q2). */}
        {states.length > 0 && (
          <section aria-labelledby="states" className="mb-12">
            <h2
              id="states"
              className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
            >
              Browse by state
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {states.map((state) => (
                <li key={state.slug}>
                  <Button asChild variant="outline" size="sm">
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
