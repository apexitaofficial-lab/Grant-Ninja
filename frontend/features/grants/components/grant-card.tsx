import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { DeadlineMeter } from "@/features/grants/components/deadline-meter";
import { getPrimaryCategory } from "@/features/grants/services/grant-service";
import type { GrantListItem } from "@/features/grants/types/grant";
import { resolveDeadline } from "@/features/grants/utils/deadline";
import { formatFundingRange, NOT_ANNOUNCED } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One grant, sized for scanning.
 *
 * A row rather than a tile: the reader is ruling grants in or out, and a
 * consistent left scan line down the page does that faster than a grid where
 * every card starts in a different place. The right rail holds the two facts
 * that decide it — money and time — in the mono face, so figures line up
 * vertically between cards and can be compared without reading.
 */

interface GrantCardProps {
  readonly grant: GrantListItem;
  readonly className?: string;
}

export function GrantCard({ grant, className }: GrantCardProps) {
  const deadline = resolveDeadline(grant);
  const funding = formatFundingRange(grant);
  const category = getPrimaryCategory(grant);
  const location =
    grant.state === null ? grant.country.name : `${grant.state.name}, ${grant.country.name}`;

  return (
    <article
      className={cn(
        "group relative rounded-card border border-border bg-card p-5 transition-colors hover:border-primary/40 md:p-6",
        "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {grant.organization.name}
            </span>
            {grant.featured && (
              <Badge variant="secondary" className="font-mono text-[10px] tracking-wide uppercase">
                Featured
              </Badge>
            )}
          </div>

          {/*
            `text-pretty`, not `text-balance`.

            Balancing evens the lines out, which suits a short display heading
            with room around it. In a 622px card column it does the opposite of
            what is wanted: a title needing 879px was set as two lines of about
            440px, leaving some 180px empty at the end of *both* — measured
            across the listing, the widest line used was 419-528px of the 622
            available.

            Pretty fills each line and only protects the last one from an
            orphan. Same titles, same line counts (measured: 2/2/2/1/1/3 either
            way), 568-620px used instead of 419-528.
          */}
          <h3 className="mt-2 text-lg leading-snug font-semibold tracking-tight text-pretty">
            {/* Stretched link: the whole card is the target, but only the
                title lands in the tab order and the accessibility tree. */}
            <Link
              href={routes.grant(grant.slug)}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {grant.title}
            </Link>
          </h3>

          {grant.shortDescription !== null && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {grant.shortDescription}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span>{location}</span>
            {category !== null && (
              <>
                <Divider />
                <span>{category.name}</span>
              </>
            )}
            {grant.isFederal && (
              <>
                <Divider />
                <span>Federal</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:w-56">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Award
            </p>
            <p
              className={cn(
                "mt-0.5 font-mono text-base font-semibold tabular-nums",
                funding === null && "text-sm font-normal text-muted-foreground",
              )}
            >
              {funding ?? NOT_ANNOUNCED}
            </p>
          </div>

          <DeadlineMeter state={deadline} />
        </div>
      </div>

      <ArrowUpRight
        className="absolute top-5 right-5 size-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground md:top-6 md:right-6"
        aria-hidden="true"
      />
    </article>
  );
}

function Divider() {
  return <span aria-hidden="true">&middot;</span>;
}
