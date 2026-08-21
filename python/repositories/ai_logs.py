"""Every Gemini call, recorded.

Part 3B `ai_generation_logs`: debugging, cost monitoring and prompt
improvement all depend on knowing what was asked, by which prompt version, and
what it cost. The admin AI Center reads this table.

Logging must never be the reason a crawl fails, so write errors here are
swallowed after being logged — losing one usage row is a far smaller problem
than abandoning a successful extraction.
"""

from __future__ import annotations

from postgrest.exceptions import APIError

from repositories.base import BaseRepository


class AILogRepository(BaseRepository):
    entity_name = "AI log"

    def record(self, row: dict[str, object]) -> None:
        try:
            self._table("ai_generation_logs").insert(row).execute()
        except APIError as error:
            self.log.warning(
                "Could not record AI usage ({message}) — continuing",
                message=error.message,
            )

    def record_failure(
        self,
        *,
        model: str,
        prompt_name: str,
        prompt_version: str,
        status: str,
        error_message: str,
        grant_id: str | None = None,
    ) -> None:
        """A failed call still costs tokens and still matters to the operator."""
        self.record(
            {
                "grant_id": grant_id,
                "model": model,
                "prompt_name": prompt_name,
                "prompt_version": prompt_version,
                "status": status,
                "error_message": error_message[:2000],
            }
        )


ai_log_repository = AILogRepository()
