"""Generate a contrarian investment brief.

This utility demonstrates how to assemble a short-form report that
summarizes a handful of differentiated opportunities along with a small
poetic coda.  It mirrors the structure of the ad-hoc reports produced by
research teams that monitor sentiment dislocations.
"""

from __future__ import annotations

from datetime import date
from typing import Iterable, Mapping

Opportunity = Mapping[str, str]


def generate_contrarian_brief(opportunities: Iterable[Opportunity]) -> str:
    """Create a contrarian brief from the supplied opportunities.

    The report highlights up to five opportunities, pairing each theme
    with a short explanation of the divergence that makes it noteworthy.
    A short poetic stanza is appended to reinforce the contrarian framing.
    """

    report = f"Contrarian Index – {date.today()}\n"
    for i, opp in enumerate(opportunities, start=1):
        if i > 5:
            break
        report += f"{i}. {opp['theme']} — {opp['divergence_reason']}\n"

    poetic = "\n".join(
        [
            "In noise, the signal hums low.",
            "In silence, the profit hums high.",
            "Between fear and frenzy: frequency.",
        ]
    )
    return report + "\n\n" + poetic


if __name__ == "__main__":
    sample_opportunities = [
        {
            "theme": "Underfollowed clean shipping lanes",
            "divergence_reason": "Baltic dry index rolling over while freight futures climb",
        },
        {
            "theme": "Rural data-center co-ops",
            "divergence_reason": "Commodity power costs decoupling from metropolitan benchmarks",
        },
        {
            "theme": "Analog synth manufacturers",
            "divergence_reason": "Order books expanding despite consumer electronics slowdown",
        },
    ]

    print(generate_contrarian_brief(sample_opportunities))
