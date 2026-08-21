import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Custom 404 — MASTER_PROJECT_SPEC.md §32. A dead end should still offer a
 * route back into the grants database.
 */
export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        The page may have moved, or the grant may no longer be published. Try searching the database
        instead.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href={routes.grants}>Browse grants</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.home}>Back to home</Link>
        </Button>
      </div>
    </Container>
  );
}
