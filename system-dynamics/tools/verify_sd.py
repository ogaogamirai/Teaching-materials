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
# L3 Figure validity (D2-rendered SVG)
# ---------------------------------------------------------------------------

def check_svg_valid(figures_dir: Path, issues: list[str]) -> None:
    """SVG files must be well-formed XML with no leftover @font-face (shared CSS fonts)."""
    import xml.etree.ElementTree as ET

    for svg_path in sorted(figures_dir.glob("*.svg")):
        try:
            ET.parse(svg_path)
        except ET.ParseError as exc:
            issues.append(f"{svg_path.name}: XML parse error: {exc}")
            continue
        text = svg_path.read_text(encoding="utf-8")
        if "@font-face" in text:
            issues.append(f"{svg_path.name}: still contains embedded @font-face (run build_figures_d2.py)")
        if "d2-" in text and "font-family" in text and "font-regular" in text:
            issues.append(f"{svg_path.name}: font-family may still reference d2 internal font")


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
        check_svg_valid(FIGURES_DIR, issues)

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
