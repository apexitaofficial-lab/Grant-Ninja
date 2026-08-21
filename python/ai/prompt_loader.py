"""Versioned prompt loading.

Part 4B §14: every prompt carries a version, and that version is stored
alongside whatever it produced. When a prompt is improved, the records made by
the old one can be found and regenerated — without that, a prompt fix silently
leaves months of worse output in the database with no way to identify it.

Prompts live in `ai/prompts/<name>.<version>.md` with a YAML-ish header. They
are files rather than string literals so a non-engineer can read and improve
them, and so a diff shows exactly what changed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"

_FRONT_MATTER = re.compile(r"^---\n(.*?)\n---\n(.*)$", re.DOTALL)
_VERSION_IN_NAME = re.compile(r"^(?P<name>[a-z0-9_]+)\.(?P<version>v\d+)\.md$")


class PromptNotFoundError(FileNotFoundError):
    pass


@dataclass(frozen=True, slots=True)
class Prompt:
    name: str
    version: str
    purpose: str
    template: str

    def render(self, **values: str) -> str:
        """Fills `{placeholder}` slots.

        `str.format` is deliberately avoided: prompt bodies contain JSON braces
        and would raise or mangle them.
        """
        rendered = self.template

        for key, value in values.items():
            rendered = rendered.replace(f"{{{key}}}", value)

        return rendered


def _parse(path: Path) -> Prompt:
    match = _VERSION_IN_NAME.match(path.name)

    if match is None:
        raise ValueError(f"{path.name} must be named <name>.<version>.md, e.g. extraction.v1.md")

    raw = path.read_text(encoding="utf-8")
    front_matter = _FRONT_MATTER.match(raw)

    if front_matter is None:
        raise ValueError(f"{path.name} is missing its --- front matter --- header")

    header, body = front_matter.groups()
    purpose = ""

    for line in header.splitlines():
        key, _, value = line.partition(":")

        if key.strip() == "purpose":
            purpose = value.strip()

    return Prompt(
        name=match.group("name"),
        version=match.group("version"),
        purpose=purpose,
        template=body.strip(),
    )


@lru_cache(maxsize=32)
def load_prompt(name: str, version: str | None = None) -> Prompt:
    """Loads a prompt, defaulting to the highest version on disk.

    Pinning a version is what makes a regeneration reproducible; leaving it
    unset is what makes day-to-day use convenient. Both are supported, and the
    resolved version is always recorded with the output.
    """
    if version is not None:
        path = PROMPTS_DIR / f"{name}.{version}.md"

        if not path.exists():
            raise PromptNotFoundError(f"No prompt {name} at {version}")

        return _parse(path)

    candidates = sorted(
        PROMPTS_DIR.glob(f"{name}.v*.md"),
        key=lambda path: int(path.stem.rsplit(".v", 1)[-1]),
    )

    if not candidates:
        raise PromptNotFoundError(f"No prompt named {name} in {PROMPTS_DIR}")

    return _parse(candidates[-1])


def list_prompts() -> list[Prompt]:
    return [_parse(path) for path in sorted(PROMPTS_DIR.glob("*.v*.md"))]
