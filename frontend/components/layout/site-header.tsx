import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BookACallButton } from "@/components/shared/book-a-call-button";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { mainNav } from "@/config/site";

/**
 * Sticky site header — MASTER_PROJECT_SPEC.md §24, UI_UX_DESIGN_SYSTEM.md §8.
 * Server Component: the only interactive part is the mobile drawer.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href={routes.home}
          className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo priority />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Secondary to "Find Grants": browsing the directory is what most
              visitors came for, and booking is the step after it. */}
          <BookACallButton variant="outline" className="hidden sm:inline-flex" />
          <Button asChild className="hidden sm:inline-flex">
            <Link href={routes.grants}>Find Grants</Link>
          </Button>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
