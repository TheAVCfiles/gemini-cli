"""Automated product pipeline prototype.

The module intentionally mirrors the three-engine walkthrough that accompanies the
Aura planners concept. All external calls are mocked so the script can be executed
in isolation while still demonstrating the orchestration flow.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional
import re

import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


# ---------------------------------------------------------------------------
# Component 1: analysis_engine
# ---------------------------------------------------------------------------


def _fetch_shopify_data(api_key: str) -> pd.DataFrame:
    """Mock Shopify sales feed."""
    print("  [C1] Ingesting sales data from Shopify...")
    sales_data = [
        {"customer_id": "cust_123", "sku": "PLAN-V4", "action": "purchase", "value": 45},
        {"customer_id": "cust_456", "sku": "PLAN-V4", "action": "purchase", "value": 45},
        {"customer_id": "cust_789", "sku": "PLAN-V4", "action": "refund", "value": -45},
        {"customer_id": "cust_123", "sku": "BUDGET-V2", "action": "purchase", "value": 25},
    ]
    return pd.DataFrame(sales_data)


def _fetch_feedback_data(db_conn: str) -> pd.DataFrame:
    """Mock Zendesk/Etsy feedback feed."""
    print("  [C1] Ingesting feedback data from Zendesk/Etsy...")
    feedback_data = [
        {"customer_id": "cust_123", "text": "Love this planner! Bought the budget sheets too."},
        {"customer_id": "cust_456", "text": "Aesthetic is great, but it's not editable?"},
        {"customer_id": "cust_789", "text": "I needed a finance section. This is missing it. Had to refund."},
    ]
    return pd.DataFrame(feedback_data)


def _fetch_competitor_data(targets: Iterable[str]) -> Dict[str, List[str]]:
    """Mock competitor landscape."""
    print("  [C1] Ingesting market placement from competitors...")
    return {"competitor_A_offers": ["editable", "subscription", "finance_pack"]}


def ingest_data(
    sales_api_key: str,
    feedback_db_conn: str,
    competitor_targets: Iterable[str],
) -> Dict[str, Any]:
    """Fetch all sources required by the analysis engine."""

    return {
        "sales": _fetch_shopify_data(sales_api_key),
        "feedback": _fetch_feedback_data(feedback_db_conn),
        "market": _fetch_competitor_data(competitor_targets),
    }


@dataclass
class Insight:
    """Outcome produced by the analysis engine."""

    id: str
    finding: str
    opportunity: Optional[str]
    recommendation_engine: str
    recommendation_action: str


REFUND_TOPIC_PATTERN = re.compile(r"finance|budget|money", re.IGNORECASE)
EDITABLE_TOPIC_PATTERN = re.compile(r"editable|pdf|edit", re.IGNORECASE)
AESTHETIC_TOPIC_PATTERN = re.compile(r"aesthetic|look|design", re.IGNORECASE)
TOPIC_LABELS = {
    "topic_finance": REFUND_TOPIC_PATTERN,
    "topic_editable": EDITABLE_TOPIC_PATTERN,
    "topic_aesthetic": AESTHETIC_TOPIC_PATTERN,
}


def _extract_topics(text: str) -> List[str]:
    topics: List[str] = []
    for label, pattern in TOPIC_LABELS.items():
        if pattern.search(text):
            topics.append(label)
    return topics


def find_core_drivers(raw_data: Dict[str, Any]) -> Insight:
    """Correlate refunds with qualitative feedback topics."""

    print("  [C1] Cross-examining data... running NLP sentiment/topic analysis...")
    sales_df = raw_data["sales"]
    feedback_df = raw_data["feedback"].copy()
    analyzer = SentimentIntensityAnalyzer()

    feedback_df["sentiment"] = feedback_df["text"].apply(
        lambda text: analyzer.polarity_scores(text)["compound"],
    )
    feedback_df["topics"] = feedback_df["text"].apply(_extract_topics)

    joined = pd.merge(sales_df, feedback_df, on="customer_id", how="inner")
    refund_df = joined[joined["action"] == "refund"]

    if refund_df.empty:
        return Insight(
            id="INS-000",
            finding="No new negative drivers found.",
            opportunity=None,
            recommendation_engine="StrategyEngine",
            recommendation_action="None",
        )

    refund_topics = refund_df["topics"].explode().value_counts()
    top_failure_topic = refund_topics.idxmax() if not refund_topics.empty else "topic_unknown"
    sku = refund_df["sku"].iloc[0]

    return Insight(
        id="INS-447",
        finding=(
            f"Product '{sku}' refund rate is highly correlated with NLP topic: '{top_failure_topic}'."
        ),
        opportunity="Customers mentioning 'topic_finance' are a high-risk churn segment.",
        recommendation_engine="StrategyEngine",
        recommendation_action="Create_Bundle",
    )


# ---------------------------------------------------------------------------
# Component 2: strategy_engine
# ---------------------------------------------------------------------------


Strategy = Dict[str, Any]


STRATEGY_PLAYBOOK: Dict[str, Strategy] = {
    "topic_finance": {
        "action": "Create_Bundle",
        "new_sku": "BUNDLE_LIFE_OS_V1",
        "core_message_dna": "The complete life planner. Goals and finances in one place.",
        "component_skus": ["PLAN-V4", "BUDGET-V2"],
        "price_mechanic": "Bundle_Discount_15_Percent",
        "price_value": 59.99,
    },
    "topic_editable": {
        "action": "Create_Variant",
        "new_sku": "PLAN-V4-EDITABLE",
        "core_message_dna": "The aesthetic planner, now 100% editable in GoodNotes & Notability.",
        "component_skus": ["PLAN-V4"],
        "price_mechanic": "Price_Increase_10_Percent",
        "price_value": 49.50,
    },
    "default": {"action": "Maintain", "new_sku": None},
}


def reconfigure_offer(insight: Insight) -> Optional[Dict[str, Any]]:
    """Select a strategy entry based on the dominant topic."""

    print("  [C2] Parsing insight and applying strategy playbook...")
    finding = insight.finding

    strategy = STRATEGY_PLAYBOOK["default"]
    for topic, candidate in STRATEGY_PLAYBOOK.items():
        if topic != "default" and topic in finding:
            strategy = candidate
            break

    if strategy["new_sku"] is None:
        print("  [C2] No action required.")
        return None

    return {
        "product_sku": strategy["new_sku"],
        "product_type": strategy["action"],
        "target_audience_id": f"seg_from_insight_{insight.id}",
        "core_message_dna": strategy["core_message_dna"],
        "component_skus": strategy["component_skus"],
        "price_mechanic": strategy["price_mechanic"],
        "price_value": strategy["price_value"],
    }


# ---------------------------------------------------------------------------
# Component 3: assembly_engine
# ---------------------------------------------------------------------------


BrandDNA = Dict[str, str]


def load_brand_dna(brand_id: str = "default_brand") -> BrandDNA:
    """Return the canonical brand profile."""

    print("  [C3] Loading Brand DNA...")
    return {
        "brand_name": "Aura Planners",
        "voice": "minimal, expert, calm, aspirational, professional",
        "color_primary": "#0A0A0A",
        "color_secondary": "#F4F4F4",
        "font_headline": "Playfair Display",
        "font_body": "Inter",
    }


def create_rna_script(dna: BrandDNA, offer: Dict[str, Any]) -> str:
    """Combine static DNA with the dynamic offer configuration."""

    print("  [C3] Merging DNA and Offer into master RNA script...")
    return f"""
    IDENTITY (DNA):
    - Brand: {dna['brand_name']}
    - Voice: {dna['voice']}
    - Primary Color: {dna['color_primary']}
    - Secondary Color: {dna['color_secondary']}
    - Font: {dna['font_headline']}

    TASK (Offer):
    - Product: {offer['product_sku']}
    - Core Message: {offer['core_message_dna']}
    - Price: {offer['price_value']}
    - Target Audience: Users who need a professional, aesthetic tool to manage both their life and finances.

    INSTRUCTIONS:
    Generate assets that are clean, minimal, and feel professional.
    Use high-contrast, photorealistic mockups.
    """.strip()


def generate_copy(rna_script: str) -> Dict[str, Any]:
    """Mocked call to a text generation service."""

    print("  [C3] Generating marketing copy from RNA script... (Mocked)")
    return {
        "title": "The Aura Life OS Planner: Goals & Finances, Unified.",
        "description": (
            "Stop juggling apps. The Aura Life OS combines our best-selling V4 planner with the V2 budget toolkit. "
            "Manage your schedule and your money in one seamless, beautiful system."
        ),
        "headlines": [
            "Finally: Planning & Budgeting in One.",
            "The Aesthetic Life OS.",
            "Your New Financial & Life Dashboard.",
        ],
    }


def generate_visuals(rna_script: str) -> List[str]:
    """Mocked call to an image generation service."""

    print("  [C3] Generating visual assets from RNA script... (Mocked)")
    return [
        "https.mock_cdn.com/img_bundle_v1_main.png",
        "https.mock_cdn.com/img_bundle_v1_angle.png",
        "https.mock_cdn.com/img_bundle_v1_context.png",
    ]


def render_seamlessly(visuals: List[str], copy: Dict[str, Any], offer: Dict[str, Any]) -> str:
    """Mock push to a headless CMS."""

    print("  [C3] Pushing all assets to Headless CMS API... (Mocked)")
    product_payload = {
        "fields": {
            "sku": {"en-US": offer["product_sku"]},
            "title": {"en-US": copy["title"]},
            "description": {"en-US": copy["description"]},
            "headlines": {"en-US": copy["headlines"]},
            "price": {"en-US": offer["price_value"]},
            "images": {"en-US": [{"url": url} for url in visuals]},
            "is_published": {"en-US": True},
        }
    }

    # The payload is returned for transparency in real-world integrations.
    print("    Payload prepared for CMS ingestion:")
    print(product_payload)

    return f"https_your-store.com/products/{offer['product_sku']}"


# ---------------------------------------------------------------------------
# Pipeline runner
# ---------------------------------------------------------------------------


def run_automated_product_pipeline() -> Optional[str]:
    """Execute the pipeline end to end."""

    print("Engine 1: Cross-Examining Data...")
    raw_data = ingest_data(
        sales_api_key="DUMMY_KEY",
        feedback_db_conn="DUMMY_CONN",
        competitor_targets=["competitor.com"],
    )

    insight = find_core_drivers(raw_data)
    print(f"Insight found: {insight.finding}")

    print("\nEngine 2: Redistributing Offer Mechanics...")
    offer = reconfigure_offer(insight)
    if not offer:
        print("\n---\nPIPELINE COMPLETE. No new product generated.\n---")
        return None

    print(f"New hypothesis created: {offer['product_sku']}")

    print("\nEngine 3: Assembling Seamless Wrapper...")
    dna = load_brand_dna()
    rna_script = create_rna_script(dna, offer)
    copy_assets = generate_copy(rna_script)
    visual_assets = generate_visuals(rna_script)
    final_url = render_seamlessly(visuals=visual_assets, copy=copy_assets, offer=offer)

    print("\n---")
    print(f"PIPELINE COMPLETE. New product live at: {final_url}")
    print("---")
    return final_url


if __name__ == "__main__":
    run_automated_product_pipeline()
