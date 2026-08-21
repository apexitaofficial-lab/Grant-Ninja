import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  readonly icon?: LucideIcon;
  /** States what is not here, in the reader's terms. */
  readonly title: string;
  /** Says what to do next. Never an apology. */
  readonly description: string;
  readonly actions?: ReactNode;
  readonly className?: string;
}

/**
 * An empty result is a moment for direction, not mood — so this always carries
 * a next step. Used wherever a listing can come back with nothing.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-border bg-muted/30 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && <Icon className="mb-4 size-6 text-muted-foreground" aria-hidden="true" />}
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
