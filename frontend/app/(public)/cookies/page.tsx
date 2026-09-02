import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/shared/json-ld";
import { LegalPage, LegalSection } from "@/components/shared/legal-page";
import { routes } from "@/config/routes";
import { buildBreadcrumbSchema } from "@/features/seo/lib/json-ld";
import { getSiteIdentity } from "@/features/shared/services/settings-service";

const TITLE = "Cookie Policy";

export const metadata: Metadata = {
  title: TITLE,
  description: "The cookies Grant Ninja sets, the ones it does not, and how to control them.",
  alternates: { canonical: routes.cookies },
};

/**
 * There is no cookie banner on this site, and this page explains why rather
 * than apologising for it: nothing here sets a cookie that would require
 * consent. Reading the directory sets none of ours at all — the only cookies
 * this application writes are the Supabase session cookies created when a
 * member of staff signs in to the admin area.
 *
 * Checked rather than assumed: no analytics provider is configured and no
 * analytics script is served on any public page.
 */
export default async function CookiesPage() {
  const identity = await getSiteIdentity();

  return (
    <>
      <JsonLd
        schemas={[
          buildBreadcrumbSchema(
            [
              { name: "Home", path: routes.home },
              { name: TITLE, path: routes.cookies },
            ],
            identity.url,
          ),
        ]}
      />

      <LegalPage
        title={TITLE}
        intro="Cookies are small files a website asks your browser to keep. This page lists the ones connected with Grant Ninja and what each is for."
      >
        <LegalSection id="browsing" heading="Reading the Directory">
          <p>
            Browsing grant pages, searching and filtering set no cookies of ours. Your search terms
            and filters live in the page address rather than in a stored file, which is why a
            filtered listing can be bookmarked and shared — and why closing the tab leaves nothing
            behind.
          </p>
        </LegalSection>

        <LegalSection id="ours" heading="Cookies We Set">
          <p>
            One kind: the session cookies that keep a Grant Ninja operator signed in to the
            administration area. They are created by our authentication provider, Supabase, at the
            moment someone signs in, and they are what stops the sign-in being forgotten between
            pages. If you are not a member of staff signing in, they are never set.
          </p>
        </LegalSection>

        <LegalSection id="support-chat" heading="Support Chat">
          <p>
            The chat widget is provided by Zendesk, and it sets its own cookies to remember a
            conversation across pages. Those are Zendesk&rsquo;s, governed by Zendesk&rsquo;s
            policies. If you do not open the chat, it does not start a conversation to remember.
          </p>
        </LegalSection>

        <LegalSection id="not-used" heading="What We Do Not Use">
          <p>
            No advertising cookies, no cross-site trackers, and no analytics cookies — the site runs
            no analytics software at all. Nothing here follows you to another website, and nothing
            builds a profile of what you looked at.
          </p>
          <p>
            That is also why there is no cookie banner: there is nothing to ask your permission for.
          </p>
        </LegalSection>

        <LegalSection id="controlling" heading="Controlling Cookies">
          <p>
            Every major browser lets you view, block and delete cookies, per site or in general.
            Blocking them will not affect reading the directory. It will stop staff sign-in working,
            and it may stop the support chat remembering a conversation.
          </p>
        </LegalSection>

        <LegalSection id="more" heading="More Detail">
          <p>
            What we do with information generally is described in the{" "}
            <Link href={routes.privacy} className="underline underline-offset-4">
              Privacy Policy
            </Link>
            . Anything unclear, ask us at{" "}
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
