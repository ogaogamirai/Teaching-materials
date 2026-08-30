#!/usr/bin/env python3
"""Static SVG sanity check for math-nodes diagram.svg files."""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG_NS = {"svg": "http://www.w3.org/2000/svg"}


def parse_viewbox(root: ET.Element) -> tuple[float, float, float, float] | None:
    vb = root.get("viewBox")
    if not vb:
        w, h = root.get("width"), root.get("height")
        if w and h:
            try:
                return 0, 0, float(re.sub(r"[^\d.]", "", w)), float(re.sub(r"[^\d.]", "", h))
            except ValueError:
                return None
        return None
    parts = [float(x) for x in vb.replace(",", " ").split()]
    if len(parts) == 4:
        return parts[0], parts[1], parts[2], parts[3]
    return None


def audit_svg(path: Path, node_id: str) -> dict:
    issues: list[str] = []
    warnings: list[str] = []
    try:
        tree = ET.parse(path)
        root = tree.getroot()
    except ET.ParseError as e:
        return {"node": node_id, "issues": [f"XML parse error: {e}"], "warnings": []}

    vb = parse_viewbox(root)
    if not vb:
        warnings.append("no viewBox/width/height")

  # Register all elements
    texts = root.findall(".//{http://www.w3.org/2000/svg}text")
    texts += root.findall(".//text")

    if not texts:
        warnings.append("no <text> elements")

    for t in texts:
        if not (t.text or "").strip() and not list(t):
            warnings.append("empty text element")
        fs = t.get("font-size", "")
        if fs:
            try:
                size = float(re.sub(r"[^\d.]", "", fs))
                if size < 8:
                    warnings.append(f"small font-size {fs}")
            except ValueError:
                pass
        anchor = t.get("text-anchor", "")
        x = t.get("x", "")
        if anchor == "end" and vb and x:
            try:
                xf = float(x)
                _, _, vw, _ = vb
                if xf > vw * 0.95:
                    warnings.append(f"text-anchor=end near right edge x={x}")
            except ValueError:
                pass

    # crude overlap: many texts at same x,y
    positions: dict[str, int] = {}
    for t in texts:
        key = f"{t.get('x','')},{t.get('y','')}"
        positions[key] = positions.get(key, 0) + 1
    for k, c in positions.items():
        if c >= 3 and k != ",":
            warnings.append(f"possible label overlap at ({k}) x{c}")

    raw = path.read_text(encoding="utf-8", errors="replace")
    if "polyline" in raw and "points=" in raw:
        # flag very long polylines without spaces (Nova retro note)
        for m in re.finditer(r'points="([^"]{200,})"', raw):
            if " " not in m.group(1)[:50]:
                warnings.append("polyline points may lack spacing (render risk)")

    return {"node": node_id, "issues": issues, "warnings": warnings, "text_count": len(texts)}


def main() -> int:
    results = []
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith(("_", ".")) or d.name == "ontology":
            continue
        svg = d / "diagram.svg"
        if svg.exists():
            results.append(audit_svg(svg, d.name))

    flagged = [r for r in results if r.get("issues") or r.get("warnings")]
    out = ROOT / "_audit" / "svg_static_report.json"
    out.write_text(
        json.dumps({"total": len(results), "flagged": len(flagged), "nodes": results}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"# svg static audit: {len(results)} files, flagged={len(flagged)}\n")
    for r in results:
        if not r.get("issues") and not r.get("warnings"):
            continue
        print(f"## {r['node']}")
        for i in r.get("issues", []):
            print(f"  ISSUE: {i}")
        for w in r.get("warnings", []):
            print(f"  WARN: {w}")
    print(f"\n[ok] wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
