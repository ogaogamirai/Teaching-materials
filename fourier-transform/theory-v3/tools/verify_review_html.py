# -*- coding: utf-8 -*-
"""Verify theory-v2 review HTML math (L1 integrity + KaTeX compile).

Usage (from theory-v2/):
  python tools/build_review_html.py
  python tools/verify_review_html.py

Exit 0 = green. Exit 1 = failures.
Contract: docs/MATH_DISPLAY_CONTRACT.md
"""
from __future__ import annotations

import argparse
import json
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
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

from math_protect import find_latex_integrity_issues  # noqa: E402

DEFAULT_HTML = ROOT / "review" / "test.html"
KATEX_JS = ROOT / "review" / "vendor" / "katex" / "katex.min.js"
FALLBACK_KATEX = ROOT.parent / "archive" / "interactive-v1" / "vendor" / "katex" / "katex.min.js"

DISPLAY_RE = re.compile(r"\$\$(.+?)\$\$", re.DOTALL)
PAREN_RE = re.compile(r"\\\((.+?)\\\)", re.DOTALL)
BRACKET_RE = re.compile(r"\\\[(.+?)\\\]", re.DOTALL)

BAD_SOURCE = [
    # require a plausible tag, not inequalities like 0<h<\pi
    (re.compile(r"</?[a-zA-Z][a-zA-Z0-9:-]*(?:\s|/?>)"), "HTML tag in math (use pure LaTeX)"),
    (re.compile(r"[ωφθπαβΣ∫∞√·／　]"), "Unicode math char (use LaTeX command)"),
]

BAD_OUTPUT = [
    (re.compile(r"katex-error"), "KaTeX error class in output"),
    (re.compile(r"\\omegat|\\phit|\\thetat|\\pit\b"), "greek glued to letter"),
]

# display that is still one KaTeX line and too long will overflow the review column
WRAP_ENV_RE = re.compile(
    r"\\begin\{(?:align\*?|aligned|gather\*?|gathered|multline\*?|split|"
    r"cases|array|matrix|pmatrix|bmatrix)\}"
)
LONG_DISPLAY_CHARS = 110

VENDOR_CHECKS = (
    "vendor/katex/katex.min.js",
    "vendor/katex/katex.min.css",
    "vendor/katex/auto-render.min.js",
)


def body_for_math(html: str) -> str:
    """Scan chapter body only — skip <script> delimiter config (\\( \\) false positives)."""
    m = re.search(r"<main\b[^>]*>(.*)</main>", html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else html


def collect_tex(html: str) -> list[tuple[str, str]]:
    body = body_for_math(html)
    items: list[tuple[str, str]] = []
    for i, m in enumerate(DISPLAY_RE.finditer(body)):
        items.append((f"display#{i}", m.group(1).strip()))
    for i, m in enumerate(BRACKET_RE.finditer(body)):
        items.append((f"bracket#{i}", m.group(1).strip()))
    for i, m in enumerate(PAREN_RE.finditer(body)):
        items.append((f"inline#{i}", m.group(1).strip()))
    return items


def katex_batch(formulas: list[tuple[str, str]], katex_js: Path) -> list[tuple[str, str | None, str | None]]:
    if not katex_js.is_file():
        raise FileNotFoundError(f"missing {katex_js}")

    payload = [{"id": fid, "tex": tex} for fid, tex in formulas]
    with tempfile.TemporaryDirectory() as tmp:
        in_path = Path(tmp) / "in.json"
        script_path = Path(tmp) / "run.js"
        in_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        script_path.write_text(
            r"""
const fs = require('fs');
const vm = require('vm');
const katexPath = process.argv[2];
const inPath = process.argv[3];
const code = fs.readFileSync(katexPath, 'utf8');
const sandbox = { module: { exports: {} }, exports: {}, console, process };
vm.createContext(sandbox);
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
      displayMode: String(it.id).startsWith('display') || String(it.id).startsWith('bracket'),
      strict: 'ignore'
    });
    out.push({ id: it.id, html, error: null });
  } catch (e) {
    out.push({ id: it.id, html: null, error: String(e && e.message ? e.message : e) });
  }
}
process.stdout.write(JSON.stringify(out));
""",
            encoding="utf-8",
        )
        proc = subprocess.run(
            ["node", str(script_path), str(katex_js), str(in_path)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if proc.returncode != 0:
            raise RuntimeError(f"node katex failed: {proc.stderr or proc.stdout}")
        results = json.loads(proc.stdout)
        by_id = {r["id"]: r for r in results}
        out: list[tuple[str, str | None, str | None]] = []
        for fid, _tex in formulas:
            r = by_id.get(fid)
            if not r:
                out.append((fid, None, "missing katex result"))
            elif r.get("error"):
                out.append((fid, None, r["error"]))
            else:
                out.append((fid, r.get("html"), None))
        return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", type=Path, default=DEFAULT_HTML)
    ap.add_argument("--skip-katex", action="store_true", help="integrity checks only")
    args = ap.parse_args()

    html_path = args.html
    if not html_path.is_file():
        print(f"[FAIL] missing HTML: {html_path}")
        print("  run: python tools/build_review_html.py")
        print("   or: python tools/build_book_html.py")
        return 1

    html = html_path.read_text(encoding="utf-8")
    failures: list[str] = []

    # --- environment contract (KNOW §3.1) ---
    if "cdn.jsdelivr" in html or "cdnjs.cloudflare" in html:
        failures.append("CDN reference found (file:// contract: local vendor only)")
    for rel in VENDOR_CHECKS:
        if rel not in html:
            failures.append(f"HTML missing script/link path: {rel}")
        p = html_path.parent.joinpath(*rel.split("/"))
        if not p.is_file():
            failures.append(f"missing vendor file: {p}")
    fonts = html_path.parent / "vendor" / "katex" / "fonts"
    if not fonts.is_dir():
        failures.append(f"missing KaTeX fonts dir: {fonts}")

    # display math should not remain trapped in <p> (scroll-clip regression)
    if re.search(r"<p>\s*\$\$", html):
        failures.append("display $$ still inside <p> (expect <div class=\"math-block\">)")
    if 'class="math-block"' not in html and "$$" in html:
        failures.append("no math-block wrappers but $$ present")

    # auto-render: file must contain JS "\\(" (two backslashes). Four = raw-string over-escape.
    if "renderMathInElement" in html:
        if '{ left: "\\\\\\\\("' in html or '{ left: "\\\\\\\\["' in html:
            failures.append(
                "KaTeX delimiters over-escaped (\\\\( in HTML); inline math stays raw"
            )
        elif '{ left: "\\\\("' not in html:
            failures.append("KaTeX inline delimiter \\( missing from auto-render config")

    # --- L1 integrity (SD math_protect) ---
    for issue in find_latex_integrity_issues(html):
        failures.append(f"integrity: {issue}")

    formulas = collect_tex(html)
    print(f"[info] formulas found: {len(formulas)} in {html_path.name}")

    for fid, tex in formulas:
        for pat, msg in BAD_SOURCE:
            if pat.search(tex):
                failures.append(f"{fid}: source: {msg}: {tex[:60]!r}")
        if fid.startswith("display") or fid.startswith("bracket"):
            compact = re.sub(r"\s+", "", tex)
            wrapped = bool(WRAP_ENV_RE.search(tex))
            if wrapped and r"\\" not in tex and len(compact) > LONG_DISPLAY_CHARS:
                failures.append(
                    f"{fid}: long align without \\\\ is still one line ({len(compact)} chars)"
                )
            elif (not wrapped) and len(compact) > LONG_DISPLAY_CHARS:
                failures.append(
                    f"{fid}: display too long ({len(compact)} chars); wrap with align*"
                    f" :: {compact[:70]}"
                )

    if not args.skip_katex:
        local_katex = html_path.parent / "vendor" / "katex" / "katex.min.js"
        if local_katex.is_file():
            katex_js = local_katex
        elif KATEX_JS.is_file():
            katex_js = KATEX_JS
        else:
            katex_js = FALLBACK_KATEX
        try:
            rendered = katex_batch(formulas, katex_js)
        except FileNotFoundError as ex:
            print(f"[FAIL] {ex}")
            return 1
        except RuntimeError as ex:
            print(f"[FAIL] katex runner: {ex}")
            return 1

        for fid, out_html, err in rendered:
            if err:
                failures.append(f"{fid}: katex: {err}")
                continue
            assert out_html is not None
            for pat, msg in BAD_OUTPUT:
                if pat.search(out_html):
                    failures.append(f"{fid}: output: {msg}")

    if failures:
        print(f"[FAIL] {len(failures)} issue(s)")
        for f in failures[:40]:
            print(f"  - {f}")
        if len(failures) > 40:
            print(f"  ... and {len(failures) - 40} more")
        return 1

    print("[OK] math gate green")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
