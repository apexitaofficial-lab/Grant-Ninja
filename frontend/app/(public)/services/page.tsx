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
import { FUNDING_CONTACT_CTA_LABEL } from "@/config/site";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/features/seo/lib/json-ld";
import { getStaticPageFaqs } from "@/features/shared/services/faq-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

export const metadata: Metadata = {
  // Short in the tab and in search results; the page's own H1 carries the
  // full line, which is too long to sit in front of "| Grant Ninja".
  title: "Our Services",
  description:
    "Grant discovery, proposal writing, R&D tax credit submissions, and advance funding against awards you have already secured.",
  alternates: { canonical: routes.services },
};

/**
 * The services page.
 *
 * Content supplied by the business and used as written. The route is unchanged
 * on purpose: `/services` is linked from the funding CTA in four places, from
 * the footer, and from every grant page's service card, and it is in the
 * sitemap. Publishing this at a new address would leave all of that pointing
 * at the old page.
 *
 * American spellings ("organization", "specialized") are kept rather than
 * converted to the British forms used elsewhere on the site. The audience and
 * the terminology are American — "Non-Profit Organizations" and "501(c)(3)"
 * are US legal terms, and anglicising them would make them wrong rather than
 * consistent.
 */

interface Service {
  readonly name: string;
  readonly lead: readonly string[];
  /** Introduces the list, where the copy has a line before it. */
  readonly listIntro?: string;
  readonly points: readonly { readonly term: string; readonly detail: string }[];
}

const SERVICES: readonly Service[] = [
  {
    name: "Grant Discovery & Intelligence",
    lead: [
      "Stop manually searching through disparate agency websites. We provide access to the world’s most extensive, real-time database of research and development grants from official government and private sources.",
    ],
    points: [
      {
        term: "AI-Powered Matching",
        detail:
          "We align your organization’s profile and project scope with the highest-probability grant opportunities.",
      },
      {
        term: "Real-Time Opportunity Alerts",
        detail:
          "Stay ahead of the curve with instant notifications when new funding is announced in your sector.",
      },
      {
        term: "Comprehensive Database",
        detail:
          "Covering healthcare, technology, AI, manufacturing, energy, agriculture, education, and small business (SBIR/STTR).",
      },
      {
        term: "Deadline & Eligibility Tracking",
        detail:
          "We verify every grant’s status, publication date, and eligibility requirements directly from the source.",
      },
    ],
  },
  {
    name: "Comprehensive Grant Proposal Writing",
    lead: [
      "You have the vision; we have the narrative expertise to get it funded.",
      "We handle the entire lifecycle of the grant application—research, narrative development, budget justification, attachments, and formatting. Our expert grant writers know exactly what reviewers and agencies are looking for, translating your project’s impact into a compelling, compliant, and highly competitive proposal.",
    ],
    listIntro: "We craft specialized proposals for:",
    points: [
      {
        term: "Profit Organizations",
        detail:
          "Startups, SMEs, and enterprise R&D departments seeking non-dilutive commercialization funding.",
      },
      {
        term: "Non-Profit Organizations",
        detail:
          "501(c)(3) entities pursuing federal, state, local, or foundation support for operational and program expansion.",
      },
      {
        term: "Educational Institutions",
        detail:
          "Schools, universities, and academic researchers requiring STEM, curriculum, and applied research funding.",
      },
      {
        term: "Community Organizations & Individuals",
        detail:
          "Grassroots initiatives, community development projects, and individual innovators.",
      },
    ],
  },
  {
    name: "Regulatory Submission Management (R&D Tax Credits)",
    lead: [
      "Innovation isn’t just funded through grants; it is rewarded through the tax code. However, navigating the bureaucratic maze of government tax incentives requires specialized precision.",
      "We provide complete regulatory submission management, specifically assisting clients in preparing, documenting, and filing applications for Research and Development (R&D) tax credits with governmental regulatory bodies.",
    ],
    points: [
      {
        term: "Qualification Analysis",
        detail:
          "We identify qualifying R&D expenditures (wages, supplies, contract research) that you may be overlooking.",
      },
      {
        term: "Documentation & Compliance",
        detail:
          "We meticulously prepare the technical narratives and financial exhibits required by regulatory bodies to substantiate your claim.",
      },
      {
        term: "Filing & Audit Defense Readiness",
        detail:
          "We ensure your application is structurally sound, legally compliant, and seamlessly filed, minimizing risk and maximizing your statutory return.",
      },
    ],
  },
  {
    name: "Advance Capital & Bridge Financing",
    lead: [
      "Both grants and R&D tax credits are often paid retrospectively—meaning you must spend your own capital to fund projects before the government reimburses you.",
      "We eliminate this cash-flow bottleneck. If you have already secured an award, we finance it.",
    ],
    points: [
      {
        term: "Grant Advances",
        detail:
          "We provide immediate capital against approved, yet-to-be-disbursed government and foundation grants.",
      },
      {
        term: "R&D Tax Credit Financing",
        detail:
          "We advance funds against your filed R&D tax credits so your innovation doesn’t stall while you wait for the treasury to cut a check.",
      },
      {
        term: "Seamless Transition",
        detail:
          "Move straight from application approval to project execution without waiting months for institutional bureaucracy to release your funds.",
      },
    ],
  },
];

export default async function ServicesPage() {
  const [identity, faqs] = await Promise.all([getSiteIdentity(), getStaticPageFaqs("service")]);

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: "Our Services", path: routes.services },
            ],
            identity.url,
          ),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title="Our Services: End-to-End Funding &amp; Innovation Support"
        description="Securing capital for innovation, research, and community impact shouldn&rsquo;t be a fragmented process. From identifying the perfect funding opportunity and crafting a winning proposal to filing complex R&amp;D tax credits and financing your approved awards, we provide a complete ecosystem of funding services."
        breadcrumb={<EntityBreadcrumb trail={[{ label: "Our Services" }]} />}
      />

      <Container className="pb-24">
        <p className="max-w-3xl leading-relaxed text-pretty text-muted-foreground">
          Whether you are a profit-driven enterprise, a non-profit organization, an educational
          institution, or an individual innovator, we handle the intricacies of capital acquisition
          so you can focus on execution.
        </p>

        {/*
          Numbered, as the source copy is. The numbering is not a sequence you
          work through — these are four separate services — so it is a label
          rather than an ordered list, set in the mono face the rest of the site
          uses for figures.
        */}
        <div className="mt-16 flex flex-col gap-20">
          {SERVICES.map((service, index) => (
            <section key={service.name} aria-labelledby={slugify(service.name)}>
              <div className="flex items-baseline gap-4 border-b border-border pb-3">
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2
                  id={slugify(service.name)}
                  className="text-xl font-semibold tracking-tight text-balance md:text-2xl"
                >
                  {service.name}
                </h2>
              </div>

              <div className="mt-4 max-w-3xl">
                {service.lead.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="mt-3 leading-relaxed text-pretty">
                    {paragraph}
                  </p>
                ))}

                {service.listIntro !== undefined && (
                  <p className="mt-5 font-medium">{service.listIntro}</p>
                )}

                <dl className="mt-5 flex flex-col gap-4">
                  {service.points.map((point) => (
                    <div key={point.term} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-muted-foreground"
                      />
                      <div>
                        <dt className="inline font-semibold">{point.term}:</dt>{" "}
                        <dd className="inline leading-relaxed text-muted-foreground">
                          {point.detail}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          ))}
        </div>

        {/* Centred to match the closing callout on the home page. */}
        <section aria-labelledby="cta" className="mt-20">
          <div className="rounded-card border border-border bg-muted/40 p-8 text-center md:p-12">
            <h2
              id="cta"
              className="mx-auto max-w-3xl text-2xl font-bold tracking-tight text-balance"
            >
              Already Been Awarded Something?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Tell us which programme and when it pays out, and we will tell you what can be brought
              forward.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={routes.contact}>
                  {FUNDING_CONTACT_CTA_LABEL}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={routes.grants}>Browse Grants First</Link>
              </Button>
            </div>
          </div>
        </section>

        <FaqSection items={faqs} headingId="services-faq" className="mt-20" />
      </Container>
    </>
  );
}

/** Stable heading ids, so `aria-labelledby` resolves without a hand-kept list. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
