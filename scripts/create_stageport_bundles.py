#!/usr/bin/env python3
"""Generate sample StagePort bundles used in documentation demos."""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import textwrap
import zipfile
from pathlib import Path
from typing import Iterable


PORTAL_HTML = textwrap.dedent(
    """
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Orchestr8 · StagePort (Balanchine ↔ Neon)</title>
      <style>
        :root {
          --bg: #0b0e14;
          --fg: #e6e6e6;
          --amber: #d9a441;
          --ice: #a7c2ff;
          --violet: #7c4dff;
          --aqua: #00e5ff;
          --gold: #ffd166;
        }
        html, body { margin:0; height:100%; background:var(--bg); color:var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji; }
        header { padding:16px 20px; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(90deg, rgba(217,164,65,0.15), rgba(167,194,255,0.15)); border-bottom: 1px solid rgba(255,255,255,0.08); }
        h1 { font-size: 20px; margin:0; letter-spacing: .5px; }
        #modeBtn { padding:10px 14px; border:1px solid rgba(255,255,255,0.15); background:transparent; color:var(--fg); border-radius: 8px; cursor:pointer; }
        #stage { position:relative; height: calc(100% - 140px); overflow:hidden; }
        .dancer { position:absolute; width:18px; height:18px; border-radius:50%; box-shadow: 0 0 12px rgba(255,255,255,0.35); transform: translate(-9px,-9px); }
        .label { position:absolute; transform: translate(-50%, -180%); font-size:12px; opacity:.85; }
        footer { padding:14px 20px; font-size:12px; border-top: 1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; }
        .bar { height:6px; background: linear-gradient(90deg, var(--amber), var(--ice)); border-radius: 999px; width: 260px; }
        .neon .bar { background: linear-gradient(90deg, var(--violet), var(--aqua)); }
        .balanchine { background: radial-gradient(1200px 700px at 50% 120%, rgba(217,164,65,0.18), transparent 60%),
                                 radial-gradient(1000px 600px at 40% -20%, rgba(167,194,255,0.18), transparent 50%); }
        .neon { background: radial-gradient(1200px 700px at 50% 120%, rgba(124,77,255,0.18), transparent 60%),
                         radial-gradient(1000px 600px at 40% -20%, rgba(0,229,255,0.18), transparent 50%); }
      </style>
    </head>
    <body class="balanchine">
      <header>
        <h1>Orchestr8 · StagePort <span id="modeName">Balanchine</span> Mode</h1>
        <button id="modeBtn" title="Toggle lighting mode">Toggle Balanchine ↔ Neon</button>
      </header>
      <div id="stage" class="balanchine"></div>
      <footer>
        <div>© 2025 Allison Van Cura · DeCrypt the Girl · Intuition Labs · DOI 10.5281/zenodo.17282954</div>
        <div class="bar" title="Mirror Gain (demo)"></div>
      </footer>

      <script>
        let neon = false;
        const stage = document.getElementById('stage');
        const body = document.body;
        const modeBtn = document.getElementById('modeBtn');
        const modeName = document.getElementById('modeName');

        modeBtn.addEventListener('click', () => {
          neon = !neon;
          body.className = neon ? 'neon' : 'balanchine';
          stage.className = neon ? 'neon' : 'balanchine';
          modeName.textContent = neon ? 'Neon' : 'Balanchine';
        });

        function colorFor(tag){
          if (!neon){
            if (tag === 'turn') return 'var(--amber)';
            if (tag === 'finale') return 'var(--gold)';
            return 'var(--ice)';
          } else {
            if (tag === 'turn') return 'var(--violet)';
            if (tag === 'finale') return 'var(--aqua)';
            return '#7ee8fa';
          }
        }

        fetch('pyrouette_pipeline.json').then(r=>r.json()).then(data=>{
          const W = stage.clientWidth, H = stage.clientHeight;
          const N = data.scores.length;
          stage.innerHTML='';
          data.scores.forEach((m,i)=>{
            const x = (i+1)/(N+1) * (W*0.9) + W*0.05;
            const y = (1 - (m.total/6.0)) * (H*0.7) + (H*0.15);
            const d = document.createElement('div');
            d.className='dancer';
            d.style.left = x+'px'; d.style.top = y+'px';
            d.style.background = colorFor(m.tag);
            const lab = document.createElement('div');
            lab.className='label';
            lab.style.left = x+'px'; lab.style.top = y+'px';
            lab.textContent = m.movement + " • " + m.total;
            stage.appendChild(d); stage.appendChild(lab);

            let t = 0;
            setInterval(()=>{
              t += 0.05;
              const scale = 1 + 0.2*Math.sin(t*2 + i);
              d.style.transform = "translate(-9px,-9px) scale(" + scale + ")";
            }, 50);
          });
        }).catch(err=>{
          stage.innerHTML = '<p style="padding:20px">Failed to load pipeline. Ensure pyrouette_pipeline.json is present.</p>';
        });
      </script>
    </body>
    </html>
    """
)


def build_pyrouette_data() -> dict:
    """Return the demo pipeline used by the StagePort bundles."""

    data = {
        "meta": {
            "title": "Py.rouette Pipeline (Demo)",
            "generated_at": "",
            "author": "Allison Van Cura",
            "copyright": "© 2025 Allison Van Cura · DeCrypt the Girl · Intuition Labs",
            "doi": "10.5281/zenodo.17282954",
        },
        "scores": [
            {"time": "00:00:05", "movement": "Plié", "TES": 0.8, "PCS": 1.2, "deductions": 0.0, "tag": "warmup"},
            {"time": "00:00:17", "movement": "Pirouette", "TES": 2.6, "PCS": 2.1, "deductions": 0.2, "tag": "turn"},
            {"time": "00:00:27", "movement": "Jeté", "TES": 1.9, "PCS": 1.6, "deductions": 0.0, "tag": "jump"},
            {"time": "00:00:39", "movement": "Arabesque", "TES": 1.5, "PCS": 2.4, "deductions": 0.0, "tag": "line"},
            {"time": "00:00:52", "movement": "Coda", "TES": 2.2, "PCS": 2.6, "deductions": 0.1, "tag": "finale"},
        ],
    }

    return data


def calculate_totals(scores: list[dict]) -> None:
    """Add a computed ``total`` field to each score in-place."""

    for score in scores:
        total = score["TES"] + score["PCS"] - score["deductions"]
        score["total"] = round(total, 3)


def build_proof_manifest(timestamp: str) -> str:
    """Return the markdown manifest text for the bundle."""

    template = textwrap.dedent(
        """
        # StagePort Proof Manifest

        **Build:** {timestamp}  
        **Author:** Allison Van Cura  
        **Project:** StagePort · Orchestr8 Dual Bundle (Balanchine ↔ Neon)  
        **DOI:** 10.5281/zenodo.17282954

        This manifest records the sample proof events included in this demo bundle. Replace `pyrouette_pipeline.json` with live outputs from your scorer to regenerate proofs.

        ## Sample Events
        - {timestamp}: Loaded initial Py.rouette scores (5 movements).
        - {timestamp}: Rendered Orchestr8 stage in **Balanchine Mode** (amber → ice-blue).
        - {timestamp}: Toggle tested to **Neon Mode** (violet ↔ aqua).

        ## Licensing
        All creative work © 2025 Allison Van Cura. See LICENSE where applicable.
        """
    )
    return template.format(timestamp=timestamp)


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def zip_files(directory: Path, output_path: Path, filenames: Iterable[str]) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for name in filenames:
            archive.write(directory / name, arcname=name)
    return output_path


def create_local_bundle(base_dir: Path, timestamp: str, portal_html: str) -> Path:
    bundle_dir = base_dir / "StagePort_Local_Conductor"
    bundle_dir.mkdir(parents=True, exist_ok=True)

    data = build_pyrouette_data()
    data["meta"]["generated_at"] = timestamp
    calculate_totals(data["scores"])

    write_json(bundle_dir / "pyrouette_pipeline.json", data)
    write_text(bundle_dir / "proof_manifest.md", build_proof_manifest(timestamp))
    write_text(bundle_dir / "stageport_local.py", _build_local_app_script())
    write_text(bundle_dir / "orchestr8_portal.html", portal_html)

    zip_path = base_dir / "StagePort_Local_Conductor.zip"
    return zip_files(
        bundle_dir,
        zip_path,
        [
            "stageport_local.py",
            "pyrouette_pipeline.json",
            "proof_manifest.md",
            "orchestr8_portal.html",
        ],
    )


def create_web_bundle(base_dir: Path, timestamp: str, portal_html: str) -> Path:
    bundle_dir = base_dir / "Orchestr8_Portal_Toggle"
    bundle_dir.mkdir(parents=True, exist_ok=True)

    data = build_pyrouette_data()
    data["meta"]["generated_at"] = timestamp
    calculate_totals(data["scores"])

    manifest = "{}\n\n**Deploy:** host this folder on Netlify/Vercel.".format(
        build_proof_manifest(timestamp)
    )

    write_text(bundle_dir / "index.html", portal_html.replace("Orchestr8 · StagePort", "Orchestr8 Portal"))
    write_json(bundle_dir / "pyrouette_pipeline.json", data)
    write_text(bundle_dir / "StagePort_Manifest.md", manifest)

    zip_path = base_dir / "Orchestr8_Portal_Toggle.zip"
    return zip_files(
        bundle_dir,
        zip_path,
        [
            "index.html",
            "pyrouette_pipeline.json",
            "StagePort_Manifest.md",
        ],
    )


def _build_local_app_script() -> str:
    """Return the Flask helper used in the local bundle."""

    return textwrap.dedent(
        """
        from flask import Flask, jsonify, send_from_directory
        import json
        import os

        APP_DIR = os.path.dirname(__file__)
        DATA_FILE = os.path.join(APP_DIR, 'pyrouette_pipeline.json')

        app = Flask(__name__, static_folder=APP_DIR)

        @app.get('/')
        def index():
            return (
                "<h1>StagePort Local · Balanchine Mode</h1>"
                "<p>Serving Py.rouette pipeline & proof ledger. "
                "Open <a href='/orchestr8_portal.html'>Orchestr8 Portal</a> to view the stage.</p>"
                "<p>© 2025 Allison Van Cura · DeCrypt the Girl · Intuition Labs · DOI 10.5281/zenodo.17282954</p>"
            )

        @app.get('/api/pipeline')
        def pipeline():
            with open(DATA_FILE, encoding='utf-8') as handle:
                data = json.load(handle)
            totals = [movement['total'] for movement in data['scores']]
            summary = {
                'count': len(totals),
                'avg_total': round(sum(totals) / len(totals), 3),
                'max_move': max(data['scores'], key=lambda entry: entry['total']),
            }
            return jsonify({'pipeline': data, 'summary': summary})

        @app.get('/<path:fname>')
        def assets(fname):
            return send_from_directory(APP_DIR, fname)

        if __name__ == '__main__':
            app.run(host='0.0.0.0', port=5000, debug=False)
        """
    )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the StagePort demo bundles used for documentation samples.",
    )
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path("dist") / "stageport",
        help="Directory where the bundles should be written.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    base_dir: Path = args.base_dir
    base_dir.mkdir(parents=True, exist_ok=True)

    timestamp = _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds").replace(
        "+00:00", "Z"
    )

    local_zip = create_local_bundle(base_dir, timestamp, PORTAL_HTML)
    web_zip = create_web_bundle(base_dir, timestamp, PORTAL_HTML)

    print("Created local bundle at {}".format(local_zip))
    print("Created web bundle at {}".format(web_zip))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
