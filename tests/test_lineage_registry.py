"""Tests for the Savoyard provenance helpers."""

from __future__ import annotations

import unittest

from lineage_registry import (
    ArchivalRecord,
    LineageRecord,
    TitleRecord,
    apply_savoyard_provenance,
)


class SavoyardProvenanceTests(unittest.TestCase):
    def test_recognised_lineage_updates_title_and_archival_root(self) -> None:
        lineage = LineageRecord(origin="Savoyard proven")
        title = TitleRecord()
        archival = ArchivalRecord()

        apply_savoyard_provenance(lineage, title, archival)

        self.assertEqual(title.status, "legally recognized")
        self.assertEqual(archival.node, "Casa Savoia Root")

    def test_unverified_lineage_defaults_to_oral_tradition(self) -> None:
        lineage = LineageRecord(origin="folklore channel")
        title = TitleRecord(status="pending review")
        archival = ArchivalRecord(node="Prior Node")

        apply_savoyard_provenance(lineage, title, archival)

        self.assertEqual(title.status, "oral tradition / unverified")
        self.assertIsNone(archival.node)


if __name__ == "__main__":
    unittest.main()

