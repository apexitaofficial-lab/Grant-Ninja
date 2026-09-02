import { Building2, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { BookACallButton } from "@/components/shared/book-a-call-button";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { routes } from "@/config/routes";
import type { SiteAddress } from "@/features/seo/lib/json-ld";
import {
  buildBreadcrumbSchema,
  buildDataCatalogSchema,
  buildFaqSchema,
} from "@/features/seo/lib/json-ld";
import { getStaticPageFaqs } from "@/features/shared/services/faq-service";
import { getSiteAddress, getSiteIdentity } from "@/features/shared/services/settings-service";

const TITLE = "Contact Us";
const DESCRIPTION =
  "Speak to Grant Ninja about finding research grants, or about bringing funding forward on a grant or R&D tax credit you have already been awarded. Schedule a call or contact us directly.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: routes.contact },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: routes.contact,
  },
  // Set explicitly rather than left to inherit. Without it the card falls back
  // to the site-wide defaults from the root layout and a shared link to this
  // page advertises the home page's title instead of this one.
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * The address as a person would write it on an envelope.
 *
 * Two things the raw fields get wrong on their own. The locality line is
 * "Fort Worth, TX 76104" — a comma separates city from state, but a space
 * separates state from ZIP, and "TX, 76104" reads as a typo to anyone American.
 * And `addressCountry` holds an ISO code because that is what schema.org wants;
 * printing a bare "US" as an address line is not how a country is written.
 */
function toAddressLines(address: SiteAddress): string[] {
  const localityLine = [
    [address.addressLocality, address.addressRegion]
      .filter((part): part is string => part !== null && part !== "")
      .join(", "),
    address.postalCode,
  ]
    .filter((part): part is string => part !== null && part !== "")
    .join(" ");

  let country: string | null = address.addressCountry;

  if (country !== null && country.length === 2) {
    try {
      country =
        new Intl.DisplayNames(["en"], { type: "region" }).of(country.toUpperCase()) ?? country;
    } catch {
      // Unknown or unsupported code — keep what was recorded rather than
      // dropping the country entirely.
    }
  }

  return [address.streetAddress, localityLine, country].filter(
    (line): line is string => line !== null && line.trim() !== "",
  );
}

/**
 * Contact Us.
 *
 * Deliberately has no contact form. The page states who Grant Ninja is and how
 * to reach them, and routes anyone ready to talk into the group's existing
 * booking flow — the same pattern the sibling sites use. A form here would add
 * a second inbox to watch alongside a calendar that already takes bookings.
 *
 * No Organization JSON-LD is emitted here. The root layout emits it once for
 * the whole site and every page references it by `@id`; a second block on this
 * page would define a competing entity under the same identifier. The contact
 * details rendered below and the ones in that shared schema come from the same
 * settings, so the visible page and the structured data cannot disagree.
 */
export default async function ContactPage() {
  const [identity, address, faqs] = await Promise.all([
    getSiteIdentity(),
    getSiteAddress(),
    getStaticPageFaqs("contact"),
  ]);

  const addressLines = address === null ? [] : toAddressLines(address);

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: TITLE, path: routes.contact },
            ],
            identity.url,
          ),
          // The catalogue the grant pages already point at. Defined here, on
          // the page that also states the contact details it carries, matching
          // how the sibling site structures its contact page.
          buildDataCatalogSchema(identity, address),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title={TITLE}
        description="Ask about a specific grant, or about bringing funding forward on one you have already been awarded. Schedule a call and speak to a specialist directly."
        breadcrumb={<EntityBreadcrumb trail={[{ label: TITLE }]} />}
      />

      <Container className="pb-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="min-w-0">
            {/* The primary action. Placed before the written details because
                booking is the fastest route to an answer for most enquiries. */}
            <section
              aria-labelledby="book"
              className="rounded-card border border-border bg-muted/40 p-6 md:p-8"
            >
              <h2 id="book" className="text-xl font-semibold tracking-tight">
                Schedule a Call with a Grant Specialist
              </h2>
              <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
                Pick a time that suits you and we will call to talk through which grants you are
                eligible for, or how funding can be advanced against an award you already hold.
                There is no charge for the call.
              </p>
              <BookACallButton className="mt-6" showIcon />
            </section>

            <section aria-labelledby="what-happens" className="mt-12">
              <h2
                id="what-happens"
                className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
              >
                What happens next
              </h2>
              <ol className="mt-4 flex flex-col gap-3 leading-relaxed text-muted-foreground">
                <li>
                  We ask which grant or credit your enquiry relates to and what stage it is at.
                </li>
                <li>
                  If it is about funding, we confirm what has been awarded and when it is due to pay
                  out.
                </li>
                <li>If we cannot help, we say so plainly rather than putting you in a funnel.</li>
              </ol>
            </section>
          </div>

          {/*
            Official organisation details. Each line is rendered only when it has
            been recorded in Settings — an unfilled field shows nothing rather
            than a placeholder somebody might try to call or write to.
          */}
          <aside>
            <section aria-labelledby="details">
              <h2
                id="details"
                className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
              >
                Our details
              </h2>

              <dl className="mt-5 flex flex-col gap-5 text-sm">
                <div className="flex gap-3">
                  <Building2
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-medium">{identity.name}</dt>
                    {identity.legalName !== null && (
                      <dd className="mt-0.5 text-muted-foreground">{identity.legalName}</dd>
                    )}
                  </div>
                </div>

                {addressLines.length > 0 && (
                  <div className="flex gap-3">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Address</dt>
                      <dd className="text-muted-foreground not-italic">
                        <address className="not-italic">
                          {addressLines.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </address>
                      </dd>
                    </div>
                  </div>
                )}

                {identity.contactPhone !== null && (
                  <div className="flex gap-3">
                    <Phone
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Telephone</dt>
                      <dd>
                        <a href={`tel:${identity.contactPhone}`} className="hover:underline">
                          {identity.contactPhone}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}

                {identity.contactEmail !== null && (
                  <div className="flex gap-3">
                    <Mail
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Email</dt>
                      <dd>
                        <a href={`mailto:${identity.contactEmail}`} className="hover:underline">
                          {identity.contactEmail}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </section>
          </aside>
        </div>

        <FaqSection items={faqs} headingId="contact-faq" className="mt-20" />
      </Container>
    </>
  );
}
