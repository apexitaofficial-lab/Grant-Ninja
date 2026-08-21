import cronstrue from "cronstrue";

/**
 * Cron expressions in words.
 *
 * `crawler_sources.crawl_frequency` holds a cron expression because the
 * scheduler has to evaluate it (deviation V8 — the spec originally suggested
 * free text like "daily", which cannot be). That is right for the machine and
 * useless for the person reading the table: `0 5 * * 1` tells an operator
 * nothing at a glance.
 *
 * Times are **UTC**. The Python scheduler compares against `datetime.now(UTC)`,
 * so an operator who reads "02:00" as their own morning would be wrong about
 * when the crawl actually runs — which is why the caller shows the zone.
 */

export interface ScheduleDescription {
  /** Human-readable text, or the raw expression when it cannot be parsed. */
  readonly text: string;
  readonly isValid: boolean;
}

export function describeSchedule(expression: string): ScheduleDescription {
  const trimmed = expression.trim();

  if (trimmed === "") {
    return { text: "No schedule", isValid: false };
  }

  try {
    return {
      text: cronstrue.toString(trimmed, {
        use24HourTimeFormat: true,
        // "At 02:00, every day" rather than "At 02:00" — the daily part is
        // only obvious to someone who already reads cron.
        verbose: true,
        throwExceptionOnParseError: true,
      }),
      isValid: true,
    };
  } catch {
    // A malformed expression must not take down the whole crawler page. The
    // raw value is shown instead, which is also the thing that needs fixing.
    return { text: trimmed, isValid: false };
  }
}
