#!/usr/bin/env python3
"""math-nodes structural quality audit — batch-safe, no LLM."""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "ontology" / "math_euler_complete_ontology.json"

REQUIRED_SECTIONS = [
    "到達点",
    "記号の読み方",
    "前提ノードと入口判定",
    "まずやってみる",
    "teach-back",
]
OPTIONAL_SECTION_ALIASES = {
    "teach-back": ["教え返し", "Teach-back", "TEACH-BACK"],
}
CALLOUT_TYPES = ["abstract", "success", "question", "tip", "warning", "note"]


@dataclass
class NodeReport:
    node_id: str
    issues: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    line_count: int = 0
    has_svg: bool = False
    status: str = "?"


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end < 0:
        return {}
    block = text[3:end].strip()
    out: dict[str, str] = {}
    for line in block.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def section_present(text: str, section: str) -> bool:
    if re.search(rf"^##\s+.*{re.escape(section)}", text, re.M | re.I):
        return True
    for alt in OPTIONAL_SECTION_ALIASES.get(section, []):
        if re.search(rf"^##\s+.*{re.escape(alt)}", text, re.M | re.I):
            return True
    return False


def audit_node(node_id: str, ontology_node: dict) -> NodeReport:
    rep = NodeReport(node_id=node_id)
    node_dir = ROOT / node_id
    lesson = node_dir / "lesson.md"

    if not lesson.exists():
        rep.issues.append("missing lesson.md")
        return rep

    text = lesson.read_text(encoding="utf-8")
    rep.line_count = len(text.splitlines())
    rep.has_svg = (node_dir / "diagram.svg").exists()

    fm = parse_frontmatter(text)
    rep.status = fm.get("status", "(no status)")

    if fm.get("node_id") and fm.get("node_id") != node_id:
        rep.issues.append(f"frontmatter node_id mismatch: {fm.get('node_id')}")

    if not fm.get("ontology_diagnostic"):
        rep.warnings.append("missing ontology_diagnostic in frontmatter")

    diag = ontology_node.get("diagnostic_query", "")
    if diag and diag not in text and diag[:20] not in text:
        rep.warnings.append("ontology diagnostic_query not found in body")

    prereqs = ontology_node.get("prerequisites", [])
    for p in prereqs:
        if p not in text:
            rep.warnings.append(f"prerequisite {p} not mentioned in lesson")

    for sec in REQUIRED_SECTIONS:
        if not section_present(text, sec):
            rep.issues.append(f"missing section: {sec}")

    if not rep.has_svg:
        rep.warnings.append("missing diagram.svg")

    if "![diagram.svg]" not in text and "diagram.svg" not in text:
        rep.warnings.append("diagram.svg not linked in lesson")

    callouts_found = sum(1 for c in CALLOUT_TYPES if f"[!{c}]" in text.lower() or f"[!{c}]" in text)
    if callouts_found < 2:
        rep.warnings.append(f"few callouts ({callouts_found})")

    if "<details>" not in text:
        rep.warnings.append("no <details> answer blocks")

    # KaTeX / markdown hazards
    if re.search(r"\\\\frac|\\\\sin|\\\\cos|\\\\tan", text):
        rep.issues.append("double-backslash TeX (\\\\frac etc.) — Obsidian may break")

    dollars = text.count("$") - text.count("$$") * 2
    if dollars % 2 != 0:
        rep.issues.append("possible unclosed inline $ math")

    if rep.line_count < 150:
        rep.warnings.append(f"short lesson ({rep.line_count} lines, target ~250-320)")
    elif rep.line_count > 450:
        rep.warnings.append(f"long lesson ({rep.line_count} lines)")

    if "prerequisite_status:" not in text and "prerequisite_status" not in fm:
        rep.warnings.append("prerequisite_status not documented")

    return rep


def main() -> int:
    data = json.loads(ONTOLOGY.read_text(encoding="utf-8-sig"))
    nodes = {n["id"]: n for n in data["nodes"]}
    expected = set(nodes)

    dirs = {
        p.name
        for p in ROOT.iterdir()
        if p.is_dir() and not p.name.startswith(("_", ".")) and p.name != "ontology"
    }
    extra = sorted(dirs - expected)
    missing = sorted(expected - dirs)

    reports = [audit_node(nid, nodes[nid]) for nid in sorted(expected)]

    issue_nodes = [r for r in reports if r.issues]
    warn_nodes = [r for r in reports if r.warnings and not r.issues]
    approved = [r for r in reports if r.status == "approved"]
    draft = [r for r in reports if r.status == "draft"]

    print("# math-nodes structural audit")
    print(f"ontology_nodes: {len(expected)}")
    print(f"directories: {len(dirs)}")
    print(f"approved: {len(approved)} | draft: {len(draft)}")
    print()

    if missing:
        print("## MISSING DIRECTORIES")
        for m in missing:
            print(f"  - {m}")
        print()

    if extra:
        print("## EXTRA DIRECTORIES (not in ontology)")
        for e in extra:
            print(f"  - {e}")
        print()

    # Root stray files
    stray = []
    if (ROOT / "lesson.md").exists():
        stray.append("root lesson.md")
    if (ROOT / "diagram.svg").exists():
        stray.append("root diagram.svg")
    if stray:
        print("## STRAY ROOT FILES")
        for s in stray:
            print(f"  - {s}")
        print()

    print("## ISSUES (must fix)")
    if not issue_nodes:
        print("  (none)")
    else:
        for r in issue_nodes:
            print(f"\n### {r.node_id} (status={r.status}, lines={r.line_count})")
            for i in r.issues:
                print(f"  [ISSUE] {i}")

    print("\n## WARNINGS (review)")
    warn_only = [r for r in reports if r.warnings]
    for r in warn_only:
        print(f"\n### {r.node_id} (status={r.status}, lines={r.line_count}, svg={r.has_svg})")
        for w in r.warnings:
            print(f"  [WARN] {w}")

    print("\n## SUMMARY")
    print(f"  nodes_with_issues: {len(issue_nodes)}/{len(reports)}")
    print(f"  nodes_with_warnings: {len(warn_only)}/{len(reports)}")
    print(f"  median_lines: {sorted(r.line_count for r in reports)[len(reports)//2]}")

    out_json = ROOT / "_audit" / "structure_report.json"
    out_json.write_text(
        json.dumps(
            {
                "summary": {
                    "total": len(reports),
                    "issues": len(issue_nodes),
                    "warnings": len(warn_only),
                    "approved": len(approved),
                    "missing_dirs": missing,
                    "extra_dirs": extra,
                    "stray_root": stray,
                },
                "nodes": [
                    {
                        "id": r.node_id,
                        "status": r.status,
                        "lines": r.line_count,
                        "has_svg": r.has_svg,
                        "issues": r.issues,
                        "warnings": r.warnings,
                    }
                    for r in reports
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\n[ok] wrote {out_json}")
    return 1 if issue_nodes or missing else 0


if __name__ == "__main__":
    sys.exit(main())
