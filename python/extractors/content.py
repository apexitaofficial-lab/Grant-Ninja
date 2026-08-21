"""Content cleaning.

Part 4B §6: navigation, banners, scripts and footers are removed before AI ever
sees the page. This is not cosmetic — boilerplate is most of a government
page's bytes, and every one of them is a token we would pay for and a chance
for the model to quote a cookie notice as eligibility criteria.

This module never calls AI. Extraction and interpretation stay separate (§146).
"""

from __future__ import annotations

import re

from bs4 import BeautifulSoup

_NOISE_TAGS = ("script", "style", "nav", "header", "footer", "aside", "form", "noscript", "iframe")

# Phrases no grant notice would ever contain, dropped at any length.
#
# These are verbatim government-template strings. The .gov trust banner is the
# single highest-value rule in this project — left in, it is paid for on every
# fetch, forever — and it arrives as one ~165-character line combining two
# sentences, so the short-line guard below never sees it.
_ALWAYS_NOISE = re.compile(
    r"(safely\s+connected\s+to\s+the\s+\.gov\s+website"
    r"|share\s+sensitive\s+information\s+only\s+on\s+official"
    r"|belongs\s+to\s+an\s+official\s+government\s+organization"
    r"|official\s+websites?\s+use\s+\.gov"
    r"|your\s+session\s+will\s+expire\s+in"
    r"|this\s+is\s+being\s+done\s+to\s+protect\s+your\s+privacy"
    r"|to\s+continue\s+working,\s+click"
    r"|unsaved\s+changes\s+will\s+be\s+lost"
    r"|open\s+default\s+modal)",
    re.IGNORECASE,
)

# Weaker signals. A long paragraph containing one of these is more likely to be
# real eligibility text than a banner, so these only apply to short lines.
_NOISE_PATTERNS = re.compile(
    r"(cookie|privacy\s+policy|skip\s+to\s+main|javascript\s+is\s+disabled"
    r"|official\s+websites?\s+(use|of)\s|secure\s+\.gov\s+websites"
    r"|share\s+sensitive\s+information\s+only"
    r"|you'?ve\s+been\s+logged\s+out)",
    re.IGNORECASE,
)

_BLANK_LINES = re.compile(r"\n{3,}")

# Markdown noise that survives Crawl4AI's conversion.
#
# Inline SVG icons come through as base64 data URIs — a single government
# header can contribute tens of thousands of characters of them. Left in, they
# would dominate the prompt, cost real money per page, and give the model
# nothing but an opportunity to be confused.
_MARKDOWN_IMAGE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
_DATA_URI = re.compile(r"\(data:[^)]*\)")
# [visible text](url) -> visible text. The URL carries no meaning for
# extraction, and application links are captured from structured fields.
_MARKDOWN_LINK = re.compile(r"\[([^\]]+)\]\((?:[^)]*)\)")
_BARE_URL = re.compile(r"<https?://[^>]+>")


def html_to_text(html: str) -> str:
    """Readable text from raw HTML, boilerplate removed."""
    soup = BeautifulSoup(html, "lxml")

    for tag in soup(_NOISE_TAGS):
        tag.decompose()

    # Prefer the semantic content region when the page marks one.
    main = soup.find("main") or soup.find(attrs={"role": "main"}) or soup.body or soup

    text = main.get_text(separator="\n", strip=True)

    return collapse_blank_lines(text)


def collapse_blank_lines(text: str) -> str:
    return _BLANK_LINES.sub("\n\n", text).strip()


def strip_boilerplate_lines(text: str) -> str:
    """Drops the short banner lines that survive tag removal.

    Two tiers. Verbatim government-template phrases go at any length, because
    nothing else on the page says them. The weaker keyword list applies only to
    short lines: a long paragraph mentioning "privacy policy" is probably real
    eligibility text, and losing it would be worse than keeping one banner.
    """
    kept = [
        line
        for line in text.splitlines()
        if not _ALWAYS_NOISE.search(line)
        and not (len(line.strip()) < 90 and _NOISE_PATTERNS.search(line))
    ]

    return collapse_blank_lines("\n".join(kept))


def clean_markdown(markdown: str) -> str:
    """Strips image, data-URI and link noise from Crawl4AI's markdown.

    Order matters: images are removed before links, or the link rule would
    leave a stray `!` behind for every icon.
    """
    without_images = _MARKDOWN_IMAGE.sub("", markdown)
    without_data = _DATA_URI.sub("", without_images)
    text_only_links = _MARKDOWN_LINK.sub(r"\1", without_data)
    without_bare_urls = _BARE_URL.sub("", text_only_links)

    return collapse_blank_lines(without_bare_urls)


def prepare_for_ai(content: str, max_chars: int = 60_000) -> str:
    """Final trim before the prompt.

    Grant notices bury the detail near the top; an appendix of unrelated
    programmes at the bottom adds cost without adding signal. The cap is
    generous enough that truncation is rare and logged when it happens.
    """
    cleaned = strip_boilerplate_lines(clean_markdown(content))

    if len(cleaned) <= max_chars:
        return cleaned

    return cleaned[:max_chars].rsplit("\n", 1)[0]
