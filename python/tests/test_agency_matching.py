"""Resolving an agency name to a stored organization.

Getting this wrong is quiet and expensive: a grant filed under the wrong bureau
looks published and correct, and nobody notices until an applicant follows it.
Holding a grant back is recoverable; misfiling it is not. These tests pin the
two rules that let matching be strict without being useless — acronyms and
parent-department qualifiers.
"""

from __future__ import annotations

import pytest

from repositories.reference import (
    ReferenceRepository,
    acronyms_of,
    name_probes,
    same_agency,
)


class _StubReference(ReferenceRepository):
    """Bypasses `__init__` so no Supabase client is constructed."""

    def __init__(self, organizations: list[dict[str, str]]) -> None:  # noqa: super-init-not-called
        self._organizations = organizations

        class _NullLog:
            def debug(self, *_args, **_kwargs) -> None:
                return None

        self.log = _NullLog()

    def list_organizations(self, country_id: str | None = None) -> list[dict[str, str]]:
        return self._organizations


FEDERAL = [
    {"id": "nsf", "name": "U.S. National Science Foundation"},
    {"id": "nih", "name": "National Institutes of Health"},
    {"id": "afr", "name": "Bureau of African Affairs"},
    {"id": "edu", "name": "Bureau of Educational and Cultural Affairs"},
    {"id": "ovc", "name": "Office for Victims of Crime"},
    {"id": "state", "name": "Department of State"},
]


def _match(name: str):
    return _StubReference(FEDERAL).match_organization(name, country_id="us")


class TestAcronyms:
    @pytest.mark.parametrize(
        ("name", "expected"),
        [
            ("National Aeronautics and Space Administration", "NASA"),
            ("National Institutes of Health", "NIH"),
            ("Office for Victims of Crime", "OVC"),
        ],
    )
    def test_builds_the_conventional_acronym(self, name: str, expected: str) -> None:
        assert expected in acronyms_of(name)

    def test_drops_a_leading_national_qualifier(self) -> None:
        """"U.S. National Science Foundation" is still NSF."""
        assert "NSF" in acronyms_of("U.S. National Science Foundation")

    def test_an_acronym_matches_its_expansion(self) -> None:
        assert same_agency("NIH", "National Institutes of Health")
        assert same_agency("National Institutes of Health", "NIH")

    def test_unrelated_agencies_do_not_match(self) -> None:
        assert not same_agency("NASA", "National Science Foundation")

    def test_matching_resolves_an_acronym_to_the_stored_row(self) -> None:
        """RapidFuzz alone scores this pair around 30 — far below any threshold."""
        matched = _match("NIH")

        assert matched is not None
        assert matched["id"] == "nih"


class TestParentQualifiers:
    def test_sub_agency_with_its_department_resolves_to_the_sub_agency(self) -> None:
        """The whole string scores 70 against the stored name; the part scores 100."""
        matched = _match("Bureau of African Affairs, Department of State")

        assert matched is not None
        assert matched["id"] == "afr"

    def test_an_unknown_bureau_is_not_absorbed_into_its_parent(self) -> None:
        """"Department of State" is stored, but this bureau is not.

        Matching the parent would publish the grant under the wrong agency and
        look entirely correct while doing it.
        """
        assert _match("Bureau of Consular Affairs, Department of State") is None

    def test_an_acronym_qualified_by_its_department_still_resolves(self) -> None:
        """The leading part is the agency even when it is the shorter string."""
        matched = _match("NIH, Department of Health and Human Services")

        assert matched is not None
        assert matched["id"] == "nih"

    def test_probes_are_the_whole_name_then_its_leading_part(self) -> None:
        assert name_probes("Bureau of African Affairs, Department of State") == [
            "Bureau of African Affairs, Department of State",
            "Bureau of African Affairs",
        ]

    def test_a_name_without_commas_probes_once(self) -> None:
        assert name_probes("Office for Victims of Crime") == ["Office for Victims of Crime"]


class TestRefusal:
    def test_an_unknown_agency_returns_none_rather_than_a_guess(self) -> None:
        """The pipeline holds the grant. Inventing an agency is permanent."""
        assert _match("Ministry of Imaginary Affairs") is None

    def test_no_stored_agencies_is_not_a_match(self) -> None:
        assert _StubReference([]).match_organization("Anything", country_id="us") is None
