import ccxt, csv
from datetime import datetime

SYMBOLS = ["ETH/USDT", "BTC/USDT", "LIT/USDT"]
EXCHANGE = "binanceusdm"

def get_client():
    return getattr(ccxt, EXCHANGE)({"enableRateLimit": True})

def fetch_levels(client, symbol):
    ticker = client.fetch_ticker(symbol)
    funding = client.fetch_funding_rate(symbol) if hasattr(client, "fetch_funding_rate") else {"fundingRate": None}
    oi = client.fetch_open_interest(symbol) if hasattr(client, "fetch_open_interest") else {"openInterest": None}
    last_close = ticker.get("last", None)
    guard_low = last_close * 0.99 if last_close else None
    ang_45 = last_close * 1.01 if last_close else None
    ang_90 = last_close * 1.02 if last_close else None
    fade_trigger = "Angle90High (short)"
    return [symbol.split("/")[0], last_close, guard_low, ang_45, ang_90, fade_trigger, funding.get("fundingRate"), oi.get("openInterest")]

def main():
    client = get_client()
    with open("predictive_levels.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Symbol","LastClose","GuardLow","Angle45High","Angle90High","FadeTrigger","FundingRate","OpenInterest"])
        for symbol in SYMBOLS:
            w.writerow(fetch_levels(client, symbol))
    print("Updated: predictive_levels.csv")

if __name__ == "__main__":
    main()
