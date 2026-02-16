#!/usr/bin/env python3
"""Weekly automation: pull Todo records from Airtable, render digest, mark records done."""

from __future__ import annotations

import datetime as dt
import os
from dataclasses import dataclass
from typing import Any

import requests
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas

AIRTABLE_API_ROOT = "https://api.airtable.com/v0"
TIMEOUT_SECONDS = 30


@dataclass(frozen=True)
class Config:
    pat: str
    base_id: str
    table_name: str
    view_name: str
    done_field: str
    done_value: str
    title_field: str
    detail_fields: list[str]


def load_config() -> Config:
    pat = os.environ.get("AIRTABLE_PAT", "").strip()
    base_id = os.environ.get("AIRTABLE_BASE_ID", "").strip()
    if not pat:
        raise RuntimeError("Missing AIRTABLE_PAT environment variable.")
    if not base_id:
        raise RuntimeError("Missing AIRTABLE_BASE_ID environment variable.")

    detail_fields = [
        field.strip()
        for field in os.environ.get("AIRTABLE_DETAIL_FIELDS", "Notes,Description").split(",")
        if field.strip()
    ]

    return Config(
        pat=pat,
        base_id=base_id,
        table_name=os.environ.get("AIRTABLE_TABLE_NAME", "Todo"),
        view_name=os.environ.get("AIRTABLE_VIEW", "Grid view"),
        done_field=os.environ.get("AIRTABLE_DONE_FIELD", "Status"),
        done_value=os.environ.get("AIRTABLE_DONE_VALUE", "Done"),
        title_field=os.environ.get("AIRTABLE_TITLE_FIELD", "Task"),
        detail_fields=detail_fields,
    )


def fetch_todo_records(config: Config) -> list[dict[str, Any]]:
    headers = {"Authorization": f"Bearer {config.pat}"}
    params = {
        "view": config.view_name,
        "filterByFormula": f"{{{config.done_field}}}!='{config.done_value}'",
    }
    url = f"{AIRTABLE_API_ROOT}/{config.base_id}/{config.table_name}"

    records: list[dict[str, Any]] = []
    offset: str | None = None
    while True:
        if offset:
            params["offset"] = offset
        response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        payload = response.json()
        records.extend(payload.get("records", []))
        offset = payload.get("offset")
        if not offset:
            break
    return records


def format_markdown(records: list[dict[str, Any]], config: Config, created_at: dt.datetime) -> str:
    header = [
        "# Sunday Gossip Rag",
        "",
        f"Generated: {created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"Total open records: {len(records)}",
        "",
    ]

    lines = header
    for index, record in enumerate(records, start=1):
        fields = record.get("fields", {})
        title = str(fields.get(config.title_field, f"Untitled item {index}"))
        lines.append(f"## {index}. {title}")
        lines.append("")
        for field_name in config.detail_fields:
            value = fields.get(field_name)
            if value:
                lines.append(f"- **{field_name}:** {value}")
        lines.append(f"- **Record ID:** `{record.get('id', 'unknown')}`")
        lines.append("")
    if not records:
        lines.append("No open records. The board is clear.")
    lines.append("")
    return "\n".join(lines)


def write_pdf(records: list[dict[str, Any]], config: Config, created_at: dt.datetime, output_path: str) -> None:
    pdf = canvas.Canvas(output_path, pagesize=LETTER)
    _, height = LETTER

    y = height - 60
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "Sunday Gossip Rag")
    y -= 22
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"Generated: {created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    y -= 18
    pdf.drawString(40, y, f"Total open records: {len(records)}")
    y -= 24

    for index, record in enumerate(records, start=1):
        fields = record.get("fields", {})
        title = str(fields.get(config.title_field, f"Untitled item {index}"))

        if y < 80:
            pdf.showPage()
            y = height - 60

        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(40, y, f"{index}. {title}")
        y -= 16

        pdf.setFont("Helvetica", 10)
        for field_name in config.detail_fields:
            value = fields.get(field_name)
            if not value:
                continue
            line = f"{field_name}: {value}"
            for chunk in wrap_text(line, 95):
                if y < 60:
                    pdf.showPage()
                    y = height - 60
                    pdf.setFont("Helvetica", 10)
                pdf.drawString(52, y, chunk)
                y -= 14

        record_id = record.get("id", "unknown")
        pdf.drawString(52, y, f"Record ID: {record_id}")
        y -= 18

    if not records:
        pdf.setFont("Helvetica", 10)
        pdf.drawString(40, y, "No open records. The board is clear.")

    pdf.save()


def wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if len(candidate) <= max_chars:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def mark_done(records: list[dict[str, Any]], config: Config) -> None:
    if not records:
        return

    url = f"{AIRTABLE_API_ROOT}/{config.base_id}/{config.table_name}"
    headers = {
        "Authorization": f"Bearer {config.pat}",
        "Content-Type": "application/json",
    }

    batch_size = 10
    for idx in range(0, len(records), batch_size):
        chunk = records[idx : idx + batch_size]
        payload = {
            "records": [
                {
                    "id": record["id"],
                    "fields": {config.done_field: config.done_value},
                }
                for record in chunk
            ]
        }
        response = requests.patch(url, headers=headers, json=payload, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()


def main() -> None:
    config = load_config()
    now = dt.datetime.now(dt.UTC)
    date_slug = now.strftime("%Y-%m-%d")

    records = fetch_todo_records(config)
    markdown = format_markdown(records, config, now)

    md_path = f"gossip-rag-{date_slug}.md"
    pdf_path = f"gossip-rag-{date_slug}.pdf"

    with open(md_path, "w", encoding="utf-8") as handle:
        handle.write(markdown)

    write_pdf(records, config, now, pdf_path)
    mark_done(records, config)

    print(f"Wrote {md_path} and {pdf_path}; updated {len(records)} record(s).")


if __name__ == "__main__":
    main()
