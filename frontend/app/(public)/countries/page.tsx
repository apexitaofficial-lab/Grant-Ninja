import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DirectoryCard } from "@/components/shared/directory-card";
import { routes } from "@/config/routes";
import { listCountries } from "@/features/shared/services/reference-service";

export const metadata: Metadata = {
  title: "Grants by country",
  description:
    "Browse research grants by country. Grant Ninja tracks funding from government agencies and research councils worldwide.",
  alternates: { canonical: routes.countries },
};

export default async function CountriesPage() {
  const countries = await listCountries();

  return (
    <>
      <PageHeader
        title="Grants by country"
        description="Every country in the database, with the number of published grants behind each. Countries are added as their government sources are brought into the crawler."
      />

      <Container className="pb-24">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <li key={country.slug} className="flex">
              <DirectoryCard
                className="w-full"
                href={routes.country(country.slug)}
                eyebrow={country.isoCode}
                title={country.name}
                description={country.description}
                count={country.grantCount}
                countLabel={country.grantCount === 1 ? "grant" : "grants"}
              />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
