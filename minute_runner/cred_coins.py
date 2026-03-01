
def street_coins(pnl_pct: float, obeyed_plan: bool) -> int:
    """
    1 Street Coin per +1% clean realized gain,
    scaled by obedience to the plan, capped at 10.
    """
    if pnl_pct <= 0:
        return 0
    obedience_factor = 1.0 if obeyed_plan else 0.5
    raw = pnl_pct * obedience_factor
    return min(10, int(raw))


def screen_coins(quality_pass_count: int) -> int:
    """
    1 Screen Coin per reel / log that passes your checklist,
    capped at 5 per week.
    """
    return min(5, int(quality_pass_count))
