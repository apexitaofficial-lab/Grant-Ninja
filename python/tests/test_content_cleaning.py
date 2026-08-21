"""Content cleaning and change detection.

The rules here were written against a real grants.gov fetch: the first run
returned 2,830 characters that were almost entirely base64 icon data, which
would have been paid for on every page, forever.
"""

from __future__ import annotations

from core.hashing import content_hash, has_changed
from extractors.content import clean_markdown, prepare_for_ai, strip_boilerplate_lines


class TestMarkdownCleaning:
    def test_removes_base64_icon_images(self) -> None:
        markdown = (
            "# Search funding opportunities\n"
            "![](data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e)\n"
            "Real content here."
        )

        cleaned = clean_markdown(markdown)

        assert "data:image" not in cleaned
        assert "Search funding opportunities" in cleaned
        assert "Real content here." in cleaned

    def test_keeps_link_text_and_drops_the_url(self) -> None:
        cleaned = clean_markdown("Apply via [Grants.gov](https://www.grants.gov/apply?x=1).")

        assert "Grants.gov" in cleaned
        assert "https://" not in cleaned

    def test_leaves_no_stray_bang_from_images(self) -> None:
        """Images must be removed before links, or every icon leaves a `!`."""
        assert "!" not in clean_markdown("![alt](https://example.gov/icon.png)")

    def test_removes_bare_angle_bracket_urls(self) -> None:
        assert "example.gov" not in clean_markdown("See <https://example.gov/notice>")


class TestBoilerplate:
    def test_strips_the_dot_gov_trust_banner(self) -> None:
        text = (
            "**Official websites use .gov**\n"
            "A .gov website belongs to an official government organization in the United States.\n"
            "Secure .gov websites use HTTPS\n"
            "Share sensitive information only on official, secure websites.\n"
            "Award ceiling: $305,000"
        )

        cleaned = strip_boilerplate_lines(text)

        assert "Award ceiling: $305,000" in cleaned
        assert ".gov website belongs" not in cleaned
        assert "Share sensitive information" not in cleaned

    def test_keeps_long_paragraphs_that_merely_mention_a_banned_word(self) -> None:
        """A long eligibility paragraph must survive even if it says 'privacy'."""
        paragraph = (
            "Applicants must describe how participant privacy policy obligations will be met "
            "throughout the study, including data retention, consent withdrawal and the "
            "handling of identifiable records across every participating institution."
        )

        assert paragraph in strip_boilerplate_lines(paragraph)

    def test_prepare_for_ai_truncates_on_a_line_boundary(self) -> None:
        content = "\n".join(f"line {index}" for index in range(1, 500))

        prepared = prepare_for_ai(content, max_chars=100)

        assert len(prepared) <= 100
        assert not prepared.endswith("lin")


class TestChangeDetection:
    def test_reindenting_alone_is_not_a_change(self) -> None:
        """Re-indented HTML must not trigger a paid re-extraction."""
        assert content_hash("  Award   ceiling  \n$305,000") == content_hash(
            "Award ceiling\n  $305,000"
        )

    def test_blank_lines_are_not_a_change(self) -> None:
        assert content_hash("Award ceiling\n\n\n$305,000") == content_hash("Award ceiling\n$305,000")

    def test_reordered_lines_are_not_a_change(self) -> None:
        """The bug this cost the most to find.

        Grants.gov renders its "Eligible Applicants" list in a different order
        on every request. Hashing the sequence reported almost every page as
        changed on every crawl, paying for a re-extraction each time.
        """
        first = "Eligible Applicants:\nState governments\nCounty governments\nCity governments"
        second = "Eligible Applicants:\nCity governments\nState governments\nCounty governments"

        assert content_hash(first) == content_hash(second)

    def test_reordered_table_cells_are_not_a_change(self) -> None:
        """The real shape of the bug, verbatim from grants.gov.

        The list is a markdown table, so the first value carries the row label
        and the last a trailing separator. Reordering moves those markers onto
        different values, so sorting whole lines is not enough.
        """
        first = "| Eligible Applicants:  | State governments\nCounty governments\nCity governments  |"
        second = "| Eligible Applicants:  | City governments\nState governments\nCounty governments  |"

        assert content_hash(first) == content_hash(second)

    def test_a_changed_value_inside_a_table_is_still_a_change(self) -> None:
        first = "| Award Ceiling:  | $305,000  |"
        second = "| Award Ceiling:  | $500,000  |"

        assert content_hash(first) != content_hash(second)

    def test_an_added_line_is_still_a_change(self) -> None:
        """Order-insensitive must not mean content-insensitive."""
        first = "State governments\nCounty governments"
        second = "State governments\nCounty governments\nTribal governments"

        assert content_hash(first) != content_hash(second)

    def test_an_edited_line_is_still_a_change(self) -> None:
        assert content_hash("Closes 1 June\nAward $50,000") != content_hash(
            "Closes 8 June\nAward $50,000"
        )

    def test_real_edits_are_detected(self) -> None:
        changed, _ = has_changed(content_hash("Closes 1 June"), "Closes 8 June")

        assert changed

    def test_a_page_never_seen_before_counts_as_changed(self) -> None:
        changed, new_hash = has_changed(None, "anything")

        assert changed
        assert len(new_hash) == 64
