from fastapi import FastAPI
import os
import psycopg

api = FastAPI(title="MythOS API")


@api.get("/api/health")
def health():
    return {"ok": True}


@api.get("/api/ping")
def ping():
    return {"pong": True}


@api.get("/api/dbcheck")
def dbcheck():
    url = os.getenv("DB_URL")
    try:
        with psycopg.connect(url) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return {"db": "ok"}
    except Exception as e:  # pragma: no cover - defensive check for quick diagnostics
        return {"db": "error", "detail": str(e)}
