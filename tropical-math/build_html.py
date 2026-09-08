#!/usr/bin/env python3
"""Build index.html (Textbook) with Sticky Chapter Nav and Mobile/PC Responsive Layout."""
from __future__ import annotations

import html
import re
import sys
from datetime import datetime
from pathlib import Path

import markdown

ROOT_DIR = Path(__file__).resolve().parent
TEXTBOOK_MD = ROOT_DIR / "textbook.md"
OUTPUT_HTML = ROOT_DIR / "index.html"

MATH_DISPLAY_RE = re.compile(r"\$\$(.*?)\$\$", re.DOTALL)
MATH_INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)((?:\\.|[^$\\])+?)(?<!\$)\$(?!\$)", re.DOTALL)
MATH_PAREN_RE = re.compile(r"\\\((.*?)\\\)", re.DOTALL)
MATH_BRACKET_RE = re.compile(r"\\\[(.*?)\\\]", re.DOTALL)

JP_CHARS = "\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\u3005\u3006\u30fb\u2010\u30fc"
JP_RUN_RE = re.compile(f"([{JP_CHARS}]+)")
TEXT_BLOCK_RE = re.compile(r"\\text\{[^{}]*\}")


def _wrap_japanese(text: str) -> str:
    stash: list[str] = []

    def stash_block(m: re.Match[str]) -> str:
        stash.append(m.group(0))
        return f"\x00TEXT{len(stash) - 1}\x00"

    tmp = TEXT_BLOCK_RE.sub(stash_block, text)
    out: list[str] = []
    pos = 0
    for m in JP_RUN_RE.finditer(tmp):
        out.append(tmp[pos : m.start()])
        prefix = tmp[max(0, m.start() - 1) : m.start()]
        if prefix == "\\":
            out.append(m.group(0))
        else:
            out.append(f"\\text{{{m.group(0)}}}")
        pos = m.end()
    out.append(tmp[pos:])
    result = "".join(out)

    for i, block in enumerate(stash):
        result = result.replace(f"\x00TEXT{i}\x00", block)
    return result


def protect_math(text: str) -> tuple[str, list[str]]:
    tokens: list[str] = []

    def store(match: re.Match[str]) -> str:
        raw = match.group(0)
        content = _wrap_japanese(raw)
        tokens.append(content)
        return f"<!--MATHPROTECT{len(tokens) - 1}-->"

    for pattern in (MATH_DISPLAY_RE, MATH_BRACKET_RE, MATH_PAREN_RE, MATH_INLINE_RE):
        text = pattern.sub(store, text)
    return text, tokens


def restore_math(text: str, tokens: list[str]) -> str:
    for index, token in enumerate(tokens):
        text = text.replace(f"<!--MATHPROTECT{index}-->", token)
    return text


def wrap_tables(html_str: str) -> str:
    """Wrap <table> elements with <div class='table-wrapper'> for responsive horizontal scroll."""
    return re.sub(r"(<table>.*?</table>)", r'<div class="table-wrapper">\1</div>', html_str, flags=re.DOTALL)


def fix_markdown_lists(text: str) -> str:
    lines = text.split("\n")
    new_lines = []
    for i, line in enumerate(lines):
        if i > 0:
            prev = lines[i - 1].strip()
            curr = line.strip()
            is_curr_list = False
            is_quote = False
            if curr.startswith("- ") or curr.startswith("* ") or re.match(r"^\d+\.\s", curr):
                is_curr_list = True
            elif curr.startswith(">"):
                after_q = curr[1:].strip()
                if after_q.startswith("- ") or after_q.startswith("* ") or re.match(r"^\d+\.\s", after_q):
                    is_curr_list = True
                    is_quote = True

            if is_curr_list:
                is_prev_blank = (prev == "" or prev == ">")
                is_prev_list = False
                if prev.startswith("- ") or prev.startswith("* ") or re.match(r"^\d+\.\s", prev):
                    is_prev_list = True
                elif prev.startswith(">"):
                    p_after = prev[1:].strip()
                    if p_after.startswith("- ") or p_after.startswith("* ") or re.match(r"^\d+\.\s", p_after):
                        is_prev_list = True

                if not is_prev_blank and not is_prev_list:
                    if is_quote:
                        new_lines.append(">")
                    else:
                        new_lines.append("")

        m_sub = re.match(r"^(>\s*)  (-|\*|\d+\.)\s+(.*)$", line)
        if m_sub:
            line = f"{m_sub.group(1)}    {m_sub.group(2)} {m_sub.group(3)}"

        new_lines.append(line)
    return "\n".join(new_lines)


def convert_mermaid(html_str: str) -> str:
    """Convert <pre><code class="language-mermaid">...</code></pre> to <div class="mermaid">...</div>."""
    def replace_mermaid(match: re.Match[str]) -> str:
        code_content = match.group(1)
        unescaped = html.unescape(code_content).strip()
        return f'<div class="mermaid">\n{unescaped}\n</div>'

    pattern = re.compile(r'<pre><code class="language-mermaid">(.*?)</code></pre>', re.DOTALL)
    return pattern.sub(replace_mermaid, html_str)


def convert_md(text: str) -> str:
    md_converter = markdown.Markdown(
        extensions=["fenced_code", "tables"],
        output_format="html5",
    )
    normalized = fix_markdown_lists(text)
    protected, tokens = protect_math(normalized)
    rendered = md_converter.convert(protected)
    restored = restore_math(rendered, tokens)
    with_tables = wrap_tables(restored)
    return convert_mermaid(with_tables)



CSS_STYLES = """
:root {
  color-scheme: light;
  --bg: #f8fafc;
  --paper: #ffffff;
  --text: #1e293b;
  --muted: #64748b;
  --line: #e2e8f0;
  --accent: #0284c7;
  --accent-hover: #0369a1;
  --accent-soft: #f0f9ff;
  --code-bg: #f1f5f9;
  --details-bg: #f8fafc;
  --nav-h: 3.4rem;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html {
  scroll-behavior: smooth;
  scroll-padding-top: calc(var(--nav-h) + 1rem);
  -webkit-text-size-adjust: 100%;
}
body {
  background: var(--bg);
  color: var(--text);
  font-family: "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.8;
  font-size: 16px;
  padding-bottom: 4rem;
}
a { color: var(--accent); text-decoration: none; transition: all 0.2s; }
a:hover { color: var(--accent-hover); text-decoration: underline; }

/* 🌟 Sticky Top Navigation Bar */
.sticky-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}
.sticky-nav-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: var(--nav-h);
}
.nav-brand {
  font-weight: 700;
  font-size: 1.05rem;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.nav-brand:hover { text-decoration: none; color: var(--accent); }
.nav-select-wrapper {
  flex: 1;
  max-width: 440px;
  min-width: 0;
}
.nav-select-wrapper select {
  width: 100%;
  padding: 0.45rem 0.8rem;
  font-size: 0.9rem;
  color: var(--text);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s;
}
.nav-select-wrapper select:focus, .nav-select-wrapper select:hover {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.nav-btn-sim {
  background: var(--accent);
  color: #ffffff !important;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.nav-btn-sim:hover {
  background: var(--accent-hover);
  text-decoration: none;
  transform: translateY(-1px);
}

/* 🌟 Layout Container */
.page {
  max-width: 920px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
.hero, .toc, .chapter {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1.8rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

/* Hero Section */
.hero h1 {
  font-size: 1.85rem;
  line-height: 1.35;
  color: #0f172a;
  margin-bottom: 0.5rem;
}
.hero .tagline {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 1rem;
}
.hero .meta-box {
  background: var(--details-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.8rem 1.1rem;
  margin: 1.2rem 0;
  font-size: 0.88rem;
  color: var(--muted);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.5rem;
}
.hero .actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.2rem;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.55rem 1.1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--line);
  transition: all 0.2s ease;
}
.btn-primary {
  background: var(--accent);
  color: #ffffff !important;
  border-color: var(--accent);
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
}
.btn-primary:hover {
  background: var(--accent-hover);
  text-decoration: none;
}
.btn-secondary {
  background: #ffffff;
  color: var(--text);
}
.btn-secondary:hover {
  background: var(--code-bg);
  border-color: var(--muted);
  text-decoration: none;
}

/* Table of Contents (TOC) */
.toc h2 {
  margin-top: 0;
  font-size: 1.3rem;
  color: #0f172a;
  border-bottom: 2px solid var(--line);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.toc ol {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.6rem;
  list-style: none;
}
.toc li {
  margin: 0;
}
.toc a {
  display: block;
  padding: 0.6rem 0.9rem;
  background: var(--details-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.92rem;
  color: #334155;
}
.toc a:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
  transform: translateY(-1px);
}

/* Chapter Card */
.chapter {
  scroll-margin-top: calc(var(--nav-h) + 1rem);
}
.chapter-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.2rem;
  color: var(--muted);
  font-size: 0.9rem;
}
.chapter-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
  font-size: 0.95rem;
  border: 1px solid rgba(2, 132, 199, 0.2);
}
.chapter-label {
  font-weight: 700;
  color: var(--text);
  font-size: 1rem;
}

.chapter-body h2 {
  font-size: 1.5rem;
  color: #0f172a;
  margin-top: 0.5rem;
  margin-bottom: 1.2rem;
  padding-bottom: 0.4rem;
  border-bottom: 2px solid var(--line);
  line-height: 1.35;
}
.chapter-body h3 {
  font-size: 1.22rem;
  color: #0369a1;
  margin: 2rem 0 0.8rem;
  line-height: 1.4;
}
.chapter-body h4 {
  font-size: 1.08rem;
  color: #1e293b;
  margin: 1.5rem 0 0.6rem;
  line-height: 1.4;
}
.chapter-body h5 {
  font-size: 0.98rem;
  color: var(--muted);
  margin: 1.2rem 0 0.4rem;
}
.chapter-body p, .chapter-body li, .chapter-body blockquote {
  max-width: 78ch;
  margin-bottom: 1rem;
}
.chapter-body blockquote {
  margin: 1.2rem 0;
  padding: 0.9rem 1.2rem;
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  color: #1e293b;
  border-radius: 0 8px 8px 0;
}
.chapter-body ul, .chapter-body ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
.chapter-body li {
  margin-bottom: 0.35rem;
}
.chapter-body hr {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 2.2rem 0;
}

/* Responsive Table Wrapper (Prevents mobile overflow) */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1.4rem 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}
.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  margin: 0;
}
.table-wrapper th, .table-wrapper td {
  border: 1px solid var(--line);
  padding: 0.65rem 0.85rem;
  vertical-align: top;
  white-space: normal;
  min-width: 110px;
}
.table-wrapper th {
  background: var(--code-bg);
  color: #0f172a;
  font-weight: 700;
  text-align: left;
}

/* Code block styling (厳密な日本語等幅フォント設定) */
.chapter-body pre {
  overflow-x: auto;
  background: #0f172a;
  color: #f8fafc;
  padding: 1.1rem 1.3rem;
  border-radius: 8px;
  line-height: 1.55;
  font-family: "Cascadia Code", "BIZ UDGothic", "Consolas", "Courier New", monospace;
  letter-spacing: 0;
  font-size: 0.88rem;
  margin: 1.3rem 0;
  -webkit-overflow-scrolling: touch;
}
.chapter-body code {
  font-family: "Cascadia Code", "BIZ UDGothic", "Consolas", "Courier New", monospace;
  font-size: 0.9em;
  background: var(--code-bg);
  color: #d97706;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--line);
}
.chapter-body pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  border: 0;
  font-size: 0.88rem;
}

/* 🌟 Comparison Cards (対比ブロック) */
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin: 1.8rem 0;
}
.compare-card {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1.4rem;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.compare-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}
.compare-card.danger {
  border-top: 4px solid #ef4444;
  background: linear-gradient(to bottom, #fff5f5, #ffffff);
}
.compare-card.success {
  border-top: 4px solid #10b981;
  background: linear-gradient(to bottom, #f0fdf4, #ffffff);
}
.compare-card-title {
  font-size: 1.08rem;
  font-weight: 700;
  margin-bottom: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.compare-card.danger .compare-card-title {
  color: #b91c1c;
}
.compare-card.success .compare-card-title {
  color: #047857;
}
.compare-card ul {
  margin: 0;
  padding-left: 1.25rem;
}
.compare-card li {
  margin-bottom: 0.6rem;
  font-size: 0.94rem;
  line-height: 1.6;
}
@media (max-width: 768px) {
  .compare-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* KaTeX scroll guard */
.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5rem 0;
  -webkit-overflow-scrolling: touch;
}

/* Chapter Footer Navigation (Prev / Next) */
.chapter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 2.2rem;
  padding-top: 1.2rem;
  border-top: 1px dashed var(--line);
  font-size: 0.88rem;
}
.chapter-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--details-bg);
  color: var(--text);
  font-weight: 600;
  transition: all 0.2s;
}
.chapter-nav-btn:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  text-decoration: none;
}
.chapter-nav-btn.primary {
  background: var(--accent);
  color: #ffffff !important;
  border-color: var(--accent);
}
.chapter-nav-btn.primary:hover {
  background: var(--accent-hover);
}

/* 🌟 Mermaid Diagrams */
.mermaid {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1.25rem 1rem;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}
.mermaid svg {
  max-width: 100%;
  height: auto;
}

/* 🌟 Inline SVG Diagrams */
.svg-diagram-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.8rem 0;
  padding: 1.25rem 1rem;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  overflow-x: auto;
}
.svg-cut-diagram {
  max-width: 680px;
  width: 100%;
  height: auto;
  display: block;
}

/* 📱 Mobile Responsive Optimization */
@media (max-width: 768px) {
  body {
    font-size: 15.5px;
    line-height: 1.7;
  }
  .sticky-nav-inner {
    padding: 0.4rem 0.6rem;
    gap: 0.4rem;
  }
  .nav-brand {
    font-size: 0.92rem;
  }
  .nav-select-wrapper select {
    padding: 0.35rem 0.5rem;
    font-size: 0.84rem;
  }
  .nav-btn-sim {
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
  }
  .page {
    padding: 0.8rem 0.5rem 3rem;
  }
  .hero, .toc, .chapter {
    padding: 1.2rem 0.9rem;
    border-radius: 10px;
    margin-bottom: 1.2rem;
  }
  .hero h1 {
    font-size: 1.45rem;
  }
  .hero .tagline {
    font-size: 0.98rem;
  }
  .chapter-body h2 {
    font-size: 1.28rem;
  }
  .chapter-body h3 {
    font-size: 1.12rem;
  }
  .chapter-body pre {
    padding: 0.85rem 1rem;
    font-size: 0.82rem;
  }
  .chapter-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .chapter-nav-btn {
    justify-content: center;
  }
  .toc ol {
    grid-template-columns: 1fr;
  }
}
"""


def build():
    if not TEXTBOOK_MD.exists():
        print(f"Error: {TEXTBOOK_MD} not found.")
        sys.exit(1)

    raw_text = TEXTBOOK_MD.read_text(encoding="utf-8")

    chapter_pattern = re.compile(r"(?m)^##\s+(.*)$")
    all_matches = list(chapter_pattern.finditer(raw_text))
    matches = [m for m in all_matches if any(k in m.group(1) for k in ("はじめに", "第", "おわりに"))]

    if not matches:
        print("Error: No chapter headings found.")
        sys.exit(1)

    header_chunk = raw_text[: matches[0].start()]
    title_match = re.search(r"^#\s+(.*)$", header_chunk, re.M)
    title = title_match.group(1).strip() if title_match else "電車の路線図から大学数学へ"
    subtitle_match = re.search(r"^##\s+(.*)$", header_chunk, re.M)
    subtitle = subtitle_match.group(1).strip() if subtitle_match else "トロピカル代数とフロンティア法で解き明かす「最短」と「最長」の数理"

    chapters: list[dict] = []
    for i, m in enumerate(matches):
        raw_title = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw_text)
        content_md = raw_text[start:end].strip()

        chap_id = f"chap-{i:02d}"
        chap_index = f"{i:02d}"
        chap_label = "本編"

        if "はじめに" in raw_title:
            chap_id = "intro"
            chap_index = "序"
            chap_label = "はじめに"
        elif "おわりに" in raw_title:
            chap_id = "epilogue"
            chap_index = "結"
            chap_label = "おわりに"
        else:
            num_match = re.search(r"第(\d+)章", raw_title)
            if num_match:
                chap_num = int(num_match.group(1))
                chap_id = f"chap-{chap_num:02d}"
                chap_index = f"{chap_num:02d}"
                chap_label = f"第{chap_num}章"

        chapters.append({
            "id": chap_id,
            "index": chap_index,
            "label": chap_label,
            "title": raw_title,
            "md": content_md,
        })

    # Generate TOC items and Select options
    toc_items_html = []
    select_options_html = ['<option value="">📑 章を選択してジャンプ...</option>']
    chapters_html = []

    for i, chap in enumerate(chapters):
        select_options_html.append(
            f'<option value="#{chap["id"]}">{chap["index"]}: {html.escape(chap["title"])}</option>'
        )
        toc_items_html.append(
            f'<li><a href="#{chap["id"]}"><span style="color:var(--accent); font-weight:700;">{chap["index"]}:</span> {chap["title"]}</a></li>'
        )

        rendered_body = convert_md(chap["md"])

        # Prev / Next navigation buttons
        prev_btn = ""
        if i > 0:
            prev_chap = chapters[i - 1]
            prev_btn = f'<a href="#{prev_chap["id"]}" class="chapter-nav-btn">← {prev_chap["index"]}: {prev_chap["label"]}</a>'

        next_btn = ""
        if i + 1 < len(chapters):
            next_chap = chapters[i + 1]
            next_btn = f'<a href="#{next_chap["id"]}" class="chapter-nav-btn primary">{next_chap["index"]}: {next_chap["label"]} →</a>'

        chapter_html = f"""
    <section class="chapter" id="{chap['id']}">
      <div class="chapter-meta">
        <span class="chapter-index">{chap['index']}</span>
        <span class="chapter-label">{chap['label']}</span>
      </div>
      <div class="chapter-body">
        <h2>{chap['title']}</h2>
        {rendered_body}
      </div>
      <div class="chapter-footer">
        <div>{prev_btn}</div>
        <div><a href="#toc" class="chapter-nav-btn">↑ 目次へ戻る</a></div>
        <div>{next_btn}</div>
      </div>
    </section>"""
        chapters_html.append(chapter_html)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    html_template = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>__TITLE__ | __SUBTITLE__</title>
  <style>__CSS_STYLES__</style>
  
  <link rel="stylesheet" href="vendor/katex/katex.min.css">
  <script defer src="vendor/katex/katex.min.js"></script>
  <script defer src="vendor/katex/auto-render.min.js"></script>
  
  <script src="vendor/mermaid.min.js"></script>
  <script>
    if (typeof mermaid === 'undefined') {
      document.write('<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\\/script>');
    }
  </script>
  
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      // 🌟 Mermaid ダイアグラム自動レンダリング
      if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        });
      }

      // 🌟 KaTeX 数式自動レンダリング
      var blocks = document.querySelectorAll('.chapter-body');
      var renderOptions = {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '\\\\[', right: '\\\\]', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\\\(', right: '\\\\)', display: false}
        ],
        throwOnError: false
      };
      if (typeof renderMathInElement === 'function') {
        blocks.forEach(function (block) {
          renderMathInElement(block, renderOptions);
        });
      }

      // 🌟 スクロール連動：現在読んでいる章をセレクトボックスに自動反映
      var sections = document.querySelectorAll('section.chapter[id]');
      var select = document.getElementById('chapter-select');
      window.addEventListener('scroll', function () {
        var currentId = '';
        var scrollPos = window.scrollY + 140;
        sections.forEach(function (sec) {
          if (sec.offsetTop <= scrollPos) {
            currentId = '#' + sec.id;
          }
        });
        if (select && currentId && select.value !== currentId) {
          select.value = currentId;
        }
      });
    });
  </script>
</head>
<body id="top">
  <!-- 🌟 上部固定ナビゲーションバー -->
  <nav class="sticky-nav" aria-label="読書ナビゲーション">
    <div class="sticky-nav-inner">
      <a href="#top" class="nav-brand">📘 トロピカル数学</a>
      <div class="nav-select-wrapper">
        <select id="chapter-select" onchange="if(this.value) location.hash = this.value;">
          __SELECT_OPTIONS__
        </select>
      </div>
      <div class="nav-actions">
        <a href="simulator.html" target="_blank" class="nav-btn-sim">🎮 実験室</a>
        <a href="../tropical-jr-simulator/index.html" target="_blank" class="nav-btn-sim" style="background: #059669;">🗺️ 87駅シミュレータ</a>
      </div>
    </div>
  </nav>

  <div class="page">
    <header class="hero">
      <h1>__TITLE__</h1>
      <p class="tagline">__SUBTITLE__</p>
      <div class="actions">
        <a href="simulator.html" target="_blank" class="btn btn-primary">🎮 連動Webシミュレーター（4駅実験室）を開く</a>
        <a href="../tropical-jr-simulator/index.html" target="_blank" class="btn btn-primary" style="background: #059669; border-color: #059669;">🗺️ 都内JR 87駅全体シミュレーターを開く</a>
        <a href="textbook.md" target="_blank" class="btn btn-secondary">📄 Markdown 正本を開く</a>
      </div>
    </header>

    <nav class="toc" id="toc" aria-label="章一覧">
      <h2>目次</h2>
      <ol>
        __TOC_ITEMS__
      </ol>
    </nav>

    __CHAPTERS__
  </div>
</body>
</html>
"""

    full_html = (
        html_template
        .replace("__TITLE__", title)
        .replace("__SUBTITLE__", subtitle)
        .replace("__CSS_STYLES__", CSS_STYLES)
        .replace("__SELECT_OPTIONS__", "".join(select_options_html))
        .replace("__TOC_ITEMS__", "".join(toc_items_html))
        .replace("__CHAPTERS__", "".join(chapters_html))
    )

    OUTPUT_HTML.write_text(full_html, encoding="utf-8")
    print(f"Successfully generated: {OUTPUT_HTML} ({len(full_html):,} bytes)")


if __name__ == "__main__":
    build()
