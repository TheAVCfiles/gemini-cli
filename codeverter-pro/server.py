import csv
import json
import os
from datetime import datetime

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL_NAME = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
LEDGER_FILE = os.environ.get("CODEVERTER_LEDGER", "codeverter_pro_ledger.csv")


def append_to_ledger(
    source_lang: str,
    target_lang: str,
    source_score: int,
    target_score: int,
) -> None:
    """Persist a conversion score pair for auditing ROI over time."""
    file_exists = os.path.isfile(LEDGER_FILE)
    delta = target_score - source_score

    with open(LEDGER_FILE, mode="a", newline="", encoding="utf-8") as ledger:
        writer = csv.writer(ledger)
        if not file_exists:
            writer.writerow(
                [
                    "timestamp",
                    "source_lang",
                    "target_lang",
                    "source_score",
                    "target_score",
                    "delta",
                ]
            )

        writer.writerow(
            [
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                source_lang,
                target_lang,
                source_score,
                target_score,
                f"+{delta}" if delta > 0 else str(delta),
            ]
        )


def build_prompt(source_lang: str, target_lang: str, source_code: str) -> str:
    return f"""You are an expert software engineer and strict code reviewer.

Task:
1. Evaluate the original {source_lang} code against the 7 Rules.
2. Translate the code to {target_lang}, refactoring it to strictly adhere to the 7 Rules.
3. Evaluate your translated {target_lang} code against the same 7 Rules.

The 7 Rules:
1. Descriptive names
2. Function size (<200 lines, >5 lines unless public)
3. Explicit dependencies (no hidden global state)
4. Robust error handling (no empty try/catch)
5. Nesting depth (max 2-3 levels)
6. Obvious side effects
7. No magic numbers

Output ONLY valid JSON in this exact structure:
{{
  "source_evaluation": {{
    "score": <int 0-100>,
    "summary": "<main flaws in the source architecture>"
  }},
  "translated_code": "<the refactored {target_lang} code>",
  "target_evaluation": {{
    "score": <int 0-100>,
    "improvements_made": [
      {{
        "rule": "<one of the 7 rules>",
        "action": "<specific change applied>"
      }}
    ]
  }}
}}

Source Code ({source_lang}):
{source_code}
"""


def _extract_message_text(response_json: dict) -> str:
    content = response_json.get("content", [])
    if not content:
        raise ValueError("No content returned from Anthropic.")

    text_chunks = [part.get("text", "") for part in content if part.get("type") == "text"]
    raw_text = "\n".join(chunk for chunk in text_chunks if chunk).strip()
    if not raw_text:
        raise ValueError("Empty text response from Anthropic.")
    return raw_text


def _parse_llm_json(raw_text: str) -> dict:
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
    result = json.loads(cleaned)

    if not isinstance(result, dict):
        raise ValueError("Unexpected model output shape.")

    if "source_evaluation" not in result or "target_evaluation" not in result:
        raise ValueError("Model response missing required evaluation fields.")

    return result


@app.post("/api/convert")
def convert_and_evaluate():
    payload = request.get_json(silent=True) or {}
    source_lang = payload.get("sourceLanguage")
    target_lang = payload.get("targetLanguage")
    source_code = payload.get("sourceCode")

    if not all([source_lang, target_lang, source_code]):
        return jsonify({"error": "Missing required parameters."}), 400

    if not API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY is not set."}), 500

    anthropic_headers = {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    anthropic_payload = {
        "model": MODEL_NAME,
        "max_tokens": 4000,
        "system": "You are a code translation and evaluation engine. Output ONLY JSON.",
        "messages": [{"role": "user", "content": build_prompt(source_lang, target_lang, source_code)}],
    }

    try:
        response = requests.post(
            ANTHROPIC_URL,
            headers=anthropic_headers,
            json=anthropic_payload,
            timeout=90,
        )
        response.raise_for_status()

        raw_text = _extract_message_text(response.json())
        result_data = _parse_llm_json(raw_text)

        source_score = int(result_data.get("source_evaluation", {}).get("score", 0))
        target_score = int(result_data.get("target_evaluation", {}).get("score", 0))
        append_to_ledger(source_lang, target_lang, source_score, target_score)

        return jsonify(result_data)
    except requests.RequestException as error:
        return jsonify({"error": f"Anthropic request failed: {error}"}), 502
    except (ValueError, json.JSONDecodeError) as error:
        return jsonify({"error": f"Response parse failed: {error}"}), 500
    except Exception as error:  # defensive boundary
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
