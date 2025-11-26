"""Helper functions for converting Stage Cred results into coin summaries."""


def street_coins(pnl_pct: float, obeyed_plan: bool) -> int:
    """Street: trading behavior."""
    if pnl_pct <= 0:
        return 0
    obedience_factor = 1.0 if obeyed_plan else 0.5
    raw = pnl_pct * obedience_factor
    return min(10, int(raw))


def screen_coins(quality_pass_count: int) -> int:
    """Screen: content / logs that pass your checklist."""
    return min(5, int(quality_pass_count))


def apply_coin_summary(weekly: dict, stage_result: dict) -> dict:
    """Apply coin minting rules to a weekly Stage Cred record."""
    st = street_coins(
        pnl_pct=weekly["stage_cred"]["street"]["pnl_pct"],
        obeyed_plan=weekly["stage_cred"]["street"]["obeyed_plan"],
    )
    weekly["stage_cred"]["street"]["coins"]["minted"] = st

    sc = screen_coins(
        quality_pass_count=weekly["stage_cred"]["screen"]["quality_pass_count"]
    )
    weekly["stage_cred"]["screen"]["coins"]["minted"] = sc

    sg = int(stage_result["stage_coins"])
    weekly["stage_cred"]["stage"]["coins"]["minted"] = sg

    weekly["coin_summary"]["street"] = st
    weekly["coin_summary"]["screen"] = sc
    weekly["coin_summary"]["stage"] = sg
    weekly["coin_summary"]["total"] = st + sc + sg

    return weekly
