import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DirectoryCard } from "@/components/shared/directory-card";
import { routes } from "@/config/routes";
import {
  listOrganizations,
  ORGANIZATION_TYPE_LABELS,
} from "@/features/shared/services/reference-service";

export const metadata: Metadata = {
  title: "Grant-making agencies",
  description:
    "Government departments, research councils and foundations that issue the grants tracked by Grant Ninja.",
  alternates: { canonical: routes.agencies },
};

export default async function AgenciesPage() {
  const organizations = await listOrganizations();

  return (
    <>
      <PageHeader
        title="Grant-making agencies"
        description="The government departments, research councils and foundations behind the grants in the database. Every grant links back to the agency that issued it."
      />

      <Container className="pb-24">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((organization) => (
            <li key={organization.slug} className="flex">
              <DirectoryCard
                className="w-full"
                href={routes.agency(organization.slug)}
                eyebrow={ORGANIZATION_TYPE_LABELS[organization.organizationType]}
                title={organization.name}
                description={organization.description}
                count={organization.grantCount}
                countLabel={organization.grantCount === 1 ? "grant" : "grants"}
              />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
