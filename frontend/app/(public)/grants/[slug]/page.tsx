import { ArrowUpRight, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { FUNDING_CTA_LABEL } from "@/config/site";
import { DeadlineMeter } from "@/features/grants/components/deadline-meter";
import { GrantCard } from "@/features/grants/components/grant-card";
import { GrantFactRow } from "@/features/grants/components/grant-fact-row";
import {
  getGrantBySlug,
  getPrimaryCategory,
  getRelatedGrants,
} from "@/features/grants/services/grant-service";
import { resolveDeadline } from "@/features/grants/utils/deadline";
import { toEligibilityPoints } from "@/features/grants/utils/eligibility";
import {
  buildFaqSchema,
  buildGrantArticleSchema,
  buildGrantBreadcrumbSchema,
  buildGrantDatasetSchema,
  buildGrantSchema,
  buildGrantWebPageSchema,
} from "@/features/seo/lib/json-ld";
import { getSiteIdentity } from "@/features/shared/services/settings-service";
import { formatDate, formatFundingRange } from "@/lib/format";

interface GrantDetailPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GrantDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const grant = await getGrantBySlug(slug);

  if (grant === null) {
    return { title: "Grant not found", robots: { index: false, follow: true } };
  }

  const description =
    grant.shortDescription ??
    grant.summary?.slice(0, 200) ??
    `${grant.title} from ${grant.organization.name}.`;

  return {
    title: grant.title,
    description,
    alternates: { canonical: routes.grant(grant.slug) },
    openGraph: {
      type: "article",
      title: grant.title,
      description,
      url: routes.grant(grant.slug),
    },
  };
}

export default async function GrantDetailPage({ params }: GrantDetailPageProps) {
  const { slug } = await params;
  const grant = await getGrantBySlug(slug);

  if (grant === null) {
    notFound();
  }

  const deadline = resolveDeadline(grant);
  const funding = formatFundingRange(grant, false);
  const category = getPrimaryCategory(grant);
  const eligibilityPoints = toEligibilityPoints(grant.eligibility);
  const related = await getRelatedGrants(grant);

  const identity = await getSiteIdentity();

  return (
    <>
      {/*
        Five entities, one graph. The page is about a funding programme
        (MonetaryGrant), presents an editorial write-up of it (Article) and the
        structured record behind it (Dataset); WebPage is the node those hang
        off, and BreadcrumbList is addressable so WebPage.breadcrumb resolves.

        Organization and WebSite are not repeated here — the root layout emits
        them once and everything above points at them by @id.
      */}
      <JsonLd
        schemas={[
          buildGrantWebPageSchema(grant, identity),
          buildGrantSchema(grant, identity),
          buildGrantArticleSchema(grant, identity),
          buildGrantDatasetSchema(grant, identity),
          buildGrantBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: "Grants", path: routes.grants },
              ...(category === null
                ? []
                : [{ name: category.name, path: routes.category(category.slug) }]),
              { name: grant.title, path: routes.grant(grant.slug) },
            ],
            grant,
            identity,
          ),
          // Only emitted when the questions are actually on the page.
          buildFaqSchema(grant.faqs),
        ]}
      />

      <Container as="header" className="pt-10 pb-8 md:pt-14">
        <Breadcrumb>
          <BreadcrumbList className="font-mono text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.home}>Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.grants}>Grants</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {category !== null && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={routes.category(category.slug)}>{category.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">{grant.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <p className="mt-8 font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {grant.organization.name}
        </p>
        <h1 className="mt-2 max-w-4xl text-3xl leading-tight font-bold tracking-tight text-balance md:text-4xl">
          {grant.title}
        </h1>
      </Container>

      <Container className="pb-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="min-w-0">
            {/*
              Key facts before prose. Someone deciding whether to apply needs
              money, time and eligibility — reading order follows that, and
              AI systems quoting the page find the facts near the top.
            */}
            <section aria-labelledby="key-facts">
              <h2 id="key-facts" className="sr-only">
                Key facts
              </h2>
              <dl className="divide-y divide-border border-y border-border">
                <GrantFactRow label="Award" value={funding ?? "Not published"} mono />
                {/*
                  A missing date and a missing amount are different absences.
                  "Not published" reads, against a date, as though we chose not
                  to print one — when in fact the agency has not set it yet.
                  Saying so is both truer and more useful: it tells the reader
                  there is nothing to go and look up.
                */}
                <GrantFactRow
                  label="Opens"
                  value={formatDate(grant.opensAt) ?? "Date not announced"}
                  mono
                />
                <GrantFactRow
                  label="Closes"
                  value={formatDate(grant.closesAt) ?? "Date not announced"}
                  mono
                />
                <GrantFactRow
                  label="Location"
                  value={
                    grant.state === null
                      ? grant.country.name
                      : `${grant.state.name}, ${grant.country.name}`
                  }
                />
                {category !== null && <GrantFactRow label="Category" value={category.name} />}
              </dl>
            </section>

            {grant.summary !== null && (
              <section aria-labelledby="summary" className="mt-12">
                <SectionHeading id="summary">Summary</SectionHeading>
                <p className="mt-4 text-base leading-relaxed text-pretty">{grant.summary}</p>
              </section>
            )}

            {grant.answerCapsules.length > 0 && (
              <section aria-labelledby="questions" className="mt-12">
                <SectionHeading id="questions">Quick answers</SectionHeading>
                <dl className="mt-4 flex flex-col gap-6">
                  {grant.answerCapsules.map((capsule) => (
                    <div key={capsule.question}>
                      <dt className="font-semibold">{capsule.question}</dt>
                      <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                        {capsule.answer}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {grant.eligibility !== null && (
              <section aria-labelledby="eligibility" className="mt-12">
                <SectionHeading id="eligibility">Who can apply</SectionHeading>
                {/*
                  Broken into points where the notice itself has them, so the
                  clause that rules a reader in or out can be found without
                  reading the whole paragraph. The agency's wording is carried
                  over untouched — see `utils/eligibility.ts` for why nothing
                  here is ever reworded.
                */}
                {eligibilityPoints === null ? (
                  <p className="mt-4 leading-relaxed text-pretty">{grant.eligibility}</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {eligibilityPoints.map((point) => (
                      <li key={point} className="flex gap-3 leading-relaxed text-pretty">
                        <span
                          aria-hidden="true"
                          className="mt-2.5 size-1.5 shrink-0 rounded-full bg-muted-foreground"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {grant.fullDescription !== null && (
              <section aria-labelledby="about" className="mt-12">
                <SectionHeading id="about">About this grant</SectionHeading>
                <p className="mt-4 leading-relaxed text-pretty">{grant.fullDescription}</p>
              </section>
            )}

            <FaqSection items={grant.faqs} headingId="faq" className="mt-12" />

            {grant.documents.length > 0 && (
              <section aria-labelledby="documents" className="mt-12">
                <SectionHeading id="documents">Documents</SectionHeading>
                <ul className="mt-4 flex flex-col gap-2">
                  {grant.documents.map((document) => (
                    <li key={document.fileUrl}>
                      <a
                        href={document.fileUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40"
                      >
                        <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                        {document.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Everything needed to act, kept in view while the page is read. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-card border border-border bg-card p-6">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Application window
              </p>
              <DeadlineMeter state={deadline} className="mt-3" />

              <div className="mt-6 flex flex-col gap-2">
                {grant.applicationUrl !== null && (
                  <Button asChild>
                    <a href={grant.applicationUrl} rel="noopener noreferrer" target="_blank">
                      Apply on the Agency Site
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                )}
                {grant.officialUrl !== null && (
                  <Button asChild variant="outline">
                    <a href={grant.officialUrl} rel="noopener noreferrer" target="_blank">
                      Read the Official Notice
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Provenance, not decoration: it is how a reader checks us. */}
              <dl className="mt-6 space-y-1.5 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <dt>Source</dt>
                  <dd className="text-right">{grant.organization.name}</dd>
                </div>
                {grant.lastVerifiedAt !== null && (
                  <div className="flex justify-between gap-4">
                    <dt>Verified</dt>
                    <dd>{formatDate(grant.lastVerifiedAt)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt>Updated</dt>
                  <dd>{formatDate(grant.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            {/*
              Everything above this in the sidebar is the agency's: the
              deadline, the application link, the official notice. This is not
              — it is Grant Ninja selling its own service, directly underneath
              them, and an unlabelled panel in that position reads as part of
              the grant. The eyebrow says whose offer it is before the pitch
              starts, which is the honest way to place it here at all.
            */}
            <div className="mt-4 rounded-card border border-border bg-muted/40 p-6">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Grant Ninja service
              </p>
              <p className="mt-3 font-semibold">Need the money before the grant pays out?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Grant Ninja advances funding against approved grants and R&amp;D tax credits, so
                work can start before the first disbursement arrives. This is separate from the
                grant above, and not offered by {grant.organization.name}.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href={routes.services}>{FUNDING_CTA_LABEL}</Link>
              </Button>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-20">
            <SectionHeading id="related">Related grants</SectionHeading>
            <ul className="mt-6 flex flex-col gap-4">
              {related.map((item) => (
                <li key={item.id}>
                  <GrantCard grant={item} />
                </li>
              ))}
            </ul>
          </section>
        )}
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
