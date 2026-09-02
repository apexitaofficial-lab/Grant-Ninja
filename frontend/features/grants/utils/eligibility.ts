/**
 * Turning an eligibility notice into something scannable.
 *
 * Agencies publish eligibility as one dense paragraph — the CYFAR notice packs
 * the list of qualifying institutions, the one-application rule and the
 * duplicate-submission rule into three sentences with no visual separation.
 * Someone deciding whether they can apply has to read all of it to find the
 * one clause that rules them in or out.
 *
 * **The wording is never changed.** These are the conditions on public money,
 * and a paraphrase that reads more cleanly is still a different claim about
 * who may apply — the kind of error someone acts on. So this only inserts
 * breaks that the text already implies: existing list markers if the agency
 * used them, otherwise sentence boundaries. Every character the agency wrote
 * survives, in their order.
 */

/**
 * Abbreviations whose full stop ends a word rather than a sentence. Without
 * this, "U.S. Department of Agriculture" becomes two bullets, one of them the
 * single word "U.S.".
 */
const ABBREVIATIONS = [
  "U.S",
  "U.K",
  "e.g",
  "i.e",
  "etc",
  "vs",
  "No",
  "Inc",
  "Ltd",
  "Co",
  "Corp",
  "Dr",
  "Mr",
  "Mrs",
  "Ms",
  "Prof",
  "St",
  "Approx",
  "Dept",
  "Est",
];

/** A line that an agency already marked as a list item. */
const EXPLICIT_MARKER = /^\s*(?:[-*•·‣▪●]|\(?[a-z0-9]{1,3}[).])\s+/i;

/**
 * Bullet glyphs sitting inside a run of text rather than at the start of a
 * line. Notices pasted out of a PDF arrive exactly like this — one long line
 * reading "● US and foreign not-for-profit organizations ● Public..." — so
 * matching only at line starts leaves the glyphs on screen as punctuation.
 *
 * The ambiguous middot is deliberately not here: it separates values elsewhere
 * in the product, and splitting on it would shred a sentence that merely used
 * one.
 */
const INLINE_BULLET = /[●•‣▪]/g;

/** Ends a sentence, followed by the start of the next one. */
const SENTENCE_BREAK = /(?<=[.!?])\s+(?=["'(]?[A-Z0-9])/;

/**
 * The last resort, and only for text that is not made of sentences at all.
 *
 * Grants.gov publishes "Eligible Applicants" as a list and delivers it as one
 * run-on string. Measured across the published set, the worst is 763
 * characters with fifteen semicolons and not a single full stop — a half page
 * of prose that is really a list of applicant types:
 *
 *   "Nonprofits having a 501(c)(3) status with the IRS, other than
 *    institutions of higher education; County governments; Native American
 *    tribal governments (Federally recognized); ..."
 *
 * Checked after sentence splitting, never before. A notice that *is* made of
 * sentences may still use semicolons inside one of them — the CYFAR text lists
 * four institution types that way inside its first sentence — and splitting
 * there would strand "1862 Land-grant Colleges and Universities" as a bullet
 * with no idea what it is a list of.
 */
const SEMICOLON_LIST = /\s*;\s*/;
const MIN_SEMICOLONS_FOR_LIST = 2;

function endsWithAbbreviation(text: string): boolean {
  const trimmed = text.trimEnd();

  if (!trimmed.endsWith(".")) {
    return false;
  }

  const withoutStop = trimmed.slice(0, -1);
  const lastWord = withoutStop.split(/[\s(]/).pop() ?? "";

  // A lone initial — "West Virginia State University, J." — is also not a
  // sentence ending.
  if (/^[A-Z]$/.test(lastWord)) {
    return true;
  }

  return ABBREVIATIONS.some(
    (abbreviation) => lastWord.toLowerCase() === abbreviation.toLowerCase(),
  );
}

/** Re-joins fragments that were split at an abbreviation rather than a sentence end. */
function healAbbreviations(parts: readonly string[]): string[] {
  const healed: string[] = [];

  for (const part of parts) {
    const previous = healed[healed.length - 1];

    if (previous !== undefined && endsWithAbbreviation(previous)) {
      healed[healed.length - 1] = `${previous} ${part}`;
      continue;
    }

    healed.push(part);
  }

  return healed;
}

/**
 * Splits eligibility prose into bullet points, or returns null when it should
 * stay a paragraph.
 *
 * Null rather than a one-item array on purpose: a single bullet is a paragraph
 * wearing a dot, and the caller should render it as the paragraph it is.
 */
export function toEligibilityPoints(text: string | null): readonly string[] | null {
  if (text === null) {
    return null;
  }

  const trimmed = text.trim();

  if (trimmed === "") {
    return null;
  }

  // The agency's own list wins over anything inferred. Lines are only treated
  // as a list when they are actually marked as one — a paragraph that happens
  // to contain newlines is still a paragraph.
  const lines = trimmed
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const marked = lines.filter((line) => EXPLICIT_MARKER.test(line));

  if (marked.length > 1) {
    return marked.map((line) => line.replace(EXPLICIT_MARKER, "").trim()).filter((l) => l !== "");
  }

  // Glyph bullets run together on one line. Two or more means the agency was
  // writing a list, whatever the whitespace says.
  if ((trimmed.match(INLINE_BULLET) ?? []).length > 1) {
    const items = trimmed
      .split(INLINE_BULLET)
      .map((item) => item.trim())
      .filter((item) => item !== "");

    if (items.length > 1) {
      return items;
    }
  }

  const sentences = healAbbreviations(
    trimmed
      .split(SENTENCE_BREAK)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence !== ""),
  );

  if (sentences.length > 1) {
    return sentences;
  }

  // Not sentences, but semicolons doing a list's job.
  if ((trimmed.match(/;/g) ?? []).length >= MIN_SEMICOLONS_FOR_LIST) {
    const items = trimmed
      .split(SEMICOLON_LIST)
      .map((item) => item.trim())
      .filter((item) => item !== "");

    if (items.length > 1) {
      return items;
    }
  }

  /**
   * Everything else stays a paragraph, and the commonest reason is worth
   * stating: the remaining notices are comma-delimited applicant lists whose
   * items *contain* commas. Splitting
   *
   *   "Nonprofits having a 501(c)(3) status with the IRS, other than
   *    institutions of higher education, Special district governments"
   *
   * on commas yields a bullet reading "other than institutions of higher
   * education" — a qualifier promoted to an eligible category, which inverts
   * an exclusion into an inclusion. That is a false statement about who may
   * apply, and worse than a paragraph someone has to read twice.
   */
  return null;
}
