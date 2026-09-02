import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";
import { JsonLd } from "@/components/shared/json-ld";
import { StatRow } from "@/components/shared/stat-row";
import { routes } from "@/config/routes";
import { GrantResultList } from "@/features/grants/components/grant-result-list";
import { toSearchParams } from "@/features/grants/services/grant-filter-params";
import { listGrants, parsePagination, parseSort } from "@/features/grants/services/grant-service";
import { buildBreadcrumbSchema, buildCollectionPageSchema } from "@/features/seo/lib/json-ld";
import { getCountry, getState } from "@/features/shared/services/reference-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

interface StatePageProps {
  readonly params: Promise<{ country: string; state: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { country: countrySlug, state: stateSlug } = await params;
  const [country, state] = await Promise.all([
    getCountry(countrySlug),
    getState(countrySlug, stateSlug),
  ]);

  if (country === null || state === null) {
    return { title: "State not found", robots: { index: false, follow: true } };
  }

  return {
    title: `Research grants in ${state.name}`,
    description: `Research grants available in ${state.name}, ${country.name}, from official government sources.`,
    alternates: { canonical: routes.state(country.slug, state.slug) },
  };
}

export default async function StatePage({ params, searchParams }: StatePageProps) {
  const { country: countrySlug, state: stateSlug } = await params;

  const [country, state] = await Promise.all([
    getCountry(countrySlug),
    getState(countrySlug, stateSlug),
  ]);

  // A state slug is only meaningful inside its country, so a mismatched pair
  // is a 404 rather than a redirect to the country page.
  if (country === null || state === null) {
    notFound();
  }

  const query = await searchParams;
  const sort = parseSort(single(query["sort"]), "newest");
  const { page, pageSize } = parsePagination(single(query["page"]));

  const [result, identity] = await Promise.all([
    listGrants({ page, pageSize, sort, countrySlug: country.slug, stateSlug: state.slug }),
    getSiteIdentity(),
  ]);

  return (
    <>
      <JsonLd
        schemas={[
          buildCollectionPageSchema(
            {
              name: `Research grants in ${state.name}`,
              description: null,
              path: routes.state(country.slug, state.slug),
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
              { name: state.name, path: routes.state(country.slug, state.slug) },
            ],
            identity.url,
          ),
        ]}
      />

      <PageHeader
        title={`Research Grants in ${state.name}`}
        description={`Funding available to organisations based in ${state.name}. National ${country.name} programmes are listed on the country page.`}
        breadcrumb={
          <EntityBreadcrumb
            trail={[
              { label: "Countries", href: routes.countries },
              { label: country.name, href: routes.country(country.slug) },
              { label: state.name },
            ]}
          />
        }
      />

      <Container className="pb-24">
        <StatRow
          className="mb-10"
          stats={[
            { label: "Published grants", value: state.grantCount },
            { label: "Country", value: country.name, isText: true },
            ...(state.code === null
              ? []
              : [{ label: "Code", value: state.code, isText: true as const }]),
          ]}
        />

        <GrantResultList
          result={result}
          sort={sort}
          basePath={routes.state(country.slug, state.slug)}
          currentQuery={toSearchParams(query).toString()}
          emptyTitle={`No state-level grants in ${state.name} yet`}
          emptyDescription={`Grants scoped to this state have not been published yet. National ${country.name} programmes are open to applicants here and are listed on the country page.`}
        />
      </Container>
    </>
  );
}
