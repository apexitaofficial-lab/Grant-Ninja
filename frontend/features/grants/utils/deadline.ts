/**
 * Application-window state.
 *
 * In this domain the deadline is the fact that decides whether a grant is worth
 * a second look. Funding amounts are ranges and often unpublished; a closing
 * date is binary. This module turns two nullable timestamps into one explicit
 * state so the UI never has to reason about dates itself.
 */

/** A window closing inside this many days is treated as urgent. */
export const CLOSING_SOON_DAYS = 14;

const MS_PER_DAY = 86_400_000;

export type DeadlineState =
  | { readonly kind: "unknown" }
  | { readonly kind: "not_yet_open"; readonly opensAt: Date; readonly daysUntilOpen: number }
  | {
      readonly kind: "open";
      readonly closesAt: Date;
      readonly daysRemaining: number;
      /** Fraction of the window elapsed, or null when the open date is unknown. */
      readonly progress: number | null;
    }
  | {
      readonly kind: "closing_soon";
      readonly closesAt: Date;
      readonly daysRemaining: number;
      readonly progress: number | null;
    }
  | { readonly kind: "closed"; readonly closesAt: Date };

function parse(value: string | null): Date | null {
  if (value === null) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whole days between two instants, rounded up so a partial day still counts. */
function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function resolveDeadline(
  input: { readonly opensAt: string | null; readonly closesAt: string | null },
  now: Date = new Date(),
): DeadlineState {
  const opensAt = parse(input.opensAt);
  const closesAt = parse(input.closesAt);

  if (closesAt === null) {
    // An open date with no close date still tells the reader something useful.
    if (opensAt !== null && opensAt.getTime() > now.getTime()) {
      return { kind: "not_yet_open", opensAt, daysUntilOpen: daysBetween(now, opensAt) };
    }

    return { kind: "unknown" };
  }

  if (closesAt.getTime() <= now.getTime()) {
    return { kind: "closed", closesAt };
  }

  if (opensAt !== null && opensAt.getTime() > now.getTime()) {
    return { kind: "not_yet_open", opensAt, daysUntilOpen: daysBetween(now, opensAt) };
  }

  const daysRemaining = daysBetween(now, closesAt);
  const progress = resolveProgress(opensAt, closesAt, now);

  return daysRemaining <= CLOSING_SOON_DAYS
    ? { kind: "closing_soon", closesAt, daysRemaining, progress }
    : { kind: "open", closesAt, daysRemaining, progress };
}

function resolveProgress(opensAt: Date | null, closesAt: Date, now: Date): number | null {
  if (opensAt === null) {
    return null;
  }

  const total = closesAt.getTime() - opensAt.getTime();

  if (total <= 0) {
    return null;
  }

  const elapsed = now.getTime() - opensAt.getTime();

  return Math.min(1, Math.max(0, elapsed / total));
}

/** Whether a grant can still be applied for. Drives the status badge. */
export function isAcceptingApplications(state: DeadlineState): boolean {
  return state.kind === "open" || state.kind === "closing_soon";
}
