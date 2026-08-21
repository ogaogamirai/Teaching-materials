"""Protect LaTeX math from Markdown HTML transforms (underscore emphasis, etc.).

Ported from system-dynamics/tools/math_protect.py (proven L1 gate).
Also normalizes Japanese text inside math to \\text{...} so that KaTeX renders
Japanese labels correctly (unicodeTextInMathMode warning avoided).

Contract: theory-v2/docs/MATH_DISPLAY_CONTRACT.md
Upstream know: archive/interactive-v1/docs/KNOW_MATH_DISPLAY_ENVIRONMENTS.md
"""
from __future__ import annotations

import re

MATH_DISPLAY_RE = re.compile(r"\$\$(.*?)\$\$", re.DOTALL)
MATH_INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)((?:\\.|[^$\\])+?)(?<!\$)\$(?!\$)", re.DOTALL)
MATH_PAREN_RE = re.compile(r"\\\((.*?)\\\)", re.DOTALL)
MATH_BRACKET_RE = re.compile(r"\\\[(.*?)\\\]", re.DOTALL)

# Japanese character runs: hiragana, katakana, kanji, plus common punctuation.
JP_CHARS = (
    "\u3040-\u309f"  # hiragana
    "\u30a0-\u30ff"  # katakana
    "\u4e00-\u9fff"  # CJK unified ideographs
    "\u3005\u3006\u30fb\u2010\u30fc"  # 々 〆 ・ ‐ ー
)
JP_RUN_RE = re.compile(rf"([{JP_CHARS}]+)")


def _math_token(index: int) -> str:
    return f"⟦MATH{index}⟧"


TEXT_BLOCK_RE = re.compile(r"\\text\{[^{}]*\}")


def _wrap_japanese(text: str) -> str:
    """Wrap contiguous Japanese runs (outside existing \\text{...}) in \\text{...}."""
    stash: list[str] = []

    def stash_block(match: re.Match[str]) -> str:
        stash.append(match.group(0))
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
    """Replace math spans with opaque tokens before Markdown conversion."""
    tokens: list[str] = []

    def store(match: re.Match[str]) -> str:
        raw = match.group(0)
        content = _wrap_japanese(raw)
        tokens.append(content)
        return _math_token(len(tokens) - 1)

    for pattern in (MATH_DISPLAY_RE, MATH_BRACKET_RE, MATH_PAREN_RE, MATH_INLINE_RE):
        text = pattern.sub(store, text)
    return text, tokens


def restore_math(text: str, tokens: list[str]) -> str:
    """Restore math spans after Markdown conversion."""
    for index, token in enumerate(tokens):
        text = text.replace(_math_token(index), token)
    return text


def convert_markdown_with_math(md_converter, text: str, *, pre_process=None, post_process=None) -> str:
    """Run Markdown conversion with math protection."""
    prepared = pre_process(text) if pre_process else text
    protected, tokens = protect_math(prepared)
    rendered = md_converter.convert(protected)
    if post_process:
        rendered = post_process(rendered)
    return restore_math(rendered, tokens)


def find_latex_integrity_issues(html_content: str) -> list[str]:
    """Detect known LaTeX corruption patterns in rendered HTML."""
    issues: list[str] = []

    if re.search(r"<em e_1=", html_content):
        issues.append("LaTeX subscript corrupted to <em e_1=...>")

    if "⟦MATH" in html_content:
        issues.append("Unrestored math protection tokens (⟦MATH…⟧)")

    if "MATHPROTECT" in html_content:
        issues.append("Unrestored legacy math protection tokens (MATHPROTECT)")

    if "@@MATH" in html_content:
        issues.append("Unrestored legacy math protection tokens (@@MATH)")

    if re.search(r"\\bar\{e\}<em", html_content):
        issues.append("Shannon bar{e}_1 corrupted by emphasis tags")

    if "¥;" in html_content or "¥\\" in html_content:
        issues.append("Broken yen-sign escape sequences in math")

    # Markdown ate \\( ... \\) → bare (\\sin) etc. (theory-v2 review 2026-08 regression)
    if re.search(r"(?<!\\)\(\\s*\\[a-zA-Z]", html_content):
        issues.append("Likely eaten \\( delimiter: bare (\\command...) in HTML")

    return issues
