"""Simple helpers for assigning Savoyard title recognition metadata.

The repository's archival scripts occasionally need to normalise a small
record structure that tracks a claimant's dynastic lineage, their present title
status, and the archival node where the documentation should live.  The rules
are intentionally tiny and are captured in :func:`apply_savoyard_provenance` so
they can be reused across notebooks and quick validation utilities.

Only lineages with an origin explicitly marked as ``"Savoyard proven"`` are
treated as fully authenticated.  Every other origin is conservatively marked as
oral tradition until an archivist verifies the claim.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

__all__ = [
    "LineageRecord",
    "TitleRecord",
    "ArchivalRecord",
    "apply_savoyard_provenance",
]


@dataclass(slots=True)
class LineageRecord:
    """Minimal representation of a dynastic lineage."""

    origin: str


@dataclass(slots=True)
class TitleRecord:
    """Metadata describing a claimant's title status."""

    status: str = "oral tradition / unverified"


@dataclass(slots=True)
class ArchivalRecord:
    """Location of the supporting archival documentation, if any."""

    node: Optional[str] = None


def apply_savoyard_provenance(
    lineage: LineageRecord,
    title: TitleRecord,
    archival: ArchivalRecord,
) -> None:
    """Mutate *title* and *archival* based on the lineage provenance.

    Parameters
    ----------
    lineage:
        The dynastic lineage entry whose ``origin`` flag determines whether the
        claimant is recognised by Casa Savoia.
    title:
        A mutable record describing the claimant's current title status.
    archival:
        The archival metadata that should point at the correct root node when a
        claim is recognised.
    """

    if lineage.origin == "Savoyard proven":
        title.status = "legally recognized"
        archival.node = "Casa Savoia Root"
    else:
        title.status = "oral tradition / unverified"
        archival.node = None

