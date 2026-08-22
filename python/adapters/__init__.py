"""Source adapters.

Importing this package registers every adapter. `adapters.base.get_adapter`
relies on that, so a new adapter becomes available by adding one import here.
"""

from adapters import generic, grants_gov  # noqa: F401 — imported for registration

__all__ = ["generic", "grants_gov"]
