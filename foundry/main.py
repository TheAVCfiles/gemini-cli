from fastapi import FastAPI
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import hashlib
import json
import time
import os
import zipfile
import subprocess
import datetime
from reportlab.pdfgen import canvas

app = FastAPI(title="Psychic OS – Foundry Engine")

LEDGER_REPO = os.environ.get("LEDGER_REPO", "../_ledger.git")
ARTIFACTS_DIR = "artifacts"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)


class VaultIn(BaseModel):
    client_name: str
    birth_date: str
    birth_time: str
    birth_location: Optional[str] = None
    symbols: List[str] = Field(..., min_items=5, max_items=5)
    tier: str = Field("Orchestra", regex="^(Orchestra|BoxSeat)$")

    @validator("birth_date")
    def check_date(cls, value: str) -> str:
        try:
            datetime.date.fromisoformat(value)
        except Exception as error:  # noqa: F841
            raise ValueError("birth_date must be ISO 8601 YYYY-MM-DD") from error
        return value

    @validator("birth_time")
    def check_time(cls, value: str) -> str:
        try:
            datetime.time.fromisoformat(value)
        except Exception as error:  # noqa: F841
            raise ValueError("birth_time must be HH:MM (24h)") from error
        return value


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def make_key_signature(payload: Dict[str, Any]) -> str:
    seed = json.dumps(payload, sort_keys=True) + f"|{int(time.time())}"
    return sha256_hex(seed)[:16]


def symbol_map(symbols: List[str]) -> Dict[str, str]:
    base = {
        "🌊": "Neptune/Pisces/Water",
        "🗝️": "Chiron/Saturn/Access",
        "🔑": "Chiron/Saturn/Access",
        "🧬": "Uranus/Pluto/Code",
        "🔥": "Mars/Aries/Combustion",
        "🎭": "Mercury/Gemini/Mask",
        "💰": "Taurus/2nd House/Value",
        "🜂": "Fire/Will",
        "🜄": "Water/Feeling",
    }
    mapped: Dict[str, str] = {}
    for symbol in symbols:
        mapped[symbol] = base.get(symbol, "Archetype: User-defined")
    return mapped


def natal_chart_stub(
    birth_date: str,
    birth_time: str,
    birth_location: Optional[str],
) -> Dict[str, Any]:
    has_location = bool(birth_location)
    chart = {
        "mode": "full" if has_location else "sign_only",
        "birth_date": birth_date,
        "birth_time": birth_time,
        "birth_location": birth_location or "UNSPECIFIED",
        "core": {
            "sun": {"sign": "Scorpio"},
            "moon": {"sign": "Aquarius"},
            "asc": {"sign": "Sagittarius"},
        },
        "notes": "Houses/aspects suppressed without geocoded birthplace.",
    }
    return chart


def build_prompt(
    client_name: str,
    chart_data: Dict[str, Any],
    symbol_mapping: Dict[str, str],
) -> Dict[str, Any]:
    system_prompt = (
        "You are the Psychic OS for Decrypt the Girl. "
        "Voice: measured, reverent, oracular. Synthesize natal data + 5 symbols "
        "into a poetic, strategic reading with sharp, actionable insights. Avoid platitudes."
    )
    user_prompt = {
        "CLIENT": client_name,
        "ORBITAL_MAP": chart_data,
        "SYMBOL_VAULT": symbol_mapping,
        "TASK": {
            "symbol_interpretations": True,
            "anomaly_detection": True,
            "timing": True,
            "actions": True,
        },
    }
    return {"system": system_prompt, "user": user_prompt}


def write_pdf(path: str, title: str, body: str) -> None:
    pdf_canvas = canvas.Canvas(path)
    pdf_canvas.setTitle(title)
    pdf_canvas.setFont("Times-Roman", 14)
    pdf_canvas.drawString(72, 770, title)
    pdf_canvas.setFont("Times-Roman", 10)
    y_position = 740
    for line in body.splitlines():
        if y_position < 72:
            pdf_canvas.showPage()
            y_position = 770
            pdf_canvas.setFont("Times-Roman", 10)
        pdf_canvas.drawString(72, y_position, line[:100])
        y_position -= 14
    pdf_canvas.save()


def zip_dir(zip_path: str, files: Dict[str, str]) -> None:
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for archive_name, filesystem_path in files.items():
            archive.write(filesystem_path, arcname=archive_name)


def ledger_commit(zip_path: str, key_sig: str, tier: str, client_name: str, status: str = "RENDERED") -> None:
    if not os.path.isdir(".git"):
        subprocess.run(["git", "init"], check=True)
        subprocess.run(["git", "remote", "add", "origin", LEDGER_REPO], check=True)
    subprocess.run(["git", "add", zip_path], check=True)
    message = f"EVENT:{key_sig} TIER:{tier} CLIENT:{client_name} STATUS:{status}"
    subprocess.run(["git", "commit", "-m", message], check=True)
    subprocess.run(["git", "push", "origin", "HEAD:master"], check=True)


@app.post("/vault")
def vault(payload: VaultIn) -> Dict[str, Any]:
    data = payload.dict()
    key_sig = make_key_signature(data)
    symbol_mapping = symbol_map(payload.symbols)
    chart_data = natal_chart_stub(payload.birth_date, payload.birth_time, payload.birth_location)
    prompt = build_prompt(payload.client_name, chart_data, symbol_mapping)

    ai_output = {
        "summary": "Proof-of-Intuition: AVC Zero-Block. Sign-only natal synthesis with symbol anomalies.",
        "confluence": [
            "Sun Scorpio × 🔑 Access",
            "Moon Aquarius × 🧬 Code",
            "ASC Sagittarius × 🜂 Fire",
        ],
        "actions": [
            "Protect IP vault",
            "Schedule benefactor calls during Moon air transits",
            "Publish ledger hash",
        ],
    }

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    base_name = f"{payload.client_name.replace(' ', '')}_Vault_{key_sig}"
    directory_path = os.path.join(ARTIFACTS_DIR, base_name)
    os.makedirs(directory_path, exist_ok=True)

    reading_path = os.path.join(directory_path, "reading.json")
    with open(reading_path, "w", encoding="utf-8") as file:
        json.dump(
            {
                "key_signature": key_sig,
                "input": data,
                "chart_data": chart_data,
                "symbol_map": symbol_mapping,
                "prompt": prompt,
                "ai_output": ai_output,
                "timestamp_utc": timestamp,
            },
            file,
            indent=2,
        )

    pdf_path = os.path.join(directory_path, "Reading.pdf")
    pdf_body = f"""AVC Proof-of-Intuition: {timestamp}
Key: {key_sig}

Client: {payload.client_name}
Birth: {payload.birth_date} {payload.birth_time}  Location: {payload.birth_location or 'UNSPECIFIED'}

Core:
- Sun: {chart_data['core']['sun']['sign']}
- Moon: {chart_data['core']['moon']['sign']}
- Asc:  {chart_data['core']['asc']['sign']}

Symbols:
{', '.join(payload.symbols)}

Anomalies:
- {ai_output['confluence'][0]}
- {ai_output['confluence'][1]}
- {ai_output['confluence'][2]}

Actions:
- {ai_output['actions'][0]}
- {ai_output['actions'][1]}
- {ai_output['actions'][2]}
"""
    write_pdf(pdf_path, "AVC – Zero Block Reading", pdf_body)

    stage_html = os.path.join(directory_path, "01_THE_STAGE.html")
    with open(stage_html, "w", encoding="utf-8") as file:
        file.write(
            f"""<!doctype html><meta charset=\"utf-8\">
<title>AVC Zero Block – {key_sig}</title>
<h1>AVC Zero Block</h1>
<p><b>Key:</b> {key_sig}</p>
<p>This is a local, permanent proof-of-intuition ticket. Open reading.json for raw data.</p>
"""
        )

    zip_output_path = os.path.join(ARTIFACTS_DIR, f"{base_name}.zip")
    zip_dir(
        zip_output_path,
        {
            f"{base_name}/reading.json": reading_path,
            f"{base_name}/Reading.pdf": pdf_path,
            f"{base_name}/01_THE_STAGE.html": stage_html,
        },
    )

    ledger_commit(zip_output_path, key_sig, payload.tier, payload.client_name, status="RENDERED")

    return {
        "status": "ok",
        "key_signature": key_sig,
        "artifact": zip_output_path,
        "mode": chart_data["mode"],
    }
