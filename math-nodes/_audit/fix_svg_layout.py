#!/usr/bin/env python3
"""Apply layout fixes to diagram.svg: panel expansion + angle arc recomputation."""
from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "_audit" / "svg_layout_report.json"

# vertex, radius, point_on_ray1, point_on_ray2, sweep (0|1)
ARC_FIXES: dict[str, list[tuple]] = {
    "HS1-TRIG-AREA-01": [
        ((90, 300), 20, (430, 300), (200, 100), 0),
    ],
    "HS1-TRIG-COSINELAW-01": [
        ((100, 300), 20, (420, 300), (210, 100), 0),
        ((420, 300), 20, (100, 300), (210, 100), 1),
    ],
    "JH-GEO-TRI-CONG-01": [
        ((120, 300), 18, (280, 300), (280, 218), 0),
        ((330, 300), 18, (490, 300), (490, 165), 0),
    ],
    "HS2-TRIG-ADDITION-01": [
        ((250, 210), 24, (320, 210), (286.2, 74.8), 0),
        ((250, 210), 36, (286.2, 74.8), (371.2, 140), 1),
    ],
    "HS2-TRIG-SYNTHESIS-01": [
        ((250, 290), 28, (370, 290), (370, 170), 0),
    ],
    "HS1-TRIG-UNITCIRCLE-01": [
        ((250, 210), 26, (320, 210), (320, 88.8), 0),
        ((250, 210), 26, (320, 88.8), (180, 88.8), 0),
    ],
    "HS3-COMPLEX-DEMOIVRE-01": [
        ((250, 250), 12, (362, 250), (362.6, 185), 0),
        ((250, 250), 28, (378, 250), (362.6, 185), 0),
        ((250, 250), 38, (362.6, 185), (315, 137.4), 1),
    ],
}


def angle_deg(cx: float, cy: float, px: float, py: float) -> float:
    return math.degrees(math.atan2(py - cy, px - cx))


def arc_path(cx: float, cy: float, r: float, p1: tuple[float, float], p2: tuple[float, float], sweep: int) -> str:
    a1 = angle_deg(cx, cy, p1[0], p1[1])
    a2 = angle_deg(cx, cy, p2[0], p2[1])
    x1 = cx + r * math.cos(math.radians(a1))
    y1 = cy + r * math.sin(math.radians(a1))
    x2 = cx + r * math.cos(math.radians(a2))
    y2 = cy + r * math.sin(math.radians(a2))
    large = 0
    return f"M {x1:.1f} {y1:.1f} A {r:.0f} {r:.0f} 0 {large} {sweep} {x2:.1f} {y2:.1f}"


def expand_panel(svg: str, need_bottom: bool = False) -> str:
    if 'viewBox="0 0 860' in svg:
        return svg
    svg = svg.replace('viewBox="0 0 820 400"', 'viewBox="0 0 860 400"')
    svg = svg.replace('<rect width="820" height="400"', '<rect width="860" height="400"')
    # panel rect variants
    svg = re.sub(
        r'(<rect x="548" y=")(\d+)(" width=")(\d+)(" height=")(\d+)',
        lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}292{m.group(5)}{336 if need_bottom or int(m.group(6)) >= 310 else m.group(6)}',
        svg,
        count=1,
    )
    svg = re.sub(
        r'(<rect x="540" y=")(\d+)(" width=")(\d+)(" height=")(\d+)',
        lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}292{m.group(5)}{336 if need_bottom or int(m.group(6)) >= 310 else m.group(6)}',
        svg,
        count=1,
    )
    svg = re.sub(
        r'(<rect x="556" y=")(\d+)(" width=")(\d+)(" height=")(\d+)',
        lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}292{m.group(5)}{336 if need_bottom or int(m.group(6)) >= 310 else m.group(6)}',
        svg,
        count=1,
    )
    svg = re.sub(
        r'(<rect x="560" y=")(\d+)(" width=")(\d+)(" height=")(\d+)',
        lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}292{m.group(5)}{336 if need_bottom or int(m.group(6)) >= 310 else m.group(6)}',
        svg,
        count=1,
    )
    # divider lines inside panel
    svg = re.sub(r'x2="77[26]"', 'x2="824"', svg)
    svg = re.sub(r'x2="776"', 'x2="824"', svg)
    if "<!-- layout v" not in svg:
        svg = svg.replace("<svg ", "<!-- layout v4 2026-08-30: widen panel -->\n<svg ", 1)
    return svg


def fix_arcs(svg: str, node: str) -> str:
    specs = ARC_FIXES.get(node)
    if not specs:
        return svg
    paths = [arc_path(cx, cy, r, p1, p2, sweep) for (cx, cy), r, p1, p2, sweep in specs]
    # replace angle-marker arcs (small fill=none arcs) in order
    pat = re.compile(
        r'<path d="M [^"]+ A (\d+(?:\.\d+)?) (\d+(?:\.\d+)?) [^"]+" fill="none"[^/]*/>',
        re.I,
    )
    idx = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal idx
        rx = float(m.group(1))
        if rx > 50:
            return m.group(0)
        if idx >= len(paths):
            return m.group(0)
        stroke_m = re.search(r'stroke="([^"]+)"', m.group(0))
        width_m = re.search(r'stroke-width="([^"]+)"', m.group(0))
        stroke = stroke_m.group(1) if stroke_m else "#334155"
        width = width_m.group(1) if width_m else "3"
        d = paths[idx]
        idx += 1
        return f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{width}"/>'

    return pat.sub(repl, svg)


def main() -> int:
    if not REPORT.exists():
        print("Run verify_svg_layout.py first", file=sys.stderr)
        return 1
    data = json.loads(REPORT.read_text(encoding="utf-8"))
    fixed_panel = 0
    fixed_arc = 0
    for node in data["nodes"]:
        nid = node["node"]
        if not node["flagged"]:
            continue
        path = ROOT / nid / "diagram.svg"
        if not path.exists():
            continue
        svg = path.read_text(encoding="utf-8")
        orig = svg
        need_bottom = any("bottom overflow" in x for x in node.get("panel_overflow", []))
        if node.get("panel_overflow"):
            svg = expand_panel(svg, need_bottom=need_bottom)
        if node.get("arc_issues") and nid in ARC_FIXES:
            svg = fix_arcs(svg, nid)
        if svg != orig:
            path.write_text(svg, encoding="utf-8")
            if node.get("panel_overflow"):
                fixed_panel += 1
            if node.get("arc_issues") and nid in ARC_FIXES:
                fixed_arc += 1
            print(f"[fixed] {nid}")
    print(f"\n[ok] panel={fixed_panel} arc={fixed_arc}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
