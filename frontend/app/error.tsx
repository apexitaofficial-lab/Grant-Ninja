"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Route-level error boundary — MASTER_PROJECT_SPEC.md §51.
 * Explains what happened and offers a retry; never renders a stack trace (§40).
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    logger.error("Unhandled route error", error, { feature: "app", digest: error.digest });
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        We hit an unexpected problem loading this page. The issue has been logged. Retrying often
        resolves it.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <a href="/contact">Contact support</a>
        </Button>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
    </Container>
  );
}
