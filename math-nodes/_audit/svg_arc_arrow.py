#!/usr/bin/env python3
"""SVG circular arc + arrowhead helpers (L5 prevention).

Formal spec: _audit/DIAGRAM_LAYOUT_CHECK_v01.md §2.4 / L5

Usage (generate snippet):
  python _audit/svg_arc_arrow.py --cx 290 --cy 240 --r 108 --t1 0 --t2 1.5708 --color "#0ea5e9"
"""
from __future__ import annotations

import argparse
import math
import re
from dataclasses import dataclass


@dataclass
class CircularArc:
    x1: float
    y1: float
    rx: float
    ry: float
    x2: float
    y2: float
    sweep: int
    raw: str


@dataclass
class ArrowHead:
    points: list[tuple[float, float]]
    fill: str


ARC_RE = re.compile(
    r"M\s*([-\d.]+)\s+([-\d.]+)\s+A\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([01])\s+([01])\s+([-\d.]+)\s+([-\d.]+)",
    re.I,
)


def pt_on_circle(cx: float, cy: float, r: float, theta: float) -> tuple[float, float]:
    """Math angle θ: 0=right, CCW positive; SVG y-down."""
    return cx + r * math.cos(theta), cy - r * math.sin(theta)


def tangent_angle_ccw(theta: float) -> float:
    """Direction of CCW travel on circle (SVG coords)."""
    return math.atan2(-math.cos(theta), -math.sin(theta))


def arc_path(cx: float, cy: float, r: float, t1: float, t2: float, sweep: int = 0) -> str:
    x1, y1 = pt_on_circle(cx, cy, r, t1)
    x2, y2 = pt_on_circle(cx, cy, r, t2)
    return f"M {x1:.1f} {y1:.1f} A {r} {r} 0 0 {sweep} {x2:.1f} {y2:.1f}"


def arrow_polygon(
    cx: float,
    cy: float,
    r: float,
    theta_end: float,
    *,
    size: float = 10.0,
    spread: float = 0.42,
) -> str:
    """Triangle tip at arc end, pointing along CCW tangent."""
    ex, ey = pt_on_circle(cx, cy, r, theta_end)
    tdir = tangent_angle_ccw(theta_end)
    w1x = ex + size * 1.15 * math.cos(tdir + math.pi - spread)
    w1y = ey + size * 1.15 * math.sin(tdir + math.pi - spread)
    w2x = ex + size * 1.15 * math.cos(tdir + math.pi + spread)
    w2y = ey + size * 1.15 * math.sin(tdir + math.pi + spread)
    return f"{ex:.1f},{ey:.1f} {w1x:.1f},{w1y:.1f} {w2x:.1f},{w2y:.1f}"


def arc_arrow_snippet(
    cx: float,
    cy: float,
    r: float,
    t1: float,
    t2: float,
    color: str,
    *,
    stroke_width: float = 3.0,
    sweep: int = 0,
    arrow_size: float = 10.0,
) -> str:
    path = arc_path(cx, cy, r, t1, t2, sweep=sweep)
    poly = arrow_polygon(cx, cy, r, t2, size=arrow_size)
    return (
        f'  <path d="{path}" fill="none" stroke="{color}" stroke-width="{stroke_width}"/>\n'
        f'  <polygon points="{poly}" fill="{color}"/>'
    )


def parse_polygon_points(raw: str) -> list[tuple[float, float]]:
    nums = [float(v) for v in re.split(r"[\s,]+", raw.strip()) if v]
    return [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]


def collect_circular_arcs(raw: str, *, min_r: float = 50.0) -> list[CircularArc]:
    arcs: list[CircularArc] = []
    for path_block in re.findall(r"<path\b[^>]*>", raw, re.I):
        if 'fill="none"' not in path_block and "fill='none'" not in path_block:
            continue
        d_m = re.search(r'd="([^"]+)"', path_block, re.I)
        if not d_m:
            continue
        d = d_m.group(1)
        for m in ARC_RE.finditer(d):
            x1, y1, rx, ry, x2, y2 = map(
                float, (m.group(1), m.group(2), m.group(3), m.group(4), m.group(8), m.group(9))
            )
            sweep = int(m.group(7))
            if abs(rx - ry) > 0.5 or rx < min_r:
                continue
            arcs.append(CircularArc(x1, y1, rx, ry, x2, y2, sweep, d))
    return arcs


def infer_circle_center(arc: CircularArc) -> tuple[float, float] | None:
    """Infer center from arc endpoints, radius, and sweep (short-arc assumption)."""
    x1, y1, x2, y2, r = arc.x1, arc.y1, arc.x2, arc.y2, arc.rx
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    chord = math.hypot(dx, dy)
    if chord < 1e-6 or chord > 2 * r:
        return None
    h = math.sqrt(max(0.0, r * r - (chord / 2) ** 2))
    px, py = -dy / chord, dx / chord
    candidates = ((mx + px * h, my + py * h), (mx - px * h, my - py * h))

    def theta_at(cx: float, cy: float, x: float, y: float) -> float:
        return math.atan2((cy - y) / r, (x - cx) / r)

    for cx, cy in candidates:
        if abs(math.hypot(x1 - cx, y1 - cy) - r) > 1.0 or abs(math.hypot(x2 - cx, y2 - cy) - r) > 1.0:
            continue
        t1 = theta_at(cx, cy, x1, y1)
        t2 = theta_at(cx, cy, x2, y2)
        diff = (t2 - t1) % (2 * math.pi)
        if arc.sweep == 0 and 0 < diff <= math.pi + 0.05:
            return cx, cy
        if arc.sweep == 1 and diff >= math.pi - 0.05:
            return cx, cy
    return candidates[0]


def arc_end_tangent(arc: CircularArc) -> float | None:
    center = infer_circle_center(arc)
    if center is None:
        return None
    cx, cy = center
    cos_t = (arc.x2 - cx) / arc.rx
    sin_t = (cy - arc.y2) / arc.rx
    theta = math.atan2(sin_t, cos_t)
    if arc.sweep == 0:
        return math.atan2(-math.cos(theta), -math.sin(theta))
    return math.atan2(math.cos(theta), math.sin(theta))


def arrow_tip_and_dir(poly: list[tuple[float, float]]) -> tuple[tuple[float, float], float] | None:
    if len(poly) < 3:
        return None
    # Tip = vertex farthest from centroid (arrow triangles are isosceles with tip at arc end).
    cx = sum(p[0] for p in poly) / len(poly)
    cy = sum(p[1] for p in poly) / len(poly)
    tip = max(poly, key=lambda p: math.hypot(p[0] - cx, p[1] - cy))
    base = [p for p in poly if p != tip]
    if len(base) < 2:
        return None
    bx = sum(p[0] for p in base) / len(base)
    by = sum(p[1] for p in base) / len(base)
    direction = math.atan2(tip[1] - by, tip[0] - bx)
    return tip, direction


def audit_arc_arrowheads(
    arcs: list[CircularArc],
    polygons: list[tuple[list[tuple[float, float]], str]],
    *,
    tip_tol: float = 6.0,
    angle_tol_deg: float = 35.0,
) -> list[str]:
    """L5: arrow tip must sit on arc end and align with tangent."""
    issues: list[str] = []
    used: set[int] = set()

    for i, arc in enumerate(arcs, 1):
        tangent = arc_end_tangent(arc)
        if tangent is None:
            continue
        travel = tangent

        best_j = -1
        best_dist = 1e9
        for j, (poly, _fill) in enumerate(polygons):
            if j in used:
                continue
            parsed = arrow_tip_and_dir(poly)
            if parsed is None:
                continue
            tip, _ = parsed
            d_end = math.hypot(tip[0] - arc.x2, tip[1] - arc.y2)
            d_start = math.hypot(tip[0] - arc.x1, tip[1] - arc.y1)
            d = min(d_end, d_start)
            if d < best_dist:
                best_dist, best_j = d, j

        if best_j < 0:
            issues.append(f"arc#{i} r={arc.rx:.0f}: no nearby arrowhead polygon")
            continue

        poly, _ = polygons[best_j]
        used.add(best_j)
        parsed = arrow_tip_and_dir(poly)
        if parsed is None:
            continue
        tip, adir = parsed

        if math.hypot(tip[0] - arc.x2, tip[1] - arc.y2) > tip_tol:
            issues.append(
                f"arc#{i} r={arc.rx:.0f}: arrow tip ({tip[0]:.1f},{tip[1]:.1f}) "
                f"off arc end ({arc.x2:.1f},{arc.y2:.1f}) d={math.hypot(tip[0]-arc.x2, tip[1]-arc.y2):.1f}px"
            )

        ang = abs((adir - travel + math.pi) % (2 * math.pi) - math.pi)
        if math.degrees(ang) > angle_tol_deg:
            issues.append(
                f"arc#{i} r={arc.rx:.0f}: arrow direction {math.degrees(adir):.0f}° "
                f"vs tangent {math.degrees(travel):.0f}° (Δ={math.degrees(ang):.0f}°)"
            )

    return issues


def main() -> int:
    p = argparse.ArgumentParser(description="Generate SVG arc + arrowhead snippet")
    p.add_argument("--cx", type=float, required=True)
    p.add_argument("--cy", type=float, required=True)
    p.add_argument("--r", type=float, required=True)
    p.add_argument("--t1", type=float, required=True, help="start angle (radians)")
    p.add_argument("--t2", type=float, required=True, help="end angle (radians)")
    p.add_argument("--color", default="#0ea5e9")
    p.add_argument("--sweep", type=int, default=0)
    p.add_argument("--stroke-width", type=float, default=3.0)
    args = p.parse_args()
    print(
        arc_arrow_snippet(
            args.cx,
            args.cy,
            args.r,
            args.t1,
            args.t2,
            args.color,
            stroke_width=args.stroke_width,
            sweep=args.sweep,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
