import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, LegalSection } from "@/components/shared/legal-page";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { buildBreadcrumbSchema } from "@/features/seo/lib/json-ld";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

const TITLE = "Terms of Use";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "The terms on which Grant Ninja publishes grant information, and the limits of what a directory entry tells you.",
  alternates: { canonical: routes.terms },
};

/**
 * The substance here is the accuracy section, and it says the same thing the
 * grant pages already say in their provenance panel: the agency notice is
 * authoritative and ours is a summary of it. Stating that plainly is not
 * throat-clearing — the whole product is a secondary source, and someone is
 * going to plan work around a closing date they read here.
 */
export default async function TermsPage() {
  const identity = await getSiteIdentity();

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: TITLE, path: routes.terms },
            ],
            identity.url,
          ),
        ]}
      />

      <LegalPage
        title={TITLE}
        intro="Grant Ninja publishes a searchable summary of grant notices issued by government agencies. These terms describe what that is, and what it is not."
      >
        <LegalSection id="what-this-is" heading="What This Service Is">
          <p>
            Grant Ninja collects grant notices published by government agencies and research
            councils and presents them in one searchable place. It is free to use and needs no
            account.
          </p>
          <p>
            {identity.name} is an initiative of {siteConfig.parentOrganization.name}.
          </p>
        </LegalSection>

        <LegalSection id="accuracy" heading="Accuracy and the Official Notice">
          <p>
            Every entry is a summary of a notice published elsewhere. We check what we publish and
            show, on each grant page, the source it came from and the date it was last verified.
          </p>
          <p>
            Even so, the agency&rsquo;s own notice is the authority. Funding amounts, eligibility
            rules and deadlines change, sometimes without warning, and a summary can be out of date
            before we revisit it.{" "}
            <strong className="font-semibold">
              Confirm eligibility, amounts and closing dates on the issuing agency&rsquo;s website
              before you apply or commit time or money to an application.
            </strong>
          </p>
          <p>
            Where our page and the agency&rsquo;s notice disagree, the agency is right. We would be
            glad to hear about it — tell us and we will correct the record.
          </p>
        </LegalSection>

        <LegalSection id="not-advice" heading="What We Do Not Do">
          <p>
            We do not decide who receives funding, we do not submit applications on your behalf, and
            nothing on this site is legal, financial or tax advice. Whether a programme suits you is
            a judgement only you and your advisers can make.
          </p>
          <p>
            Appearing in the directory is not a recommendation, and the order results appear in is
            not a ranking of quality.
          </p>
        </LegalSection>

        <LegalSection id="funding-services" heading="Funding Services Are Separate">
          <p>
            Grant Ninja also advances funding against grants and R&amp;D tax credits that have
            already been awarded. That is a commercial service with its own agreement and its own
            terms, and it has no bearing on what appears in the directory: a grant is listed because
            it exists and is current.{" "}
            <Link href={routes.services} className="underline underline-offset-4">
              How that works
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="other-sites" heading="Links to Other Sites">
          <p>
            Grant pages link out to agency notices, application portals and supporting documents. We
            do not control those sites and are not responsible for their content or availability. A
            link is a pointer to the source, not an endorsement.
          </p>
        </LegalSection>

        <LegalSection id="availability" heading="Availability">
          <p>
            We aim to keep the site available and current, but we do not guarantee it will be
            uninterrupted or error-free, and we may change or withdraw parts of it.
          </p>
        </LegalSection>

        <LegalSection id="using-content" heading="Using Our Content">
          <p>
            The underlying grant information is public. The way it is written, organised and
            presented here is ours. You are welcome to read it, link to it and quote it with
            attribution; please do not copy the directory wholesale or scrape it in a way that
            degrades the service for other people.
          </p>
        </LegalSection>

        <LegalSection id="contact" heading="Contact">
          <p>
            Questions about these terms, or a correction to a grant record, can go to{" "}
            {identity.contactEmail === null ? (
              "our contact address"
            ) : (
              <a href={`mailto:${identity.contactEmail}`} className="underline underline-offset-4">
                {identity.contactEmail}
              </a>
            )}
            .
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
