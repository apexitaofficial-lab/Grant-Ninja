import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { StatRow } from "@/components/shared/stat-row";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { FUNDING_CTA_LABEL } from "@/config/site";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/features/seo/lib/json-ld";
import { getStaticPageFaqs } from "@/features/shared/services/faq-service";
import { getStatistics } from "@/features/shared/services/reference-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

export const metadata: Metadata = {
  title: "About",
  description:
    "Grant Ninja is a searchable database of research grants from official government sources, built by a team that also finances them.",
  alternates: { canonical: routes.about },
};

/**
 * Deliberately free of the things an about page usually invents: no founding
 * year, no team size, no customer count. Those are facts about the business
 * that belong to the business, and a placeholder would be a lie in production.
 * What is here describes how the platform works, which is verifiable.
 */
export default async function AboutPage() {
  const [identity, statistics, faqs] = await Promise.all([
    getSiteIdentity(),
    getStatistics(),
    getStaticPageFaqs("about"),
  ]);

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: "About", path: routes.about },
            ],
            identity.url,
          ),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title="Grant Funding Is Public Information That Is Hard to Find"
        description="Thousands of research grants are published every year across hundreds of government sites, in formats built for compliance rather than for reading. Grant Ninja collects them into one place and keeps them current."
        breadcrumb={<EntityBreadcrumb trail={[{ label: "About" }]} />}
      />

      <Container className="pb-24">
        <StatRow
          stats={[
            { label: "Published grants", value: statistics.grants },
            { label: "Agencies tracked", value: statistics.organizations },
            { label: "Countries", value: statistics.countries },
            { label: "Categories", value: statistics.categories },
          ]}
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <div className="max-w-2xl min-w-0">
            <section aria-labelledby="how-it-works">
              <SectionHeading id="how-it-works">How the database is built</SectionHeading>
              <div className="mt-4 flex flex-col gap-4 leading-relaxed">
                <p>
                  Automated crawlers monitor official agency websites and grant portals. When a page
                  changes, the new content is extracted, checked, and turned into a structured
                  record: what the funding is, who can apply, how much is available, and when it
                  closes.
                </p>
                <p>
                  Records that the system is not confident about do not go live. They go to a review
                  queue and a person decides. That is slower than publishing everything, and it is
                  the reason the database is worth reading.
                </p>
                <p>
                  Every grant page links back to the agency notice it came from and shows when it
                  was last checked. If the two ever disagree, the agency is right — and we want to
                  know about it.
                </p>
              </div>
            </section>

            <section aria-labelledby="what-we-do-not" className="mt-12">
              <SectionHeading id="what-we-do-not">What this is not</SectionHeading>
              <div className="mt-4 flex flex-col gap-4 leading-relaxed">
                <p>
                  Grant Ninja does not write applications and does not decide who gets funded. The
                  agency does both. What we can tell you is what exists, whether you are eligible,
                  and how long you have.
                </p>
                <p>
                  We also finance grants that have already been awarded. That is a separate service
                  and it has no bearing on what appears in the database — a grant is listed because
                  it is real and current, not because there is anything in it for us.
                </p>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            <section aria-labelledby="principles">
              <SectionHeading id="principles">How we work</SectionHeading>
              <dl className="mt-4 flex flex-col gap-5 text-sm">
                <Principle term="Sources are named">
                  Every record links to the official notice behind it.
                </Principle>
                <Principle term="Dates are shown">
                  Published, updated and last verified, on every grant.
                </Principle>
                <Principle term="Gaps stay visible">
                  A missing amount reads &ldquo;Not Announced&rdquo; rather than being guessed at.
                </Principle>
              </dl>
            </section>

            <div className="rounded-card border border-border bg-muted/40 p-6">
              <p className="font-semibold">Already secured funding?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We advance against approved grants and R&amp;D tax credits so work can start before
                the money lands.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href={routes.services}>{FUNDING_CTA_LABEL}</Link>
              </Button>
            </div>
          </aside>
        </div>

        <FaqSection items={faqs} headingId="about-faq" className="mt-20" />
      </Container>
    </>
  );
}

function SectionHeading({ id, children }: { readonly id: string; readonly children: string }) {
  return (
    <h2
      id={id}
      className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
    >
      {children}
    </h2>
  );
}

function Principle({
  term,
  children,
}: {
  readonly term: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-1 leading-relaxed text-muted-foreground">{children}</dd>
    </div>
  );
}
