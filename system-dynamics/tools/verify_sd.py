#!/usr/bin/env python3
"""Verify system-dynamics build output before shipping.

Checks:
  L1  Markdown->HTML: bold×bracket escapes, figure refs resolved
  L2  Math: all $...$ compile in KaTeX (via node), Japanese wrapped in \\text{}
  L3  Figures: referenced SVG files exist

Usage:
    python tools/verify_sd.py                 # full
    python tools/verify_sd.py --math-only     # math compile only
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
INDEX_HTML = PROJECT_ROOT / "index.html"
FIGURES_DIR = PROJECT_ROOT / "figures"
KATEX_JS = PROJECT_ROOT / "vendor" / "katex" / "katex.min.js"

# Ensure tools/ dir is importable for math_protect.
sys.path.insert(0, str(Path(__file__).resolve().parent))

FIGURE_REF_RE = re.compile(r"!\[fig\]\(figures/([^)]+\.svg)\)")
FIGURE_INLINE_RE = re.compile(r'<figure class="figure">')


def check_figure_refs_resolved(html: str, issues: list[str]) -> None:
    """Any markdown figure refs left unresolved in the HTML?"""
    unresolved = FIGURE_REF_RE.findall(html)
    if unresolved:
        issues.append(f"Unresolved figure refs in HTML: {unresolved[:5]}")


def check_inline_figures_exist(html: str, issues: list[str]) -> None:
    """Each inline <figure> should embed an <svg>."""
    count = len(FIGURE_INLINE_RE.findall(html))
    svg_count = len(re.findall(r'<svg', html))
    if svg_count < count:
        issues.append(f"figure count={count} but <svg> count={svg_count}")


def check_figure_files(issues: list[str]) -> None:
    """Referenced SVG files should exist under figures/."""
    for md in PROJECT_ROOT.glob("units/*.md"):
        for name in FIGURE_REF_RE.findall(md.read_text(encoding="utf-8")):
            f = FIGURES_DIR / name
            if not f.exists():
                issues.append(f"Missing figure file: {f}")


# ---------------------------------------------------------------------------
# L3 Figure arrow-direction verification
# ---------------------------------------------------------------------------

def _polygon_centroid(points_str: str) -> tuple[float, float]:
    """Return (cx, cy) of a polygon points attribute."""
    pts = [float(v) for v in points_str.replace(",", " ").split()]
    xs, ys = pts[0::2], pts[1::2]
    return sum(xs) / len(xs), sum(ys) / len(ys)


def _polygon_tip(points_str: str) -> tuple[float, float]:
    """Return the vertex farthest from the centroid (the arrow's pointy tip)."""
    pts = [float(v) for v in points_str.replace(",", " ").split()]
    xs, ys = pts[0::2], pts[1::2]
    cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
    best_i, best_d = 0, -1.0
    for i in range(len(xs)):
        d = (xs[i] - cx) ** 2 + (ys[i] - cy) ** 2
        if d > best_d:
            best_d, best_i = d, i
    return xs[best_i], ys[best_i]


def _node_center(node_el: dict) -> tuple[float, float]:
    """Compute center of a node from its x/y/width/height (or cx/cy)."""
    try:
        if node_el.get("cx") and node_el.get("cy"):
            return float(node_el["cx"]), float(node_el["cy"])
        x = float(node_el.get("x", 0) or 0)
        y = float(node_el.get("y", 0) or 0)
        w = float(node_el.get("width", 0) or 0)
        h = float(node_el.get("height", 0) or 0)
        return x + w / 2, y + h / 2
    except (ValueError, TypeError):
        return (0.0, 0.0)


def check_svg_arrows(figures_dir: Path, issues: list[str]) -> None:
    """Verify each SVG's data-edge declarations point from source to target.

    Contract:
      - Each node: <rect ... data-node="id" x y width height>
      - Each edge: <path data-edge="from->to" .../> plus <polygon class="arrow"/>
        whose centroid should lie nearer the *target* than the *source*.
    """
    import xml.etree.ElementTree as ET

    for svg_path in sorted(figures_dir.glob("*.svg")):
        try:
            tree = ET.parse(svg_path)
        except ET.ParseError as exc:
            issues.append(f"{svg_path.name}: XML parse error: {exc}")
            continue

        root = tree.getroot()
        ns = {"svg": "http://www.w3.org/2000/svg"}

        # Collect node declarations (data-node on any shape, incl. <g>).
        nodes: dict[str, tuple[float, float]] = {}
        for el in root.iter():
            nid = el.get("data-node")
            if nid and nid not in nodes:
                # If this is a <g>, look for a child <rect>/<ellipse>/<circle> for geometry.
                shape = None
                for child in el.iter():
                    if child.tag.endswith(("rect", "ellipse", "circle")) and child is not el:
                        shape = child
                        break
                if shape is not None:
                    nodes[nid] = _node_center(
                        {k: shape.get(k, "") for k in
                         ("x", "y", "width", "height", "cx", "cy")}
                    )
                else:
                    nodes[nid] = _node_center(
                        {k: el.get(k, "") for k in
                         ("x", "y", "width", "height", "cx", "cy")}
                    )

        # Check each data-edge.
        edge_count = 0
        for el in root.iter():
            edge = el.get("data-edge")
            if not edge:
                continue
            edge_count += 1
            parts = edge.split("->")
            if len(parts) != 2:
                issues.append(f"{svg_path.name}: malformed data-edge '{edge}'")
                continue
            src, tgt = parts[0].strip(), parts[1].strip()
            if src not in nodes or tgt not in nodes:
                issues.append(
                    f"{svg_path.name}: data-edge '{edge}' references unknown node "
                    f"(have: {sorted(nodes)})"
                )
                continue

            sx, sy = nodes[src]
            tx, ty = nodes[tgt]

            # Arrow polygon must be inside the same <g> (or be a sibling) as the
            # element carrying data-edge.
            arrow = None
            container = el  # element with data-edge (usually <g>)
            for child in container.iter():
                if child.get("class") == "arrow":
                    arrow = child
                    break
            if arrow is None:
                issues.append(f"{svg_path.name}: edge '{edge}' has no <polygon class='arrow'> in its <g>")
                continue

            pts = arrow.get("points", "")
            # Direction from source to target.
            dx, dy = tx - sx, ty - sy
            # Arrow polygon convention: the FIRST vertex is the tip.
            coords = [float(v) for v in pts.replace(",", " ").split()]
            tip_x, tip_y = coords[0], coords[1]
            # Arrow tip should point toward the target (positive dot product).
            dot = dx * (tip_x - sx) + dy * (tip_y - sy)
            if dot <= 0:
                issues.append(
                    f"{svg_path.name}: edge '{edge}' arrow tip points away from target "
                    f"(tip=({tip_x:.0f},{tip_y:.0f}) src=({sx:.0f},{sy:.0f}) tgt=({tx:.0f},{ty:.0f}))"
                )

        # Every edge must have an arrow.
        if edge_count == 0 and list(figures_dir.glob("*.svg")):
            # Only warn if there are data-edges expected but none found for this file
            # (skip: some figures have no edges, that's fine).
            pass


def check_svg_node_edges_consistent(figures_dir: Path, issues: list[str]) -> None:
    """Every data-edge's from/to must be a declared data-node."""
    import xml.etree.ElementTree as ET

    for svg_path in sorted(figures_dir.glob("*.svg")):
        try:
            tree = ET.parse(svg_path)
        except ET.ParseError:
            continue
        root = tree.getroot()
        node_ids = {
            el.get("data-node")
            for el in root.iter()
            if el.get("data-node")
        }
        for el in root.iter():
            edge = el.get("data-edge")
            if not edge:
                continue
            for part in edge.split("->"):
                part = part.strip()
                if part and part not in node_ids:
                    issues.append(
                        f"{svg_path.name}: data-edge '{edge}' node '{part}' not a data-node"
                    )


def check_bold_bracket(html: str, issues: list[str]) -> None:
    """Bold that leaks outside brackets (e.g. **text**（補足）)."""
    # Heuristic: closing ** immediately before a full-width open bracket.
    bad = re.findall(r"\*\*[^*\n]+\*\*（", html)
    if bad:
        issues.append(f"Bold followed by （: {bad[:5]}")


def collect_math_from_md() -> list[str]:
    """Collect all math blocks from markdown sources (both $$..$$ and $..$)."""
    blocks: list[str] = []
    for md in sorted(PROJECT_ROOT.glob("units/*.md")):
        text = md.read_text(encoding="utf-8")
        blocks += re.findall(r"\$\$(.*?)\$\$", text, re.DOTALL)
    for md in sorted(PROJECT_ROOT.glob("math-bridge/*.md")):
        text = md.read_text(encoding="utf-8")
        blocks += re.findall(r"\$\$(.*?)\$\$", text, re.DOTALL)
        # inline $...$ (single-line, no $$)
        blocks += re.findall(r"(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)", text)
    return blocks


def check_math_compile(issues: list[str]) -> int:
    """Compile all math blocks (from md sources, after Japanese->\\text{} normalization)
    with KaTeX via node."""
    from math_protect import _wrap_japanese  # local import, same dir

    blocks = collect_math_from_md()
    # Normalize Japanese exactly as the build does.
    normalized = [_wrap_japanese(b) for b in blocks]

    if not KATEX_JS.exists():
        issues.append(f"KaTeX JS missing: {KATEX_JS}")
        return 1

    script = (
        "const katex=require("
        + json.dumps(str(KATEX_JS))
        + ");const opts={throwOnError:true,strict:'ignore'};let ok=0,err=0;"
    )
    for block in normalized:
        script += "try{katex.renderToString(" + json.dumps(block, ensure_ascii=False) + ",opts);ok++;}catch(e){err++;console.log('ERR:'+e.message);}"
    script += "console.log('OK:'+ok+' ERR:'+err);process.exit(err>0?1:0);"

    tmp = PROJECT_ROOT / "tools" / "_verify_math_tmp.js"
    tmp.write_text(script, encoding="utf-8")
    try:
        result = subprocess.run(
            ["node", str(tmp)], capture_output=True, text=True, encoding="utf-8"
        )
        print(result.stdout.strip())
        if result.returncode != 0:
            issues.append(f"KaTeX compile failed: {result.stderr.strip()[:300]}")
            return 1
        return 0
    finally:
        tmp.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify system-dynamics build.")
    parser.add_argument("--math-only", action="store_true", help="Only run KaTeX compile check")
    args = parser.parse_args()

    issues: list[str] = []
    html = INDEX_HTML.read_text(encoding="utf-8")

    if not args.math_only:
        check_figure_refs_resolved(html, issues)
        check_inline_figures_exist(html, issues)
        check_figure_files(issues)
        check_bold_bracket(html, issues)
        check_svg_node_edges_consistent(FIGURES_DIR, issues)
        check_svg_arrows(FIGURES_DIR, issues)

    check_math_compile(issues)

    if issues:
        print("FAIL")
        for msg in issues:
            print(f"  - {msg}")
        return 1
    print("PASS: all checks green")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
