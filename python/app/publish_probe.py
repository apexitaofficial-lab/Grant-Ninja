"""Exercise the publish path end to end against the real database.

    python -m app.publish_probe

Writes one grant through `publish_grant`, confirms the version and history
rows were created in the same transaction, publishes again unchanged to prove
that is a no-op, then removes everything it created.

This verifies the transaction, not the crawler — it uses a fixed fake grant so
the result does not depend on what a government website happens to say today.
"""

from __future__ import annotations

import sys
from decimal import Decimal

from core.database import get_client
from core.logging import get_logger
from models.grant import GrantFundingType, GrantStatus, NormalizedGrant
from repositories.grants import grant_repository
from repositories.reference import ReferenceRepository

log = get_logger("publish-probe")

PROBE_SLUG = "zz-publish-probe-delete-me"


def _cleanup(client) -> None:  # noqa: ANN001
    rows = client.table("grants").select("id").eq("slug", PROBE_SLUG).execute().data

    for row in rows:
        client.table("grant_versions").delete().eq("grant_id", row["id"]).execute()
        client.table("grant_history").delete().eq("grant_id", row["id"]).execute()
        client.table("grant_category_relations").delete().eq("grant_id", row["id"]).execute()
        client.table("grants").delete().eq("id", row["id"]).execute()


def main() -> int:
    client = get_client()
    reference = ReferenceRepository()

    _cleanup(client)

    country = reference.find_country("united-states")
    organizations = reference.list_organizations(country["id"])
    categories = reference.list_categories()

    if not organizations or not categories:
        log.error("Need at least one organization and category seeded")
        return 1

    grant = NormalizedGrant(
        title="Publish Probe Opportunity",
        slug=PROBE_SLUG,
        short_description="Temporary record written by the publish probe.",
        organization_id=organizations[0]["id"],
        country_id=country["id"],
        category_ids=[categories[0]["id"]],
        primary_category_id=categories[0]["id"],
        maximum_amount=Decimal("125000"),
        currency="USD",
        grant_type=GrantFundingType.COMPETITIVE,
        status=GrantStatus.PUBLISHED,
        official_url="https://example.gov/probe",
        source_url="https://example.gov/probe",
        content_hash="probe-hash-1",
        ai_confidence=95,
    )

    grant_id = grant_repository.publish(
        grant.to_row(), list(grant.category_ids), grant.primary_category_id, "probe: first write"
    )
    log.info("Published {id}", id=grant_id)

    versions = client.table("grant_versions").select("version_number").eq("grant_id", grant_id).execute().data
    history = client.table("grant_history").select("action").eq("grant_id", grant_id).execute().data
    relations = (
        client.table("grant_category_relations")
        .select("is_primary")
        .eq("grant_id", grant_id)
        .execute()
        .data
    )

    log.info(
        "After first write: {versions} version(s), {history} history row(s), {relations} category link(s)",
        versions=len(versions),
        history=len(history),
        relations=len(relations),
    )

    # Same hash again: the function must treat this as a no-op so the version
    # history records real changes rather than crawl frequency.
    grant_repository.publish(
        grant.to_row(), list(grant.category_ids), grant.primary_category_id, "probe: unchanged"
    )
    versions_after = client.table("grant_versions").select("version_number").eq("grant_id", grant_id).execute().data

    log.info("After unchanged re-publish: {count} version(s)", count=len(versions_after))

    # A real edit must create a second version.
    changed = grant.model_copy(update={"content_hash": "probe-hash-2", "maximum_amount": Decimal("200000")})
    grant_repository.publish(
        changed.to_row(), list(changed.category_ids), changed.primary_category_id, "probe: changed"
    )
    versions_changed = client.table("grant_versions").select("version_number").eq("grant_id", grant_id).execute().data

    log.info("After changed re-publish: {count} version(s)", count=len(versions_changed))

    ok = (
        len(versions) == 1
        and len(history) == 1
        and len(relations) == 1
        and len(versions_after) == 1
        and len(versions_changed) == 2
    )

    _cleanup(client)
    log.info("Probe rows removed")

    if ok:
        log.info("Publish path verified: transactional, idempotent, versioned")
        return 0

    log.error("Publish path did NOT behave as expected")
    return 1


if __name__ == "__main__":
    sys.exit(main())
