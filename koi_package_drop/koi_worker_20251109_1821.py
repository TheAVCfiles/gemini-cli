#!/usr/bin/env python3
"""
koi_worker.py — Minimal KOI backoff+jitter worker stub (no external deps).

This is a drop-in template. Swap the placeholder "fetch_next_task" and
"execute_task" with your queue/API calls and database writes.

Environment variables:
  KOI_MAX_ATTEMPTS (default 9)
  KOI_BASE_DELAY_MS (default 1500)
  KOI_CAP_DELAY_MS  (default 120000)
  KOI_HEARTBEAT_SEC (default 60)

Optional:
  KOI_LOG_JSON=true to emit JSON logs.
"""

import json
import os
import random
import signal
import threading
import time
from datetime import datetime, timedelta

MAX_ATTEMPTS = int(os.getenv("KOI_MAX_ATTEMPTS", "9"))
BASE_DELAY_MS = int(os.getenv("KOI_BASE_DELAY_MS", "1500"))
CAP_DELAY_MS = int(os.getenv("KOI_CAP_DELAY_MS", "120000"))
HEARTBEAT_SEC = int(os.getenv("KOI_HEARTBEAT_SEC", "60"))
LOG_JSON = os.getenv("KOI_LOG_JSON", "false").lower() == "true"

RUNNING = True

def log(event, **fields):
    payload = {"ts": datetime.utcnow().isoformat() + "Z", "event": event, **fields}
    if LOG_JSON:
        print(json.dumps(payload), flush=True)
    else:
        kv = " ".join(f"{k}={v}" for k, v in fields.items())
        print(f"[{payload['ts']}] {event} {kv}", flush=True)

def heartbeat_loop():
    while RUNNING:
        log("koi.pulse")
        time.sleep(HEARTBEAT_SEC)

def backoff_delay_ms(attempt: int) -> int:
    base = BASE_DELAY_MS / 1000.0
    cap = CAP_DELAY_MS / 1000.0
    delay = min(cap, base * (2 ** attempt)) + random.random() * base
    return int(delay * 1000)

# ---- Replace these with real integrations ----------------------------------

_INBOX = []  # demo queue (in-memory)

def enqueue_demo_task(task_key: str, payload: dict):
    _INBOX.append(
        {
            "task_key": task_key,
            "event_type": payload.get("event_type", "demo"),
            "status": "pending",
            "attempt": 0,
            "max_attempts": MAX_ATTEMPTS,
            "next_run_at": datetime.utcnow(),
            "last_error": None,
            "payload": payload,
        }
    )

def fetch_next_task():
    now = datetime.utcnow()
    for task in _INBOX:
        if task["status"] in ("pending", "failed") and task["next_run_at"] <= now:
            return task
    return None

def execute_task(task: dict) -> None:
    """
    Replace with your real task execution: API call, DB op, etc.
    Here we simulate transient failures 40% of the time.
    """

    time.sleep(0.1)
    if random.random() < 0.4:
        raise RuntimeError("transient upstream error")
    return

# ----------------------------------------------------------------------------

def worker_loop():
    while RUNNING:
        task = fetch_next_task()
        if not task:
            time.sleep(0.2)
            continue

        attempt = task["attempt"]
        key = task["task_key"]
        try:
            log("koi.task.start", key=key, attempt=attempt)
            execute_task(task)
            task["status"] = "succeeded"
            log("koi.task.ok", key=key, attempt=attempt)
        except Exception as exc:  # noqa: BLE001 - demo resiliency
            task["attempt"] += 1
            task["status"] = "failed"
            task["last_error"] = str(exc)
            if task["attempt"] >= task["max_attempts"]:
                task["status"] = "dead"
                log("koi.deadletter.parked", key=key, error=str(exc))
            else:
                delay = backoff_delay_ms(task["attempt"])
                task["next_run_at"] = datetime.utcnow() + timedelta(milliseconds=delay)
                log("koi.task.requeued", key=key, next_ms=delay, error=str(exc))

def handle_sigterm(signum, frame):
    del signum, frame
    global RUNNING
    RUNNING = False


def main():
    signal.signal(signal.SIGINT, handle_sigterm)
    signal.signal(signal.SIGTERM, handle_sigterm)

    for i in range(5):
        enqueue_demo_task(f"demo-{i}", {"event_type": "demo", "n": i})

    heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
    heartbeat_thread.start()

    log(
        "koi.start",
        max_attempts=MAX_ATTEMPTS,
        base_ms=BASE_DELAY_MS,
        cap_ms=CAP_DELAY_MS,
    )
    try:
        worker_loop()
    finally:
        log("koi.stop")


if __name__ == "__main__":
    main()
