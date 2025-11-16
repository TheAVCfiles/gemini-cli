#!/usr/bin/env python3
"""Tiny Tkinter renderer for SML events."""

# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import sys
from dataclasses import dataclass
from typing import Iterable, List

try:
    import tkinter as tk
except ModuleNotFoundError as error:  # pragma: no cover - import guard
    raise SystemExit(
        "Tkinter is required for --render mode. Install it or run without --render."
    ) from error


@dataclass
class Effect:
    raw: str

    def kind(self) -> str:
        if self.raw.startswith("display("):
            return "display"
        if self.raw.startswith("animate("):
            return "animate"
        if self.raw.startswith("narrate("):
            return "narrate"
        if self.raw.startswith("cue_state("):
            return "cue_state"
        return "other"


@dataclass
class Event:
    cast: str
    fields: dict
    effects: List[Effect]
    timestamp: str


class TinyStage:
    """A minimal canvas for rendering display/animate effects."""

    def __init__(self, title: str = "Sourcery Stage") -> None:
        self.root = tk.Tk()
        self.root.title(title)
        self.canvas = tk.Canvas(self.root, width=640, height=360)
        self.canvas.pack()
        self.text_items: List[int] = []

    def display(self, text: str, *, x: int = 40, y: int = 40, size: int = 24) -> int:
        item = self.canvas.create_text(
            x,
            y,
            text=text,
            anchor="nw",
            font=("DejaVu Sans", int(size)),
            fill="#000000",
        )
        self.text_items.append(item)
        self.canvas.update()
        return item

    def animate_fade_in(self, item: int, *, duration_ms: int = 1000, steps: int = 20) -> None:
        for step in range(steps):
            progress = (step + 1) / steps
            gray_value = int(255 * (1 - progress))
            color = f"#{gray_value:02x}{gray_value:02x}{gray_value:02x}"
            self.canvas.itemconfig(item, fill=color)
            self.canvas.update()
            self.root.after(max(1, int(duration_ms / steps)))
        self.canvas.update()

    def run(self) -> None:
        self.root.mainloop()


def parse_effect_argument(raw: str, key: str, default: int) -> int:
    import re

    match = re.search(rf"{key}\s*=\s*([0-9]+)", raw)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return default
    return default


def render_events(events: Iterable[Event]) -> None:
    stage = TinyStage()
    for event in events:
        for effect in event.effects:
            kind = effect.kind()
            if kind == "display":
                text_start = effect.raw.find('(\"')
                text_end = effect.raw.rfind('\")')
                if text_start == -1 or text_end == -1:
                    continue
                text = effect.raw[text_start + 2 : text_end]
                x = parse_effect_argument(effect.raw, "x", 40)
                y = parse_effect_argument(effect.raw, "y", 40)
                size = parse_effect_argument(effect.raw, "size", 24)
                item = stage.display(text, x=x, y=y, size=size)
            elif kind == "animate" and stage.text_items:
                duration = parse_effect_argument(effect.raw, "duration_ms", 1000)
                stage.animate_fade_in(stage.text_items[-1], duration_ms=duration)
            else:
                continue
        stage.root.after(200)
    stage.run()


def load_events() -> List[Event]:
    payload = sys.stdin.read().strip()
    if not payload:
        return []
    data = json.loads(payload)
    events: List[Event] = []
    for item in data:
        events.append(
            Event(
                cast=item.get("cast", ""),
                fields=item.get("fields", {}),
                effects=[Effect(raw=value) for value in item.get("effects", [])],
                timestamp=item.get("timestamp", ""),
            )
        )
    return events


def main() -> None:
    events = load_events()
    if not events:
        return
    render_events(events)


if __name__ == "__main__":
    main()
