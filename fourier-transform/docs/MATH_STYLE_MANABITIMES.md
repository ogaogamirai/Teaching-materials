# 数式スタイル（まなびタイムズ準拠）

参考:
- https://manabitimes.jp/math/585 （オイラーの公式）
- https://manabitimes.jp/math/2280 （フーリエ変換）

## 目標の見え方
- **看板式**: KaTeX `displayMode`（∑/∫ の上下限が記号の上下）
- **中央寄せ**の数式ブロック
- 指数は \(e^{i\theta}\), \(e^{i n x}\)（`inx` を一塊にしない）
- 微分は \(\dfrac{\mathrm{d}}{\mathrm{d}x}e^{i n x}=i\,n\,e^{i n x}\)

## データ側の書き方
- `formula_html` は **LaTeX**（`\\sum_{n=-\\infty}^{\\infty}` 等）
- 複数行は `formula_html`, `formula_html_2`, … に分割（重ねて誤読しない）
- 本文のインラインは `e^{i\\theta}` / `e^{inx}` でも `math_tex` が整形

## 実装
- `vendor/katex/` + `js/math_tex.js`
- `renderFormulaHtml` → displayMode
- `renderInline` / `escMath` → インライン KaTeX
