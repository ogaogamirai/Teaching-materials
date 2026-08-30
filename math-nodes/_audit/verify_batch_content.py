#!/usr/bin/env python3
"""Batch content spot-check for math-nodes lessons."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "ontology" / "math_euler_complete_ontology.json"

BATCHES = {
    "B1": [
        "ELEM-NUM-01", "ELEM-RATIO-01", "ELEM-CIRCLE-01",
        "JH-NUM-SIGN-01", "JH-ALG-EXPR-01", "JH-NUM-SQRT-01",
        "JH-ALG-QUADRATIC-01", "JH-COORD-PLANE-01",
    ],
    "B2": [
        "JH-GEO-ROTATION-01", "JH-GEO-PARALLEL-01", "JH-GEO-PYTHAGORAS-01",
        "JH-GEO-TRI-CONG-01", "JH-GEO-SIMILAR-01", "JH-GEO-TRI-BASIC-01",
        "JH-GEO-CIRCLE-ANGLE-01", "JH-GEO-CIRCLE-INCIRCUM-01",
        "JH-COORD-DISTANCE-01", "JH-FUNC-LINEAR-01",
    ],
    "B3": [
        "HS1-TRIG-DEF-01", "HS1-TRIG-UNITCIRCLE-01", "HS1-TRIG-IDENTITY-01",
        "HS1-TRIG-COSINELAW-01", "HS1-TRIG-SINELAW-01", "HS1-TRIG-AREA-01",
        "HS1-TRIG-ANGLECONV-01",
    ],
    "B4": [
        "HS2-TRIG-GENERALANGLE-01", "HS2-TRIG-GRAPH-01", "HS2-TRIG-ADDITION-01",
        "HS2-TRIG-RADIAN-01", "HS2-TRIG-DOUBLE-01", "HS2-TRIG-HALF-01",
        "HS2-TRIG-TRIPLE-01", "HS2-TRIG-SYNTHESIS-01", "HS2-TRIG-PRODSUM-01",
        "HS2-EXP-LOG-01", "HS2-EXP-FUNC-01", "HS2-COMPLEX-NUM-01",
        "HS2-CALC-DIFF-POLY-01",
    ],
    "B5": [
        "HS3-CALC-LIMIT-TRIG-01", "HS3-CALC-DIFF-TRIG-01", "HS3-CALC-E-DEF-01",
        "HS3-CALC-HIGHER-DIFF-01", "HS3-COMPLEX-PLANE-01", "HS3-COMPLEX-DEMOIVRE-01",
        "UNIV-CALC-TAYLOR-01", "EULER-CONVERGENCE-01",
    ],
}


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end < 0:
        return {}
    out: dict[str, str] = {}
    for line in text[3:end].splitlines():
        if ":" in line and not line.startswith(" "):
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip().strip("'\"")
    return out


def extract_block(text: str, start_pat: str, end_pat: str = r"^## ") -> str:
    m = re.search(start_pat, text, re.M | re.I)
    if not m:
        return ""
    rest = text[m.end():]
    em = re.search(end_pat, rest, re.M)
    return rest[: em.start()] if em else rest


def check_node(nid: str, ontology: dict) -> dict:
    lesson = ROOT / nid / "lesson.md"
    issues: list[str] = []
    notes: list[str] = []
    if not lesson.exists():
        return {"id": nid, "issues": ["missing lesson"], "notes": []}

    text = lesson.read_text(encoding="utf-8")
    fm = parse_frontmatter(text)
    lines = len(text.splitlines())

    diag_fm = fm.get("ontology_diagnostic", "")
    diag_json = ontology.get(nid, {}).get("diagnostic_query", "")
    if diag_json and diag_fm and diag_json not in diag_fm and diag_fm not in diag_json:
        notes.append(f"diagnostic drift fm/json")

    # P0 answer present?
    if "P0" in text and "P0の答え" not in text:
        issues.append("has P0 check but no P0の答え section")

    # teach-back
    if "teach-back" not in text.lower() and "教え返し" not in text:
        issues.append("missing teach-back section")

    # まずやってみる answer
    try_m = re.search(
        r"## まずやってみる.*?<details>.*?<summary>.*?</summary>\s*(.*?)</details>",
        text,
        re.S,
    )
    if not try_m:
        notes.append("no まずやってみる answer block")

    # suspicious patterns in answers (heuristic)
    ans_sections = re.findall(
        r"<details>.*?<summary>.*?</summary>\s*(.*?)</details>",
        text,
        re.S,
    )
    for i, ans in enumerate(ans_sections):
        # obvious wrong direction: question mentions 下がる but answer uses 5-(-3) without (-3)-5
        if "下がる" in text and "5 - (-3)" in ans and "(-3) - 5" not in ans:
            issues.append(f"answer block {i+1}: possible 下がる/5-(-3) mismatch")

    # unclosed math
    if text.count("$") % 2 != 0:
        issues.append("unclosed $ math")

    if lines < 150:
        notes.append(f"short ({lines} lines)")
    if lines > 400:
        notes.append(f"long ({lines} lines)")

    return {"id": nid, "lines": lines, "status": fm.get("status", "?"), "issues": issues, "notes": notes}


def main() -> int:
    data = json.loads(ONTOLOGY.read_text(encoding="utf-8-sig"))
    ontology = {n["id"]: n for n in data["nodes"]}

    report: dict = {}
    all_issues = []
    for batch, nids in BATCHES.items():
        results = [check_node(nid, ontology) for nid in nids]
        flagged = [r for r in results if r.get("issues")]
        report[batch] = {"nodes": results, "flagged": len(flagged)}
        all_issues.extend((batch, r) for r in flagged)

    out = ROOT / "_audit" / "batch_content_scan.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("# batch content scan\n")
    for batch, nids in BATCHES.items():
        flagged = report[batch]["flagged"]
        print(f"## {batch} ({len(nids)} nodes, flagged={flagged})")
        for r in report[batch]["nodes"]:
            mark = " !!" if r.get("issues") else ""
            notes = "; ".join(r.get("notes", [])) or "-"
            print(f"  {r['id']}: {r.get('lines','?')}L status={r.get('status','?')}{mark} [{notes}]")
            for iss in r.get("issues", []):
                print(f"    ISSUE: {iss}")
        print()

    print(f"[ok] wrote {out}")
    return 1 if all_issues else 0


if __name__ == "__main__":
    sys.exit(main())
