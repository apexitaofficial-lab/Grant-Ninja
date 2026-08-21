"""Content fingerprinting.

Part 4B §10: before anything is sent to Gemini, the cleaned content is hashed
and compared with the previous crawl. An unchanged hash skips AI, the database
write and SEO regeneration entirely.

This is the single biggest cost lever in the pipeline. A grant page that has
not changed since yesterday costs one HTTP request instead of one AI call.
"""

from __future__ import annotations

import hashlib
import re

# Collapse whitespace before hashing: a page that only re-indented its HTML
# has not changed in any way a reader or an AI would notice, and treating it
# as changed would pay for an extraction that produces identical output.
_WHITESPACE = re.compile(r"[^\S\n]+")


def normalize_for_hash(content: str) -> str:
    """Canonical form for comparison: same content always yields same text.

    The content is reduced to a *sorted multiset of table cells*, and both
    halves of that were forced by measurement.

    Grants.gov renders list blocks — "Eligible Applicants" is the usual
    culprit — in a different order on every request. Across two fetches seconds
    apart, three of four grant pages differed only by that ordering. Hashing
    the sequence therefore reported "changed" on nearly every page of every
    crawl, which would mean paying Gemini to re-extract unchanged grants
    forever: exactly the cost this hash exists to prevent, lost to a detail of
    someone else's template.

    Sorting whole lines was not enough. The list is rendered as a markdown
    table, so the first item carries a `| Eligible Applicants: |` prefix and
    the last a trailing `|`. Reordering moves those markers onto different
    items, changing the line text itself. Splitting on the cell separator first
    puts the label and each value on their own footing, so the multiset is
    stable however the rows are shuffled.

    The trade is deliberate: content that was only reordered counts as
    unchanged, which for a grant notice is the right answer — an eligibility
    list means the same thing in any order. Adding, removing or editing a value
    still changes the hash.
    """
    cells = (
        _WHITESPACE.sub(" ", cell).strip()
        for line in content.splitlines()
        for cell in line.split("|")
    )

    return "\n".join(sorted(cell for cell in cells if cell))


def content_hash(content: str) -> str:
    """SHA256 of the normalized content, hex encoded."""
    return hashlib.sha256(normalize_for_hash(content).encode("utf-8")).hexdigest()


def has_changed(previous: str | None, current_content: str) -> tuple[bool, str]:
    """Returns (changed, new_hash).

    A missing previous hash counts as changed — a page never seen before must
    always be processed.
    """
    new_hash = content_hash(current_content)

    return (previous != new_hash, new_hash)
