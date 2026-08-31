import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

interface PageHeaderProps {
  /** The page's single H1 — MASTER_PROJECT_SPEC.md §73. */
  readonly title: string;
  readonly description?: string;
  readonly breadcrumb?: ReactNode;
  readonly actions?: ReactNode;
}

/**
 * Standard header for every inner page, so heading level, spacing and
 * breadcrumb placement stay identical site-wide (§60).
 */
export function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <Container as="header" className="py-10 md:py-14">
      {breadcrumb}

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        {/*
          `max-w-3xl` ended this block 448px short of the content beneath it —
          the listing, the search field and the result grid all run the full
          container — so every inner page opened with a narrow column of text
          above a wide one, which reads as two layouts stacked rather than one
          page. Widened to match the hero, which was corrected the same way.

          Not the full container, though: the widest description on any of the
          eleven pages that use this is 1193px on one line, so removing the cap
          entirely would set it as a single 157-character line on a large
          screen. This keeps it to two.
        */}
        <div className="max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h1>
          {description && (
            <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
    </Container>
  );
}
