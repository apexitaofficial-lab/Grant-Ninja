import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface DirectoryCardProps {
  readonly href: string;
  readonly title: string;
  /** Short line above the title — a country code, an agency type. */
  readonly eyebrow?: string;
  readonly description?: string | null;
  /** The count is the reason to click, so it is set in the mono face. */
  readonly count: number;
  readonly countLabel: string;
  readonly className?: string;
}

/**
 * One entry in a directory of countries, categories or agencies.
 *
 * Every directory shows the same three things — what it is, how much is behind
 * it, and a way in — so they share one card rather than three that drift.
 * A zero count is stated plainly instead of hidden: an empty category is still
 * a real category, and pretending otherwise wastes a click.
 */
export function DirectoryCard({
  href,
  title,
  eyebrow,
  description,
  count,
  countLabel,
  className,
}: DirectoryCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-card border border-border bg-card p-5 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-primary/40",
        className,
      )}
    >
      {eyebrow !== undefined && (
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}

      <h3 className="mt-1 font-semibold tracking-tight">
        <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
          {title}
        </Link>
      </h3>

      {description !== null && description !== undefined && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      <p className="mt-4 flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums">
        <span className={cn(count > 0 && "font-medium text-foreground")}>{count}</span>
        <span>{countLabel}</span>
        <ArrowRight
          className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </p>
    </article>
  );
}
