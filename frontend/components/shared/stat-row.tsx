import { cn } from "@/lib/utils";

export interface Stat {
  readonly label: string;
  readonly value: number | string;
  /** Skips number formatting for values like a currency code. */
  readonly isText?: boolean;
}

interface StatRowProps {
  readonly stats: readonly Stat[];
  readonly className?: string;
}

/**
 * A row of counts.
 *
 * Rules rather than boxes: these are facts about the page you are already on,
 * not separate things to click, and a row of bordered tiles would suggest
 * otherwise. Figures are mono and tabular so they line up under each other.
 */
export function StatRow({ stats, className }: StatRowProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {stat.label}
          </dt>
          <dd className="mt-1 font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {stat.isText === true || typeof stat.value === "string"
              ? stat.value
              : stat.value.toLocaleString("en-US")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
