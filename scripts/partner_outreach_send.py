"""Utility to send partner outreach emails and record them in Supabase.

This helper keeps the business logic in one place so the message copy,
targets, and logging stay consistent.  It can be invoked directly as a
CLI script and supports a dry-run mode for local validation.
"""

from __future__ import annotations

import argparse
import os
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Iterable, Sequence

from supabase import Client, create_client


DEFAULT_FROM_EMAIL = os.getenv("FROM_EMAIL", "enterprise@avcsystems.studio")
EMAIL_SUBJECT = "Strategic RFP — Kinesthetic OS (Neurodivergent-Native Interface)"
EMAIL_BODY = """To the Product & Enterprise Solutions Team,

I’m writing from AVC Systems Studios (Intuition Labs OÜ) with a strategic partnership proposal: the Kinesthetic OS,
a neurodivergent-native interface layer designed to unlock the “high-ideation” market your platforms underserve.

This is not a feature request. It’s a competitive invitation to co-develop a new category—an interface for minds that think in frequency, not sequence.

Preview: https://avcsystems.studio/kinesthetic-os

Attachments: AVC_KinestheticOS_Enterprise_Proposal_Q4_2025.pdf

Half-baked scripts & feel-good sips,

Allison Van Cura
Founder / Architect
AVC Systems Studios · Intuition Labs OÜ
enterprise@avcsystems.studio
"""


ATTACHMENT_FILENAME = "AVC_KinestheticOS_Enterprise_Proposal_Q4_2025.pdf"
ATTACHMENT_PATH = Path(__file__).resolve().parent.parent / ATTACHMENT_FILENAME


@dataclass(frozen=True)
class OutreachTarget:
    platform: str
    email: str


def load_default_targets() -> Sequence[OutreachTarget]:
    return (
        OutreachTarget("Notion", "partnerships@makenotion.com"),
        OutreachTarget("Asana", "partners@asana.com"),
        OutreachTarget("ClickUp", "partners@clickup.com"),
        OutreachTarget("Linear", "hi@linear.app"),
        OutreachTarget("Microsoft", "partner@microsoft.com"),
    )


def read_required_env(var_name: str) -> str:
    value = os.getenv(var_name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {var_name}")
    return value


def build_supabase_client() -> Client | None:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


def attach_proposal(message: EmailMessage) -> None:
    if not ATTACHMENT_PATH.exists():
        return

    with ATTACHMENT_PATH.open("rb") as file_handle:
        data = file_handle.read()

    message.add_attachment(
        data,
        maintype="application",
        subtype="pdf",
        filename=ATTACHMENT_FILENAME,
    )


def build_email(to_email: str, *, from_email: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = EMAIL_SUBJECT
    message["From"] = from_email
    message["To"] = to_email
    message.set_content(EMAIL_BODY)
    attach_proposal(message)
    return message


def send_email(message: EmailMessage, *, host: str, port: int, username: str, password: str) -> None:
    context = ssl.create_default_context()
    with smtplib.SMTP(host, port) as server:
        server.starttls(context=context)
        server.login(username, password)
        server.send_message(message)


def log_outreach(client: Client | None, *, platform: str, contact_email: str) -> None:
    if client is None:
        return

    client.table("partner_outreach").insert(
        {
            "platform": platform,
            "contact_email": contact_email,
            "status": "Sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "notes": "Initial RFP sent via script",
        }
    ).execute()


def send_targets(targets: Iterable[OutreachTarget], *, dry_run: bool = False) -> None:
    smtp_host = read_required_env("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = read_required_env("SMTP_USER")
    smtp_pass = read_required_env("SMTP_PASS")

    supabase_client = build_supabase_client()
    from_email = DEFAULT_FROM_EMAIL

    for target in targets:
        message = build_email(target.email, from_email=from_email)

        if dry_run:
            print(f"[dry-run] Would send email to {target.platform} ({target.email})")
        else:
            send_email(
                message,
                host=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_pass,
            )
            log_outreach(
                supabase_client,
                platform=target.platform,
                contact_email=target.email,
            )
            print(f"Sent + logged → {target.platform} / {target.email}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print targets without sending emails or logging to Supabase.",
    )
    parser.add_argument(
        "--target",
        action="append",
        metavar="PLATFORM=email",
        help="Override the default targets. Provide multiple times for additional recipients.",
    )
    return parser.parse_args()


def parse_custom_targets(raw_targets: Sequence[str] | None) -> Sequence[OutreachTarget]:
    if not raw_targets:
        return load_default_targets()

    parsed_targets = []
    for entry in raw_targets:
        if "=" not in entry:
            raise ValueError(f"Invalid target format: {entry!r}. Expected PLATFORM=email")
        platform, email = entry.split("=", maxsplit=1)
        platform = platform.strip()
        email = email.strip()
        if not platform or not email:
            raise ValueError(f"Invalid target format: {entry!r}. Expected PLATFORM=email")
        parsed_targets.append(OutreachTarget(platform=platform, email=email))
    return parsed_targets


def main() -> None:
    args = parse_args()
    targets = parse_custom_targets(args.target)
    send_targets(targets, dry_run=args.dry_run)


if __name__ == "__main__":  # pragma: no cover - manual invocation script
    main()
