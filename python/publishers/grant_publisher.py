"""The only code that writes a grant.

Part 7B §154. Everything upstream produces candidates; this decides what
actually lands, and records why. A dry run exercises every stage and writes
nothing, so a new source can be rehearsed against production data safely.
"""

from __future__ import annotations

from dataclasses import dataclass

from config.settings import get_settings
from core.logging import get_logger
from models.grant import GrantStatus, NormalizedGrant
from processors.duplicates import DuplicateAction, DuplicateResult
from repositories.grants import grant_repository

log = get_logger("publish")


@dataclass(frozen=True, slots=True)
class PublishResult:
    grant_id: str | None
    action: str
    reason: str

    @property
    def wrote_anything(self) -> bool:
        return self.grant_id is not None and self.action in {"created", "updated"}


class GrantPublisher:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._repository = grant_repository

    def publish(
        self,
        grant: NormalizedGrant,
        duplicate: DuplicateResult,
        source_name: str,
    ) -> PublishResult:
        if duplicate.action is DuplicateAction.UNCHANGED:
            return PublishResult(duplicate.existing_id, "unchanged", duplicate.reason)

        if duplicate.action is DuplicateAction.REVIEW:
            # An ambiguous pair is recorded and the grant is held as a draft.
            # Publishing it would risk a visible duplicate; discarding it would
            # lose a real opportunity. A draft does neither.
            held = grant.model_copy(update={"status": GrantStatus.PENDING_REVIEW})
            result = self._write(held, f"held for duplicate review: {duplicate.reason}")

            if result.grant_id is not None and duplicate.existing_id is not None:
                self._repository.record_duplicate(
                    result.grant_id,
                    duplicate.existing_id,
                    duplicate.confidence,
                    "possible_duplicate",
                    duplicate.method,
                )

            return result

        if duplicate.action is DuplicateAction.UPDATE:
            return self._write(
                self._with_existing_slug(grant, duplicate.existing_id),
                f"{duplicate.method}: {duplicate.reason}",
                action="updated",
            )

        return self._write(grant, f"new grant from {source_name}")

    def _with_existing_slug(self, grant: NormalizedGrant, existing_id: str | None) -> NormalizedGrant:
        """Points an update at the row it is updating.

        `publish_grant` identifies a grant by slug. The normalizer assigns the
        slug before duplicate detection has run, so on a re-crawl it finds its
        own previous row occupying the base slug and mints a suffixed variant.
        Publishing that would insert a *second* row for the same grant — the
        exact duplication the whole detection ladder exists to prevent, arriving
        through the back door.
        """
        if existing_id is None:
            return grant

        existing_slug = self._repository.find_slug(existing_id)

        if existing_slug is None or existing_slug == grant.slug:
            return grant

        log.debug(
            "Updating {existing} rather than creating {proposed}",
            existing=existing_slug,
            proposed=grant.slug,
        )

        return grant.model_copy(update={"slug": existing_slug})

    def _write(
        self, grant: NormalizedGrant, reason: str, action: str = "created"
    ) -> PublishResult:
        if self._settings.dry_run:
            log.info(
                "DRY RUN — would {status} {slug} ({reason})",
                status=grant.status.value,
                slug=grant.slug,
                reason=reason,
            )

            return PublishResult(None, "dry_run", reason)

        grant_id = self._repository.publish(
            grant_row=grant.to_row(),
            category_ids=list(grant.category_ids),
            primary_category_id=grant.primary_category_id,
            change_reason=reason,
            actor="crawler",
        )

        log.info(
            "{action} {status} {slug} ({reason})",
            action=action,
            status=grant.status.value,
            slug=grant.slug,
            reason=reason,
        )

        return PublishResult(grant_id, action, reason)


grant_publisher = GrantPublisher()
