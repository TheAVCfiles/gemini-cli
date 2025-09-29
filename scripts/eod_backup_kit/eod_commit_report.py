#!/usr/bin/env python3
"""
eod_commit_report.py — End-of-day Git backup reporter

Generates a Markdown (and optional HTML) report of all commits in a time window,
and (optionally) zips repo snapshots for each commit.

Usage:
  python eod_commit_report.py [--since YYYY-MM-DD] [--until YYYY-MM-DD]
                              [--include-diff] [--zip-snapshots]
                              [--output-dir backups] [--html]

Defaults:
  --since: today at 00:00 local
  --until: now
  --output-dir: backups

Requirements: Python 3.8+, git CLI installed. Run from within a git repo.
"""

import argparse, subprocess, os, sys, datetime, pathlib, shutil, html

def run(cmd, cwd=None, check=True):
    proc = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if check and proc.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{proc.stderr}")
    return proc.stdout

def git(cmd):
    return run(["git"] + cmd.split())

def list_commits(since, until):
    fmt = "%H%x1f%an%x1f%ae%x1f%ad%x1f%s%x1e"  # separators
    out = git(f"log --since='{since}' --until='{until}' --date=iso-local --pretty=format:{fmt}")
    commits = []
    for rec in out.strip().split("\x1e"):
        if not rec.strip():
            continue
        parts = rec.strip().split("\x1f")
        if len(parts) >= 5:
            sha, author, email, date, subject = parts[:5]
            commits.append({"sha": sha, "author": author, "email": email, "date": date, "subject": subject})
    return commits

def commit_stats(sha):
    out = git(f"show --stat --oneline {sha}")
    return out

def commit_diff(sha):
    out = git(f"show --patch {sha}")
    return out

def repo_name():
    try:
        url = git("config --get remote.origin.url").strip()
        if url.endswith(".git"): url = url[:-4]
        base = url.split("/")[-1] or "repo"
        return base
    except Exception:
        return pathlib.Path.cwd().name

def snapshot_commit(sha, dest_dir):
    tar_path = os.path.join(dest_dir, f"{sha[:10]}.zip")
    proc = subprocess.run(["git", "archive", "-o", tar_path, sha], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", "ignore"))
    return tar_path

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def to_html(md_text, title="End of Day Report"):
    import html, re
    html_lines = []
    in_code = False
    for line in md_text.splitlines():
        if line.startswith("```"):
            if not in_code:
                html_lines.append("<pre><code>"); in_code = True
            else:
                html_lines.append("</code></pre>"); in_code = False
            continue
        if in_code:
            html_lines.append(html.escape(line)); continue
        if line.startswith("# "):
            html_lines.append(f"<h1>{html.escape(line[2:])}</h1>"); continue
        if line.startswith("## "):
            html_lines.append(f"<h2>{html.escape(line[3:])}</h2>"); continue
        if line.startswith("### "):
            html_lines.append(f"<h3>{html.escape(line[4:])}</h3>"); continue
        if line.strip().startswith("- "):
            if not (len(html_lines) and html_lines[-1].startswith("<ul")):
                html_lines.append("<ul>")
            html_lines.append(f"<li>{html.escape(line.strip()[2:])}</li>")
        else:
            if len(html_lines) and html_lines[-1] == "</ul>":
                pass
        if not line.strip().startswith("- "):
            html_lines.append(f"<p>{html.escape(line)}</p>")
        if len(html_lines) >= 2 and html_lines[-2].startswith("<li") and not line.strip().startswith("- "):
            if html_lines[-3] != "</ul>":
                html_lines.insert(-1, "</ul>")
    if in_code:
        html_lines.append("</code></pre>")
    body = "\n".join(html_lines)
    return f"<!doctype html><html><head><meta charset='utf-8'><title>{html.escape(title)}</title><style>body{{font-family:system-ui,sans-serif;margin:24px;}} pre{{background:#f6f8fa;padding:12px;overflow:auto}} code{{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace}}</style></head><body>{body}</body></html>"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--since", default=None, help="YYYY-MM-DD or git date string")
    parser.add_argument("--until", default=None, help="YYYY-MM-DD or git date string")
    parser.add_argument("--include-diff", action="store_true", help="Include full diffs")
    parser.add_argument("--zip-snapshots", action="store_true", help="Zip repo snapshot per commit")
    parser.add_argument("--output-dir", default="backups", help="Output directory")
    parser.add_argument("--html", action="store_true", help="Also emit HTML version of the report")
    args = parser.parse_args()

    now = datetime.datetime.now()
    today = now.date()
    since = args.since or f"{today.isoformat()} 00:00"
    until = args.until or now.isoformat(timespec='minutes')

    commits = list_commits(since, until)
    out_dir = pathlib.Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    repo = repo_name()
    date_tag = today.isoformat()
    md_path = out_dir / f"eod-{repo}-{date_tag}.md"
    html_path = out_dir / f"eod-{repo}-{date_tag}.html"

    lines = []
    lines.append(f"# End of Day — {repo}")
    lines.append(f"**Window:** {since} → {until}")
    lines.append(f"**Commits:** {len(commits)}")
    lines.append("")
    for c in commits:
        lines.append(f"## {c['subject']}")
        lines.append(f"- SHA: `{c['sha']}`")
        lines.append(f"- Author: {c['author']} <{c['email']}>")
        lines.append(f"- Date: {c['date']}")
        lines.append("")
        stats = commit_stats(c['sha'])
        lines.append("```")
        lines.append(stats.rstrip())
        lines.append("```")
        if args.include_diff:
            diff = commit_diff(c['sha'])
            lines.append("\n<details><summary>Diff</summary>\n\n```diff")
            lines.append(diff.rstrip())
            lines.append("```\n</details>\n")

    write_file(str(md_path), "\n".join(lines))

    if args.html:
        html_doc = to_html("\n".join(lines), title=f"EOD — {repo} — {date_tag}")
        write_file(str(html_path), html_doc)

    if args.zip_snapshots:
        snap_dir = out_dir / f"snapshots-{date_tag}"
        snap_dir.mkdir(exist_ok=True)
        for c in commits:
            snapshot_commit(c['sha'], str(snap_dir))

    print(f"Wrote: {md_path}")
    if args.html:
        print(f"Wrote: {html_path}")

if __name__ == "__main__":
    main()
