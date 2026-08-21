# GEMINI_PROMPTS.md

Project
Grant Ninja

Purpose

This document contains every prompt used by the AI pipeline.

Prompts should never be hardcoded inside Python.

Each prompt should have

- Name
- Version
- Purpose
- Input
- Expected Output

Every prompt must return JSON only.

---

# Prompt 1 — Grant Extraction

Version
1.0

Purpose

Extract structured grant information from cleaned webpage content.

Input

Markdown content extracted from Crawl4AI.

Prompt

You are an expert research grant analyst.

Extract all available grant information from the provided content.

Return ONLY valid JSON.

Schema

{
"title":"",
"description":"",
"funding_amount":"",
"currency":"",
"deadline":"",
"opening_date":"",
"eligibility":"",
"organization":"",
"country":"",
"state":"",
"grant_type":"",
"industry":"",
"application_url":"",
"official_url":"",
"required_documents":[],
"keywords":[],
"confidence":95
}

Rules

Do not invent information.

Leave fields empty if unavailable.

---

# Prompt 2 — AI Summary

Purpose

Generate a human-friendly grant summary.

Length

150-250 words.

Prompt

Write a concise summary of this grant.

Explain

- Purpose
- Who should apply
- Funding
- Deadline
- Benefits

Do not exaggerate.

Do not invent information.

---

# Prompt 3 — FAQ Generation

Generate between 5 and 10 FAQs.

Each FAQ should include

Question

Answer

Return JSON

[
{
"question":"",
"answer":""
}
]

---

# Prompt 4 — Answer Capsules

Generate concise answers for AI systems.

Examples

What is this grant?

Who can apply?

How much funding?

How do I apply?

Each answer

40-80 words.

---

# Prompt 5 — SEO Metadata

Generate

Meta Title

Meta Description

Keywords

Slug

Canonical URL

Return JSON.

---

# Prompt 6 — Grant Classification

Classify the grant into

Category

Industry

Research Area

Grant Type

Return JSON only.

---

# Prompt 7 — Duplicate Detection

Compare Grant A and Grant B.

Determine whether

Same Grant

Updated Version

Different Grant

Return

{
"duplicate":true,
"confidence":98,
"reason":""
}

---

# Prompt 8 — Related Grants

Given one grant,

recommend five related grants.

Return only grant IDs if available.

---

# Prompt 9 — Page Improvement

Review a page.

Suggest improvements for

SEO

Readability

AI Friendliness

Schema

Accessibility

Return JSON.

---

# Prompt 10 — Grant Validation

Validate extracted information.

Check

Missing Fields

Incorrect Dates

Broken URLs

Funding

Return

Valid

Warnings

Errors

---

Rules

Every prompt

✓ Version controlled

✓ JSON output

✓ Temperature low

✓ No hallucinations

✓ Fact based

End of GEMINI_PROMPTS.md
