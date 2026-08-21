/**
 * Presentation formatting.
 *
 * Grant figures are the domain's vernacular — award ceilings, closing dates,
 * agency names — so they get formatted in one place and set in the mono face
 * wherever they appear.
 */

/**
 * Compact currency for card figures: $305K, $1.2M, $2B.
 * Grant amounts span five orders of magnitude, and a full-precision figure
 * makes a column of cards impossible to compare at a glance.
 */
export function formatCompactCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Renders whatever funding facts exist, rather than inventing the ones that
 * do not. Most government notices publish a ceiling but no floor.
 */
export function formatFundingRange(
  input: {
    readonly fundingAmount: number | null;
    readonly minimumAmount: number | null;
    readonly maximumAmount: number | null;
    readonly currency: string;
  },
  compact = true,
): string | null {
  const money = (value: number) =>
    compact ? formatCompactCurrency(value, input.currency) : formatCurrency(value, input.currency);

  const { fundingAmount, minimumAmount, maximumAmount } = input;

  if (minimumAmount !== null && maximumAmount !== null) {
    return `${money(minimumAmount)} – ${money(maximumAmount)}`;
  }

  if (maximumAmount !== null) {
    return `Up to ${money(maximumAmount)}`;
  }

  if (minimumAmount !== null) {
    return `From ${money(minimumAmount)}`;
  }

  if (fundingAmount !== null) {
    return money(fundingAmount);
  }

  return null;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** UTC so a deadline never shifts a day depending on where it is read. */
export function formatDate(value: string | Date | null): string | null {
  if (value === null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : DATE_FORMAT.format(date);
}

export function formatDayCount(days: number): string {
  if (days === 0) {
    return "Closes today";
  }

  if (days === 1) {
    return "1 day left";
  }

  if (days < 30) {
    return `${days} days left`;
  }

  const months = Math.round(days / 30);

  return months === 1 ? "About 1 month left" : `About ${months} months left`;
}
