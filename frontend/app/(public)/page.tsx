import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { DirectoryCard } from "@/components/shared/directory-card";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { StatRow } from "@/components/shared/stat-row";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { FUNDING_CONTACT_CTA_LABEL, FUNDING_CTA_LABEL, siteConfig } from "@/config/site";
import { GrantCard } from "@/features/grants/components/grant-card";
import { GrantSearchField } from "@/features/grants/components/grant-search-field";
import { listGrants } from "@/features/grants/services/grant-service";
import { buildFaqSchema, buildHomePageSchema } from "@/features/seo/lib/json-ld";
import { getStaticPageFaqs } from "@/features/shared/services/faq-service";
import {
  getStatistics,
  listCategoriesWithGrants,
  listCountriesWithGrants,
} from "@/features/shared/services/reference-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

export const metadata: Metadata = {
  alternates: { canonical: routes.home },
};

export default async function HomePage() {
  const [statistics, closingSoon, countries, categories, faqs, identity] = await Promise.all([
    getStatistics(),
    listGrants({ page: 1, pageSize: 4, sort: "closing_soon" }),
    listCountriesWithGrants(),
    listCategoriesWithGrants(),
    getStaticPageFaqs("home"),
    getSiteIdentity(),
  ]);

  return (
    <>
      {/*
        WebPage and the FAQ block. Organization and WebSite are emitted site-wide
        in the root layout and referenced here by @id, so the home page adds no
        second definition of either.

        No BreadcrumbList: a trail with one entry describes nothing, and Google
        ignores single-item breadcrumbs.
      */}
      <JsonLd
        schemas={[
          buildHomePageSchema(identity, { hasFaq: faqs.length > 0 }),
          buildFaqSchema(faqs, `${identity.url}#faq`),
        ]}
      />

      {/*
        The hero leads with search rather than a headline and a picture.
        The one thing a visitor came to do is find a grant, so the search
        field is the first interactive thing on the page.
      */}
      <Container as="section" className="pt-16 pb-14 md:pt-24 md:pb-20">
        {/*
          One block, one left edge, one right edge.

          These four elements previously carried three different widths — the
          heading `max-w-3xl`, the lede and the search field `max-w-2xl`, the
          buttons none — and the search field was a sibling of the heading
          rather than part of it. At 1440px that ended them at 872, 776 and
          1320, so the section read as three separate areas with 448px of dead
          space beside the heading while the stat row below ran the full width.

          The width is bounded by the lede, not the heading: the heading wraps
          to two lines at every width up to the container, while the lede is
          1314px on one line against the rendered font. `max-w-5xl` is the
          widest that still breaks it into two lines with a substantial second
          line rather than an orphan, and it leaves a trailing margin that
          reads as deliberate next to the full-width stat row beneath.
        */}
        <div className="max-w-5xl">
          <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">
            {siteConfig.tagline}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">
            {siteConfig.description}
          </p>

          {/*
            Full width of the block, so it shares both edges with the text
            above it rather than stopping short of them.

            `destination` is what makes this field go somewhere. There are no
            results on this page for it to filter, so without it a search wrote
            `?q=` to `/` — a URL the home page does not read — and pressing
            Enter appeared to do nothing at all.
          */}
          <GrantSearchField initialValue="" destination={routes.grants} className="mt-8" />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={routes.grants}>Browse All Grants</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={routes.services}>{FUNDING_CTA_LABEL}</Link>
            </Button>
          </div>
        </div>
      </Container>

      <Container as="section" aria-label="Database size" className="pb-16">
        <StatRow
          stats={[
            { label: "Published grants", value: statistics.grants },
            { label: "Countries", value: statistics.countries },
            { label: "Agencies", value: statistics.organizations },
            { label: "Categories", value: statistics.categories },
          ]}
        />
      </Container>

      {closingSoon.items.length > 0 && (
        <Container as="section" aria-labelledby="closing-soon" className="pb-20">
          <SectionHeading id="closing-soon" href={routes.grants} linkLabel="View All Grants">
            Closing soonest
          </SectionHeading>
          <ul className="mt-6 flex flex-col gap-4">
            {closingSoon.items.map((grant) => (
              <li key={grant.id}>
                <GrantCard grant={grant} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      {categories.length > 0 && (
        <Container as="section" aria-labelledby="by-category" className="pb-20">
          <SectionHeading id="by-category" href={routes.categories} linkLabel="View All Categories">
            Browse by category
          </SectionHeading>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      )}

      {countries.length > 0 && (
        <Container as="section" aria-labelledby="by-country" className="pb-20">
          <SectionHeading id="by-country" href={routes.countries} linkLabel="View All Countries">
            Browse by country
          </SectionHeading>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      )}

      <Container as="section" aria-labelledby="funding" className="pb-20">
        {/*
          Centred, unlike the rest of the page.

          The heading previously ran the full width of the card while the
          paragraph was capped at `max-w-2xl`, so the text stopped some 450px
          short of the border and dumped all the slack on one side. Centring
          spends that space as equal margins instead, and it suits this block
          in a way it would not suit the listings: this is a single callout
          interrupting the directory, not a column of scannable records, so
          there is no left edge for the eye to run down.
        */}
        <div className="rounded-card border border-border bg-muted/40 p-8 text-center md:p-12">
          <h2
            id="funding"
            className="mx-auto max-w-3xl text-2xl font-bold tracking-tight text-balance md:text-3xl"
          >
            A Grant Approval Is Not the Same as Money in the Bank
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-pretty text-muted-foreground">
            Government grants pay in arrears, often months after the work starts. Grant Ninja
            advances funding against approved grants and R&amp;D tax credits, so a project can begin
            on schedule rather than when the first disbursement clears.
          </p>
          {/* Directly under the copy and on the same axis, so the block reads
              as one centred column rather than centred text with left-hung
              controls. */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={routes.services}>{FUNDING_CTA_LABEL}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={routes.contact}>{FUNDING_CONTACT_CTA_LABEL}</Link>
            </Button>
          </div>
        </div>
      </Container>

      {faqs.length > 0 && (
        <Container as="section" className="pb-24">
          <FaqSection items={faqs} headingId="home-faq" />
        </Container>
      )}
    </>
  );
}

function SectionHeading({
  id,
  children,
  href,
  linkLabel,
}: {
  readonly id: string;
  readonly children: string;
  readonly href: string;
  readonly linkLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <h2 id={id} className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {children}
      </h2>
      <Link
        href={href}
        className="flex items-center gap-1 rounded-sm font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {linkLabel}
        <ArrowRight className="size-3" aria-hidden="true" />
      </Link>
    </div>
  );
}
