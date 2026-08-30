#!/usr/bin/env python3
"""math-nodes ontology & prerequisite chain audit."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "ontology" / "math_euler_complete_ontology.json"


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end < 0:
        return {}
    block = text[3:end]
    out: dict = {}
    current_key = None
    current_list: list | None = None
    for line in block.splitlines():
        if line.strip().startswith("- ") and current_list is not None:
            current_list.append(line.strip()[2:].strip())
            continue
        if ":" in line and not line.startswith(" "):
            if current_key and current_list is not None:
                out[current_key] = current_list
            k, v = line.split(":", 1)
            current_key = k.strip()
            v = v.strip()
            if v == "":
                current_list = []
            else:
                out[current_key] = v.strip("'\"")
                current_list = None
    if current_key and current_list is not None:
        out[current_key] = current_list
    return out


def main() -> int:
    data = json.loads(ONTOLOGY.read_text(encoding="utf-8-sig"))
    nodes = {n["id"]: n for n in data["nodes"]}
    ids = set(nodes)

    sha_counts: dict[str, list[str]] = {}
    prereq_issues = []
    missing_prereq_lessons = []
    section_order_issues = []

    for nid in sorted(ids):
        lesson = ROOT / nid / "lesson.md"
        if not lesson.exists():
            continue
        text = lesson.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)

        sha = str(fm.get("ontology_snapshot_sha256", ""))
        if sha:
            sha_counts.setdefault(sha, []).append(nid)

        pnodes = fm.get("prerequisite_nodes", [])
        if isinstance(pnodes, str):
            pnodes = [pnodes]
        for p in pnodes:
            if p not in ids:
                prereq_issues.append(f"{nid}: prerequisite_nodes references unknown {p}")
            elif not (ROOT / p / "lesson.md").exists():
                missing_prereq_lessons.append(f"{nid} -> {p} (no lesson)")

        ont_prereqs = nodes[nid].get("prerequisites", [])
        for p in ont_prereqs:
            if p not in text:
                prereq_issues.append(f"{nid}: ontology prereq {p} not in lesson text")

        # section order: 到達点 should appear before heavy content ideally
        m_goal = re.search(r"^## 到達点", text, re.M)
        m_def = re.search(r"^## (三角比の定義|定義|マクローリン|導出)", text, re.M)
        if m_goal and m_def and m_goal.start() > m_def.start():
            section_order_issues.append(f"{nid}: 到達点 appears after main definition/derivation section")

    print("# math-nodes ontology audit\n")
    print(f"nodes: {len(ids)}")
    print(f"sha256 variants: {len(sha_counts)}")
    for sha, nids in sorted(sha_counts.items(), key=lambda x: -len(x[1])):
        print(f"  {sha[:16]}... : {len(nids)} nodes")
        if len(nids) <= 5:
            print(f"    {', '.join(nids)}")

    if len(sha_counts) > 1:
        minority = [s for s, ns in sha_counts.items() if len(ns) < max(len(x) for x in sha_counts.values())]
        print("\n## SHA256 DRIFT (minority snapshots)")
        for s in minority:
            print(f"  {s}: {', '.join(sha_counts[s])}")

    print("\n## PREREQUISITE ISSUES")
    if not prereq_issues:
        print("  (none)")
    else:
        for x in prereq_issues[:30]:
            print(f"  - {x}")
        if len(prereq_issues) > 30:
            print(f"  ... +{len(prereq_issues)-30} more")

    print("\n## SECTION ORDER ISSUES")
    if not section_order_issues:
        print("  (none)")
    else:
        for x in section_order_issues:
            print(f"  - {x}")

    # Root stray duplicate check
    root_lesson = ROOT / "lesson.md"
    if root_lesson.exists():
        root_fm = parse_frontmatter(root_lesson.read_text(encoding="utf-8"))
        rid = root_fm.get("node_id")
        print("\n## ROOT STRAY")
        print(f"  root lesson.md claims node_id={rid}")
        if rid and (ROOT / rid / "lesson.md").exists():
            a = root_lesson.read_text(encoding="utf-8")
            b = (ROOT / rid / "lesson.md").read_text(encoding="utf-8")
            if a == b:
                print(f"  DUPLICATE of {rid}/lesson.md (byte-identical)")
            else:
                print(f"  SIMILAR to {rid}/lesson.md but not identical")

    out = ROOT / "_audit" / "ontology_report.json"
    out.write_text(
        json.dumps(
            {
                "sha_counts": {k: v for k, v in sha_counts.items()},
                "prereq_issues": prereq_issues,
                "section_order_issues": section_order_issues,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\n[ok] wrote {out}")
    return 1 if prereq_issues or section_order_issues else 0


if __name__ == "__main__":
    sys.exit(main())
