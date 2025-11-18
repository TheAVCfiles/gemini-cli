"""Utilities for sending partner outreach emails and logging Supabase records.

This module automates two concrete steps of the Kinesthetic OS outreach plan:

1. Send tailored outreach emails and store a corresponding row in the
   ``partner_outreach`` table.
2. Append replies (or manual follow-ups) into the ``partner_responses`` table.

The script intentionally keeps external dependencies minimal.  It uses the
Supabase PostgREST endpoint directly so you can run it from any environment that
can make HTTP requests.
"""
from __future__ import annotations

import argparse
import json
import os
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Iterable, Optional

import requests

SUPABASE_TABLE_OUTREACH = "partner_outreach"
SUPABASE_TABLE_RESPONSES = "partner_responses"


@dataclass
class OutreachConfig:
    """Runtime configuration loaded from environment variables."""

    supabase_url: str
    supabase_service_key: str
    from_address: str
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str

    @classmethod
    def load(cls) -> "OutreachConfig":
        """Create a configuration from environment variables.

        Raises:
            RuntimeError: If a required environment variable is missing.
        """

        def require_env(var: str) -> str:
            value = os.getenv(var)
            if not value:
                raise RuntimeError(f"Environment variable {var} is required")
            return value

        return cls(
            supabase_url=require_env("SUPABASE_URL"),
            supabase_service_key=require_env("SUPABASE_SERVICE_ROLE_KEY"),
            from_address=require_env("OUTREACH_FROM_ADDRESS"),
            smtp_host=require_env("OUTREACH_SMTP_HOST"),
            smtp_port=int(require_env("OUTREACH_SMTP_PORT")),
            smtp_username=require_env("OUTREACH_SMTP_USERNAME"),
            smtp_password=require_env("OUTREACH_SMTP_PASSWORD"),
        )


def _postgrest_insert(
    config: OutreachConfig,
    table: str,
    payload: dict,
) -> None:
    """Insert ``payload`` into ``table`` using Supabase PostgREST."""

    url = f"{config.supabase_url}/rest/v1/{table}"
    headers = {
        "apikey": config.supabase_service_key,
        "Authorization": f"Bearer {config.supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=10)
    response.raise_for_status()


def _send_email(
    config: OutreachConfig,
    to_address: str,
    subject: str,
    body: str,
) -> None:
    """Send an email using SMTP with TLS."""

    message = EmailMessage()
    message["From"] = config.from_address
    message["To"] = to_address
    message["Subject"] = subject
    message.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(config.smtp_host, config.smtp_port, context=context) as server:
        server.login(config.smtp_username, config.smtp_password)
        server.send_message(message)


def render_email_body(platform: str, template_path: Optional[Path] = None) -> str:
    """Render the outreach email body with a platform-specific greeting."""

    if template_path is None:
        template = Path(__file__).with_name("partner_outreach_template.txt")
    else:
        template = template_path

    body = template.read_text(encoding="utf-8")
    return body.format(platform=platform)


def send_outreach(
    config: OutreachConfig,
    *,
    platform: str,
    contact_email: str,
    subject: str,
    template_path: Optional[Path],
    notes: Optional[str],
) -> None:
    """Send an outreach email and insert a tracking row into Supabase."""

    body = render_email_body(platform, template_path)
    _send_email(config, contact_email, subject, body)

    payload = {
        "platform": platform,
        "contact_email": contact_email,
        "status": "Sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes or "",
    }
    _postgrest_insert(config, SUPABASE_TABLE_OUTREACH, payload)


def log_response(
    config: OutreachConfig,
    *,
    platform: str,
    contact_email: str,
    sentiment: str,
    key_terms: Iterable[str],
    raw_text: str,
    thread_ref: Optional[str],
) -> None:
    """Record a partner response in Supabase."""

    payload = {
        "platform": platform,
        "contact_email": contact_email,
        "sentiment": sentiment,
        "key_terms": list(key_terms),
        "raw_text": raw_text,
        "thread_ref": thread_ref or "",
    }
    _postgrest_insert(config, SUPABASE_TABLE_RESPONSES, payload)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Kinesthetic OS partner outreach helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    send_parser = subparsers.add_parser("send", help="Send an outreach email")
    send_parser.add_argument("platform", help="Target platform name")
    send_parser.add_argument("contact_email", help="Primary contact email")
    send_parser.add_argument("subject", help="Email subject line")
    send_parser.add_argument(
        "--template",
        type=Path,
        default=None,
        help="Optional path to a plaintext email template",
    )
    send_parser.add_argument(
        "--notes",
        default=None,
        help="Free-form notes to store alongside the outreach record",
    )

    response_parser = subparsers.add_parser("log-response", help="Log an inbound response")
    response_parser.add_argument("platform")
    response_parser.add_argument("contact_email")
    response_parser.add_argument(
        "--sentiment",
        choices=("positive", "neutral", "negative", "unknown"),
        default="unknown",
    )
    response_parser.add_argument(
        "--key-terms",
        default="",
        help="Comma-separated keywords extracted from the reply",
    )
    response_parser.add_argument(
        "--raw-text",
        required=True,
        help="The body of the reply",
    )
    response_parser.add_argument(
        "--thread-ref",
        default=None,
        help="Email Message-ID or helpdesk ticket identifier",
    )

    return parser


def parse_key_terms(value: str) -> Iterable[str]:
    return [term.strip() for term in value.split(",") if term.strip()]


def main(argv: Optional[Iterable[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    config = OutreachConfig.load()

    if args.command == "send":
        send_outreach(
            config,
            platform=args.platform,
            contact_email=args.contact_email,
            subject=args.subject,
            template_path=args.template,
            notes=args.notes,
        )
        print(f"Email sent to {args.contact_email} and logged to {SUPABASE_TABLE_OUTREACH}.")
        return 0

    if args.command == "log-response":
        log_response(
            config,
            platform=args.platform,
            contact_email=args.contact_email,
            sentiment=args.sentiment,
            key_terms=parse_key_terms(args.key_terms),
            raw_text=args.raw_text,
            thread_ref=args.thread_ref,
        )
        print(
            "Response logged to "
            f"{SUPABASE_TABLE_RESPONSES} for {args.contact_email} ({args.platform})."
        )
        return 0

    parser.error("Unknown command")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
