#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verify all board formulas compile with local KaTeX (no browser).

Usage (project root):
  python tools/verify_math.py
  python tools/verify_math.py --strict-path   # also fail if formula_html is raw-injected

Exit 0 = all green. Exit 1 = failures listed.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
EXPL = ROOT / "data" / "explanations"
MATH_CARDS = ROOT / "data" / "math_cards.json"
KATEX_JS = ROOT / "vendor" / "katex" / "katex.min.js"
FORMULA_KEYS = ("formula_html", "formula_html_2", "formula_html_3", "formula_html_4")

# Patterns that must NOT appear in pure-TeX board formulas
BAD_SOURCE = [
    (re.compile(r"<[a-zA-Z/!]"), "HTML tag in formula (use pure LaTeX)"),
    (re.compile(r"[ωφθπαβΣ∫∞√·／　]"), "Unicode math char (use LaTeX command)"),
    (re.compile(r"[₀₁₂₃₄₅₆₇₈₉ⁿ⁰¹²³⁴⁵⁶⁷⁸⁹ₐₑₓᵢ]"), "Unicode super/sub (use _{} / ^{})"),
]

# After KaTeX HTML, these indicate bad render
BAD_OUTPUT = [
    (re.compile(r"katex-error"), "KaTeX error class in output"),
    (re.compile(r"\\\\[a-zA-Z]{2,}"), "raw backslash command leaked"),
    (re.compile(r"\\omegat|\\phit|\\thetat|\\pit\b"), "greek glued to letter"),
]


def collect_formulas():
    items = []
    for path in sorted(EXPL.glob("P-*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for k in FORMULA_KEYS:
            v = data.get(k)
            if isinstance(v, str) and v.strip():
                items.append((f"{path.name}:{k}", v.strip()))
    if MATH_CARDS.exists():
        mc = json.loads(MATH_CARDS.read_text(encoding="utf-8"))
        for ch_id, ch in (mc.get("chapters") or {}).items():
            v = ch.get("formula_html")
            if isinstance(v, str) and v.strip():
                items.append((f"math_cards.json:chapters.{ch_id}", v.strip()))
        for nid, node in (mc.get("nodes") or {}).items():
            v = node.get("formula_html")
            if isinstance(v, str) and v.strip():
                # skip explicit empty boards
                if "看板公式なし" in v or v.startswith("（"):
                    continue
                items.append((f"math_cards.json:nodes.{nid}", v.strip()))
    return items


def check_source(tex: str) -> list[str]:
    errs = []
    for rx, msg in BAD_SOURCE:
        if rx.search(tex):
            errs.append(msg)
    # bare < in math (K < N ok if written as K<N without spaces still bad for some)
    if re.search(r"(?<!\\text\{)(?<!\\)(?<!\{)<(?![a-zA-Z/!])", tex):
        if "<" in tex and "\\lt" not in tex and "\\text{" not in tex.split("<")[0][-20:]:
            # allow only inside \text{...}
            parts = re.split(r"\\text\{[^}]*\}", tex)
            for p in parts:
                if "<" in p:
                    errs.append("bare < in TeX (use \\lt)")
                    break
    return errs


def katex_batch(formulas: list[tuple[str, str]]) -> list[tuple[str, str | None, str | None]]:
    """Return list of (id, html_or_None, err_or_None)."""
    if not KATEX_JS.is_file():
        raise FileNotFoundError(f"missing {KATEX_JS}")

    payload = [{"id": i, "tex": t} for i, t in formulas]
    js = r"""
const fs = require('fs');
const path = require('path');
const katexPath = process.argv[2];
const inPath = process.argv[3];
// load katex UMD
const code = fs.readFileSync(katexPath, 'utf8');
const sandbox = { module: { exports: {} }, exports: {}, console };
const vm = require('vm');
vm.runInNewContext(code + '\nthis.katex = module.exports.default || module.exports || katex;', sandbox);
const katex = sandbox.katex || sandbox.module.exports;
if (!katex || typeof katex.renderToString !== 'function') {
  console.error(JSON.stringify({ fatal: 'katex load failed' }));
  process.exit(2);
}
const items = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const out = [];
for (const it of items) {
  try {
    const html = katex.renderToString(it.tex, {
      throwOnError: true,
      displayMode: true,
      strict: 'ignore',
      trust: false,
      output: 'html'
    });
    out.push({ id: it.id, ok: true, html });
  } catch (e) {
    out.push({ id: it.id, ok: false, error: String(e && e.message ? e.message : e) });
  }
}
process.stdout.write(JSON.stringify(out));
"""
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        in_path = td / "in.json"
        script_path = td / "run.js"
        in_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        script_path.write_text(js, encoding="utf-8")
        proc = subprocess.run(
            ["node", str(script_path), str(KATEX_JS), str(in_path)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=str(ROOT),
        )
        if proc.returncode != 0:
            raise RuntimeError(f"node katex failed: {proc.stderr or proc.stdout}")
        results = json.loads(proc.stdout)
    by_id = {r["id"]: r for r in results}
    out = []
    for i, t in formulas:
        r = by_id.get(i)
        if not r:
            out.append((i, None, "missing katex result"))
        elif not r.get("ok"):
            out.append((i, None, r.get("error") or "katex fail"))
        else:
            out.append((i, r.get("html") or "", None))
    return out


def check_output(html: str) -> list[str]:
    errs = []
    for rx, msg in BAD_OUTPUT:
        if rx.search(html):
            errs.append(msg)
    if not html.strip():
        errs.append("empty HTML output")
    return errs


def check_paths() -> list[str]:
    """Fail if formula_html is concatenated into DOM without mathTex."""
    fails = []
    targets = [
        ROOT / "js" / "math_render.js",
        ROOT / "js" / "readings.js",
        ROOT / "js" / "proof_ui.js",
    ]
    bad_rx = re.compile(
        r"""['\"]<div class=\"formula-box\">['\"]\s*\+\s*(?:ch\.|card\.)?formula_html"""
    )
    for path in targets:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        if bad_rx.search(text):
            fails.append(f"{path.name}: raw formula_html injection into formula-box")
        # math_render must call mathTex for cards
        if path.name == "math_render.js":
            if "mathTex.renderFormulaHtml" not in text and "FT.mathTex" not in text:
                fails.append("math_render.js: does not use FT.mathTex for formulas")
    return fails


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict-path", action="store_true")
    ap.add_argument("--json", action="store_true", help="machine-readable summary")
    args = ap.parse_args()

    formulas = collect_formulas()
    print(f"verify_math: {len(formulas)} formulas")

    failures = []
    # source checks
    for fid, tex in formulas:
        for e in check_source(tex):
            failures.append((fid, "source", e, tex[:80]))

    # katex compile
    try:
        rendered = katex_batch(formulas)
    except Exception as ex:
        print(f"[FAIL] katex runner: {ex}")
        return 1

    for fid, html, err in rendered:
        if err:
            tex = next((t for i, t in formulas if i == fid), "")
            failures.append((fid, "katex", err, tex[:80]))
            continue
        for e in check_output(html or ""):
            failures.append((fid, "output", e, (html or "")[:80]))

    path_fails = []
    if args.strict_path:
        path_fails = check_paths()
        for p in path_fails:
            failures.append((p, "path", p, ""))

    if args.json:
        print(json.dumps({"count": len(formulas), "failures": failures}, ensure_ascii=False, indent=2))
    else:
        if not failures:
            print(f"[ok] all {len(formulas)} formulas compile; source clean")
            return 0
        print(f"[FAIL] {len(failures)} issue(s):\n")
        for fid, kind, msg, snip in failures:
            print(f"  - [{kind}] {fid}")
            print(f"      {msg}")
            if snip:
                print(f"      snip: {snip}")
        print(f"\n{len(failures)} failure(s) / {len(formulas)} formulas")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
