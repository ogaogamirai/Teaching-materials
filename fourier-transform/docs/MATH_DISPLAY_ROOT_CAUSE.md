# Math display root causes (2026-07-24 r5)

> **Superseded (2026-07-25):** 正本は `PLAN_MATH_DISPLAY_FUNDAMENTAL.md`。  
> 実装: 純 LaTeX + KaTeX 一本化。ゲート: `python tools/verify_math.py --strict-path`。

## Why patches kept failing
1. **HTML `<sup>`/`<sub>` look almost flat** in Japanese UI fonts (Segoe UI / Hiragino) on Edge — DOM was correct (`e<sup>inx</sup>`) but eyes see `einx` / `cn`.
2. **Multiple text paths** (intuition, beats, formula, SVG) — fixing one left others broken.
3. **SVG is a bitmap of text** — JS cannot format strings inside `.svg` files.
4. **TeX-like `e^{inx}`** in JSON needs conversion; incomplete regex left braces or failed on `∑_{n=-∞}^{∞}`.

## Fundamental fix (r5)
- Convert **all** scripts to **Unicode** superscripts/subscripts (`eⁱⁿˣ`, `cₙ`), not HTML tags.
- Convert existing `<sup>`/`<sub>` in formula_html to unicode before display.
- Math-capable font stack on `.formula-box`.
- geometry.beats → escMath; SVG rewritten with tspan/unicode.

## Verify
Open index.html with Ctrl+F5 (`?v=20260724r5`). COMPARE formula must show raised ⁱⁿˣ not flat "inx".