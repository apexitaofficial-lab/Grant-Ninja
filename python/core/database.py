"""Supabase client for the pipeline.

Part 7B §153: the pipeline never talks to Postgres directly — everything goes
through a repository, so the storage engine can be replaced without touching
the crawler.

This process authenticates with the secret key, which bypasses Row Level
Security. That is deliberate: the crawler writes rows no public role may
write. It also means this key must never leave the server.
"""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client
from supabase.client import ClientOptions

from config.settings import get_settings


@lru_cache(maxsize=1)
def get_client() -> Client:
    """One client per process, reused across every stage."""
    settings = get_settings()

    return create_client(
        settings.supabase_url,
        settings.supabase_secret_key.get_secret_value(),
        options=ClientOptions(
            # Supabase rejects secret keys presented by browser-like agents.
            # Identifying the pipeline explicitly avoids a 401 with an empty
            # body, which is a genuinely miserable thing to debug.
            headers={"User-Agent": settings.user_agent},
            auto_refresh_token=False,
            persist_session=False,
        ),
    )
