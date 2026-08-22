"""Lookups that turn extracted free text into foreign keys.

Gemini returns "National Science Foundation", not a UUID. This is where that
becomes `organization_id`, and where an unrecognised name becomes an explicit
miss rather than a silently dropped grant.
"""

from __future__ import annotations

import re
from functools import lru_cache

from postgrest.exceptions import APIError
from rapidfuzz import fuzz, process

from repositories.base import BaseRepository

# Words that never contribute a letter to an agency acronym.
_ACRONYM_SKIP = {"of", "and", "for", "the", "a", "an", "in", "on", "to"}
# A leading national qualifier is dropped in the second candidate, so
# "U.S. National Science Foundation" yields NSF as well as UNSF.
_NATIONAL_PREFIX = {"us", "usa", "united", "states"}
_WORD_SPLIT = re.compile(r"[\s\-/,]+")


def acronyms_of(name: str) -> set[str]:
    """Plausible acronyms for an agency name.

    Fuzzy string matching cannot connect "NASA" to "National Aeronautics and
    Space Administration" — measured, that pair scores about 30, far below any
    usable threshold, because they share almost no characters. Agencies are
    written both ways constantly, so without this the directory ends up with
    one row per spelling.

    Returns a set because a name can reasonably shorten more than one way.
    """
    words = [re.sub(r"[^A-Za-z]", "", word) for word in _WORD_SPLIT.split(name)]
    significant = [word for word in words if word and word.lower() not in _ACRONYM_SKIP]

    if not significant:
        return set()

    candidates = {"".join(word[0] for word in significant).upper()}

    trimmed = significant

    while trimmed and trimmed[0].lower() in _NATIONAL_PREFIX:
        trimmed = trimmed[1:]

    if trimmed and trimmed is not significant:
        candidates.add("".join(word[0] for word in trimmed).upper())

    return {candidate for candidate in candidates if len(candidate) >= 2}


def same_agency(name_a: str, name_b: str) -> bool:
    """True when one name is written out and the other is its acronym.

    Deliberately one-directional in meaning: two *different* long names that
    happen to share an acronym are not treated as the same body, because they
    usually are not.
    """
    normalized_a = re.sub(r"[^A-Za-z]", "", name_a).upper()
    normalized_b = re.sub(r"[^A-Za-z]", "", name_b).upper()

    return normalized_a in acronyms_of(name_b) or normalized_b in acronyms_of(name_a)


def name_probes(name: str) -> list[str]:
    """The name, then its leading comma-separated part.

    Notices routinely qualify an agency with its parent — "Bureau of African
    Affairs, Department of State". Measured against the stored name, that whole
    string scores 70, below any threshold worth using, while its first part
    matches exactly.

    Only the *first* part is probed, and that is the point. These names are
    written specific-first, so the leading part is the agency and the rest is
    context. Probing the trailing parts too would quietly file an unrecognised
    bureau under its parent department — a grant that looks correctly published
    while sitting under the wrong agency, which is the failure this whole
    matcher exists to avoid. An unknown bureau is held for review instead.

    Splitting also beats lowering the threshold: with 160 federal agencies
    stored, a loose threshold starts misfiling outright.
    """
    stripped = name.strip()
    probes = [stripped]
    head, separator, _ = stripped.partition(",")

    if separator and head.strip():
        probes.append(head.strip())

    return [probe for probe in probes if probe]


def _match_one(name: str, lookup: dict[str, dict[str, str]], threshold: int) -> dict[str, str] | None:
    """One name against every stored agency: acronym first, then fuzzy."""
    # Acronyms first: fuzzy scoring cannot see that "NIH" and "National
    # Institutes of Health" are one body, and notices use both freely.
    for candidate_name, organization in lookup.items():
        if same_agency(name, candidate_name):
            return organization

    match = process.extractOne(name, lookup.keys(), scorer=fuzz.token_sort_ratio)

    if match is None:
        return None

    matched_name, score, _ = match

    return lookup[matched_name] if score >= threshold else None


class ReferenceRepository(BaseRepository):
    entity_name = "Reference"

    # --- countries ----------------------------------------------------------

    def list_countries(self) -> list[dict[str, str]]:
        try:
            response = (
                self._table("countries")
                .select("id, name, slug, iso_code, iso_code_3, currency")
                .execute()
            )
        except APIError as error:
            raise self._fail("list_countries", error) from error

        return response.data

    def find_country(self, name_or_slug: str) -> dict[str, str] | None:
        """Matches on slug, name or either ISO code — a model may return any.

        `iso_code_3` is here because it was missing: a California notice made
        the model answer "USA", which matched nothing, and the grant fell back
        to the default country with a warning. Right answer by luck, from a
        lookup that had failed.
        """
        needle = name_or_slug.strip().lower()

        for country in self.list_countries():
            if needle in {
                country["slug"].lower(),
                country["name"].lower(),
                (country.get("iso_code") or "").lower(),
                (country.get("iso_code_3") or "").lower(),
            }:
                return country

        return None

    # --- organizations ------------------------------------------------------

    def list_organizations(self, country_id: str | None = None) -> list[dict[str, str]]:
        try:
            query = self._table("organizations").select("id, name, slug, country_id")

            if country_id is not None:
                query = query.eq("country_id", country_id)

            return query.execute().data
        except APIError as error:
            raise self._fail("list_organizations", error) from error

    def match_organization(
        self, name: str, country_id: str, threshold: int = 88
    ) -> dict[str, str] | None:
        """Fuzzy-matches an agency name to an existing row.

        Agencies are written inconsistently across notices — "NSF", "National
        Science Foundation", "U.S. National Science Foundation". An exact match
        would create a duplicate agency for each spelling, so anything above
        `threshold` is treated as the same body. Below it, the caller decides
        whether to create a new organization or flag for review — guessing here
        is how a database ends up with four NSFs.
        """
        candidates = self.list_organizations(country_id)

        if not candidates:
            return None

        lookup = {organization["name"]: organization for organization in candidates}

        for probe in name_probes(name):
            match = _match_one(probe, lookup, threshold)

            if match is not None:
                return match

        self.log.debug("No confident agency match for {name!r}", name=name)

        return None

    def find_organization_by_id(self, organization_id: str) -> dict[str, str] | None:
        try:
            rows = (
                self._table("organizations")
                .select("id, name, slug, country_id")
                .eq("id", organization_id)
                .limit(1)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("find_organization_by_id", error) from error

        return self._first(rows)

    def upsert_organization(self, row: dict[str, str]) -> bool:
        """Adds an agency if its slug is not already taken.

        Only ever called with names from a government system of record — never
        with a name a model read off a page. `match_organization` is the path
        for those, and it deliberately returns None rather than creating
        anything.

        Returns True when a row was inserted.
        """
        existing = (
            self._table("organizations").select("id").eq("slug", row["slug"]).limit(1).execute().data
        )

        if existing:
            return False

        try:
            self._table("organizations").insert(row).execute()
        except APIError as error:
            self.log.warning(
                "Could not insert organization {name!r}: {message}",
                name=row.get("name"),
                message=error.message,
            )

            return False

        return True

    # --- categories ---------------------------------------------------------

    def list_categories(self) -> list[dict[str, str]]:
        try:
            return self._table("grant_categories").select("id, name, slug").execute().data
        except APIError as error:
            raise self._fail("list_categories", error) from error

    def match_categories(self, names: list[str], threshold: int = 82) -> list[dict[str, str]]:
        """Resolves classification labels to category rows, best match first."""
        categories = self.list_categories()

        if not categories or not names:
            return []

        lookup = {category["name"]: category for category in categories}
        matched: list[dict[str, str]] = []

        for name in names:
            result = process.extractOne(name, lookup.keys(), scorer=fuzz.token_sort_ratio)

            if result is None:
                continue

            matched_name, score, _ = result

            if score >= threshold and lookup[matched_name] not in matched:
                matched.append(lookup[matched_name])

        return matched

    # --- settings -----------------------------------------------------------

    @lru_cache(maxsize=1)  # noqa: B019 — one settings read per process is intended
    def get_settings_map(self) -> dict[str, object]:
        """Runtime settings owned by the admin panel, not by `.env`.

        The auto-publish threshold lives here (decision D3), so an operator can
        change it without a deploy.
        """
        try:
            rows = self._table("system_settings").select("key, value").execute().data
        except APIError as error:
            raise self._fail("get_settings_map", error) from error

        return {row["key"]: row["value"] for row in rows}

    def get_auto_publish_threshold(self, default: int = 85) -> int:
        value = self.get_settings_map().get("auto_publish_confidence_threshold", default)

        return int(value) if isinstance(value, (int, float, str)) else default

    def find_category_by_slug(self, slug: str) -> dict[str, str] | None:
        for category in self.list_categories():
            if category["slug"] == slug:
                return category

        return None

    def get_fallback_category(self) -> dict[str, str] | None:
        """The catch-all category, if one is configured.

        Named in `system_settings` rather than in code so it can be repointed
        from the admin panel. An empty setting disables the fallback, which
        sends unmatched grants to review instead — the behaviour before this
        existed, still available without a code change.
        """
        slug = self.get_settings_map().get("fallback_category_slug", "")

        if not isinstance(slug, str) or not slug.strip():
            return None

        category = self.find_category_by_slug(slug.strip())

        if category is None:
            self.log.warning(
                "fallback_category_slug is {slug!r} but no such category exists",
                slug=slug,
            )

        return category
