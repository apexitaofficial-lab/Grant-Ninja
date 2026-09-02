import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EntityBreadcrumb } from "@/components/shared/entity-breadcrumb";

/**
 * Shared shell for the three policy pages.
 *
 * They have identical structure — heading, effective date, a column of
 * sections — so it is written once. The prose column keeps a reading measure
 * rather than filling the container: these are the longest continuous text on
 * the site and the one place where line length actually decides whether
 * anybody finishes a paragraph.
 */

/**
 * The date shown at the top of every policy page.
 *
 * One constant, so three pages cannot claim three different revision dates.
 * Update it when the wording changes, not when the file is touched.
 */
export const POLICY_EFFECTIVE_DATE = "3 September 2026";

export function LegalPage({
  title,
  intro,
  children,
}: {
  readonly title: string;
  readonly intro: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={intro}
        breadcrumb={<EntityBreadcrumb trail={[{ label: title }]} />}
      />

      <Container className="pb-24">
        <div className="max-w-3xl">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Last updated {POLICY_EFFECTIVE_DATE}
          </p>

          <div className="mt-10 flex flex-col gap-10">{children}</div>
        </div>
      </Container>
    </>
  );
}

export function LegalSection({
  id,
  heading,
  children,
}: {
  readonly id: string;
  readonly heading: string;
  readonly children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
      >
        {heading}
      </h2>
      <div className="mt-4 flex flex-col gap-4 leading-relaxed">{children}</div>
    </section>
  );
}
