"""robots.txt compliance.

Part 4B §12: the crawler respects robots.txt, identifies itself, and throttles.
These are government servers funded by the public — being a bad guest is both
rude and the fastest route to an IP ban.

Rules are cached per host so one crawl of 400 pages fetches robots.txt once.
"""

from __future__ import annotations

import urllib.robotparser
from functools import lru_cache
from urllib.parse import urlparse

import httpx

from config.settings import get_settings
from core.logging import get_logger

log = get_logger("robots")


@lru_cache(maxsize=64)
def _parser_for(origin: str) -> urllib.robotparser.RobotFileParser | None:
    """Fetches and parses one host's robots.txt.

    Returns None when the file cannot be read. A missing or unreachable
    robots.txt means "no stated restrictions", which is the standard reading —
    not a licence to ignore a file that does exist.
    """
    parser = urllib.robotparser.RobotFileParser()
    robots_url = f"{origin}/robots.txt"

    try:
        settings = get_settings()
        response = httpx.get(
            robots_url,
            timeout=settings.crawl_timeout,
            follow_redirects=True,
            headers={"User-Agent": settings.user_agent},
        )
    except httpx.HTTPError as error:
        log.warning("Could not fetch {url}: {error}", url=robots_url, error=error)
        return None

    if response.status_code >= 400:
        log.debug("No robots.txt at {url} (HTTP {status})", url=robots_url, status=response.status_code)
        return None

    parser.parse(response.text.splitlines())

    return parser


def is_allowed(url: str) -> bool:
    """Whether this crawler may fetch `url`."""
    settings = get_settings()

    if not settings.respect_robots_txt:
        # Configurable because a site owner may explicitly authorise us, but
        # it defaults to on and every override should be a deliberate choice.
        return True

    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return False

    parser = _parser_for(f"{parsed.scheme}://{parsed.netloc}")

    if parser is None:
        return True

    allowed = parser.can_fetch(settings.user_agent, url)

    if not allowed:
        log.info("robots.txt disallows {url}", url=url)

    return allowed


def crawl_delay(url: str, default: float | None = None) -> float:
    """The host's requested delay, if it states one.

    A site asking for 10 seconds between requests gets 10 seconds, even when
    our own configured delay is shorter.
    """
    settings = get_settings()
    fallback = settings.request_delay if default is None else default

    parsed = urlparse(url)
    parser = _parser_for(f"{parsed.scheme}://{parsed.netloc}")

    if parser is None:
        return fallback

    stated = parser.crawl_delay(settings.user_agent)

    return max(float(stated), fallback) if stated is not None else fallback
