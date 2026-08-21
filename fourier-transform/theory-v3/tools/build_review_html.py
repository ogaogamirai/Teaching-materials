# -*- coding: utf-8 -*-
"""Build theory-v2/review/test.html from a manifest of Markdown chapters.

Usage (from theory-v2/):
  python tools/build_review_html.py
  python tools/build_review_html.py --batch Bp
  python tools/verify_review_html.py

Batches follow learning order in review/manifest.json (A1-B3 → Bp → C → D → E).

Contract: docs/MATH_DISPLAY_CONTRACT.md
Know: ../archive/interactive-v1/docs/KNOW_MATH_DISPLAY_ENVIRONMENTS.md

Rules (from past pain):
  - Protect math BEFORE Markdown (SD math_protect)
  - Local KaTeX vendor only (file:// / offline; no CDN)
  - Verify after build (integrity + KaTeX compile)
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

import markdown

TOOLS = Path(__file__).resolve().parent
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

from math_protect import convert_markdown_with_math  # noqa: E402

ROOT = TOOLS.parent
REPO = ROOT.parent
DEFAULT_MANIFEST = ROOT / "review" / "manifest.json"
DEFAULT_OUT = ROOT / "review" / "test.html"
VENDOR_SRC = REPO / "archive" / "interactive-v1" / "vendor" / "katex"
VENDOR_DST = ROOT / "review" / "vendor" / "katex"

MD_EXT = [
    "markdown.extensions.extra",
    "markdown.extensions.sane_lists",
    "markdown.extensions.toc",
    "markdown.extensions.nl2br",
]


def load_manifest(path: Path, batch_id: str | None = None, *, persist_active: bool = False) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if "batches" in data:
        batches = data["batches"]
        by_id = {b["id"]: b for b in batches}
        active = batch_id or data.get("active")
        if not active or active not in by_id:
            known = ", ".join(b["id"] for b in batches)
            raise SystemExit(f"unknown batch {active!r}. known: {known}")
        if persist_active and data.get("active") != active:
            data["active"] = active
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"manifest active -> {active}")
        chosen = by_id[active]
        return {
            "title": chosen.get("title", f"theory-v2 review — {active}"),
            "note": chosen.get("note", data.get("note_global", "")),
            "preface": chosen.get("preface", []),
            "chapters": chosen["chapters"],
            "batch_id": active,
        }
    if "chapters" not in data:
        raise SystemExit(f"manifest missing chapters/batches: {path}")
    return data


def ensure_katex(dest: Path | None = None) -> Path:
    dest = dest or VENDOR_DST
    if not VENDOR_SRC.is_dir():
        raise SystemExit(f"KaTeX vendor not found: {VENDOR_SRC}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(VENDOR_SRC, dest)
    return dest


def rewrite_md_links(text: str, *, in_book_slugs: set[str] | None = None) -> str:
    """Rewrite chapter .md links to in-page anchors.

    Links that are not part of the built HTML (docs/, chapters/README, etc.)
    keep a filesystem-relative href from book/ or review/ so they do not become
    dead ``#slug`` targets.
    """

    def repl(m: re.Match[str]) -> str:
        label, target = m.group(1), m.group(2)
        if target.startswith("http") or target.startswith("#"):
            return m.group(0)
        name = Path(target).stem
        slug = re.sub(r"[^\w\-]+", "-", name).strip("-").lower()
        t = target.replace("\\", "/")
        outside = (
            "/docs/" in f"/{t}"
            or t.startswith("../docs/")
            or name == "README"
            or (in_book_slugs is not None and slug not in in_book_slugs)
        )
        if outside:
            if t.startswith("../"):
                href = t
            elif t.startswith("./"):
                href = "../chapters/" + t[2:]
            else:
                href = "../chapters/" + t
            return f"[{label}]({href})"
        return f"[{label}](#{slug})"

    return re.sub(r"\[([^\]]+)\]\(([^)]+\.md)\)", repl, text)


def chapter_slug(rel: str) -> str:
    stem = Path(rel).stem
    return re.sub(r"[^\w\-]+", "-", stem).strip("-").lower()


def md_to_html(text: str) -> str:
    converter = markdown.Markdown(extensions=MD_EXT)
    html_body = convert_markdown_with_math(
        converter,
        text,
        pre_process=rewrite_md_links,
    )
    return unwrap_display_math(html_body)


def unwrap_display_math(html_body: str) -> str:
    """Keep $$ blocks out of <p> — paragraph line-box + overflow:auto clips tall fractions."""
    return re.sub(
        r"<p>\s*(\$\$[\s\S]*?\$\$)\s*</p>",
        r'<div class="math-block">\1</div>',
        html_body,
    )


def build(manifest: dict, out_path: Path) -> None:
    ensure_katex()

    title = manifest.get("title", "theory-v2 review")
    note = manifest.get("note", "")
    chapters = manifest["chapters"]
    preface_files = manifest.get("preface", [])

    parts: list[str] = []
    nav: list[str] = []

    for pref in preface_files:
        p = ROOT / pref
        if not p.exists():
            raise SystemExit(f"missing preface: {p}")
        body = md_to_html(p.read_text(encoding="utf-8"))
        slug = chapter_slug(pref)
        nav.append(f'<a href="#{slug}">{html.escape(p.stem)}</a>')
        parts.append(
            f'<section class="chapter preface" id="{slug}">\n{body}\n</section>'
        )

    for rel in chapters:
        p = ROOT / rel
        if not p.exists():
            raise SystemExit(f"missing chapter: {p}")
        raw = p.read_text(encoding="utf-8")
        body = md_to_html(raw)
        slug = chapter_slug(rel)
        m = re.search(r"^#\s+(.+)$", raw, re.M)
        label = m.group(1).strip() if m else Path(rel).stem
        label_plain = re.sub(r"\\\(.*?\\\)", "", label)
        label_plain = re.sub(r"\$[^$]+\$", "", label_plain).strip() or Path(rel).stem
        nav.append(f'<a href="#{slug}">{html.escape(label_plain)}</a>')
        parts.append(
            f'<section class="chapter" id="{slug}" data-src="{html.escape(rel)}">\n'
            f'<p class="src">出典: <code>{html.escape(rel)}</code></p>\n'
            f"{body}\n</section>"
        )

    generated = datetime.now().strftime("%Y-%m-%d %H:%M")
    nav_html = " · ".join(nav)
    note_html = f"<p class='note'>{html.escape(note)}</p>" if note else ""
    body_html = "\n".join(parts)

    doc = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>__TITLE__</title>
  <link rel="stylesheet" href="vendor/katex/katex.min.css" />
  <style>
    :root {
      --bg: #f7f5f0;
      --ink: #1c1a16;
      --muted: #5c574e;
      --card: #fffdf8;
      --line: #d9d2c5;
      --accent: #2c5f4a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.75;
    }
    header.top {
      position: sticky; top: 0; z-index: 10;
      background: rgba(247,245,240,0.96);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(6px);
      padding: 0.75rem 1.25rem;
    }
    header.top h1 {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--accent);
    }
    header.top .meta { color: var(--muted); font-size: 0.85rem; }
    nav {
      margin-top: 0.4rem;
      font-size: 0.82rem;
      line-height: 1.5;
    }
    nav a { color: var(--accent); text-decoration: none; }
    nav a:hover { text-decoration: underline; }
    main {
      max-width: 52rem;
      margin: 0 auto;
      padding: 1.25rem;
    }
    .chapter {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1.25rem 1.4rem 1.5rem;
      margin-bottom: 1.25rem;
    }
    .chapter.preface { border-color: var(--accent); }
    .src { color: var(--muted); font-size: 0.8rem; margin-top: 0; }
    .note { color: var(--muted); font-size: 0.9rem; }
    h1,h2,h3,h4 { line-height: 1.35; }
    h1 { font-size: 1.55rem; }
    h2 { font-size: 1.25rem; margin-top: 1.6rem; border-bottom: 1px solid var(--line); padding-bottom: 0.2rem; }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 0.92rem;
      margin: 0.8rem 0;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 0.4rem 0.55rem;
      vertical-align: top;
    }
    th { background: #efeae0; }
    blockquote {
      margin: 0.8rem 0;
      padding: 0.2rem 0.9rem;
      border-left: 4px solid var(--accent);
      background: #f0f7f3;
    }
    code {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 0.9em;
      background: #efeae0;
      padding: 0.05em 0.3em;
      border-radius: 4px;
    }
    pre {
      overflow: auto;
      background: #1c1a16;
      color: #f7f5f0;
      padding: 0.9rem 1rem;
      border-radius: 8px;
    }
    pre code { background: transparent; color: inherit; padding: 0; }
    .figure, figure.review-fig {
      margin: 1rem 0;
      padding: 0.75rem;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 8px;
      text-align: center;
    }
    .figure svg, figure.review-fig svg { max-width: 100%; height: auto; }
    figcaption {
      margin-top: 0.45rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    hr { border: 0; border-top: 1px solid var(--line); margin: 1.4rem 0; }
    .katex-display {
      margin: 0.9rem 0;
      /* overflow-x:auto + overflow-y:visible は仕様上どちらも auto になり、
         分数などが縦スクロール枠に閉じ込められる。横長だけ後で .math-block で扱う。 */
      overflow: visible;
    }
    .math-block {
      display: block;
      margin: 1rem 0;
      padding: 0.15rem 0;
      overflow: visible;
      line-height: normal;
      text-align: center;
    }
    /* 万一 <p> 内に残った display 数式の保険 */
    p:has(> .katex-display) {
      overflow: visible;
      line-height: normal;
      max-height: none;
    }
    /* KaTeX 本体フォントに無い日本語は本文と同じゴシックへ */
    .katex .text,
    .katex .mord.text,
    .katex .mathrm {
      font-family: "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", sans-serif !important;
    }
    .katex-error {
      color: #b00020;
      background: #fde8ec;
      border: 1px solid #e8a0ab;
      padding: 0.15em 0.35em;
      border-radius: 4px;
    }
    #math-status {
      display: none;
      margin: 0.5rem 1.25rem 0;
      padding: 0.5rem 0.75rem;
      background: #fff3cd;
      border: 1px solid #e0c36a;
      border-radius: 8px;
      color: #5c4b00;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <header class="top">
    <h1>__TITLE__</h1>
    <div class="meta">生成: __GENERATED__ · 正本 chapters/*.md · 数式契約 docs/MATH_DISPLAY_CONTRACT.md · ローカル KaTeX</div>
    __NOTE__
    <nav>__NAV__</nav>
  </header>
  <div id="math-status">数式エンジンの読み込みに失敗しました。review/vendor/katex（fonts 同梱）を確認し、Ctrl+F5 してください。CDN は使いません。</div>
  <main>
    __BODY__
  </main>
  <script src="vendor/katex/katex.min.js"></script>
  <script src="vendor/katex/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      if (typeof renderMathInElement !== "function" || typeof katex === "undefined") {
        var el = document.getElementById("math-status");
        if (el) el.style.display = "block";
        return;
      }
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\\\[", right: "\\\\]", display: true },
          { left: "\\\\(", right: "\\\\)", display: false }
        ],
        throwOnError: false,
        errorColor: "#b00020",
        strict: "ignore"
      });
    });
  </script>
</body>
</html>
"""
    # In a plain Python string, \\\\( becomes \\( in the HTML file (JS string for \\().
    doc = (
        doc.replace("__TITLE__", html.escape(title))
        .replace("__GENERATED__", generated)
        .replace("__NOTE__", note_html)
        .replace("__NAV__", nav_html)
        .replace("__BODY__", body_html)
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(doc, encoding="utf-8")
    print(f"wrote {out_path} ({len(chapters)} chapters)")
    print(f"katex -> {VENDOR_DST}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument(
        "--batch",
        help="learning-order batch id (A1-B3, Bp, C, D, E). writes manifest.active",
    )
    args = ap.parse_args()
    manifest = load_manifest(args.manifest, args.batch, persist_active=bool(args.batch))
    build(manifest, args.out)


if __name__ == "__main__":
    main()
