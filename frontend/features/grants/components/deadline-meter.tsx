import type { DeadlineState } from "@/features/grants/utils/deadline";
import { formatDate, formatDayCount } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The application window, drawn.
 *
 * A grant is worth reading only if you can still apply, so the window gets the
 * card's most legible position rather than a line of small print. The track is
 * the full open-to-close period and the fill is how much of it has already
 * gone, which answers "how much runway is left" faster than a date does.
 *
 * When the opening date is unknown the fill would be a guess, so the track
 * stays empty and only the remaining time is stated. Nothing here invents a
 * date the source did not publish.
 */

interface DeadlineMeterProps {
  readonly state: DeadlineState;
  readonly className?: string;
}

export function DeadlineMeter({ state, className }: DeadlineMeterProps) {
  if (state.kind === "unknown") {
    return (
      <p className={cn("font-mono text-xs text-muted-foreground", className)}>
        No closing date published
      </p>
    );
  }

  if (state.kind === "not_yet_open") {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Track fill={0} tone="upcoming" />
        <Caption
          headline={`Opens ${formatDate(state.opensAt)}`}
          detail={state.daysUntilOpen === 1 ? "in 1 day" : `in ${state.daysUntilOpen} days`}
        />
      </div>
    );
  }

  if (state.kind === "closed") {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Track fill={1} tone="closed" />
        <Caption headline="Closed" detail={formatDate(state.closesAt) ?? ""} />
      </div>
    );
  }

  const tone = state.kind === "closing_soon" ? "urgent" : "open";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Track fill={state.progress} tone={tone} />
      <Caption
        headline={formatDayCount(state.daysRemaining)}
        detail={`closes ${formatDate(state.closesAt)}`}
        emphasis={state.kind === "closing_soon"}
      />
    </div>
  );
}

type Tone = "open" | "urgent" | "closed" | "upcoming";

const TONE_FILL: Readonly<Record<Tone, string>> = {
  open: "bg-brand",
  urgent: "bg-warning",
  closed: "bg-muted-foreground/40",
  upcoming: "bg-primary/30",
};

/**
 * `fill` of null means the window length is unknown: the track is drawn empty
 * rather than filled to an invented position.
 */
function Track({ fill, tone }: { readonly fill: number | null; readonly tone: Tone }) {
  const percent = fill === null ? 0 : Math.round(fill * 100);

  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-muted"
      role="presentation"
      aria-hidden="true"
    >
      <div
        className={cn("h-full rounded-full transition-[width]", TONE_FILL[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function Caption({
  headline,
  detail,
  emphasis = false,
}: {
  readonly headline: string;
  readonly detail: string;
  readonly emphasis?: boolean;
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs">
      <span className={cn("font-medium", emphasis ? "text-warning" : "text-foreground")}>
        {headline}
      </span>
      {detail !== "" && <span className="text-muted-foreground">{detail}</span>}
    </p>
  );
}
