# -*- coding: utf-8 -*-
"""D2 SVG post-processing: strip embedded fonts, share CSS fonts instead."""
import re
import sys
from pathlib import Path

FONT_STACK = '"Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", sans-serif'


def strip_fonts(svg_text: str) -> str:
    # 1) Remove @font-face blocks (base64 font definitions).
    svg_text = re.sub(
        r'@font-face\s*\{[^}]*?src:\s*url\("data:application/font-woff;base64,[^)]*"\)[^}]*?\}',
        '',
        svg_text,
        flags=re.DOTALL,
    )
    # 2) Collapse now-empty <style> blocks.
    svg_text = re.sub(
        r'<style[^>]*>\s*</style>',
        '',
        svg_text,
        flags=re.DOTALL,
    )
    # 3) Rewrite the d2 font-class rules (.text-bold etc.) to a shared CSS font.
    svg_text = re.sub(
        r'\.d2-[^\s]+\.text-([a-z]+)\s*\{[^}]*\}',
        lambda m: f'.text-{m.group(1)} {{ font-family: {FONT_STACK};'
                  + (' font-weight: 700;' if m.group(1) == 'bold' else '')
                  + (' font-style: italic;' if m.group(1) == 'italic' else '')
                  + ' }',
        svg_text,
    )
    # 4) Rewrite inline font-family="d2-...-font-bold" to the shared stack.
    svg_text = re.sub(
        r'font-family:\s*"d2-[^"]+font-([a-z]+)"',
        lambda m: f'font-family: {FONT_STACK};'
                  + (' font-weight: 700;' if m.group(1) == 'bold' else '')
                  + (' font-style: italic;' if m.group(1) == 'italic' else ''),
        svg_text,
    )
    # 4b) Clean double semicolons left by joins.
    svg_text = re.sub(r';;+', ';', svg_text)
    # 5) Strip empty style attributes left behind.
    svg_text = re.sub(r'\s*style=""', '', svg_text)
    # 6) Tidy: remove blank <style></style> remnants.
    svg_text = re.sub(r'\s*<style>\s*</style>\s*', '', svg_text)
    return svg_text


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: python strip_d2_fonts.py <in.svg> <out.svg>")
        return 1
    src = Path(sys.argv[1]).read_text(encoding="utf-8")
    out = strip_fonts(src)
    Path(sys.argv[2]).write_text(out, encoding="utf-8")
    print(f"stripped fonts: {sys.argv[1]} -> {sys.argv[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
