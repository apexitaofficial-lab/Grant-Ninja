import { CalendarDays } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

interface BookACallButtonProps {
  readonly variant?: ComponentProps<typeof Button>["variant"];
  readonly size?: ComponentProps<typeof Button>["size"];
  readonly className?: string;
  readonly label?: string;
  /** Hidden on the navbar, where the surrounding button already reads as an action. */
  readonly showIcon?: boolean;
}

/**
 * The single definition of "Schedule a Call".
 *
 * Exists as one component rather than three copies of an anchor so the header,
 * the mobile drawer and the Contact page cannot drift apart — the brief asks
 * for the action to behave identically wherever it is pressed, and the only way
 * to guarantee that is to have one place where it is written. Renaming it from
 * "Book a Call" to "Schedule a Call" was one line here because of that.
 *
 * Points at `/bookings` on this domain, which redirects to the booking
 * calendar. Linking to the route rather than the scheduler means the calendar
 * can be repointed from one environment variable without touching any of these
 * buttons — and the URL a visitor sees on hover is a Grant Ninja one.
 *
 * A plain anchor, not `next/link`: `/bookings` is a route handler that returns
 * a redirect, and the client router has no page to transition to.
 *
 * Opens in a new tab because the journey ends on a third-party scheduler —
 * losing the grant someone was reading in order to book a call is a bad trade.
 * `rel="noopener noreferrer"` is required with `target="_blank"`: without it the
 * opened page gets a handle on this one via `window.opener`.
 */
export function BookACallButton({
  variant = "default",
  size,
  className,
  label = "Schedule a Call",
  showIcon = false,
}: BookACallButtonProps) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={routes.bookings} target="_blank" rel="noopener noreferrer">
        {showIcon && <CalendarDays aria-hidden="true" />}
        {label}
        <span className="sr-only"> (opens the booking calendar in a new tab)</span>
      </a>
    </Button>
  );
}
