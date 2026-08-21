import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { routes } from "@/config/routes";
import { ContactForm } from "@/features/contact/components/contact-form";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/features/seo/lib/json-ld";
import { getStaticPageFaqs } from "@/features/shared/services/faq-service";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Grant Ninja about finding research grants or about funding advances against approved grants and R&D tax credits.",
  alternates: { canonical: routes.contact },
};

export default async function ContactPage() {
  const [identity, faqs] = await Promise.all([getSiteIdentity(), getStaticPageFaqs("contact")]);

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: "Contact", path: routes.contact },
            ],
            identity.url,
          ),
          buildFaqSchema(faqs),
        ]}
      />

      <PageHeader
        title="Contact us"
        description="Ask about a specific grant, or about bringing funding forward on one you have already been awarded. A real person reads every message."
        breadcrumb={<EntityBreadcrumb trail={[{ label: "Contact" }]} />}
      />

      <Container className="pb-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <div className="min-w-0">
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-8">
            {/*
              Contact details come from settings, so an empty field means the
              detail has not been filled in yet — better to show nothing than
              a placeholder someone might try to call.
            */}
            {(identity.contactEmail !== null || identity.contactPhone !== null) && (
              <section aria-labelledby="direct">
                <h2
                  id="direct"
                  className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
                >
                  Direct
                </h2>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {identity.contactEmail !== null && (
                    <li className="flex items-center gap-3">
                      <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                      <a href={`mailto:${identity.contactEmail}`} className="hover:underline">
                        {identity.contactEmail}
                      </a>
                    </li>
                  )}
                  {identity.contactPhone !== null && (
                    <li className="flex items-center gap-3">
                      <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                      <a href={`tel:${identity.contactPhone}`} className="hover:underline">
                        {identity.contactPhone}
                      </a>
                    </li>
                  )}
                </ul>
              </section>
            )}

            <section aria-labelledby="what-happens">
              <h2
                id="what-happens"
                className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
              >
                What happens next
              </h2>
              <ol className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                <li>We read your message and reply, usually within one business day.</li>
                <li>
                  If it is about funding, we ask which grant or credit it relates to and what stage
                  it has reached.
                </li>
                <li>If we cannot help, we say so plainly rather than putting you in a funnel.</li>
              </ol>
            </section>
          </aside>
        </div>

        <FaqSection items={faqs} headingId="contact-faq" className="mt-20" />
      </Container>
    </>
  );
}
