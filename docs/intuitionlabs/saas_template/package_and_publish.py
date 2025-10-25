"""Utilities to package the IntuitionLabs Mythos Cloud SaaS starter kit.

The script intentionally uses only the Python standard library so it can run
inside GitHub Actions or any local workstation without additional
dependencies.  YAML is parsed when the optional PyYAML package is available;
otherwise, the configuration file is interpreted as JSON (YAML is a superset
of JSON, so this still succeeds for the provided configuration).
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from string import Template
from typing import Any, Dict, Iterable, List, Mapping

try:  # pragma: no cover - optional dependency
    import yaml  # type: ignore
except Exception:  # pragma: no cover
    yaml = None


ROOT = Path(__file__).parent


@dataclass
class GeneratedArtifact:
    """Represents a file that the packaging routine produced."""

    path: Path
    description: str

    def to_manifest_entry(self) -> Mapping[str, str]:
        return {
            "path": str(self.path),
            "description": self.description,
        }


def load_config(config_path: Path) -> Dict[str, Any]:
    """Load the configuration file from disk.

    Parameters
    ----------
    config_path:
        Absolute path to the configuration file.
    """

    text = config_path.read_text(encoding="utf-8")
    if yaml is not None:  # pragma: no branch
        return yaml.safe_load(text)
    return json.loads(text)


def render_template(template_path: Path, destination: Path, variables: Mapping[str, Any]) -> GeneratedArtifact:
    template = Template(template_path.read_text(encoding="utf-8"))
    try:
        rendered = template.substitute(variables)
    except KeyError as exc:  # pragma: no cover - defensive branch
        missing = exc.args[0]
        raise ValueError(f"Missing template variable: {missing}") from exc

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(rendered, encoding="utf-8")
    return GeneratedArtifact(destination, f"Rendered template {template_path.name}")


def bullet_list_html(items: Iterable[str], indent: str = "        ") -> str:
    return "\n".join(f"{indent}<li>{item}</li>" for item in items)


def audience_list_html(audiences: Iterable[Mapping[str, str]]) -> str:
    lines: List[str] = []
    for audience in audiences:
        title = audience.get("title", "Audience")
        need = audience.get("need", "")
        signal = audience.get("signal")
        details = f" — {need}" if need else ""
        if signal:
            details += f" <em>({signal})</em>"
        lines.append(f"        <li><strong>{title}</strong>{details}</li>")
    return "\n".join(lines)


def pricing_cards_html(pricing: Mapping[str, Any], primary_cta: Mapping[str, Any]) -> str:
    currency_symbol = pricing.get("currency_symbol", "$")
    cards: List[str] = []
    for tier in pricing.get("tiers", []):
        price = tier.get("price", "-")
        billing_period = tier.get("billing_period", "month")
        features_html = bullet_list_html(tier.get("value_props", []), indent="            ")
        tier_cta_label = tier.get("cta_label", primary_cta.get("label", "Request access"))
        tier_cta_url = tier.get("cta_url", primary_cta.get("url", "#"))
        cards.append(
            """
        <article class="tier-card">
          <h3>{name}</h3>
          <p class="price">{currency}{price}<span>/{period}</span></p>
          <ul>
{features}
          </ul>
          <a href="{cta_url}" class="cta">{cta_label}</a>
        </article>
        """.format(
                name=tier.get("name", "Plan"),
                currency=currency_symbol,
                price=price,
                period=billing_period,
                features=features_html,
                cta_url=tier_cta_url,
                cta_label=tier_cta_label,
            )
        )
    return "\n".join(cards)


def build_landing_page(config: Mapping[str, Any], workspace: Path, output_root: Path) -> GeneratedArtifact:
    landing_cfg = config["automation"]["landing_page"]
    template_path = (workspace / landing_cfg["template"]).resolve()
    destination = (output_root / landing_cfg.get("output", "index.html")).resolve()

    product = config["product"]
    seo = config.get("seo", {})
    primary_cta = config.get("primary_cta", {})

    variables = {
        "seo_title": seo.get("title", product.get("name", "SaaS Landing")),
        "seo_description": seo.get("description", product.get("description", "")),
        "product_name": product.get("name", "Mythos Cloud"),
        "product_tagline": product.get("tagline", "Composable SaaS scaffolding."),
        "product_description": product.get("description", ""),
        "feature_list": bullet_list_html(product.get("features", [])),
        "audience_list": audience_list_html(config.get("audiences", [])),
        "pricing_table": pricing_cards_html(config.get("pricing", {}), primary_cta),
        "pricing_note": config.get("pricing", {}).get("note", ""),
        "primary_cta_label": primary_cta.get("label", "Request access"),
        "primary_cta_url": primary_cta.get("url", "#"),
        "founder_note": product.get("founder_note", ""),
    }

    return render_template(template_path, destination, variables)


def build_offer_packets(config: Mapping[str, Any], workspace: Path, output_root: Path) -> List[GeneratedArtifact]:
    offers: List[GeneratedArtifact] = []
    for offer in config["automation"].get("offers", []):
        template_path = (workspace / offer["template"]).resolve()
        destination = (output_root / offer.get("output", "offer.md")).resolve()
        variables = offer.get("variables", {})
        offers.append(render_template(template_path, destination, variables))
    return offers


def write_manifest(config: Mapping[str, Any], artifacts: List[GeneratedArtifact], output_root: Path) -> GeneratedArtifact:
    manifest_path = (output_root / "package_manifest.json").resolve()
    manifest = {
        "product": {
            "name": config["product"].get("name"),
            "tagline": config["product"].get("tagline"),
        },
        "artifacts": [artifact.to_manifest_entry() for artifact in artifacts],
        "pricing": config.get("pricing", {}),
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return GeneratedArtifact(manifest_path, "Manifest for generated assets")


def main() -> None:
    parser = argparse.ArgumentParser(description="Render the SaaS starter assets defined in config.yaml.")
    parser.add_argument(
        "--config",
        default="config.yaml",
        help="Configuration file relative to the script directory.",
    )
    parser.add_argument(
        "--output",
        default="dist",
        help="Directory (relative to the script directory) where rendered files are stored.",
    )
    args = parser.parse_args()

    config_path = Path(args.config)
    if not config_path.is_absolute():
        config_path = (ROOT / config_path).resolve()

    workspace = config_path.parent
    output_root = Path(args.output)
    if not output_root.is_absolute():
        output_root = (workspace / output_root).resolve()

    config = load_config(config_path)

    artifacts: List[GeneratedArtifact] = []
    artifacts.append(build_landing_page(config, workspace, output_root))
    artifacts.extend(build_offer_packets(config, workspace, output_root))
    artifacts.append(write_manifest(config, artifacts, output_root))

    for artifact in artifacts:
        print(f"Generated {artifact.path.relative_to(workspace)}")


if __name__ == "__main__":
    main()
