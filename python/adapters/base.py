"""What a source adapter is responsible for.

Deliberately small. An adapter answers one question — *which URLs on this site
are worth reading?* — and nothing else. Fetching, cleaning, extraction,
duplicate detection and publishing are identical for every source and live in
the pipeline, so adding a new government portal means writing a discovery rule,
not another copy of the pipeline.

Adapters register themselves by `adapter_key`, matching the column in
`crawler_sources`. A source whose adapter has not been written yet is seeded as
`inactive`, so the scheduler skips it rather than failing on it.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from core.logging import get_logger

log = get_logger("adapter")


class SourceAdapter(ABC):
    """Discovery for one site."""

    adapter_key: str
    """Matches `crawler_sources.adapter_key`."""

    def __init__(self, source: dict[str, Any]) -> None:
        self.source = source
        self.base_url: str = source["base_url"]
        self.name: str = source["name"]

    @abstractmethod
    async def discover(self, limit: int) -> list[str]:
        """Returns candidate grant URLs, most promising first.

        `limit` is a hard cap the pipeline enforces anyway; honouring it here
        avoids fetching listing pages whose results would be discarded.
        """

    def is_grant_url(self, url: str) -> bool:
        """Filters links found on listing pages.

        Default is permissive; a site with a recognisable URL shape should
        override it, because every URL let through that is not a grant costs a
        fetch and possibly a paid extraction.
        """
        return url.startswith("http")


_REGISTRY: dict[str, type[SourceAdapter]] = {}


def register(adapter: type[SourceAdapter]) -> type[SourceAdapter]:
    """Class decorator. Keeps the key next to the implementation."""
    _REGISTRY[adapter.adapter_key] = adapter

    return adapter


def get_adapter(source: dict[str, Any]) -> SourceAdapter | None:
    """Builds the adapter for a source row, or None if none is registered."""
    # Imported here rather than at module scope: importing the package for its
    # registration side effects at the top would be a circular import, since
    # every adapter imports this module.
    import adapters  # noqa: F401, PLC0415

    adapter_key = str(source.get("adapter_key", ""))
    adapter_class = _REGISTRY.get(adapter_key)

    if adapter_class is None:
        log.warning(
            "No adapter registered for {key!r} ({name}) — source skipped",
            key=adapter_key,
            name=source.get("name"),
        )

        return None

    return adapter_class(source)


def registered_keys() -> list[str]:
    import adapters  # noqa: F401, PLC0415

    return sorted(_REGISTRY)
