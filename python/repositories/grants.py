"""Grant reads and writes.

The publish path goes through the `publish_grant` database function rather
than a sequence of REST calls, so a grant can never end up published without
its version history.
"""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from repositories.base import BaseRepository


class GrantRepository(BaseRepository):
    entity_name = "Grant"

    def find_by_slug(self, slug: str) -> dict[str, Any] | None:
        try:
            rows = (
                self._table("grants")
                .select("id, slug, title, content_hash, status, organization_id, country_id")
                .eq("slug", slug)
                .limit(1)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("find_by_slug", error) from error

        return self._first(rows)

    def find_by_source_url(self, source_url: str) -> dict[str, Any] | None:
        """The strongest identity signal: the same page is the same grant."""
        try:
            rows = (
                self._table("grants")
                .select("id, slug, title, content_hash, status")
                .eq("source_url", source_url)
                .limit(1)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("find_by_source_url", error) from error

        return self._first(rows)

    def find_by_content_hash(self, content_hash: str) -> dict[str, Any] | None:
        try:
            rows = (
                self._table("grants")
                .select("id, slug, title")
                .eq("content_hash", content_hash)
                .limit(1)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("find_by_content_hash", error) from error

        return self._first(rows)

    def list_titles_for_matching(self, organization_id: str, country_id: str) -> list[dict[str, Any]]:
        """Candidates for fuzzy comparison.

        Scoped to one agency in one country: two grants with similar titles
        from different agencies are usually genuinely different programmes,
        and comparing across the whole table would both mislead and not scale.
        """
        try:
            return (
                self._table("grants")
                .select("id, slug, title, status")
                .eq("organization_id", organization_id)
                .eq("country_id", country_id)
                .is_("deleted_at", "null")
                .limit(500)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("list_titles_for_matching", error) from error

    def slug_exists(self, slug: str) -> bool:
        return self.find_by_slug(slug) is not None

    def find_slug(self, grant_id: str) -> str | None:
        """The slug of a known grant.

        `publish_grant` keys on slug, so updating an existing grant means
        sending that grant's slug. Anything else inserts a second row.
        """
        try:
            rows = self._table("grants").select("slug").eq("id", grant_id).limit(1).execute().data
        except APIError as error:
            raise self._fail("find_slug", error) from error

        row = self._first(rows)

        return str(row["slug"]) if row else None

    def publish(
        self,
        grant_row: dict[str, Any],
        category_ids: list[str],
        primary_category_id: str | None,
        change_reason: str,
        actor: str = "crawler",
    ) -> str:
        """Writes the grant, its categories, a version and a history entry.

        One transaction, server side. Returns the grant id.
        """
        try:
            response = self.client.rpc(
                "publish_grant",
                {
                    "p_grant": grant_row,
                    "p_category_ids": category_ids,
                    "p_primary_category_id": primary_category_id,
                    "p_change_reason": change_reason,
                    "p_actor": actor,
                },
            ).execute()
        except APIError as error:
            raise self._fail("publish", error) from error

        return str(response.data)

    def record_duplicate(
        self,
        grant_a_id: str,
        grant_b_id: str,
        confidence: int,
        decision: str,
        method: str,
    ) -> None:
        """Records a duplicate pair for the admin review queue.

        The pair is stored in a stable order because the table has a
        `grant_a_id < grant_b_id` check — without sorting, the same pair could
        be inserted twice and show up twice in the queue.
        """
        first, second = sorted([grant_a_id, grant_b_id])

        try:
            self._table("duplicate_detection").upsert(
                {
                    "grant_a_id": first,
                    "grant_b_id": second,
                    "confidence": confidence,
                    "decision": decision,
                    "method": method,
                },
                on_conflict="grant_a_id,grant_b_id",
            ).execute()
        except APIError as error:
            # A duplicate flag is useful, not essential. Losing one must not
            # abandon an otherwise good extraction.
            self.log.warning("Could not record duplicate pair: {message}", message=error.message)


grant_repository = GrantRepository()
