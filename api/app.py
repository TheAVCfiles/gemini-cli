"""FastAPI application exposing the mythtouch demo endpoints."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import AsyncIterator

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse

import mythtouch as mod

app = FastAPI(title="mythtouch", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LIVE_HTML_PATH = Path(__file__).with_name("live.html")


@app.get("/")
def status() -> dict[str, object]:
    """Simple readiness endpoint."""
    return {"status": "ok", "textures": mod.available_textures()}


@app.get("/live", response_class=HTMLResponse)
def live_view() -> HTMLResponse:
    """Serve the demo HTML client."""
    if not LIVE_HTML_PATH.exists():
        raise HTTPException(status_code=404, detail="live.html not found")
    return HTMLResponse(LIVE_HTML_PATH.read_text(encoding="utf-8"))


@app.get("/stream")
async def stream(
    texture: str = Query(..., description="Texture preset to simulate."),
    seconds: float = Query(1.0, gt=0, le=10, description="Duration of the synthetic signal."),
    fs: int = Query(1000, gt=0, le=10_000, description="Sample rate for the synthetic signal."),
    window_ms: int = Query(50, gt=0, le=500, description="Window size for energy reduction."),
    seed: int = Query(11, description="Seed for the random generator."),
) -> StreamingResponse:
    """Stream synthetic receptor energies as server-sent events."""
    if texture not in mod.available_textures():
        raise HTTPException(status_code=400, detail=f"Unsupported texture '{texture}'.")

    rng = np.random.default_rng(seed)
    try:
        _, signal = mod.gen_texture_signal(texture, fs=fs, T=seconds, rng=rng)
        sim = mod.simulate_receptors(signal, fs=fs, grid_n=6, rng=rng)
        timeseries = mod.timeseries_energies(sim["envs"], fs=fs, window_ms=window_ms)
    except ValueError as exc:  # Surface validation errors as HTTP 400s.
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    async def event_gen() -> AsyncIterator[str]:
        for row in timeseries:
            payload = json.dumps(row)
            yield f"data: {payload}\n\n"
            await asyncio.sleep(max(0.001, window_ms / 1000))

    headers = {"Cache-Control": "no-cache", "Connection": "keep-alive"}
    return StreamingResponse(event_gen(), media_type="text/event-stream", headers=headers)


__all__ = ["app"]
