"""Logging setup.

Part 4A "Logging": every stage records what it did, and logs must stay
searchable once they leave the machine. Console output is human-readable for
someone watching a manual run; the file sink is JSON so `jq` and log shippers
can read it.
"""

from __future__ import annotations

import sys
from typing import Any

from loguru import logger

from config.settings import LOG_DIR, get_settings

_configured = False


def configure_logging() -> None:
    """Idempotent: safe to call from any entry point."""
    global _configured

    if _configured:
        return

    settings = get_settings()

    logger.remove()

    logger.add(
        sys.stderr,
        level=settings.log_level,
        format=(
            "<green>{time:HH:mm:ss}</green> "
            "<level>{level: <8}</level> "
            "<cyan>{extra[stage]: <12}</cyan> "
            "{message}"
        ),
        colorize=True,
    )

    LOG_DIR.mkdir(parents=True, exist_ok=True)

    logger.add(
        LOG_DIR / "pipeline-{time:YYYY-MM-DD}.log",
        level=settings.log_level,
        serialize=True,
        rotation="00:00",
        retention="30 days",
        # Failures inside the crawl must never take down the crawl itself.
        enqueue=True,
        backtrace=False,
        diagnose=False,
    )

    # Every record carries a stage, so a run can be filtered by pipeline step
    # without every call site remembering to pass one.
    logger.configure(extra={"stage": "pipeline"})

    _configured = True


def get_logger(stage: str, **context: Any):
    """A logger bound to one pipeline stage.

    `stage` is the field you filter on when working out where a run went wrong.
    """
    configure_logging()

    return logger.bind(stage=stage, **context)
