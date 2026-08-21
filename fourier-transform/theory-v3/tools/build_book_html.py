# -*- coding: utf-8 -*-
"""Build the learner-facing one-volume HTML (not the review batch).

Usage (from theory-v2/):
  python tools/build_book_html.py
  python tools/verify_review_html.py --html book/index.html

Contract: docs/MATH_DISPLAY_CONTRACT.md
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

from build_review_html import (  # noqa: E402
    DEFAULT_MANIFEST,
    ROOT,
    chapter_slug,
    ensure_katex,
    md_to_html,
)

DEFAULT_OUT = ROOT / "book" / "index.html"
VENDOR_DST = ROOT / "book" / "vendor" / "katex"

PART_ORDER = [
    ("G", "動機主導"),
]

TOC_SHORT = {
    "G0_experience": "G0 体験",
    "G1_superposition": "G1 足し算",
    "G2_circle_shadow": "G2 円の影",
    "G3_area_measure": "G3 面積",
    "G4_orthogonality": "G4 直交",
    "G5_coefficients": "G5 係数",
    "G6_complex_rotation": "G6 e^{iθ}",
    "G7_bridge_transform": "G7 橋",
    "G8_answer_jpeg": "G8 答え合わせ",
    "G9_teachback_graduation": "G9 卒業",
}


def book_chapter_rels(manifest_path: Path) -> list[str]:
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    out: list[str] = []
    for batch in data["batches"]:
        out.extend(batch["chapters"])
    return out


def part_of(rel: str) -> tuple[str, str]:
    stem = Path(rel).stem
    if stem.startswith("G"):
        return "G", "動機主導"
    return "?", "その他"


def plain_heading(text: str) -> str:
    t = re.sub(r"\\\(.*?\\\)", "", text)
    t = re.sub(r"\$[^$]+\$", "", t)
    return re.sub(r"\s+", " ", t).strip()


def split_code_title(h1_plain: str) -> tuple[str, str]:
    m = re.match(r"^(G\d+)\.\s*(.+)$", h1_plain)
    if not m:
        return "", h1_plain
    title = m.group(2)
    title = re.sub(r"[—ー].*$", "", title).strip()
    return m.group(1), title


def wrap_tables(body: str) -> str:
    body = re.sub(r"<table\b", r'<div class="table-wrap"><table', body)
    return body.replace("</table>", "</table></div>")


def prefix_heading_ids(body: str, slug: str, chapter_slugs: set[str]) -> str:
    found = set(re.findall(r'\bid="([^"]+)"', body))

    def repl_id(m: re.Match[str]) -> str:
        old = m.group(1)
        if old == slug or old in chapter_slugs:
            return m.group(0)
        return f'id="{slug}-{old}"'

    body = re.sub(r'\bid="([^"]+)"', repl_id, body)

    def repl_href(m: re.Match[str]) -> str:
        target = m.group(1)
        if target in chapter_slugs or target == slug or target == "toc":
            return m.group(0)
        if target in found:
            return f'href="#{slug}-{target}"'
        return m.group(0)

    return re.sub(r'href="#([^"]+)"', repl_href, body)


def collect_units(rels: list[str]) -> list[dict]:
    units: list[dict] = []
    slugs = {chapter_slug(r) for r in rels}
    for i, rel in enumerate(rels):
        path = ROOT / rel
        if not path.exists():
            raise SystemExit(f"missing chapter: {path}")
        raw = path.read_text(encoding="utf-8")
        m = re.search(r"^#\s+(.+)$", raw, re.M)
        h1 = plain_heading(m.group(1) if m else Path(rel).stem)
        code, title = split_code_title(h1)
        stem = Path(rel).stem
        part, part_name = part_of(rel)
        slug = chapter_slug(rel)
        short = TOC_SHORT.get(stem, (f"{code} {title}" if code else h1)[:18])
        units.append(
            {
                "rel": rel,
                "raw": raw,
                "slug": slug,
                "code": code or short.split()[0],
                "title": title or h1,
                "short": short,
                "part": part,
                "part_name": part_name,
                "bar": f"{code} · {title}" if code else h1,
                "prev": chapter_slug(rels[i - 1]) if i else "",
                "next": chapter_slug(rels[i + 1]) if i + 1 < len(rels) else "",
                "slugs": slugs,
            }
        )
    return units


def toc_markup(units: list[dict], *, extra_class: str = "") -> str:
    groups: list[str] = []
    for part, part_name in PART_ORDER:
        items = [u for u in units if u["part"] == part]
        if not items:
            continue
        links = "".join(
            f'<a class="toc-link" href="#{html.escape(u["slug"])}" data-id="{html.escape(u["slug"])}" '
            f'onclick="return window.bookGoTo ? (window.bookGoTo(\'{u["slug"]}\'), false) : true;">'
            f'{html.escape(u["short"])}</a>'
            for u in items
        )
        groups.append(
            f'<div class="toc-part">'
            f'<div class="toc-part-name">{html.escape(part)} {html.escape(part_name)}</div>'
            f'<div class="toc-units">{links}</div>'
            f"</div>"
        )
    cls = f"toc {extra_class}".strip()
    return f'<nav class="{cls}" aria-label="目次">\n' + "\n".join(groups) + "\n</nav>"


def chapter_nav(unit: dict) -> str:
    prev_a = (
        f'<a class="chap-nav-link" href="#{html.escape(unit["prev"])}">‹ 前へ</a>'
        if unit["prev"]
        else '<span class="chap-nav-link is-disabled">‹ 前へ</span>'
    )
    next_a = (
        f'<a class="chap-nav-link" href="#{html.escape(unit["next"])}">次へ ›</a>'
        if unit["next"]
        else '<span class="chap-nav-link is-disabled">次へ ›</span>'
    )
    return (
        '<nav class="chap-nav" aria-label="前後のユニット">'
        f"{prev_a}"
        '<button type="button" class="chap-nav-link toc-open">目次</button>'
        f"{next_a}"
        "</nav>"
    )


def build_body(units: list[dict]) -> str:
    slugs = units[0]["slugs"] if units else set()
    parts: list[str] = []
    for u in units:
        body = md_to_html(u["raw"])
        body = wrap_tables(body)
        body = prefix_heading_ids(body, u["slug"], slugs)
        parts.append(
            f'<section class="chapter" id="{html.escape(u["slug"])}" '
            f'data-part="{html.escape(u["part"])}" '
            f'data-part-name="{html.escape(u["part_name"])}" '
            f'data-code="{html.escape(u["code"])}" '
            f'data-title="{html.escape(u["title"])}" '
            f'data-bar="{html.escape(u["bar"])}" '
            f'data-prev="{html.escape(u["prev"])}" '
            f'data-next="{html.escape(u["next"])}">\n'
            f"{chapter_nav(u)}\n"
            f"{body}\n"
            f"{chapter_nav(u)}\n"
            f"</section>"
        )
    return "\n".join(parts)


def build(manifest_path: Path, out_path: Path) -> None:
    ensure_katex(VENDOR_DST)
    rels = book_chapter_rels(manifest_path)
    units = collect_units(rels)
    body_html = build_body(units)
    toc_page = toc_markup(units)
    toc_sheet = toc_markup(units, extra_class="toc-in-sheet")
    generated = datetime.now().strftime("%Y-%m-%d %H:%M")
    first = units[0] if units else None
    first_bar = first["bar"] if first else ""
    first_part = f"{first['part']} {first['part_name']}" if first else ""

    doc = TEMPLATE
    doc = (
        doc.replace("__GENERATED__", generated)
        .replace("__TOC_PAGE__", toc_page)
        .replace("__TOC_SHEET__", toc_sheet)
        .replace("__FIRST_BAR__", html.escape(first_bar))
        .replace("__FIRST_PART__", html.escape(first_part))
        .replace("__BODY__", body_html)
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(doc, encoding="utf-8")
    print(f"wrote {out_path} ({len(units)} units)")
    print(f"katex -> {VENDOR_DST}")


# This template is a raw string. KaTeX needs JS "\\(" in the output HTML.
# Write "\\(" here (not "\\\\("). The latter stays over-escaped and inline math is raw.
TEMPLATE = r"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>フーリエ変換 — ほどいて測る、組み立てて戻す</title>
  <link rel="stylesheet" href="vendor/katex/katex.min.css" />
  <style>
    :root {
      --bg: #f4f1ea;
      --ink: #1c1a16;
      --muted: #5c574e;
      --card: #fffdf8;
      --line: #d9d2c5;
      --accent: #2c5f4a;
      --accent-2: #c45c26;
      --bar-h: 3.15rem;
      --tap: 2.75rem;
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
      --safe-left: env(safe-area-inset-left, 0px);
      --safe-right: env(safe-area-inset-right, 0px);
    }
    * { box-sizing: border-box; }
    html {
      -webkit-text-size-adjust: 100%;
      scroll-padding-top: calc(var(--bar-h) + var(--safe-top) + 0.4rem);
      overflow-anchor: none;
    }
    body {
      margin: 0;
      font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic UI", sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.75;
      font-size: 17px;
      overflow-anchor: none;
    }
    body.toc-open {
      position: fixed;
      left: 0;
      right: 0;
      width: 100%;
      overflow: hidden;
    }
    a { color: var(--accent); }
    .skip {
      position: absolute; left: -999px; top: 0;
    }
    .skip:focus {
      left: 0.5rem; top: 0.5rem; z-index: 80;
      background: var(--card); padding: 0.4rem 0.7rem; border-radius: 8px;
    }

    .reader-bar {
      position: sticky; top: 0; z-index: 30;
      display: flex; align-items: center; gap: 0.4rem;
      min-height: calc(var(--bar-h) + var(--safe-top));
      padding: var(--safe-top) max(0.5rem, var(--safe-right)) 0 max(0.5rem, var(--safe-left));
      background: rgba(247,245,240,0.96);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(8px);
    }
    .reader-bar .bar-btn,
    .reader-bar .bar-nav {
      flex: 0 0 auto;
      min-width: var(--tap);
      min-height: var(--bar-h);
      padding: 0 0.55rem;
      border: 0;
      background: transparent;
      color: var(--accent);
      font: inherit;
      font-size: 0.92rem;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .reader-bar .bar-btn:active,
    .reader-bar .bar-nav:active { background: #e7efe9; }
    .reader-bar .bar-nav.is-disabled { color: #bbb; pointer-events: none; }
    .bar-where {
      flex: 1 1 auto;
      min-width: 0;
      padding: 0.15rem 0.15rem 0.2rem;
    }
    .bar-part {
      display: block;
      font-size: 0.68rem;
      letter-spacing: 0.04em;
      color: var(--muted);
      line-height: 1.2;
    }
    .bar-unit {
      display: block;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }

    main {
      max-width: 40rem;
      margin: 0 auto;
      padding: 0.9rem max(0.9rem, var(--safe-left)) calc(5.2rem + var(--safe-bottom)) max(0.9rem, var(--safe-right));
    }
    .book-open {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 1.1rem 1.05rem 1.2rem;
      margin-bottom: 1rem;
    }
    .book-open h1 {
      margin: 0 0 0.35rem;
      font-size: 1.35rem;
      line-height: 1.35;
      color: var(--accent);
    }
    .lede { margin: 0 0 0.7rem; color: var(--muted); font-size: 0.95rem; }
    .how { margin: 0; font-size: 0.9rem; color: var(--muted); }

    #toc {
      margin-top: 0.85rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--line);
    }
    .toc-part { margin: 0.55rem 0 0.7rem; }
    .toc-part-name {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 0.3rem;
    }
    .toc-units {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .toc-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.15rem;
      padding: 0.2rem 0.55rem;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #fff;
      color: var(--ink);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .toc-link.is-current {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .chapter {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 0.85rem 0.95rem 1.2rem;
      margin-bottom: 1rem;
    }
    .chap-nav {
      display: flex;
      gap: 0.35rem;
      margin: 0.15rem 0 0.7rem;
    }
    .chapter .chap-nav:last-child { margin: 1rem 0 0; }
    .chap-nav-link {
      flex: 1 1 0;
      min-height: var(--tap);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: #fff;
      color: var(--accent);
      text-decoration: none;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
    }
    .chap-nav-link.is-disabled { color: #bbb; pointer-events: none; }

    h1,h2,h3,h4 { line-height: 1.35; }
    h1 { font-size: 1.38rem; margin: 0.2rem 0 0.7rem; }
    h2 {
      font-size: 1.12rem;
      margin-top: 1.45rem;
      border-bottom: 1px solid var(--line);
      padding-bottom: 0.2rem;
    }
    h3 { font-size: 1.02rem; margin-top: 1.15rem; }
    blockquote {
      margin: 0.8rem 0;
      padding: 0.25rem 0.8rem;
      border-left: 4px solid var(--accent);
      background: #f0f7f3;
    }
    .table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 0.8rem 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 0.9rem;
      margin: 0;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 0.4rem 0.5rem;
      vertical-align: top;
    }
    th { background: #efeae0; }
    code {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 0.88em;
      background: #efeae0;
      padding: 0.05em 0.3em;
      border-radius: 4px;
      word-break: break-word;
    }
    pre {
      overflow: auto;
      background: #1c1a16;
      color: #f7f5f0;
      padding: 0.85rem 0.9rem;
      border-radius: 8px;
      -webkit-overflow-scrolling: touch;
    }
    pre code { background: transparent; color: inherit; padding: 0; }
    .figure, figure.review-fig {
      margin: 1rem 0;
      padding: 0.65rem;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 8px;
      text-align: center;
    }
    .figure svg, figure.review-fig svg { max-width: 100%; height: auto; }
    figcaption { margin-top: 0.4rem; color: var(--muted); font-size: 0.84rem; text-align: left; }
    hr { border: 0; border-top: 1px solid var(--line); margin: 1.3rem 0; }
    .katex-display { margin: 0.9rem 0; overflow: visible; }
    .math-block {
      display: block;
      margin: 1rem 0;
      padding: 0.15rem 0;
      overflow: visible;
      line-height: normal;
      text-align: center;
    }
    p:has(> .katex-display) {
      overflow: visible;
      line-height: normal;
      max-height: none;
    }
    .katex .text, .katex .mord.text, .katex .mathrm {
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
      margin: 0.6rem 0;
      padding: 0.5rem 0.75rem;
      background: #fff3cd;
      border: 1px solid #e0c36a;
      border-radius: 8px;
      color: #5c4b00;
      font-size: 0.9rem;
    }

    .fab-toc {
      position: fixed;
      right: max(0.85rem, var(--safe-right));
      bottom: max(0.85rem, var(--safe-bottom));
      z-index: 28;
      min-width: 3.4rem;
      min-height: 3.4rem;
      padding: 0 0.95rem;
      border: 0;
      border-radius: 999px;
      background: var(--accent);
      color: #fff;
      font: inherit;
      font-size: 0.92rem;
      font-weight: 700;
      box-shadow: 0 6px 18px rgba(28,26,22,0.18);
    }
    @media (min-width: 800px) {
      .fab-toc { display: none; }
    }

    .toc-sheet {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: none;
    }
    .toc-sheet.is-open { display: block; }
    .toc-sheet-back {
      position: absolute;
      inset: 0;
      z-index: 0;
      background: rgba(28,26,22,0.38);
      border: 0;
      width: 100%;
      height: 100%;
    }
    .toc-sheet-panel {
      position: absolute;
      left: 0; right: 0; bottom: 0;
      z-index: 1;
      max-height: min(86vh, 40rem);
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      background: var(--card);
      border-radius: 16px 16px 0 0;
      padding: 0.7rem 0.9rem calc(1rem + var(--safe-bottom));
      box-shadow: 0 -8px 28px rgba(28,26,22,0.12);
      pointer-events: auto;
    }
    .toc-sheet-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.35rem;
    }
    .toc-sheet-head h2 { margin: 0; font-size: 1rem; border: 0; }
    .toc-sheet-close {
      min-width: var(--tap);
      min-height: var(--tap);
      border: 0;
      background: transparent;
      font: inherit;
      font-size: 1.2rem;
      color: var(--muted);
    }
    @media (min-width: 720px) {
      .toc-sheet-panel {
        left: 50%;
        right: auto;
        top: 12vh;
        bottom: auto;
        transform: translateX(-50%);
        width: min(28rem, 92vw);
        border-radius: 14px;
        max-height: 76vh;
      }
    }
    @media (max-width: 419px) {
      body { font-size: 16px; }
      .reader-bar .bar-nav-label { display: none; }
      main { padding-left: max(0.7rem, var(--safe-left)); padding-right: max(0.7rem, var(--safe-right)); }
      .chapter { padding: 0.75rem 0.7rem 1rem; }
    }
  </style>
</head>
<body>
  <a class="skip" href="#toc">目次へ</a>
  <header class="reader-bar" role="banner">
    <button type="button" class="bar-btn toc-open" aria-haspopup="dialog" aria-controls="toc-sheet">目次</button>
    <div class="bar-where" aria-live="polite">
      <span class="bar-part" id="bar-part">__FIRST_PART__</span>
      <span class="bar-unit" id="bar-unit">__FIRST_BAR__</span>
    </div>
    <a class="bar-nav" id="bar-prev" href="#" aria-label="前のユニット"><span aria-hidden="true">‹</span><span class="bar-nav-label">前</span></a>
    <a class="bar-nav" id="bar-next" href="#" aria-label="次のユニット"><span class="bar-nav-label">次</span><span aria-hidden="true">›</span></a>
  </header>

  <main>
    <div id="math-status">数式エンジンの読み込みに失敗しました。同じフォルダの vendor/katex を確認し、再読み込みしてください。</div>
    <section class="book-open" id="top">
      <h1>フーリエ変換</h1>
      <p class="lede">複雑な信号を、単純な波の足し算として理解する。ほどいて測り、組み立てて戻す。</p>
      <p class="how">下の目次から進む。いま読んでいるユニットは、上のバーに出る。いつでも「目次」で戻れる。</p>
      <div id="toc">
        __TOC_PAGE__
      </div>
    </section>
    __BODY__
  </main>

  <button type="button" class="fab-toc toc-open" aria-haspopup="dialog" aria-controls="toc-sheet">目次</button>

  <div class="toc-sheet" id="toc-sheet">
    <button type="button" class="toc-sheet-back" tabindex="-1" aria-label="目次を閉じる"></button>
    <div class="toc-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="toc-sheet-title">
      <div class="toc-sheet-head">
        <h2 id="toc-sheet-title">目次</h2>
        <button type="button" class="toc-sheet-close" aria-label="閉じる">×</button>
      </div>
      __TOC_SHEET__
    </div>
  </div>

  <script src="vendor/katex/katex.min.js"></script>
  <script src="vendor/katex/auto-render.min.js"></script>
  <script>
    (function () {
      var chapters = Array.prototype.slice.call(document.querySelectorAll("section.chapter"));
      var barPart = document.getElementById("bar-part");
      var barUnit = document.getElementById("bar-unit");
      var barPrev = document.getElementById("bar-prev");
      var barNext = document.getElementById("bar-next");
      var sheet = document.getElementById("toc-sheet");
      var currentId = "";

      function setCurrent(ch) {
        if (!ch || ch.id === currentId) return;
        currentId = ch.id;
        barPart.textContent = (ch.getAttribute("data-part") || "") + " " + (ch.getAttribute("data-part-name") || "");
        barUnit.textContent = ch.getAttribute("data-bar") || "";
        var prev = ch.getAttribute("data-prev") || "";
        var next = ch.getAttribute("data-next") || "";
        if (prev) {
          barPrev.href = "#" + prev;
          barPrev.classList.remove("is-disabled");
        } else {
          barPrev.href = "#toc";
          barPrev.classList.add("is-disabled");
        }
        if (next) {
          barNext.href = "#" + next;
          barNext.classList.remove("is-disabled");
        } else {
          barNext.href = "#toc";
          barNext.classList.add("is-disabled");
        }
        var links = document.querySelectorAll(".toc-link");
        for (var i = 0; i < links.length; i++) {
          links[i].classList.toggle("is-current", links[i].getAttribute("data-id") === currentId);
        }
      }

      function updateFromScroll() {
        var y = 72;
        var current = chapters[0];
        for (var i = 0; i < chapters.length; i++) {
          if (chapters[i].getBoundingClientRect().top <= y) current = chapters[i];
        }
        if (current) setCurrent(current);
      }

      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          updateFromScroll();
        });
      }, { passive: true });

      var navSeq = 0;
      var tocLockY = 0;

      function barOffset() {
        var bar = document.querySelector(".reader-bar");
        return (bar ? bar.offsetHeight : 56) + 8;
      }

      function findTarget(id) {
        if (!id) return null;
        try { id = decodeURIComponent(id); } catch (e0) {}
        var chapter = document.querySelector("section.chapter[id=\"" + id.replace(/"/g, "") + "\"]");
        if (chapter) return chapter;
        return document.getElementById(id);
      }

      function goToId(id, updateHash) {
        if (updateHash === undefined) updateHash = true;
        var el = findTarget(id);
        if (!el) return false;
        var seq = ++navSeq;

        function applyScroll() {
          if (seq !== navSeq) return;
          var y = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - barOffset();
          if (y < 0) y = 0;
          try {
            window.scrollTo(0, y);
          } catch (e1) {
            if (el.scrollIntoView) el.scrollIntoView(true);
          }
        }

        applyScroll();
        window.requestAnimationFrame(applyScroll);
        setTimeout(applyScroll, 50);

        if (updateHash) {
          var nextHash = "#" + (el.id || id);
          if (location.hash !== nextHash) {
            try {
              history.replaceState(null, "", nextHash);
            } catch (e2) {}
          }
        }
        if (el.classList && el.classList.contains("chapter")) setCurrent(el);
        else if (id === "toc" || id === "top") {
          currentId = "";
          updateFromScroll();
        }
        return true;
      }

      function unlockTocSheet() {
        if (!sheet.classList.contains("is-open") && !document.body.classList.contains("toc-open")) {
          return;
        }
        sheet.classList.remove("is-open");
        document.body.classList.remove("toc-open");
        document.body.style.top = "";
        window.scrollTo(0, tocLockY);
      }

      function openToc() {
        tocLockY = window.pageYOffset || document.documentElement.scrollTop || 0;
        sheet.classList.add("is-open");
        document.body.classList.add("toc-open");
        document.body.style.top = "-" + tocLockY + "px";
        var cur = sheet.querySelector(".toc-link.is-current");
        if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
      }
      function closeToc() {
        unlockTocSheet();
      }

      function eventEl(ev) {
        var t = ev.target;
        if (t && t.nodeType === 3) t = t.parentNode;
        return t;
      }

      document.addEventListener("click", function (ev) {
        var t = eventEl(ev);
        if (!t || !t.closest) return;

        var openBtn = t.closest(".toc-open");
        if (openBtn) {
          ev.preventDefault();
          if (sheet.classList.contains("is-open")) closeToc();
          else openToc();
          return;
        }
        // 背面オーバーレイ / 閉じるボタン（パネル内リンクより先に取らない）
        if (t.classList && (t.classList.contains("toc-sheet-back") || t.classList.contains("toc-sheet-close"))) {
          ev.preventDefault();
          closeToc();
          return;
        }
        if (t.closest(".toc-sheet-close")) {
          ev.preventDefault();
          closeToc();
          return;
        }
        var jump = t.closest("a.toc-link, a.chap-nav-link, a.bar-nav");
        if (!jump) return;
        var href = jump.getAttribute("href") || "";
        if (href.charAt(0) !== "#" || href.length < 2) return;
        ev.preventDefault();
        var targetId = jump.getAttribute("data-id") || href.slice(1);
        var fromSheet = !!jump.closest(".toc-sheet");
        if (fromSheet) {
          unlockTocSheet();
          setTimeout(function () { goToId(targetId, true); }, 0);
        } else {
          goToId(targetId, true);
        }
      }, true);

      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && sheet.classList.contains("is-open")) closeToc();
      });

      window.addEventListener("hashchange", function () {
        var id = location.hash ? location.hash.slice(1) : "";
        if (id) goToId(id, false);
      });

      window.bookGoTo = goToId;

      if (typeof renderMathInElement === "function" && typeof katex !== "undefined") {
        renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false,
          errorColor: "#b00020",
          strict: "ignore"
        });
      } else {
        var el = document.getElementById("math-status");
        if (el) el.style.display = "block";
      }

      updateFromScroll();
      if (location.hash) {
        var hashedId = location.hash.slice(1);
        setTimeout(function () { goToId(hashedId, false); }, 0);
      }
    })();
  </script>
  <!-- book-nav:v5 toc-panel-zindex+onclick -->
</body>
</html>
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    build(args.manifest, args.out)


if __name__ == "__main__":
    main()
