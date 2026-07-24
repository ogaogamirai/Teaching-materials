# 数式表示（√ / ∫）根治メモ — 2026-07-24

## 症状
- 道のり・くわしく読む等で `√(...)` の**上棒が消える**／素の √ に見える
- 積分 `∫₀²π` が崩れる・上下限が変
- Ellie が CSS/HTML を直してもキャプテン画面で治らない

## 根本原因（順位）

### 1. 正本（Git / C: workspace）が古かった【最大】
| 場所 | 状態（修正前） |
|------|----------------|
| `C:\...\Teaching-materials\fourier-transform` | Ellie 修正前。`escMath` なし・`.math-sqrt` CSS なし・P-COEFF 旧本文 |
| `G:\...\projects\teaching-materials\fourier-transform` | Ellie 作業あり |
| キャプテンが開くパス | どちらか不明 → **古い正本を見ると永遠に治らない** |

### 2. 描画経路の不一致
| フィールド | 修正前 | 問題 |
|------------|--------|------|
| story title/body, full_explain | 正本は `esc()` のみ | HTML タグが文字化け表示／√ 装飾なし |
| morph `html` | 生 `innerHTML` | √ は素文字のまま（データが plain） |
| morph `say` | `textContent` | 装飾不可 |
| morph `change` | `esc()` | √ 装飾なし |
| formula_html | 生 HTML | データに span があれば OK。plain √ は未整形 |
| lesson (app.js) | 生連結 | √ 装飾なし |

### 3. Ellie 版 `formatIntegral` のバグ
- `∫₀²π` を部分マッチし、**記号の後ろに `₀²π` が残る**（orphan）
- bare `∫` に架空の 0..2π を付けていた
- `∫₀<sup>2π</sup>` 混在 HTML を壊し得た

### 4. file:// キャッシュ
- `index.html` に cache-bust が無く、古い `proof_ui.js` / `app.css` が残る可能性

## 実施した対処（2026-07-24 r1）

1. **`formatRoot` / `formatIntegral` / `escMath` / `formatMathHtml` を根治**（orphan なし・hybrid 保護）
2. story / full_explain / morph(html,say,change) / formula 経路に適用
3. **app.js lesson** も `FT.escMath` 経由
4. **CSS** `.math-sqrt` 上棒を強化
5. **index.html** `?v=20260724r1` cache-bust
6. **G: ミラー ⇔ C: 正本** を hash 一致まで同期
7. `expl_pipeline.py all` で bundle 再生成

## キャプテン確認手順

1. **必ず正本を開く**  
   `C:\Users\ogaog\.antigravity\Nova\workspace\Teaching-materials\fourier-transform\index.html`
2. ブラウザで **Ctrl+F5**（強制再読込）
3. FT-COEFF-1 の「道のり」「もっとくわしく」「変形」で √ に上棒・∫ に上下限があること
4. まだ古いならアドレスバーの `proof_ui.js?v=` が `20260724r1` か確認

## 今後のルール
- 説明ブラッシュは G でも可だが、**表示バグ修正・push は正本 C: で完了**
- 同期向き: 作業後は **正本 ↔ 家を hash 確認**（片方だけ直さない）
