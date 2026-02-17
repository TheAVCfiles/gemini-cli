from fastapi import FastAPI
import pandas as pd

from check_structural_bid_confirmation import check_structural_bid_confirmation

app = FastAPI(title="Structural Bid Signal API")


@app.get("/signal")
def get_signal(anchor_date: str = "2026-02-12"):
    ledger_df = pd.read_csv("structural_ledger.csv")
    return check_structural_bid_confirmation(ledger_df, anchor_date)
