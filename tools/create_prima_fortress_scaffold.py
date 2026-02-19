#!/usr/bin/env python3
"""Create a GitHub-ready PRIMA Fortress scaffold zip."""

from __future__ import annotations

import json
import pathlib
import shutil
import textwrap
import zipfile

ROOT = pathlib.Path("/mnt/data/prima-fortress")
ZIP_PATH = pathlib.Path("/mnt/data/prima-fortress.zip")


def write(path: str, content: str) -> None:
    full_path = ROOT / path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")


def main() -> None:
    if ROOT.exists():
        shutil.rmtree(ROOT)
    ROOT.mkdir(parents=True, exist_ok=True)

    write(
        "README.md",
        """
        # PRIMA Fortress — ETH Weather Forecaster (7-Day), Self-Improving Loop

        This scaffold includes:
        - FastAPI backend with `/forecast/eth`, `/learn/eth`, `/healthz`
        - Robust daily evaluator (`api/daily_eval.py`) with logging, retries, and tolerance guards
        - Paper executor (`executor/paper_executor.py`) for simple capped Kelly paper trades
        - Vite + React + TS dashboard
        - Dockerfiles, docker-compose, GitHub Actions CI, and systemd timer examples

        ## Quick start

        ```bash
        # API
        cd api
        pip install -r requirements.txt
        uvicorn app:app --host 0.0.0.0 --port 8000 --reload

        # Web
        cd web
        npm i
        npm run dev

        # Full stack
        docker compose up --build

        # Daily evaluation
        cd api
        python daily_eval.py
        ```
        """,
    )

    write(
        "api/requirements.txt",
        """
        fastapi==0.115.6
        uvicorn[standard]==0.32.1
        pydantic==2.10.3
        numpy==2.2.0
        pandas==2.2.3
        requests==2.32.3
        pyyaml==6.0.2
        pyarrow==18.1.0
        pytest==8.3.4
        """,
    )

    write(
        "api/config.yaml",
        """
        horizon_minutes: 10080
        upper_band_atr_k: 1.2
        lower_band_atr_k: 1.2
        rain_threshold: 0.70
        request_timeout_seconds: 30
        nearest_tolerance_min: 2.0
        """,
    )

    write(
        "api/app.py",
        """
        from datetime import datetime, timedelta, timezone
        import random

        from fastapi import FastAPI
        from pydantic import BaseModel

        app = FastAPI(title="PRIMA Fortress API")

        STATE = {
            "rain_alpha": 1.0,
            "rain_beta": 1.0,
            "sun_alpha": 1.0,
            "sun_beta": 1.0,
            "timing_shift_min": 0.0,
            "learn_events": 0,
        }


        class LearnEvent(BaseModel):
            event: str
            predicted_ts: str
            realized_ts: str
            hit: bool = True


        def clamp(v: float, lo: float, hi: float) -> float:
            return max(lo, min(v, hi))


        @app.get("/healthz")
        def healthz() -> dict:
            return {"ok": True, "state": STATE}


        @app.get("/forecast/eth")
        def forecast_eth(anchor_date: str | None = None, horizon_minutes: int = 7 * 24 * 60) -> dict:
            if anchor_date:
                start = datetime.fromisoformat(anchor_date).replace(tzinfo=timezone.utc)
            else:
                start = datetime.now(timezone.utc).replace(second=0, microsecond=0)

            rain_prior = STATE["rain_alpha"] / (STATE["rain_alpha"] + STATE["rain_beta"])
            shift = STATE["timing_shift_min"]
            grid = []
            for i in range(horizon_minutes):
                ts = start + timedelta(minutes=i)
                phase = (i + shift) / 240.0
                seasonal = 0.08 * (1 if int(phase) % 2 == 0 else -1)
                rain = clamp(rain_prior + seasonal + random.uniform(-0.05, 0.05), 0.01, 0.99)
                grid.append({"ts": ts.isoformat(), "rain": rain, "sun": 1 - rain})

            return {"asset": "ETH", "grid": grid, "state": STATE}


        @app.post("/learn/eth")
        def learn_eth(event: LearnEvent) -> dict:
            realized = datetime.fromisoformat(event.realized_ts)
            predicted = datetime.fromisoformat(event.predicted_ts)
            delta_min = (realized - predicted).total_seconds() / 60.0

            if event.event == "rain":
                if event.hit:
                    STATE["rain_alpha"] += 1
                else:
                    STATE["rain_beta"] += 1
            elif event.event == "sun":
                if event.hit:
                    STATE["sun_alpha"] += 1
                else:
                    STATE["sun_beta"] += 1

            alpha = 0.2
            STATE["timing_shift_min"] = (1 - alpha) * STATE["timing_shift_min"] + alpha * delta_min
            STATE["timing_shift_min"] = clamp(STATE["timing_shift_min"], -180.0, 180.0)
            STATE["learn_events"] += 1

            return {"updated": True, "delta_min": delta_min, "state": STATE}
        """,
    )

    write(
        "api/daily_eval.py",
        """
        from __future__ import annotations

        import json
        import logging
        from datetime import datetime, timedelta, timezone
        from pathlib import Path
        from typing import Any

        import numpy as np
        import pandas as pd
        import requests
        import yaml

        ROOT = Path(__file__).resolve().parent
        DATA = ROOT.parent / "data"
        CFG = yaml.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))
        API = "http://localhost:8000"
        REQUEST_TIMEOUT = int(CFG.get("request_timeout_seconds", 30))

        logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
        logger = logging.getLogger("daily-eval")


        def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
            tr = (df["high"] - df["low"]).abs()
            tr2 = (df["high"] - df["close"].shift()).abs()
            tr3 = (df["low"] - df["close"].shift()).abs()
            true_range = pd.concat([tr, tr2, tr3], axis=1).max(axis=1)
            return true_range.ewm(alpha=1 / n, adjust=False).mean()


        def label_hits(
            bars: pd.DataFrame,
            start_ts: pd.Timestamp,
            horizon_min: int,
            k: float,
            nearest_tolerance_min: float = 2.0,
        ) -> dict[str, Any] | None:
            start_ts = pd.to_datetime(start_ts, utc=True)

            if start_ts not in bars.index:
                nearest = bars.index.get_indexer([start_ts], method="nearest")
                if nearest.size == 0 or nearest[0] == -1:
                    logger.debug("No nearest index for start_ts=%s", start_ts)
                    return None

                nearest_ts = bars.index[nearest[0]]
                delta_s = abs((nearest_ts - start_ts).total_seconds())
                if delta_s > nearest_tolerance_min * 60:
                    logger.debug("Nearest bar too far for start_ts=%s", start_ts)
                    return None
                start_ts = nearest_ts

            try:
                base_close = float(bars.loc[start_ts, "close"])
                base_atr = float(bars.loc[start_ts, "atr"])
            except Exception as exc:
                logger.debug("Failed to read base values for %s: %s", start_ts, exc)
                return None

            upper = base_close + k * base_atr
            lower = base_close - k * base_atr
            end_ts = start_ts + pd.Timedelta(minutes=horizon_min)
            window = bars[(bars.index > start_ts) & (bars.index <= end_ts)]
            if window.empty:
                logger.debug("Window empty for %s", start_ts)
                return None

            t_up = window[window["high"] >= upper].index.min()
            t_dn = window[window["low"] <= lower].index.min()

            if pd.isna(t_up) and pd.isna(t_dn):
                return {"event": None}
            if pd.isna(t_dn) or (not pd.isna(t_up) and t_up < t_dn):
                return {"event": "rain", "realized_ts": t_up}
            return {"event": "sun", "realized_ts": t_dn}


        def brier(probs: list[float], labels: list[int]) -> float:
            p = np.array(probs, dtype=float)
            y = np.array(labels, dtype=float)
            if len(p) == 0:
                return 1.0
            return float(np.mean((p - y) ** 2))


        def post_learn_event(session: requests.Session, payload: dict[str, Any]) -> bool:
            url = f"{API}/learn/eth"
            try:
                resp = session.post(url, json=payload, timeout=REQUEST_TIMEOUT)
                resp.raise_for_status()
                return True
            except requests.RequestException as exc:
                logger.warning("Failed POST %s payload=%s: %s", url, payload, exc)
                return False


        def run() -> None:
            session = requests.Session()
            bars_path = DATA / "eth_1m_tail.parquet"

            try:
                bars = pd.read_parquet(bars_path)
            except Exception as exc:
                logger.error("Unable to read bars parquet %s: %s", bars_path, exc)
                return

            bars["time"] = pd.to_datetime(bars["time"], utc=True)
            bars = bars.set_index("time").sort_index()
            bars["atr"] = atr(bars)

            params = {
                "anchor_date": datetime.now(timezone.utc).date().isoformat(),
                "horizon_minutes": CFG["horizon_minutes"],
            }
            try:
                forecast_resp = session.get(f"{API}/forecast/eth", params=params, timeout=REQUEST_TIMEOUT)
                forecast_resp.raise_for_status()
            except requests.RequestException as exc:
                logger.error("Forecast request failed: %s", exc)
                return

            try:
                payload = forecast_resp.json()
                grid = pd.DataFrame(payload.get("grid", []))
                grid["ts"] = pd.to_datetime(grid["ts"], utc=True)
            except Exception as exc:
                logger.error("Failed parsing forecast response JSON: %s", exc)
                return

            yday_start = (datetime.now(timezone.utc) - timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            yday_end = yday_start + timedelta(days=1)
            g = grid[(grid["ts"] >= yday_start) & (grid["ts"] < yday_end)]
            if g.empty:
                logger.info("No forecast rows for %s", yday_start.date().isoformat())
                return

            rain_probs: list[float] = []
            rain_labels: list[int] = []
            sun_probs: list[float] = []
            sun_labels: list[int] = []
            mae_times: list[float] = []
            tolerance = float(CFG.get("nearest_tolerance_min", 2.0))

            for row in g.itertuples(index=False):
                lab = label_hits(
                    bars,
                    row.ts,
                    int(CFG["horizon_minutes"]),
                    float(CFG["upper_band_atr_k"]),
                    nearest_tolerance_min=tolerance,
                )
                if lab is None:
                    continue

                if lab["event"] is None:
                    rain_labels.append(0)
                    rain_probs.append(float(row.rain))
                    sun_labels.append(0)
                    sun_probs.append(float(row.sun))
                    continue

                event = str(lab["event"])
                realized_ts = pd.Timestamp(lab["realized_ts"]).to_pydatetime()
                learn_payload = {
                    "event": event,
                    "predicted_ts": row.ts.isoformat(),
                    "realized_ts": realized_ts.isoformat(),
                    "hit": True,
                }
                post_learn_event(session, learn_payload)

                rain_labels.append(1 if event == "rain" else 0)
                rain_probs.append(float(row.rain))
                sun_labels.append(1 if event == "sun" else 0)
                sun_probs.append(float(row.sun))
                mae_times.append(abs((realized_ts - row.ts.to_pydatetime()).total_seconds() / 60.0))

            metric = {
                "date": yday_start.date().isoformat(),
                "brier_rain": brier(rain_probs, rain_labels),
                "brier_sun": brier(sun_probs, sun_labels),
                "timing_mae_min": float(np.mean(mae_times)) if mae_times else None,
                "n_points": int(len(g)),
            }

            DATA.mkdir(parents=True, exist_ok=True)
            metrics_file = DATA / "metrics.jsonl"
            try:
                with metrics_file.open("a", encoding="utf-8") as f:
                    f.write(json.dumps(metric) + "\\n")
                logger.info("Wrote metric for %s (n=%s)", metric["date"], metric["n_points"])
            except Exception as exc:
                logger.error("Failed writing metrics file %s: %s", metrics_file, exc)


        if __name__ == "__main__":
            run()
        """,
    )

    write(
        "api/tests/test_daily_eval.py",
        """
        import numpy as np
        import pandas as pd

        from daily_eval import brier, label_hits


        def _bars_upward() -> pd.DataFrame:
            idx = pd.date_range("2026-02-16T00:00:00Z", periods=20, freq="min", tz="UTC")
            high = np.linspace(100, 120, len(idx))
            low = np.linspace(99, 119, len(idx))
            close = np.linspace(99.5, 119.5, len(idx))
            bars = pd.DataFrame({"high": high, "low": low, "close": close}, index=idx)
            bars["atr"] = 1.0
            return bars


        def test_label_hits_rain_event() -> None:
            bars = _bars_upward()
            result = label_hits(bars, bars.index[0], horizon_min=10, k=1.0)
            assert result is not None
            assert result["event"] == "rain"


        def test_label_hits_no_event() -> None:
            idx = pd.date_range("2026-02-16T00:00:00Z", periods=10, freq="min", tz="UTC")
            bars = pd.DataFrame(
                {
                    "high": [100.0] * len(idx),
                    "low": [99.0] * len(idx),
                    "close": [99.5] * len(idx),
                },
                index=idx,
            )
            bars["atr"] = 1.0
            result = label_hits(bars, bars.index[0], horizon_min=5, k=100.0)
            assert result is not None
            assert result["event"] is None


        def test_label_hits_tolerance_guard() -> None:
            bars = _bars_upward()
            off_grid = bars.index[0] + pd.Timedelta(minutes=10, seconds=30)
            result = label_hits(bars, off_grid, horizon_min=5, k=1.0, nearest_tolerance_min=0.1)
            assert result is None


        def test_brier_empty() -> None:
            assert brier([], []) == 1.0
        """,
    )

    write(
        "executor/requirements.txt",
        """
        requests==2.32.3
        """,
    )

    write(
        "executor/paper_executor.py",
        """
        from __future__ import annotations

        import json
        from datetime import datetime, timezone
        from pathlib import Path

        import requests

        DATA = Path(__file__).resolve().parent.parent / "data"
        API = "http://api:8000"


        def run_once() -> None:
            resp = requests.get(f"{API}/forecast/eth", timeout=20)
            resp.raise_for_status()
            grid = resp.json()["grid"][:60]
            peak = max(grid, key=lambda r: r["rain"])
            prob = float(peak["rain"])

            equity = 10_000.0
            edge = max(min(prob - 0.5, 0.2), -0.2)
            kelly = max(min(edge, 0.05), 0.0)
            notional = round(equity * kelly, 2)
            order = {
                "ts": datetime.now(timezone.utc).isoformat(),
                "asset": "ETH",
                "side": "BUY" if prob >= 0.70 else "HOLD",
                "rain_prob": prob,
                "notional": notional,
            }

            DATA.mkdir(parents=True, exist_ok=True)
            with (DATA / "orders.jsonl").open("a", encoding="utf-8") as f:
                f.write(json.dumps(order) + "\\n")


        if __name__ == "__main__":
            run_once()
        """,
    )

    write(
        "executor/Dockerfile",
        """
        FROM python:3.12-slim
        WORKDIR /app
        COPY requirements.txt ./
        RUN pip install --no-cache-dir -r requirements.txt
        COPY . .
        CMD ["python", "paper_executor.py"]
        """,
    )

    write(
        "web/package.json",
        json.dumps(
            {
                "name": "prima-fortress-web",
                "private": True,
                "version": "0.1.0",
                "type": "module",
                "scripts": {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview --host",
                },
                "dependencies": {"react": "^18.3.1", "react-dom": "^18.3.1"},
                "devDependencies": {
                    "typescript": "^5.6.3",
                    "vite": "^5.4.11",
                    "@types/react": "^18.3.12",
                    "@types/react-dom": "^18.3.1",
                },
            },
            indent=2,
        ),
    )

    write(
        "web/index.html",
        """
        <!doctype html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>PRIMA Fortress</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
        """,
    )

    write(
        "web/src/main.tsx",
        """
        import React from "react";
        import { createRoot } from "react-dom/client";

        function App() {
          return (
            <main style={{ fontFamily: "sans-serif", margin: "2rem" }}>
              <h1>PRIMA Fortress</h1>
              <p>ETH weather dashboard scaffold is ready.</p>
              <ul>
                <li>Forecast endpoint: /forecast/eth</li>
                <li>Learning endpoint: /learn/eth</li>
                <li>Daily evaluator: api/daily_eval.py</li>
              </ul>
            </main>
          );
        }

        createRoot(document.getElementById("root")!).render(<App />);
        """,
    )

    write(
        "web/Dockerfile",
        """
        FROM node:20-alpine
        WORKDIR /app
        COPY package.json ./
        RUN npm i
        COPY . .
        CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
        """,
    )

    write(
        "docker-compose.yml",
        """
        services:
          api:
            build: ./api
            ports:
              - "8000:8000"
            volumes:
              - ./data:/app/../data

          web:
            build: ./web
            ports:
              - "5173:5173"
            depends_on:
              - api

          executor:
            build: ./executor
            volumes:
              - ./data:/app/../data
            depends_on:
              - api
        """,
    )

    write(
        "api/Dockerfile",
        """
        FROM python:3.12-slim
        WORKDIR /app
        COPY requirements.txt ./
        RUN pip install --no-cache-dir -r requirements.txt
        COPY . .
        CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
        """,
    )

    write(
        ".github/workflows/ci.yml",
        """
        name: ci
        on:
          push:
          pull_request:

        jobs:
          api:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v4
              - uses: actions/setup-python@v5
                with:
                  python-version: "3.12"
              - run: pip install -r api/requirements.txt
              - run: python -m py_compile api/app.py api/daily_eval.py
              - run: PYTHONPATH=api pytest -q api/tests

          web:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v4
              - uses: actions/setup-node@v4
                with:
                  node-version: "20"
              - run: cd web && npm i && npm run build
        """,
    )

    write(
        "Makefile",
        """
        .PHONY: scaffold api-test api-compile

        scaffold:
        \tpython tools/create_prima_fortress_scaffold.py

        api-test:
        \tPYTHONPATH=api pytest -q api/tests

        api-compile:
        \tpython -m py_compile api/app.py api/daily_eval.py
        """,
    )

    write(
        "systemd/eth-metrics.service",
        """
        [Unit]
        Description=ETH Metrics Runner
        After=network-online.target
        Wants=network-online.target

        [Service]
        Type=oneshot
        WorkingDirectory=/opt/prima-fortress/api
        ExecStart=/usr/bin/python3 /opt/prima-fortress/api/daily_eval.py
        Restart=on-failure
        Environment=PYTHONUNBUFFERED=1

        [Install]
        WantedBy=multi-user.target
        """,
    )

    write(
        "systemd/eth-metrics.timer",
        """
        [Unit]
        Description=Run ETH metrics daily

        [Timer]
        OnCalendar=*-*-* 02:00:00
        Persistent=true

        [Install]
        WantedBy=timers.target
        """,
    )

    write("data/.gitkeep", "")

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()

    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in ROOT.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(ROOT))

    print(ZIP_PATH)


if __name__ == "__main__":
    main()
