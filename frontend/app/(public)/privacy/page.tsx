import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, LegalSection } from "@/components/shared/legal-page";
import { routes } from "@/config/routes";
import { buildBreadcrumbSchema } from "@/features/seo/lib/json-ld";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

const TITLE = "Privacy Policy";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "What Grant Ninja collects, what it does not, and who else receives data when you use the site.",
  alternates: { canonical: routes.privacy },
};

/**
 * Written from what the code actually does, not from a template.
 *
 * Every claim here was checked against the running system: there is no
 * analytics provider configured and no analytics script is served; the support
 * widget is Zendesk and it is switched on; the only cookies this application
 * sets itself are Supabase authentication cookies, and those are set when an
 * operator signs in to the admin area rather than when a visitor reads a grant
 * page. A policy that lists trackers the site does not run is as misleading as
 * one that omits trackers it does.
 *
 * Deliberately absent: any statement that the site "complies with" a named
 * regulation. That is a legal conclusion, not a fact about the code, and it is
 * not ours to assert here.
 */
export default async function PrivacyPage() {
  const identity = await getSiteIdentity();

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: TITLE, path: routes.privacy },
            ],
            identity.url,
          ),
        ]}
      />

      <LegalPage
        title={TITLE}
        intro="Grant Ninja is a directory of grant information published by government agencies. Reading it does not require an account, and we ask for as little as the site can work with."
      >
        <LegalSection id="what-we-collect" heading="What We Collect When You Browse">
          <p>
            Nothing that identifies you. Browsing grant pages, searching, filtering and following
            links to agency notices do not require an account, and we do not run advertising or
            analytics software on these pages — there is no Google Analytics, no tag manager and no
            behavioural tracking script.
          </p>
          <p>
            Our hosting and database providers keep their own technical logs, such as IP addresses
            and request times, for the ordinary purposes of running and securing a service. We do
            not combine those logs with anything else or use them to build a profile of you.
          </p>
        </LegalSection>

        <LegalSection id="grant-data" heading="The Grant Information Itself">
          <p>
            Everything in the directory comes from notices that government agencies have already
            published. It is public information about funding programmes, not information about
            people. Each grant page names the source it came from and the date it was last checked.
          </p>
        </LegalSection>

        <LegalSection id="contacting-us" heading="When You Contact Us">
          <p>
            If you email us or book a call, we hold what you send — your name, your contact details
            and whatever you tell us — for as long as it takes to answer you and to keep a record of
            the conversation. Booking a call takes you to a third-party scheduling service, which
            handles that booking under its own terms.
          </p>
          <p>
            Enquiries submitted through this site in the past are stored in our database and are
            visible only to Grant Ninja staff.
          </p>
        </LegalSection>

        <LegalSection id="support-chat" heading="Support Chat">
          <p>
            The chat widget is provided by Zendesk. If you open it, Zendesk receives what you type
            and sets its own cookies in your browser, under Zendesk&rsquo;s privacy policy rather
            than this one. If you never open the chat, you never send it anything.
          </p>
        </LegalSection>

        <LegalSection id="who-else" heading="Who Else Receives Data">
          <p>
            We use a small number of service providers to run the site: Supabase hosts the database
            and handles staff sign-in, Vercel serves the pages, Zendesk provides the support chat,
            and Resend delivers email we send. Each processes data only to provide its service to
            us.
          </p>
          <p>We do not sell data, and we do not share it for advertising.</p>
        </LegalSection>

        <LegalSection id="cookies" heading="Cookies">
          <p>
            The only cookies this site sets itself are the session cookies that keep a Grant Ninja
            operator signed in to the administration area. Reading the public site does not set
            them. The support chat sets its own if you use it — see the{" "}
            <Link href={routes.cookies} className="underline underline-offset-4">
              Cookie Policy
            </Link>{" "}
            for the detail.
          </p>
        </LegalSection>

        <LegalSection id="your-choices" heading="Your Choices">
          <p>
            You can ask us what we hold about you, ask for it to be corrected, or ask us to delete
            it. Write to{" "}
            {identity.contactEmail === null ? (
              "our contact address"
            ) : (
              <a href={`mailto:${identity.contactEmail}`} className="underline underline-offset-4">
                {identity.contactEmail}
              </a>
            )}{" "}
            and we will tell you what we have and act on it.
          </p>
        </LegalSection>

        <LegalSection id="changes" heading="Changes to This Policy">
          <p>
            If this policy changes, the date at the top changes with it. We will not quietly widen
            what we collect and leave the wording as it was.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
