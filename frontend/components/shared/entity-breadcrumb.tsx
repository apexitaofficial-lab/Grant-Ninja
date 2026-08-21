import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { routes } from "@/config/routes";

export interface BreadcrumbStep {
  readonly label: string;
  /** Omitted on the final step, which is the current page. */
  readonly href?: string;
}

interface EntityBreadcrumbProps {
  readonly trail: readonly BreadcrumbStep[];
}

/**
 * Breadcrumbs for every inner page. Home is prepended automatically so no
 * caller can forget it and produce a trail that starts halfway down the site.
 *
 * The visible trail is also what the BreadcrumbList structured data will be
 * generated from, so the two cannot disagree.
 */
export function EntityBreadcrumb({ trail }: EntityBreadcrumbProps) {
  const steps: readonly BreadcrumbStep[] = [{ label: "Home", href: routes.home }, ...trail];

  return (
    <Breadcrumb>
      <BreadcrumbList className="font-mono text-xs">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <Fragment key={`${step.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || step.href === undefined ? (
                  <BreadcrumbPage className="line-clamp-1">{step.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={step.href}>{step.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
