#!/usr/bin/env python3
"""Build one distributable HTML file from the cryptography Markdown chapters."""

from __future__ import annotations

import argparse
import html
import re
from datetime import datetime, timezone
from pathlib import Path

import markdown
from markdown.extensions import fenced_code, tables

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CHAPTERS_DIR = PROJECT_ROOT / "chapters"
DEFAULT_OUTPUT = PROJECT_ROOT / "index.html"
KATEX_VERSION = "0.16.22"


def protect_math(text: str) -> tuple[str, dict[str, str]]:
    """Protect LaTeX blocks while Python-Markdown processes the document."""
    placeholders: dict[str, str] = {}
    pattern = re.compile(
        r"\$\$.*?\$\$|\\\[.*?\\\]|\\\(.*?\\\)|(?<!\$)\$(?!\$).*?(?<!\$)\$(?!\$)",
        re.DOTALL,
    )

    def replace(match: re.Match[str]) -> str:
        key = f"CRYPTOMATHPLACEHOLDER{len(placeholders)}"
        placeholders[key] = match.group(0)
        return key

    return pattern.sub(replace, text), placeholders


def restore_math(text: str, placeholders: dict[str, str]) -> str:
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text


def render_markdown(source: str) -> str:
    # Chapter Markdown is authored relative to chapters/, while the unified
    # HTML is rooted at the project directory.
    source = source.replace("](../assets/", "](assets/")
    source = source.replace("](../models/", "](models/")
    protected, placeholders = protect_math(source)
    parser = markdown.Markdown(
        extensions=["extra", "sane_lists", tables.TableExtension(), fenced_code.FencedCodeExtension()],
        output_format="html5",
    )
    return restore_math(parser.convert(protected), placeholders)


def discover_chapters() -> list[Path]:
    preferred_order = [
        "00_math_toolbox.md",
        "01_problem.md",
        "0_finite_field.md",
        "03_rsa.md",
        "04_elliptic_curve.md",
        "05_ecdlp.md",
        "06_communication.md",
        "07_quantum_computers.md",
        "07_pqc.md",
        "08_compact_glossary.md",
        "09_crypto_forms_and_lab.md",
    ]
    chapters = {
        path.name: path
        for path in CHAPTERS_DIR.glob("*.md")
        if path.name.lower() != "readme.md"
    }
    ordered = [chapters[name] for name in preferred_order if name in chapters]
    remaining = sorted(path for name, path in chapters.items() if name not in preferred_order)
    return ordered + remaining


def katex_tags(mode: str) -> str:
    if mode == "cdn":
        base = f"https://cdn.jsdelivr.net/npm/katex@{KATEX_VERSION}/dist"
        return (
            f'<link rel="stylesheet" href="{base}/katex.min.css">'
            f'<script defer src="{base}/katex.min.js"></script>'
            f'<script defer src="{base}/contrib/auto-render.min.js"></script>'
        )
    return (
        "<!-- For offline distribution, vendor KaTeX under vendor/katex "
        "and replace these tags with local paths. -->"
    )


def math_script() -> str:
    return r"""
<script>
document.addEventListener("DOMContentLoaded", function () {
  if (typeof renderMathInElement !== "function") return;
  renderMathInElement(document.body, {
    delimiters: [
      {left: "$$", right: "$$", display: true},
      {left: "\\[", right: "\\]", display: true},
      {left: "$", right: "$", display: false},
      {left: "\\(", right: "\\)", display: false}
    ],
    throwOnError: false
  });
});
</script>
"""


def build_document(chapters: list[Path], katex_mode: str) -> str:
    generated = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M %z")
    toc: list[str] = []
    sections: list[str] = []

    for index, chapter in enumerate(chapters, start=1):
        chapter_id = f"chapter-{index:02d}"
        title = chapter.stem.split("_", 1)[-1].replace("_", " ")
        body = render_markdown(chapter.read_text(encoding="utf-8"))
        toc.append(f'<li><a href="#{chapter_id}">{html.escape(title)}</a></li>')
        sections.append(
            f'<section class="chapter" id="{chapter_id}">'
            f'<div class="chapter-meta">Chapter {index:02d} · {html.escape(chapter.name)}</div>'
            f'<div class="chapter-body">{body}</div>'
            "</section>"
        )

    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>現代暗号の基礎</title>
  {katex_tags(katex_mode)}
  <style>
    :root {{ --ink:#1f2933; --muted:#52606d; --line:#d9e2ec; --paper:#fff;
      --bg:#f5f7fa; --accent:#243b53; --soft:#eaf2f8; }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; background:var(--bg); color:var(--ink);
      font-family:"Yu Gothic UI","Noto Sans JP",sans-serif; line-height:1.8; }}
    .page {{ max-width:960px; margin:auto; padding:2rem 1rem 4rem; }}
    .hero,.toc,.chapter {{ background:var(--paper); border:1px solid var(--line);
      border-radius:12px; padding:1.4rem 1.6rem; margin-bottom:1.25rem;
      box-shadow:0 6px 20px rgba(36,59,83,.05); }}
    h1 {{ line-height:1.35; }}
    h2,h3 {{ line-height:1.4; margin-top:2rem; }}
    .tagline {{ color:var(--muted); }}
    .toc ol {{ margin:0; }}
    .toc a {{ color:var(--accent); }}
    .chapter-meta {{ color:var(--muted); font-size:.9rem; border-bottom:1px solid var(--line);
      padding-bottom:.5rem; margin-bottom:1rem; }}
    .chapter-body {{ max-width:74ch; }}
    blockquote {{ margin:1rem 0; padding:.7rem 1rem; background:var(--soft);
      border-left:4px solid var(--accent); }}
    pre {{ overflow-x:auto; background:#102a43; color:#f0f4f8; padding:1rem;
      border-radius:8px; }}
    code {{ font-family:Consolas,"Courier New",monospace; }}
    table {{ border-collapse:collapse; width:100%; }}
    th,td {{ border:1px solid var(--line); padding:.45rem .6rem; vertical-align:top; }}
    th {{ background:var(--soft); text-align:left; }}
    a {{ color:#486581; }}
    @media print {{ body {{ background:#fff; }} .hero,.toc,.chapter {{ box-shadow:none; }} }}
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <h1>現代暗号の基礎</h1>
      <p class="tagline">秘密の通信 → 有限体 → RSA → 楕円曲線 → ECDLP → 通信 → PQC</p>
      <p>中学2年生が、問いと操作を通して現代暗号の理論へ進むMarkdown正本からの統合版。</p>
      <p>生成日時: {html.escape(generated)}</p>
    </header>
    <nav class="toc" id="toc" aria-label="章一覧">
      <h2>目次</h2>
      <ol>{"".join(toc)}</ol>
    </nav>
    {"".join(sections)}
    <footer class="hero">
      <h2>再生成</h2>
      <pre><code>python tools/build_html.py --katex cdn</code></pre>
    </footer>
  </main>
  {math_script()}
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--katex", choices=("placeholder", "cdn"), default="cdn")
    args = parser.parse_args()

    chapters = discover_chapters()
    if not chapters:
        raise SystemExit("No chapters found")
    args.output.write_text(build_document(chapters, args.katex), encoding="utf-8", newline="\n")
    print(f"Wrote {args.output}")
    print(f"Chapters: {len(chapters)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
