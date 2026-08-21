import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { footerNav, siteConfig } from "@/config/site";
import { getSocialProfiles } from "@/features/shared/services/settings-service";

/**
 * Site footer — MASTER_PROJECT_SPEC.md §25, UI_UX_DESIGN_SYSTEM.md §26.
 * Doubles as an internal-linking surface for the knowledge graph (§70).
 *
 * Social profiles come from `same_as_profiles` (D7), so adding one in the
 * admin panel updates the footer and the Organization schema together.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const socialProfiles = await getSocialProfiles();

  return (
    <footer className="mt-24 border-t bg-muted/40">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.tagline}
            </p>
          </div>

          {footerNav.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="text-sm font-semibold">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>

          {/* Wraps: seven profiles overflow a phone viewport on one line. */}
          {socialProfiles.length > 0 && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {socialProfiles.map((profile) => (
                <li key={profile.platform}>
                  <a
                    href={profile.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {profile.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </footer>
  );
}
