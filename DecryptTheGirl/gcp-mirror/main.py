"""FastAPI application that serves Lilith Loop folio data.

The service reads a YAML configuration file to locate folio assets.
Use this to mirror the choreography repository into Google Cloud Run.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

import yaml
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

CONFIG_PATH = Path(__file__).resolve().parent / "config.yaml"

app = FastAPI(title="DecryptTheGirl Folio Mirror", version="1.0.0")


def _load_config() -> Dict[str, Any]:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(
            "config.yaml not found. Copy sample-config.yaml and update project settings before deploying."
        )
    with CONFIG_PATH.open("r", encoding="utf-8") as stream:
        return yaml.safe_load(stream)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/folios")
def list_folios() -> JSONResponse:
    config = _load_config()
    folios: List[Dict[str, Any]] = config.get("folios", [])
    summary = [
        {
            "id": folio["id"],
            "title": folio.get("title", folio["id"]),
            "meta_rule": folio.get("meta_rule"),
        }
        for folio in folios
    ]
    return JSONResponse(content={"folios": summary})


@app.get("/folios/{folio_id}")
def get_folio(folio_id: str) -> JSONResponse:
    config = _load_config()
    folios: List[Dict[str, Any]] = config.get("folios", [])
    for folio in folios:
        if folio["id"] == folio_id:
            payload = {
                "id": folio["id"],
                "title": folio.get("title", folio_id),
                "glyph_map": _read_text(folio.get("glyph_map")),
                "meta_rule": _read_text(folio.get("meta_rule")),
                "script": _read_text(folio.get("script")),
                "flowchart": folio.get("flowchart"),
            }
            return JSONResponse(content=payload)
    raise HTTPException(status_code=404, detail=f"Folio '{folio_id}' not found")


def _read_text(path_str: str | None) -> str | None:
    if not path_str:
        return None
    path = (CONFIG_PATH.parent / path_str).resolve()
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"Configured file not found: {path_str}")
    return path.read_text(encoding="utf-8")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
