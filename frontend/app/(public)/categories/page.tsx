import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DirectoryCard } from "@/components/shared/directory-card";
import { routes } from "@/config/routes";
import { listCategories } from "@/features/shared/services/reference-service";

export const metadata: Metadata = {
  title: "Grants by category",
  description:
    "Browse research grants by field — healthcare, technology, energy, manufacturing, artificial intelligence and more.",
  alternates: { canonical: routes.categories },
};

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <>
      <PageHeader
        title="Grants by Category"
        description="Grants are classified by field. A grant can sit in several categories, so a project spanning two disciplines appears under both."
      />

      <Container className="pb-24">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.slug} className="flex">
              <DirectoryCard
                className="w-full"
                href={routes.category(category.slug)}
                title={category.name}
                description={category.description}
                count={category.grantCount}
                countLabel={category.grantCount === 1 ? "grant" : "grants"}
              />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
