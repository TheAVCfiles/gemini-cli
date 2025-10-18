#!/usr/bin/env python3
"""Generate the Roberto Prati evidence map as a Graphviz PDF diagram.

This script reproduces the researcher-provided mapping of the Prati family and
its corroborating documentary sources.  The implementation is intentionally
declarative: each node describes a person, place, or record while the edges
capture the evidentiary relationships between them.

Usage:
    python scripts/generate_prati_evidence_map.py --output output/path

The ``--output`` option can be either a file path (``.pdf`` extension optional)
or a directory.  The script ensures the resulting PDF is written to disk and
prints the final path for convenience.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from graphviz import Digraph


def build_graph() -> Digraph:
    """Return the configured evidence-map graph."""

    dot = Digraph(
        comment="Roberto (Robert) Prati — Marquis of Rovagnasca — Evidence Dossier v5"
    )
    dot.attr(rankdir="TB", splines="ortho", node_shape="box", style="rounded")
    dot.attr("node", shape="box", style="rounded,filled", fillcolor="cornsilk")
    dot.attr("edge", color="gray40", fontname="Helvetica", fontsize="10")

    # == LABELS ==
    dot.node(
        "RP",
        """RP — Roberto (“Robert”) Prati, Marquis of Rovagnasca
(1825 – Jan 26 1887)

Source: Obituary clusters (OldNews, Wheeling Intelligencer, etc.)
Value: Multi-jurisdictional confirmation of death, title, and exile narrative.""",
    )
    dot.node(
        "HM",
        """HM — Harriot A. McQuaide
(b. ~1842 NYC)

Source: 1880 US Census (Manhattan ED 490)
Value: Confirms household structure, linking American domestic life to Italian origin.""",
    )
    dot.node(
        "CFV",
        """CFV — Caroline F. Van Cura (née Prati)
(b. ~1867)

Source: Manhattan Marriage Index 1890 (Cert. No. 4106)
Value: Legally connects Prati line to Van Cura surname; primary maternal proof.""",
    )
    dot.node(
        "JVC",
        """JVC — John S. Van Cura
(b. ~1864)

Source: NY State Marriage Record + City Directory 1892
Value: Confirms Van Cura branch in NYC and anchors the family line.""",
    )

    # Residences & Vitals
    dot.node(
        "Addr_1887",
        """Addr 1887 — 158 E. 82nd St., NYC

Source: NY Tribune Jan 29 1887 obituary
Value: Exact death address; ties to “death in poverty” narrative.""",
        fillcolor="lightblue",
    )
    dot.node(
        "Addr_1880",
        """Addr 1880 — 214 E. 78th St., Manhattan

Source: US Census 1880
Value: Establishes continuity of residence in Upper East Side enclave.""",
        fillcolor="lightblue",
    )
    dot.node(
        "Burial",
        """Burial — Calvary Cemetery (Queens)

Source: Calvary Burial Ledger (NYPL microfilm)
Value: Physical remains verification; useful for repatriation petitions.""",
        fillcolor="lightblue",
    )

    # Source Documents (styled differently)
    dot.attr("node", shape="note", fillcolor="khaki1")
    dot.node(
        "Census_1880",
        """Census 1880 — U.S. Federal Record
(ED 490)

Source: FamilySearch image ID 004117092_00372
Value: Shows “Roberto Prati, music teacher,” linking occupation to IMSLP.""",
    )
    dot.node(
        "NYT",
        """NYT / NY Tribune — Jan 29 1887 Notice

Source: TimesMachine Archive page 7, col 3
Value: Most probative secondary source in NY jurisdiction for title and address.""",
    )
    dot.node(
        "IMSLP",
        """IMSLP Bio Notes

Source: IMSLP Composer Listing “Prati, Roberto”
Value: Cross-disciplinary metadata confirming military & artistic career.""",
    )
    dot.node(
        "Obit_Cluster",
        """Obit 1887 Cluster (International)

Source: OldNews.com aggregate (Wheeling, Honolulu, AUS)
Value: Proves trans-Atlantic syndication of death/title; hallmark of public noble status.""",
    )
    dot.node(
        "Turin_Academy",
        """Military Academy of Turin

Source: Archivio di Stato di Torino, Serie Militare 1843–1847
Value: Institutional verification of service; confirms pre-exile nobility.""",
    )
    dot.node(
        "Alias",
        """Alias Record

Source: Gazette di Piedmont 1859; US directories 1884
Value: Demonstrates legal/phonetic variations; bridges European & American records.""",
    )
    dot.node(
        "Cultural_Node",
        """Cultural Node — Società Italiana Vittorio Emanuele II

Source: Minutes Book Vol. II (1869–1885), Centro Culturale Italo-Americano
Value: Confirms community leadership and identity maintenance in diaspora.""",
    )
    dot.node(
        "Probate_FL",
        """Florida Probate Record
(Edward Van Cura 200x)

Source: FL State Archives – Probate Index
Value: Modern link to Van Cura line; confirms familial continuity.""",
    )
    dot.node(
        "Immigration",
        """NYC Passenger List (1865)
“Roberto Prati — Genova to NY”

Source: NARA Series T715 Roll 201
Value: Primary proof of entry and Italian origin.""",
    )
    dot.node(
        "Naturalization",
        """NYC Naturalization Record (1870)

Source: USCIS Genealogy Program
Value: Potential surname corruption record (Prati → Pretty/Prate).""",
    )
    dot.node(
        "Italian_Title",
        """Regio Decreto 1845
(Archivio di Stato di Alessandria)

Source: Italian Official Gazette Archive
Value: Verification of Marchese title before republican abolition.""",
    )

    # == EDGES ==
    # Family Connections
    dot.edge("RP", "HM", label="married")
    dot.edge("RP", "CFV", label="father of")
    dot.edge("HM", "CFV", label="mother of")
    dot.edge("CFV", "JVC", label="married")

    # Residence & Burial Connections
    dot.edge("RP", "Addr_1887", label="resided at (death)")
    dot.edge("RP", "Addr_1880", label="resided at (census)")
    dot.edge("RP", "Burial", label="interred at")

    # Evidence Connections (Source -> Subject)
    dot.edge("Census_1880", "RP", label="provides evidence for")
    dot.edge("Census_1880", "HM", label="provides evidence for")
    dot.edge("Census_1880", "Addr_1880", label="documents")
    dot.edge("NYT", "RP", label="provides evidence for")
    dot.edge("NYT", "Addr_1887", label="documents")
    dot.edge("Obit_Cluster", "RP", label="corroborates")
    dot.edge("IMSLP", "RP", label="corroborates")
    dot.edge("Turin_Academy", "RP", label="verifies service of")
    dot.edge("Italian_Title", "RP", label="verifies title of")
    dot.edge("Alias", "RP", label="documents name variation")
    dot.edge("Immigration", "RP", label="documents entry of")
    dot.edge("Naturalization", "RP", label="documents status of")
    dot.edge("Cultural_Node", "RP", label="documents activity of")
    dot.edge("Probate_FL", "JVC", label="shows modern lineage from")

    return dot


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("Prati_Evidence_Map_v5.pdf"),
        help="Path to the output PDF (directory or file).",
    )
    return parser.parse_args()


def resolve_output_path(path: Path) -> Path:
    """Return the filesystem path Graphviz should use for rendering."""

    if path.is_dir():
        return path / "Prati_Evidence_Map_v5"

    if path.suffix:
        return path.with_suffix("")

    return path


def main() -> None:
    args = parse_args()
    graph = build_graph()

    output_root = resolve_output_path(args.output)
    output_root.parent.mkdir(parents=True, exist_ok=True)

    rendered_path = Path(graph.render(str(output_root), format="pdf", cleanup=True))
    print(f"Evidence map exported to {rendered_path}")


if __name__ == "__main__":
    main()
