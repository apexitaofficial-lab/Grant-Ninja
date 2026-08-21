import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
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
import { getCategory } from "@/features/shared/services/reference-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

interface CategoryPageProps {
  readonly params: Promise<{ slug: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (category === null) {
    return { title: "Category not found", robots: { index: false, follow: true } };
  }

  return {
    title: `${category.name} grants`,
    description:
      category.description ??
      `Research grants in ${category.name} from government agencies and research councils.`,
    alternates: { canonical: routes.category(category.slug) },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (category === null) {
    notFound();
  }

  const query = await searchParams;
  // Scoped pages show what a body funds, including grants that have closed.
  const sort = parseSort(single(query["sort"]), "newest");
  const { page, pageSize } = parsePagination(single(query["page"]));

  const [result, faqs] = await Promise.all([
    listGrants({ page, pageSize, sort, categorySlugs: [category.slug] }),
    getEntityFaqs("category", category.id),
  ]);

  const identity = await getSiteIdentity();

  return (
    <>
      <JsonLd
        schemas={[
          buildCollectionPageSchema(
            {
              name: `${category.name} grants`,
              description: category.description,
              path: routes.category(category.slug),
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
              { name: "Categories", path: routes.categories },
              { name: category.name, path: routes.category(category.slug) },
            ],
            identity.url,
          ),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title={`${category.name} grants`}
        description={category.description ?? undefined}
        breadcrumb={
          <EntityBreadcrumb
            trail={[{ label: "Categories", href: routes.categories }, { label: category.name }]}
          />
        }
      />

      <Container className="pb-24">
        <GrantResultList
          result={result}
          sort={sort}
          basePath={routes.category(category.slug)}
          currentQuery={toSearchParams(query).toString()}
          emptyTitle={`No published grants in ${category.name} yet`}
          emptyDescription="This category exists but nothing has been published into it. Browse another category, or tell us what you are looking for."
        />

        <FaqSection items={faqs} headingId="category-faq" className="mt-20" />
      </Container>
    </>
  );
}
