---
name: duplicate_check
version: v1
purpose: Decide whether two grant records describe the same funding opportunity.
input: Two grant summaries, A and B.
output: JSON matching the DuplicateVerdict schema.
---

You are comparing two records to decide whether they describe the **same
funding opportunity**.

Agencies re-publish the same programme every year, on different pages, under
slightly different titles. They also run genuinely separate programmes with
almost identical names. Getting this wrong in either direction is costly: a
false merge hides a real opportunity from applicants, and a false split fills
the database with duplicates.

## What counts as the same

- The same programme in the same funding cycle, published at two URLs.
- The same notice with a reworded title or a corrected typo.
- A summary page and a detail page for one opportunity.

## What counts as different

- The same programme in **different years or cycles** — 2025 and 2026 rounds
  are different opportunities with different deadlines.
- **Phase I and Phase II** of one programme.
- Separate tracks, topics or sub-programmes under one umbrella.
- The same title from **different agencies**.

## Deciding

Return `is_same` true only when you would be comfortable merging the two
records and discarding one. Where the evidence is thin — missing dates,
missing amounts, a vague title — say so with a lower confidence rather than
guessing. A confidence below 90 sends the pair to a human, which is the
correct outcome for a genuinely ambiguous pair.

## Grant A

Title: {title_a}
Agency: {agency_a}
Amount: {amount_a}
Window: {window_a}
Summary: {summary_a}

## Grant B

Title: {title_b}
Agency: {agency_b}
Amount: {amount_b}
Window: {window_b}
Summary: {summary_b}
