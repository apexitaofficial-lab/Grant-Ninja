import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
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
import {
  getOrganization,
  ORGANIZATION_TYPE_LABELS,
} from "@/features/shared/services/reference-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

interface AgencyPageProps {
  readonly params: Promise<{ slug: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: AgencyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getOrganization(slug);

  if (agency === null) {
    return { title: "Agency not found", robots: { index: false, follow: true } };
  }

  return {
    title: `${agency.name} grants`,
    description:
      agency.description ?? `Research grants issued by ${agency.name} in ${agency.countryName}.`,
    alternates: { canonical: routes.agency(agency.slug) },
  };
}

export default async function AgencyPage({ params, searchParams }: AgencyPageProps) {
  const { slug } = await params;
  const agency = await getOrganization(slug);

  if (agency === null) {
    notFound();
  }

  const query = await searchParams;
  // Scoped pages show what a body funds, including grants that have closed.
  const sort = parseSort(single(query["sort"]), "newest");
  const { page, pageSize } = parsePagination(single(query["page"]));

  const [result, faqs] = await Promise.all([
    listGrants({ page, pageSize, sort, organizationSlug: agency.slug }),
    getEntityFaqs("organization", agency.id),
  ]);

  const identity = await getSiteIdentity();

  return (
    <>
      <JsonLd
        schemas={[
          buildCollectionPageSchema(
            {
              name: `${agency.name} grants`,
              description: agency.description,
              path: routes.agency(agency.slug),
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
              { name: "Agencies", path: routes.agencies },
              { name: agency.name, path: routes.agency(agency.slug) },
            ],
            identity.url,
          ),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title={agency.name}
        description={agency.description ?? undefined}
        breadcrumb={
          <EntityBreadcrumb
            trail={[{ label: "Agencies", href: routes.agencies }, { label: agency.name }]}
          />
        }
        actions={
          agency.website !== null && (
            <Button asChild variant="outline">
              <a href={agency.website} rel="noopener noreferrer" target="_blank">
                Official website
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          )
        }
      />

      <Container className="pb-24">
        <StatRow
          className="mb-10"
          stats={[
            { label: "Published grants", value: agency.grantCount },
            {
              label: "Type",
              value: ORGANIZATION_TYPE_LABELS[agency.organizationType],
              isText: true,
            },
            { label: "Country", value: agency.countryName, isText: true },
          ]}
        />

        <GrantResultList
          result={result}
          sort={sort}
          basePath={routes.agency(agency.slug)}
          currentQuery={toSearchParams(query).toString()}
          emptyTitle={`No published grants from ${agency.name} yet`}
          emptyDescription="This agency is tracked but nothing has been published from it. Browse other agencies in the meantime."
        />

        <FaqSection items={faqs} headingId="agency-faq" className="mt-20" />
      </Container>
    </>
  );
}
