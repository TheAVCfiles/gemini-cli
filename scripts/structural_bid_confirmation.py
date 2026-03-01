import pandas as pd
from datetime import datetime, timedelta

"""
STRUCTURAL BID CONFIRMATION ENGINE
Validates macro narrative against high-weight capital events.
"""


def check_structural_bid_confirmation(ledger_df, anchor_date, window_days=90, min_weight=85):
    """
    Implements Structural Bid Confirmation Signal.
    Checks if high-weight event (W >= min_weight) falls within ±window_days of anchor.
    """
    start = anchor_date - timedelta(days=window_days)
    end = anchor_date + timedelta(days=window_days)

    qualified_events = ledger_df[
        (ledger_df['event_date'] >= start)
        & (ledger_df['event_date'] <= end)
        & (ledger_df['weight'] >= min_weight)
    ]

    if not qualified_events.empty:
        return {
            'status': 'CONFIRMED',
            'signal': 'Structural Bid',
            'implication': 'The macro story is now anchored by structural capital (Hardware > Sentiment).',
            'execution': {
                'asset_target': 'LAC/SQM (Lithium Juniors)',
                'allocation': '1.0–1.2% equity',
                'hedge': '20–30% BTC',
                'horizon': '6–18 months',
            },
            'supporting_evidence': qualified_events.to_dict(orient='records'),
        }

    return {
        'status': 'NEUTRAL',
        'signal': 'Awaiting Confirmation',
        'implication': 'Narrative remains unanchored. Structural capital is absent.',
        'action': 'Maintain existing levels. Do not increase exposure.',
    }


if __name__ == '__main__':
    structural_ledger = pd.DataFrame(
        {
            'event_date': [datetime(2026, 2, 10), datetime(2026, 2, 15)],
            'weight': [92, 85],
            'description': ['DOE Equity Stake', 'OEM Offtake Agreement'],
        }
    )

    narrative_anchor = datetime(2026, 2, 12)
    result = check_structural_bid_confirmation(structural_ledger, narrative_anchor)

    print('-' * 30)
    print(f"SIGNAL: {result['signal']} [{result['status']}]")
    print(f"IMPLICATION: {result['implication']}")
    if result['status'] == 'CONFIRMED':
        print('ACTION: Deploy Strategy')
        for event in result['supporting_evidence']:
            print(f"  > {event['event_date'].date()}: {event['description']} (Weight: {event['weight']})")
    print('-' * 30)
