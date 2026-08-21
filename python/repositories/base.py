"""Repository foundation.

Repositories are the only code that knows Supabase exists. They translate
driver errors into `RepositoryError` and hold no business rules — those belong
to the processors and the publisher.
"""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from core.database import get_client
from core.logging import get_logger


class RepositoryError(RuntimeError):
    """A database operation failed. Carries enough context to act on."""

    def __init__(self, entity: str, operation: str, message: str, code: str | None = None) -> None:
        super().__init__(f"{entity}.{operation} failed: {message}")
        self.entity = entity
        self.operation = operation
        self.code = code


class BaseRepository:
    entity_name: str = "Record"

    def __init__(self) -> None:
        self.client = get_client()
        self.log = get_logger("repository", entity=self.entity_name)

    def _table(self, name: str):
        return self.client.table(name)

    def _fail(self, operation: str, error: APIError) -> RepositoryError:
        """Logs, then returns an exception for the caller to raise.

        Returning rather than raising keeps the `raise` visible at the call
        site, so control flow reads honestly.
        """
        # PostgREST hints are unusually good — losing them makes a permission
        # problem look like an unexplained failure.
        self.log.error(
            "{operation} failed: {message}",
            operation=operation,
            message=error.message,
            code=error.code,
            details=error.details,
            hint=error.hint,
        )

        return RepositoryError(self.entity_name, operation, error.message or "unknown", error.code)

    @staticmethod
    def _first(rows: list[dict[str, Any]]) -> dict[str, Any] | None:
        return rows[0] if rows else None
