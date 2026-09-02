import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { DirectoryCard } from "@/components/shared/directory-card";
import { routes } from "@/config/routes";
import { listCountries } from "@/features/shared/services/reference-service";

export const metadata: Metadata = {
  title: "Grants by Country",
  description:
    "Browse research grants by country. Grant Ninja tracks funding from government agencies and research councils worldwide.",
  alternates: { canonical: routes.countries },
};

export default async function CountriesPage() {
  const countries = await listCountries();

  return (
    <>
      <PageHeader
        title="Grants by Country"
        description={
          <>
            {/*
              Two statements, two lines. The second answers "why isn't my
              country here?", which is a different question from the one the
              first sentence answers — running it on from the middle of the
              line above buried it.

              "brought into the crawler" named our own machinery. Someone
              checking whether their country is covered does not know what a
              crawler is and does not need to; what they want to know is that
              coverage follows the official sources.
            */}
            <span className="block">
              Every country in the database, with the number of published grants behind each.
            </span>
            <span className="block">
              Countries are added as their official government grant sources are integrated into the
              database.
            </span>
          </>
        }
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
