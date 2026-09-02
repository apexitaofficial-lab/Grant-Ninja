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
              <SectionHeading id="how-it-works">How the Database Is Built</SectionHeading>
              <div className="mt-4 flex flex-col gap-4 leading-relaxed">
                {/*
                  Written for someone deciding whether to trust the data, not
                  for someone who knows how it is produced. "Extracted",
                  "structured record" and "review queue" are the pipeline's own
                  words — accurate, and describing machinery to a reader who
                  asked about reliability.

                  "Organised" rather than "organized": the site's prose is
                  British throughout ("programmes", "organisation",
                  "penalised"), and one American spelling in the middle of it
                  reads as a paste from somewhere else.
                */}
                <p>
                  Automated systems monitor official agency websites and grant portals. When a page
                  changes, the updated information is collected, checked, and organised into a clear
                  grant record, including what the funding is for, who can apply, how much is
                  available, and when applications close.
                </p>
                <p>
                  If the system is not confident that the information is accurate, the grant does
                  not go live immediately. Instead, it is sent for human review before being
                  published. This may take longer than publishing everything automatically, but it
                  helps ensure the database provides information you can trust.
                </p>
                <p>
                  Every grant page links back to the official agency notice it came from and shows
                  when the information was last checked. If the information on Grant Ninja ever
                  differs from the agency notice, the agency&rsquo;s information takes priority, and
                  we want to know about it.
                </p>
              </div>
            </section>

            <section aria-labelledby="what-we-do-not" className="mt-12">
              <SectionHeading id="what-we-do-not">What This Is Not</SectionHeading>
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
              <SectionHeading id="principles">How We Work</SectionHeading>
              <dl className="mt-4 flex flex-col gap-5 text-sm">
                <Principle term="Sources Are Named">
                  Every record links to the official notice behind it.
                </Principle>
                <Principle term="Dates Are Shown">
                  Published, updated, and last verified dates are shown on every grant.
                </Principle>
                <Principle term="Gaps Stay Visible">
                  If an amount is not available, it is shown as &ldquo;Not Announced&rdquo; rather
                  than being estimated or guessed.
                </Principle>
              </dl>
            </section>

            <div className="rounded-card border border-border bg-muted/40 p-6">
              <p className="font-semibold">Already Secured Funding?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We provide funding against approved grants and R&amp;D tax credits, helping work get
                started before the funding is received.
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
