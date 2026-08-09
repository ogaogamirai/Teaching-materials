#!/usr/bin/env python3
"""Combine system-dynamics Markdown chapters into a single self-contained HTML file.

Chapter order:
  1. Main units (units/unit01..unit12)
  2. Math bridge (math-bridge/B1..B6)
  3. Exercise cards (units/exercises/ex1..ex10)

KaTeX is vendored (vendor/katex) for offline / file:// use.
Math is protected from Markdown transforms (tools/math_protect.py).
Figures are inline SVG placed under figures/.

Usage:
    python tools/build_sd_html.py
"""
from __future__ import annotations

import argparse
import base64
import html
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import markdown
from markdown.extensions import fenced_code, tables

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tools.math_protect import convert_markdown_with_math

UNITS_DIR = PROJECT_ROOT / "units"
BRIDGE_DIR = PROJECT_ROOT / "math-bridge"
EXERCISES_DIR = UNITS_DIR / "exercises"
FIGURES_DIR = PROJECT_ROOT / "figures"
DEFAULT_OUTPUT = PROJECT_ROOT / "index.html"
EXCLUDED_NAMES = {"readme.md", "exercise_cards.md"}

MARKDOWN_HTML_TAGS = ("details", "summary")
HTML_TAG_OPEN_RE = re.compile(r"<(details|summary)(\s[^>]*)?>", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Chapter discovery & ordering
# ---------------------------------------------------------------------------

def unit_sort_key(path: Path) -> tuple[int, int]:
    m = re.match(r"^unit(\d+)", path.stem, re.IGNORECASE)
    if m:
        return (0, int(m.group(1)))
    return (1, 0)


def bridge_sort_key(path: Path) -> tuple[int, int]:
    m = re.match(r"^B(\d+)", path.stem, re.IGNORECASE)
    if m:
        return (0, int(m.group(1)))
    return (1, 0)


def exercise_sort_key(path: Path) -> tuple[int, int]:
    m = re.match(r"^ex(\d+)", path.stem, re.IGNORECASE)
    if m:
        return (0, int(m.group(1)))
    return (1, 0)


def discover_units() -> list[Path]:
    files = [p for p in UNITS_DIR.glob("*.md") if p.name.lower() not in EXCLUDED_NAMES]
    return sorted(files, key=unit_sort_key)


def discover_bridge() -> list[Path]:
    files = [p for p in BRIDGE_DIR.glob("*.md") if p.name.lower() not in EXCLUDED_NAMES]
    return sorted(files, key=bridge_sort_key)


def discover_exercises() -> list[Path]:
    files = [p for p in EXERCISES_DIR.glob("*.md") if p.name.lower() not in EXCLUDED_NAMES]
    return sorted(files, key=exercise_sort_key)


def discover_all() -> list[tuple[str, Path]]:
    """Return ordered (group, path) chapters."""
    items: list[tuple[str, Path]] = []
    for p in discover_units():
        items.append(("main", p))
    for p in discover_bridge():
        items.append(("bridge", p))
    for p in discover_exercises():
        items.append(("exercise", p))
    return items


def chapter_id(group: str, path: Path) -> str:
    m = re.match(r"^unit(\d+)", path.stem, re.IGNORECASE)
    if m:
        return f"unit-{int(m.group(1)):02d}"
    m = re.match(r"^B(\d+)", path.stem, re.IGNORECASE)
    if m:
        return f"bridge-b{m.group(1)}"
    m = re.match(r"^ex(\d+)", path.stem, re.IGNORECASE)
    if m:
        return f"exercise-ex{m.group(1)}"
    slug = re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")
    return f"{group}-{slug or 'misc'}"


def chapter_label(group: str, path: Path) -> str:
    m = re.match(r"^unit(\d+)", path.stem, re.IGNORECASE)
    if m:
        return f"Unit {int(m.group(1))}"
    m = re.match(r"^B(\d+)", path.stem, re.IGNORECASE)
    if m:
        return f"math-bridge B{m.group(1)}"
    m = re.match(r"^ex(\d+)", path.stem, re.IGNORECASE)
    if m:
        return f"演習 EX{m.group(1)}"
    return path.stem.replace("_", " ")


# ---------------------------------------------------------------------------
# Inline SVG figures
# ---------------------------------------------------------------------------

def inline_figure(path: Path, caption: str = "") -> str:
    """Return an <figure> with the SVG inlined (self-contained).

    Handles D2-rendered SVGs: strips the XML declaration and any
    leading <?xml?>, and removes the outer wrapper only if there is a
    single nested <svg> with its own viewBox (to avoid huge blank padding).
    """
    try:
        svg_text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return f'<!-- figure missing: {path.name} -->'
    # Drop XML declaration.
    svg_text = re.sub(r'^\s*<\?xml[^?]*\?>\s*', '', svg_text, flags=re.DOTALL)
    # Drop data-d2-version attribute on outer svg (cosmetic).
    svg_text = re.sub(r'\s+data-d2-version="[^"]*"', '', svg_text)
    # If outer <svg> has a single child <svg>, unwrap to keep the inner one.
    m = re.match(r'\s*<svg\b[^>]*>\s*(<svg\b.*</svg>)\s*</svg>\s*$', svg_text, re.DOTALL)
    if m:
        svg_text = m.group(1)
    fig = f'<figure class="figure"><div class="figure-svg">{svg_text}</div>'
    if caption:
        fig += f'<figcaption class="figure-caption">{html.escape(caption)}</figcaption>'
    fig += '</figure>'
    return fig


def replace_figure_refs(md_text: str) -> str:
    """Replace `![fig](figures/foo.svg)` (with optional `![fig:caption](...)`)
    with inline SVG figures."""
    pattern = re.compile(r"!\[fig(?::([^\]]*))?\]\(figures/([^)]+\.svg)\)")
    def repl(match: re.Match[str]) -> str:
        caption = (match.group(1) or "").strip()
        name = match.group(2)
        f = FIGURES_DIR / name
        return inline_figure(f, caption)
    return pattern.sub(repl, md_text)


# ---------------------------------------------------------------------------
# Markdown pipeline
# ---------------------------------------------------------------------------

def prepare_markdown(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        tag = match.group(1).lower()
        attrs = match.group(2) or ""
        if re.search(r"markdown\s*=", attrs, re.IGNORECASE):
            return match.group(0)
        if attrs:
            return f'<{tag}{attrs} markdown="1">'
        return f'<{tag} markdown="1">'
    return HTML_TAG_OPEN_RE.sub(repl, text)


def cleanup_rendered_html(text: str) -> str:
    def fix_summary(match: re.Match[str]) -> str:
        inner = match.group(1)
        inner = inner.replace("\\*", "*").replace("\\_", "_").replace("\\`", "`")
        return f"<summary>{inner}</summary>"
    return re.sub(r"<summary>(.*?)</summary>", fix_summary, text, flags=re.DOTALL)


def convert_markdown(text: str) -> str:
    md = markdown.Markdown(
        extensions=[
            "extra",
            "md_in_html",
            "sane_lists",
            "smarty",
            tables.TableExtension(),
            fenced_code.FencedCodeExtension(),
        ],
        output_format="html5",
    )
    return convert_markdown_with_math(
        md,
        text,
        pre_process=lambda t: prepare_markdown(replace_figure_refs(t)),
        post_process=cleanup_rendered_html,
    )


# ---------------------------------------------------------------------------
# KaTeX auto-render
# ---------------------------------------------------------------------------

def katex_auto_render_js() -> str:
    return r"""
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      var blocks = document.querySelectorAll('.chapter-body');
      blocks.forEach(function (block) {
        renderMathInElement(block, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '\\[', right: '\\]', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false}
          ],
          throwOnError: false
        });
      });
    });
  </script>
"""


# ---------------------------------------------------------------------------
# Document assembly
# ---------------------------------------------------------------------------

def build_document(chapters: list[tuple[str, Path]]) -> str:
    generated_at = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M %z")
    toc_items: list[str] = []
    sections: list[str] = []
    section_count = 0

    group_headers = {
        "main": "本編（Unit 1〜12）",
        "bridge": "理論ルート math-bridge（数理前提）",
        "exercise": "演習カード（EX1〜EX10）",
    }

    current_group = None
    for group, path in chapters:
        if group != current_group:
            current_group = group
            toc_items.append(
                f'<li class="toc-group">{html.escape(group_headers.get(group, group))}</li>'
            )

        section_count += 1
        cid = chapter_id(group, path)
        label = chapter_label(group, path)
        source = html.escape(path.name)
        body = convert_markdown(path.read_text(encoding="utf-8"))

        toc_items.append(
            f'<li><a href="#{cid}">{html.escape(label)}</a>'
            f'<span class="toc-source">{source}</span></li>'
        )
        sections.append(
            f'<section class="chapter" id="{cid}" data-source="{source}" data-group="{group}">'
            f'<div class="chapter-meta">'
            f'<span class="chapter-index">{section_count:02d}</span>'
            f'<span class="chapter-label">{html.escape(label)}</span>'
            f'<span class="chapter-source">{source}</span>'
            f"</div>"
            f'<div class="chapter-body">{body}</div>'
            f"</section>"
        )

    toc_html = "\n".join(toc_items)
    sections_html = "\n".join(sections)
    katex_js = katex_auto_render_js()

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>システムダイナミクス×TOC 学習教材 | system-dynamics</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f8f7f4;
      --paper: #ffffff;
      --text: #1f2933;
      --muted: #52606d;
      --line: #d9e2ec;
      --accent: #243b53;
      --accent-soft: #627d98;
      --code-bg: #f0f4f8;
      --details-bg: #f7fafc;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", sans-serif;
      line-height: 1.75;
    }}
    a {{ color: var(--accent-soft); }}
    .page {{ max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }}
    .hero, .toc, .chapter {{
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1.5rem 1.75rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 24px rgba(36, 59, 83, 0.05);
    }}
    .hero h1 {{ margin: 0 0 0.5rem; font-size: 1.8rem; line-height: 1.35; }}
    .hero .tagline {{ font-size: 1.05rem; color: var(--text); margin: 0.35rem 0 0.75rem; }}
    .hero p {{ margin: 0.35rem 0; color: var(--muted); }}
    .toc h2, .chapter-body > h1:first-child {{ margin-top: 0; }}
    .toc ol {{ margin: 0; padding-left: 1.25rem; }}
    .toc li {{ margin: 0.35rem 0; }}
    .toc .toc-group {{ margin-top: 0.9rem; font-weight: 700; color: var(--accent); list-style: none; margin-left: -1.25rem; }}
    .toc-source {{ display: block; font-size: 0.85rem; color: var(--muted); }}
    .chapter-meta {{
      display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem;
      color: var(--muted); font-size: 0.9rem;
    }}
    .chapter-index {{
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 2rem; height: 2rem; border-radius: 999px;
      background: var(--code-bg); color: var(--accent); font-weight: 700;
    }}
    .chapter-label {{ font-weight: 700; color: var(--text); }}
    .chapter-body h1, .chapter-body h2, .chapter-body h3, .chapter-body h4 {{ line-height: 1.35; scroll-margin-top: 1rem; }}
    .chapter-body h2 {{ margin-top: 2rem; padding-bottom: 0.25rem; border-bottom: 1px solid var(--line); }}
    .chapter-body p, .chapter-body li, .chapter-body blockquote {{ max-width: 72ch; }}
    .chapter-body blockquote {{
      margin: 1rem 0; padding: 0.75rem 1rem;
      border-left: 4px solid var(--accent-soft); background: var(--details-bg); color: var(--muted);
    }}
    .chapter-body table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.95rem; }}
    .chapter-body th, .chapter-body td {{ border: 1px solid var(--line); padding: 0.55rem 0.7rem; vertical-align: top; }}
    .chapter-body th {{ background: var(--code-bg); text-align: left; }}
    .chapter-body pre {{ overflow-x: auto; background: #102a43; color: #f0f4f8; padding: 1rem; border-radius: 8px; line-height: 1.5; }}
    .chapter-body code {{ font-family: Consolas, "Courier New", monospace; font-size: 0.92em; }}
    .chapter-body :not(pre) > code {{ background: var(--code-bg); padding: 0.1rem 0.35rem; border-radius: 4px; }}
    .chapter-body img {{ display: block; max-width: 100%; height: auto; margin: 1rem auto; }}
    .chapter-body details {{
      margin: 1rem 0; padding: 0.75rem 1rem;
      border: 1px solid var(--line); border-radius: 8px; background: var(--details-bg);
    }}
    .chapter-body summary {{ cursor: pointer; font-weight: 700; }}
    .chapter-body hr {{ border: 0; border-top: 1px solid var(--line); margin: 2rem 0; }}
    .figure {{ margin: 1.25rem 0; text-align: center; }}
    .figure-svg svg {{ max-width: 100%; height: auto; }}
    .figure-svg {{ overflow-x: auto; }}
    .figure-caption {{ font-size: 0.85rem; color: var(--muted); margin-top: 0.4rem; }}
    .sources {{ font-size: 0.9rem; color: var(--muted); }}
    @media print {{
      body {{ background: #fff; }}
      .page {{ max-width: none; padding: 0; }}
      .hero, .toc, .chapter {{ box-shadow: none; break-inside: avoid-page; }}
    }}
  </style>
  <link rel="stylesheet" href="vendor/katex/katex.min.css">
  <script defer src="vendor/katex/katex.min.js"></script>
  <script defer src="vendor/katex/auto-render.min.js"></script>
  {katex_js}
</head>
<body>
  <div class="page">
    <header class="hero">
      <h1>システムダイナミクス×TOC 学習教材</h1>
      <p class="tagline">見る（SD: 構造の全体像）→ 直す（TOC: 制約への集中）→ 抽象化（自分たちの言葉で）</p>
      <p>中学2年生〜一般社会人。Markdown 正本から自動生成した統合版です。</p>
      <p>生成日時: {html.escape(generated_at)}</p>
    </header>

    <nav class="toc" aria-label="章一覧">
      <h2>目次</h2>
      <ol>
        {toc_html}
      </ol>
    </nav>

    {sections_html}

    <footer class="hero sources">
      <h2>再生成方法</h2>
      <p>Markdown を更新したら、次のコマンドで HTML を上書き生成できます。</p>
      <pre><code>python tools/build_sd_html.py</code></pre>
    </footer>
  </div>
</body>
</html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Combine system-dynamics markdown chapters into one HTML file."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output HTML path (default: {DEFAULT_OUTPUT})",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    chapters = discover_all()
    if not chapters:
        raise SystemExit("No markdown chapters found")
    document = build_document(chapters)
    args.output.write_text(document, encoding="utf-8", newline="\n")
    print(f"Wrote {args.output}")
    print(f"Chapters: {len(chapters)}")
    for group, path in chapters:
        print(f"  [{group}] {path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
