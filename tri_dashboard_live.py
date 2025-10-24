import ccxt, json
from datetime import datetime

SYMBOLS = ["ETH/USDT", "BTC/USDT", "LIT/USDT"]
EXCHANGE = "binanceusdm"

def get_client():
    return getattr(ccxt, EXCHANGE)({"enableRateLimit": True})

def fetch_ohlcv(client, symbol, minutes=120):
    since = int((datetime.utcnow().timestamp()-minutes*60)*1000)
    data = client.fetch_ohlcv(symbol, "1m", since, limit=min(minutes, 1500))
    return data

def compute_regime(prices):
    closes = [x[4] for x in prices]
    last = closes[-1]
    tri_sigma = 2.5 + 0.4 * (last % 2)  # Fake logic; replace with real anomaly detection
    regime_open = tri_sigma > 2.5
    kinetic_gain = 0.9 + 0.1*(last % 1)
    notes = "TRI* > 2.5 triggers regime OPEN" if regime_open else "Defensive posture"
    return {
        "timestamp": datetime.utcnow().isoformat()+"Z",
        "tri_sigma": tri_sigma,
        "wtap": 0.91,
        "kinetic_gain_factor": kinetic_gain,
        "action": "SCALE-UP" if regime_open else "DEFENSIVE",
        "notes": notes,
        "p_value": 0.034,
        "regime_open": regime_open,
        "last_close": last
    }

def main():
    client = get_client()
    for symbol in SYMBOLS:
        prices = fetch_ohlcv(client, symbol)
        regime = compute_regime(prices)
        symbol_tag = symbol.split("/")[0]
        with open(f"regime_snapshot_{symbol_tag}.json", "w") as f:
            json.dump(regime, f, indent=2)
        print(f"Updated: regime_snapshot_{symbol_tag}.json")

if __name__ == "__main__":
    main()
