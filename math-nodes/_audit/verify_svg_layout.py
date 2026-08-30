#!/usr/bin/env python3
"""Audit diagram.svg layout: panel overflow, angle-arc alignment, diagram text overlap.

Formal spec: _audit/DIAGRAM_LAYOUT_CHECK_v01.md
"""
from __future__ import annotations

import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

_AUDIT_DIR = Path(__file__).resolve().parent
if str(_AUDIT_DIR) not in sys.path:
    sys.path.insert(0, str(_AUDIT_DIR))

from svg_arc_arrow import (
    audit_arc_arrowheads,
    collect_circular_arcs,
    parse_polygon_points,
)

ROOT = Path(__file__).resolve().parents[1]
SVG_NS = "http://www.w3.org/2000/svg"
ARC_RE = re.compile(
    r'M\s*([-\d.]+)\s+([-\d.]+)\s+A\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([01])\s+([01])\s+([-\d.]+)\s+([-\d.]+)',
    re.I,
)
CLASS_FS_RE = re.compile(r"\.([a-zA-Z0-9_-]+)\s*\{[^}]*font-size:\s*([0-9.]+)px", re.S)


@dataclass
class Panel:
    x: float
    y: float
    w: float
    h: float

    @property
    def right(self) -> float:
        return self.x + self.w

    @property
    def bottom(self) -> float:
        return self.y + self.h


@dataclass
class TextItem:
    x: float
    y: float
    text: str
    font_size: float
    anchor: str
    cls: str


@dataclass
class ArcItem:
    x1: float
    y1: float
    rx: float
    ry: float
    x2: float
    y2: float
    raw: str


@dataclass
class LineItem:
    x1: float
    y1: float
    x2: float
    y2: float
    stroke_width: float
    dashed: bool = False


@dataclass
class AuditResult:
    node: str
    panel_overflow: list[str] = field(default_factory=list)
    arc_issues: list[str] = field(default_factory=list)
    arc_arrow_issues: list[str] = field(default_factory=list)
    overlap_issues: list[str] = field(default_factory=list)
    arc_count: int = 0
    panel_text_count: int = 0


def parse_viewbox(root: ET.Element) -> tuple[float, float, float, float]:
    vb = root.get("viewBox", "0 0 820 400")
    parts = [float(x) for x in vb.replace(",", " ").split()]
    if len(parts) == 4:
        return parts[0], parts[1], parts[2], parts[3]
    return 0, 0, 820, 400


def parse_class_font_sizes(style_text: str) -> dict[str, float]:
    return {m.group(1): float(m.group(2)) for m in CLASS_FS_RE.finditer(style_text)}


def elem_text(el: ET.Element) -> str:
    parts: list[str] = []
    if el.text:
        parts.append(el.text)
    for child in el:
        if child.text:
            parts.append(child.text)
        if child.tail:
            parts.append(child.tail)
    return "".join(parts).strip()


def get_font_size(el: ET.Element, class_sizes: dict[str, float]) -> float:
    if el.get("font-size"):
        return float(re.sub(r"[^\d.]", "", el.get("font-size", "15")))
    cls = el.get("class", "")
    for name in cls.split():
        if name in class_sizes:
            return class_sizes[name]
    return 15.0


def estimate_text_width(text: str, font_size: float) -> float:
    width = 0.0
    for ch in text:
        if ord(ch) > 0x2E80:
            width += font_size * 0.98
        elif ch in "（）「」・＝→⇒∠°":
            width += font_size * 0.9
        elif ch in " ":
            width += font_size * 0.35
        else:
            width += font_size * 0.58
    return width


def find_panels(root: ET.Element) -> list[Panel]:
    panels: list[Panel] = []
    for el in root.iter():
        if el.tag.split("}")[-1] != "rect":
            continue
        fill = (el.get("fill") or "").lower()
        stroke = (el.get("stroke") or "").lower()
        if fill not in ("#ffffff", "#fff", "white"):
            continue
        try:
            x = float(el.get("x", 0))
            y = float(el.get("y", 0))
            w = float(el.get("width", 0))
            h = float(el.get("height", 0))
        except ValueError:
            continue
        if w < 180 or h < 180:
            continue
        if stroke in ("#e2e8f0", "#cbd5e1", "#e5e7eb", ""):
            panels.append(Panel(x, y, w, h))
    return panels


def collect_texts(root: ET.Element, class_sizes: dict[str, float]) -> list[TextItem]:
    items: list[TextItem] = []
    for el in root.iter():
        if el.tag.split("}")[-1] != "text":
            continue
        try:
            x = float(el.get("x", 0))
            y = float(el.get("y", 0))
        except ValueError:
            continue
        txt = elem_text(el)
        if not txt:
            continue
        items.append(
            TextItem(
                x=x,
                y=y,
                text=txt,
                font_size=get_font_size(el, class_sizes),
                anchor=el.get("text-anchor", "start"),
                cls=el.get("class", ""),
            )
        )
    return items


def collect_vertices(root: ET.Element) -> list[tuple[float, float]]:
    verts: list[tuple[float, float]] = []
    large_circles: list[tuple[float, float, float]] = []
    small_circles: list[tuple[float, float]] = []
    lines: list[tuple[float, float, float, float]] = []

    for el in root.iter():
        tag = el.tag.split("}")[-1]
        if tag == "circle":
            try:
                cx = float(el.get("cx", 0))
                cy = float(el.get("cy", 0))
                r = float(el.get("r", 0))
            except ValueError:
                continue
            if r >= 50:
                large_circles.append((cx, cy, r))
                verts.append((cx, cy))
            elif r <= 12:
                small_circles.append((cx, cy))
        elif tag == "line":
            try:
                lines.append(
                    (
                        float(el.get("x1", 0)),
                        float(el.get("y1", 0)),
                        float(el.get("x2", 0)),
                        float(el.get("y2", 0)),
                    )
                )
            except ValueError:
                pass

    for cx, cy in small_circles:
        on_perimeter = False
        for lx, ly, lr in large_circles:
            d = math.hypot(cx - lx, cy - ly)
            if abs(d - lr) < 25:
                on_perimeter = True
                break
        if not on_perimeter:
            verts.append((cx, cy))

    for i, a in enumerate(lines):
        for b in lines[i + 1 :]:
            p = line_intersection(a, b)
            if p:
                verts.append(p)

    dedup: list[tuple[float, float]] = []
    for v in verts:
        if not any(math.hypot(v[0] - u[0], v[1] - u[1]) < 2 for u in dedup):
            dedup.append(v)
    return dedup


def line_intersection(
    a: tuple[float, float, float, float], b: tuple[float, float, float, float]
) -> tuple[float, float] | None:
    x1, y1, x2, y2 = a
    x3, y3, x4, y4 = b
    den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(den) < 1e-6:
        return None
    px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den
    py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den
    def on_seg(xa, ya, xb, yb, xp, yp, margin=4.0) -> bool:
        return (
            min(xa, xb) - margin <= xp <= max(xa, xb) + margin
            and min(ya, yb) - margin <= yp <= max(ya, yb) + margin
        )

    if on_seg(x1, y1, x2, y2, px, py) and on_seg(x3, y3, x4, y4, px, py):
        return (px, py)
    return None


def collect_angle_arcs(raw: str) -> list[ArcItem]:
    arcs: list[ArcItem] = []
    for path_block in re.findall(r"<path\b[^>]*>", raw, re.I):
        if 'fill="none"' not in path_block and "fill='none'" not in path_block:
            continue
        d_m = re.search(r'd="([^"]+)"', path_block, re.I)
        if not d_m:
            continue
        d = d_m.group(1)
        for m in ARC_RE.finditer(d):
            x1, y1, rx, ry, x2, y2 = map(float, (m.group(1), m.group(2), m.group(3), m.group(4), m.group(8), m.group(9)))
            if abs(rx - ry) > 0.5:
                continue
            if rx > 50:
                continue
            arc_span = math.hypot(x2 - x1, y2 - y1)
            if arc_span > rx * 1.8:
                continue
            arcs.append(ArcItem(x1, y1, rx, ry, x2, y2, d))
    return arcs


def arc_vertex_fit(arc: ArcItem, verts: list[tuple[float, float]], tol: float = 4.0) -> tuple[bool, str]:
    best_err = 1e9
    best_v = None
    best_d1 = best_d2 = 0.0
    for vx, vy in verts:
        d1 = math.hypot(arc.x1 - vx, arc.y1 - vy)
        d2 = math.hypot(arc.x2 - vx, arc.y2 - vy)
        err = abs(d1 - arc.rx) + abs(d2 - arc.rx)
        if err < best_err:
            best_err, best_d1, best_d2, best_v = err, d1, d2, (vx, vy)
    if best_v is None:
        return False, "no vertex candidate"
    if best_err > tol * 2:
        return False, f"endpoints not on radius {arc.rx:.0f} from vertex ({best_v[0]:.1f},{best_v[1]:.1f}) d1={best_d1:.1f} d2={best_d2:.1f}"
    return True, f"ok @ ({best_v[0]:.1f},{best_v[1]:.1f})"


def audit_panel_overflow(texts: list[TextItem], panels: list[Panel], vb_h: float) -> list[str]:
    issues: list[str] = []
    if not panels:
        return issues
    panel = max(panels, key=lambda p: p.x)
    margin_x = 12
    margin_y = 8
    for t in texts:
        if t.x < panel.x - 20:
            continue
        if t.y < panel.y - 10 or t.y > panel.bottom + 5:
            continue
        w = estimate_text_width(t.text, t.font_size)
        if t.anchor == "middle":
            left, right = t.x - w / 2, t.x + w / 2
        elif t.anchor == "end":
            left, right = t.x - w, t.x
        else:
            left, right = t.x, t.x + w
        if right > panel.right - margin_x:
            issues.append(
                f"panel overflow: '{t.text[:28]}' est_right={right:.0f} > panel_right={panel.right - margin_x:.0f}"
            )
        if t.y + 4 > panel.bottom - margin_y:
            issues.append(f"panel bottom overflow: '{t.text[:28]}' y={t.y:.0f}")
        if left < panel.x + margin_x:
            issues.append(f"panel left overflow: '{t.text[:28]}' est_left={left:.0f}")
    return issues


def text_bbox(t: TextItem) -> tuple[float, float, float, float]:
    w = estimate_text_width(t.text, t.font_size)
    h = t.font_size
    if t.anchor == "middle":
        left = t.x - w / 2
    elif t.anchor == "end":
        left = t.x - w
    else:
        left = t.x
    right = left + w
    top = t.y - h * 0.82
    bottom = t.y + h * 0.18
    return left, top, right, bottom


def bboxes_overlap(
    a: tuple[float, float, float, float],
    b: tuple[float, float, float, float],
    margin: float = 3.0,
) -> bool:
    al, at, ar, ab = a
    bl, bt, br, bb = b
    return not (ar + margin < bl or br + margin < al or ab + margin < bt or bb + margin < at)


def dist_point_segment(px: float, py: float, x1: float, y1: float, x2: float, y2: float) -> float:
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)


def collect_diagram_lines(root: ET.Element, panel_x: float) -> list[LineItem]:
    lines: list[LineItem] = []
    for el in root.iter():
        tag = el.tag.split("}")[-1]
        if tag != "line":
            continue
        try:
            x1 = float(el.get("x1", 0))
            y1 = float(el.get("y1", 0))
            x2 = float(el.get("x2", 0))
            y2 = float(el.get("y2", 0))
            sw = float(el.get("stroke-width", "2"))
        except ValueError:
            continue
        if max(x1, x2) >= panel_x - 8:
            continue
        if el.get("stroke", "").lower() in ("#e2e8f0", "#cbd5e1"):
            continue
        dashed = bool(el.get("stroke-dasharray"))
        if not dashed and sw >= 5:
            continue
        lines.append(LineItem(x1, y1, x2, y2, sw, dashed))
    return lines


def collect_arrow_polygons(root: ET.Element, panel_x: float) -> list[tuple[list[tuple[float, float]], str]]:
    polys: list[tuple[list[tuple[float, float]], str]] = []
    for el in root.iter():
        if el.tag.split("}")[-1] != "polygon":
            continue
        pts = el.get("points", "")
        coords = parse_polygon_points(pts)
        if len(coords) < 3:
            continue
        if max(p[0] for p in coords) >= panel_x - 8:
            continue
        polys.append((coords, el.get("fill", "")))
    return polys


def audit_diagram_overlaps(
    texts: list[TextItem],
    lines: list[LineItem],
    polygons: list[list[tuple[float, float]]],
    panel_x: float,
) -> list[str]:
    issues: list[str] = []
    diagram_texts = [t for t in texts if t.x < panel_x - 8 and t.text.strip()]
    boxes = [(t, text_bbox(t)) for t in diagram_texts]

    for i, (ta, ba) in enumerate(boxes):
        for tb, bb in boxes[i + 1 :]:
            if bboxes_overlap(ba, bb):
                issues.append(f"text overlap: '{ta.text[:16]}' ↔ '{tb.text[:16]}'")

    for t, box in boxes:
        cx = (box[0] + box[2]) / 2
        cy = (box[1] + box[3]) / 2
        samples = [
            (cx, cy),
            (box[0], box[1]),
            (box[2], box[1]),
            (box[0], box[3]),
            (box[2], box[3]),
        ]
        for ln in lines:
            threshold = ln.stroke_width / 2 + (t.font_size * 0.25 if ln.dashed else t.font_size * 0.12)
            for sx, sy in samples:
                if dist_point_segment(sx, sy, ln.x1, ln.y1, ln.x2, ln.y2) < threshold:
                    issues.append(
                        f"text on {'dashed ' if ln.dashed else ''}line: '{t.text[:16]}' "
                        f"near ({ln.x1:.0f},{ln.y1:.0f})–({ln.x2:.0f},{ln.y2:.0f})"
                    )
                    break
            else:
                continue
            break

        for poly in polygons:
            pl, pt = min(p[0] for p in poly), min(p[1] for p in poly)
            pr, pb = max(p[0] for p in poly), max(p[1] for p in poly)
            if bboxes_overlap(box, (pl, pt, pr, pb), margin=-2):
                issues.append(f"text on arrow: '{t.text[:16]}'")
                break

    return issues


def audit_svg(path: Path, node_id: str) -> AuditResult:
    raw = path.read_text(encoding="utf-8", errors="replace")
    tree = ET.parse(path)
    root = tree.getroot()
    _, _, vw, vh = parse_viewbox(root)
    style_el = root.find(f"{{{SVG_NS}}}style")
    style_text = style_el.text if style_el is not None and style_el.text else ""
    if not style_text:
        style_el = root.find("style")
        style_text = style_el.text if style_el is not None and style_el.text else ""
    class_sizes = parse_class_font_sizes(style_text)

    panels = find_panels(root)
    texts = collect_texts(root, class_sizes)
    result = AuditResult(node=node_id, panel_text_count=sum(1 for t in texts if panels and t.x >= panels[0].x - 20))

    result.panel_overflow = audit_panel_overflow(texts, panels, vh)

    panel_x = panels[0].x if panels else vw * 0.65
    arrow_polys = collect_arrow_polygons(root, panel_x)
    result.overlap_issues = audit_diagram_overlaps(
        texts,
        collect_diagram_lines(root, panel_x),
        [p for p, _ in arrow_polys],
        panel_x,
    )

    verts = collect_vertices(root)
    arcs = collect_angle_arcs(raw)
    result.arc_count = len(arcs)
    for i, arc in enumerate(arcs, 1):
        ok, msg = arc_vertex_fit(arc, verts)
        if not ok:
            result.arc_issues.append(f"arc#{i} r={arc.rx:.0f}: {msg} [{arc.raw[:55]}...]")

    big_arcs = collect_circular_arcs(raw)
    if big_arcs and arrow_polys:
        result.arc_arrow_issues = audit_arc_arrowheads(big_arcs, arrow_polys)

    return result


def main() -> int:
    results: list[dict] = []
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith(("_", ".")) or d.name == "ontology":
            continue
        svg = d / "diagram.svg"
        if not svg.exists():
            continue
        r = audit_svg(svg, d.name)
        results.append(
            {
                "node": r.node,
                "panel_overflow": r.panel_overflow,
                "arc_issues": r.arc_issues,
                "arc_arrow_issues": r.arc_arrow_issues,
                "overlap_issues": r.overlap_issues,
                "arc_count": r.arc_count,
                "panel_text_count": r.panel_text_count,
                "flagged": bool(
                    r.panel_overflow or r.arc_issues or r.arc_arrow_issues or r.overlap_issues
                ),
            }
        )

    flagged = [r for r in results if r["flagged"]]
    out = ROOT / "_audit" / "svg_layout_report.json"
    out.write_text(
        json.dumps({"total": len(results), "flagged": len(flagged), "nodes": results}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"# svg layout audit: {len(results)} files, flagged={len(flagged)}\n")
    for r in results:
        if not r["flagged"]:
            continue
        print(f"## {r['node']} (arcs={r['arc_count']})")
        for i in r["panel_overflow"]:
            print(f"  PANEL: {i}".encode("utf-8", "replace").decode("utf-8"))
        for i in r["arc_issues"]:
            print(f"  ARC: {i}")
        for i in r.get("arc_arrow_issues", []):
            print(f"  ARC_ARROW: {i}")
        for i in r.get("overlap_issues", []):
            print(f"  OVERLAP: {i}")
    print(f"\n[ok] wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
