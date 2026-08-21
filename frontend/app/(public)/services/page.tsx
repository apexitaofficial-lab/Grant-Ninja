import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/features/seo/lib/json-ld";
import { getStaticPageFaqs } from "@/features/shared/services/faq-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

export const metadata: Metadata = {
  title: "Funding services",
  description:
    "Grant Ninja advances funding against approved government grants and R&D tax credits, so work can start before the money arrives.",
  alternates: { canonical: routes.services },
};

/**
 * The lead-generation page.
 *
 * Written around the problem rather than the product: a grant that pays in
 * arrears is a cash-flow problem, and naming that plainly does more than a
 * list of benefits would. No invented figures, rates or client counts — the
 * commercial details are not ours to make up.
 */

const SERVICES = [
  {
    name: "Grant advance",
    problem: "You have been awarded a grant that pays in stages, or in arrears.",
    detail:
      "We advance against the approved award so the project can start on schedule. The grant still pays out to you on the agency's own timetable.",
  },
  {
    name: "R&D tax credit advance",
    problem: "Your claim is prepared but the refund is months away.",
    detail:
      "We advance against the expected credit rather than waiting for the tax authority to process it, which turns a year-end refund into working capital now.",
  },
  {
    name: "Grant discovery",
    problem: "You suspect there is funding for your work but cannot find it.",
    detail:
      "The database here is free to search. If you would rather have someone look, we will tell you which programmes actually fit and which are a waste of your time.",
  },
] as const;

const STEPS = [
  {
    title: "Tell us what you have been awarded",
    detail: "The programme, the amount, and when the agency expects to pay.",
  },
  {
    title: "We confirm what can be advanced",
    detail:
      "Against the award itself, so the assessment is about the grant, not your balance sheet.",
  },
  {
    title: "Funds are released",
    detail: "You start the work on schedule. The agency pays out as normal.",
  },
] as const;

export default async function ServicesPage() {
  const [identity, faqs] = await Promise.all([getSiteIdentity(), getStaticPageFaqs("service")]);

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: "Services", path: routes.services },
            ],
            identity.url,
          ),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title="An approved grant is not money in the bank"
        description="Government funding pays late, and usually in stages. Grant Ninja advances against grants and R&D tax credits you have already secured, so the work can start when you planned it."
        breadcrumb={<EntityBreadcrumb trail={[{ label: "Services" }]} />}
        actions={
          <Button asChild size="lg">
            <Link href={routes.contact}>Talk to our team</Link>
          </Button>
        }
      />

      <Container className="pb-24">
        <section aria-labelledby="services">
          <SectionHeading id="services">What we do</SectionHeading>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <article
                key={service.name}
                className="flex flex-col rounded-card border border-border bg-card p-6"
              >
                <h3 className="font-semibold tracking-tight">{service.name}</h3>
                <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  {service.problem}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{service.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="how" className="mt-16">
          <SectionHeading id="how">How it works</SectionHeading>
          {/*
            Numbered because this genuinely is a sequence — each step depends
            on the one before it, and the order is information the reader needs.
          */}
          <ol className="mt-6 divide-y divide-border border-y border-border">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-6 py-6">
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="why" className="mt-16">
          <SectionHeading id="why">Why it is worth doing</SectionHeading>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            <Point title="It is not equity">
              An advance against a grant is not an investment round. Nobody takes a share of the
              company for it.
            </Point>
            <Point title="The award does the work">
              The assessment is about the grant you have been given, not about years of trading
              history.
            </Point>
            <Point title="The timetable stops mattering">
              Hiring and equipment stop waiting on an agency&rsquo;s payment schedule.
            </Point>
          </div>
        </section>

        <section aria-labelledby="cta" className="mt-16">
          <div className="rounded-card border border-border bg-muted/40 p-8 md:p-12">
            <h2 id="cta" className="text-2xl font-bold tracking-tight text-balance">
              Already been awarded something?
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Tell us which programme and when it pays out, and we will tell you what can be brought
              forward.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={routes.contact}>
                  Talk to our team
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={routes.grants}>Browse grants first</Link>
              </Button>
            </div>
          </div>
        </section>

        <FaqSection items={faqs} headingId="services-faq" className="mt-20" />
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

function Point({ title, children }: { readonly title: string; readonly children: string }) {
  return (
    <div>
      <h3 className="font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
