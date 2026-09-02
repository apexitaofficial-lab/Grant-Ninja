/**
 * Presentation formatting.
 *
 * Grant figures are the domain's vernacular — award ceilings, closing dates,
 * agency names — so they get formatted in one place and set in the mono face
 * wherever they appear.
 */

/**
 * What a key fact says when the agency has not stated it.
 *
 * "Not published" was the wrong word, and wrong in a specific way: it reads as
 * a decision *this site* made — that the figure exists and we chose not to
 * print it. What actually happened is that the notice does not carry one yet.
 * "Not announced" puts the absence where it belongs, with the funder, and
 * tells the reader there is nothing to go and look up.
 *
 * Constants rather than literals because the wording appears on the grant
 * page, the cards, the admin duplicate review — and in the prose on /about
 * that explains the convention. That last one is why they must not drift: a
 * page describing a label it no longer matches is worse than either wording.
 */
export const NOT_ANNOUNCED = "Not Announced";
export const DATE_NOT_ANNOUNCED = "Date Not Announced";

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
    // A fixed award is not a range. Notices routinely publish an identical
    // floor and ceiling — grants.gov has separate "Award Floor" and "Award
    // Ceiling" fields and a single-award programme fills both with the same
    // figure — which rendered as "$1,519,113 – $1,519,113". Repeating a number
    // either side of a dash reads as a mistake, and on a card the compact form
    // made it worse: "$1.5M – $1.5M".
    return minimumAmount === maximumAmount
      ? money(maximumAmount)
      : `${money(minimumAmount)} – ${money(maximumAmount)}`;
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
