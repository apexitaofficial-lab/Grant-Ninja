import { cn } from "@/lib/utils";

interface GrantFactRowProps {
  readonly label: string;
  readonly value: string;
  /** Figures and dates are set in the mono face so they align down the column. */
  readonly mono?: boolean;
}

/**
 * One line of the key-facts table. A definition list rather than a grid of
 * cards: these are label/value pairs, and marking them up as such is what lets
 * a screen reader and an AI crawler read them as pairs too.
 */
export function GrantFactRow({ label, value, mono = false }: GrantFactRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium", mono && "font-mono tabular-nums")}>{value}</dd>
    </div>
  );
}
