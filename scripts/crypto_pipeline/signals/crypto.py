"""Technical indicator utilities for DOGE/ETH.

Defaults to stub data for offline environments; pass ``live=True`` to pull
recent data via yfinance. The stub series mimic upward momentum to exercise the
pipeline without external calls.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

import importlib
import importlib.util

import numpy as np
import pandas as pd


@dataclass
class IndicatorSnapshot:
    symbol: str
    price: float
    buy_signals: List[str]
    sell_signals: List[str]
    rsi: float
    macd: float
    macd_signal: float
    ema20: float
    ema50: float

    def as_dict(self) -> Dict:
        return {
            "symbol": self.symbol,
            "price": self.price,
            "buy_signals": self.buy_signals,
            "sell_signals": self.sell_signals,
            "rsi": self.rsi,
            "macd": self.macd,
            "macd_signal": self.macd_signal,
            "ema20": self.ema20,
            "ema50": self.ema50,
        }


def stub_series(rows: int = 48) -> pd.DataFrame:
    now = datetime.utcnow()
    hours = pd.date_range(end=now, periods=rows, freq="H")
    base = np.linspace(0, 1, rows)
    prices = 0.1 + np.sin(base * np.pi) * 0.02 + base * 0.02
    return pd.DataFrame({"Close": prices}, index=hours)


def fetch_prices(symbol: str, live: bool) -> pd.DataFrame:
    if live:
        yf_spec = importlib.util.find_spec("yfinance")
        if yf_spec is not None:
            yf = importlib.import_module("yfinance")
            return yf.download(symbol, period="30d", interval="1h", progress=False)
    return stub_series()


def compute_indicators(series: pd.DataFrame) -> pd.DataFrame:
    series = series.copy()
    series["EMA20"] = series["Close"].ewm(span=20).mean()
    series["EMA50"] = series["Close"].ewm(span=50).mean()

    delta = series["Close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    series["RSI"] = 100 - (100 / (1 + rs))

    fast = series["Close"].ewm(span=12).mean()
    slow = series["Close"].ewm(span=26).mean()
    series["MACD"] = fast - slow
    series["MACD_signal"] = series["MACD"].ewm(span=9).mean()
    return series


def compute_signals(symbol: str, live: bool = False) -> Dict:
    series = fetch_prices(symbol, live)
    series = compute_indicators(series)
    latest = series.iloc[-1]

    buy: List[str] = []
    if latest["EMA20"] > latest["EMA50"]:
        buy.append("EMA_CROSS_UP")
    if latest["MACD"] > latest["MACD_signal"]:
        buy.append("MACD_UP")
    if latest["RSI"] < 35:
        buy.append("RSI_OVERSOLD")

    sell: List[str] = []
    if latest["EMA20"] < latest["EMA50"]:
        sell.append("EMA_CROSS_DOWN")
    if latest["MACD"] < latest["MACD_signal"]:
        sell.append("MACD_DOWN")
    if latest["RSI"] > 75:
        sell.append("RSI_OVERBOUGHT")

    snapshot = IndicatorSnapshot(
        symbol=symbol,
        price=float(latest["Close"]),
        buy_signals=buy,
        sell_signals=sell,
        rsi=float(latest["RSI"]),
        macd=float(latest["MACD"]),
        macd_signal=float(latest["MACD_signal"]),
        ema20=float(latest["EMA20"]),
        ema50=float(latest["EMA50"]),
    )
    return snapshot.as_dict()
