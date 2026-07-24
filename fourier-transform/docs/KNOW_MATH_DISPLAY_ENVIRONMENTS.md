# 知見: 数式をいろんな環境できちんと表示する

**日付:** 2026-07-25  
**プロジェクト:** fourier-transform（file:// HTML 教材）  
**関連:** `PLAN_MATH_DISPLAY_FUNDAMENTAL.md` / `tools/verify_math.py`

---

## 1. 結論（再利用の核）

```
正本 = 純 LaTeX
画面 = KaTeX（ローカル vendor）
推測変換はランタイムの主経路にしない
壊れたら赤く落とす（黙って部分表示しない）
出荷ゲート = 機械検証（目視だけに頼らない）
```

環境が増えるほど「ブラウザで見た」だけでは足りない。  
**コンパイル可能性**と**ソース方言の禁止**を CI 相当で固定する。

---

## 2. なぜ昨日まで直らなかったか

| 落とし穴 | 症状 | 対策 |
|----------|------|------|
| データ方言が混在 | Unicode / HTML `<sub>` / 生 TeX が同じ `formula_html` に同居 | 正本を純 LaTeX のみに統一 |
| `ωt` → `\omegat` | ギリシャを `\omega` に置換した直後に文字が接着 | データで `\omega t`。安全網は `{\omega}` |
| 複数描画経路 | proof は KaTeX、math_cards は生 HTML 差し込み | `FT.mathTex.renderFormulaHtml` 一本 |
| 検証が目視のみ | 直したつもりが別ノードで再発 | `verify_math.py` で全式 compile |
| 生成物の二重正本 | JSON だけ直して `data_bundle.js` 未更新 | `expl_pipeline.py all` 必須 |
| 方針ドキュメント衝突 | Unicode 上付き寄せ vs KaTeX | KaTeX に一本化（Unicode は歴史） |

---

## 3. 環境別チェックリスト

### 3.1 file://（ダブルクリック起動）

- CDN 禁止前提。`vendor/katex/`（**fonts 同梱**）を相対パスで読む
- CSS の `url(fonts/...)` が 404 だと四角・豆腐になる → fonts 欠落を疑う
- キャッシュ: `index.html` の `?v=` を上げ、確認は **Ctrl+F5**
- ES modules / fetch 必須にしない（本教材は classic script）

### 3.2 http(s)://（ローカルサーバ・GitHub Pages 等）

- 同じ相対パス構成なら file:// と同一
- 追加で MIME / キャッシュヘッダに注意（古い JS が残る）
- CSP がある場合は inline と KaTeX の eval 不要構成を維持（`renderToString` は HTML 文字列生成のみ）

### 3.3 Edge / Chrome / Safari

- HTML `<sup>`/`<sub>` は日本語 UI フォントで**ほぼ平ら**に見えることがある → **看板は KaTeX**
- 目視確認は最低 1 ブラウザ + 機械 verify（全式）

### 3.4 オフライン・教育現場 PC

- ネット無しでも動くことが要件なら vendor 同梱が必須
- 検証マシンでも `node` + ローカル `katex.min.js` で compile 可能にしておく

### 3.5 データ編集者（Ellie / 人間）の環境

- 編集は `data/explanations/P-*.json` の **LaTeX 文字列**
- 禁止: `ωt`, `·`, `／`, `<sub>`, 生の HTML
- 反映: `python tools/expl_pipeline.py all`
- 出荷前: `python tools/verify_math.py --strict-path`

---

## 4. 正しいデータの書き方（例）

```json
"formula_html": "y(t)=A\\cdot\\sin(\\omega t+\\phi)",
"formula_html_2": "\\omega=\\dfrac{2\\pi}{T}"
```

| やりがち | 正しい |
|----------|--------|
| `ωt` | `\\omega t` または `{\\omega}t` |
| `A · sin` | `A\\cdot\\sin` |
| `Σ<sub>n=1</sub><sup>N</sup>` | `\\sum_{n=1}^{N}` |
| `√(a²+b²)` HTML span | `\\sqrt{a_{n}^{2}+b_{n}^{2}}` |
| `K < N` | `K\\lt N` |
| 日本語混在 | `\\text{対辺}` |

複数行は `formula_html_2` … に分割（1 文字列に全角 `／` で無理に繋げない）。

---

## 5. 実装の型（他教材へ横展開）

1. **単一 API**  
   - display: `renderFormulaHtml(tex)`  
   - inline: `renderInline(text)`（`\\(...\\)` 優先）
2. **失敗は見える化**  
   - `.formula-error` + 生 TeX（黙ってプレーンテキストに落とさない）
3. **ゲート**  
   - 全 `formula_*` を KaTeX `throwOnError: true` で compile  
   - ソースに HTML / 禁止 Unicode があれば FAIL  
   - 出力に `.katex-error` / `\omegat` があれば FAIL  
   - 生 `formula_html` 差し込みパスがあれば FAIL（`--strict-path`）
4. **ホットスポット等の例外**  
   - クリック用 HTML は **KaTeX 看板と分離**（無理に同じ文字列に載せない）

---

## 6. コマンド（正本 cwd）

```powershell
cd fourier-transform
python tools/migrate_formulas_to_tex.py   # 必要なときだけ
python tools/expl_pipeline.py all
python tools/verify_math.py --strict-path
# ブラウザ: index.html を Ctrl+F5
```

GitHub 正本: `C:\Users\ogaog\.antigravity\Nova\workspace\Teaching-materials`  
家ミラー: `G:\マイドライブ\Nova\projects\teaching-materials\fourier-transform`  
同期向き: **正本 → 家**（家だけ直して push 忘れない）

---

## 7. Do / Don't

**Do**
- 数式の意味は LaTeX で書く
- 変更後は verify が緑になるまで push しない
- ギリシャのあとにラテンが続くときはスペース or `{}`
- fonts を vendor に含める

**Don't**
- 「画面で一箇所直した」だけで全体 OK とみなす
- ランタイムで Unicode→TeX を主経路にする
- `throwOnError: false` のまま未知コマンドを赤文字で放置
- JSON と `data_bundle.js` の片方だけ更新

---

## 8. 一行

> **環境差に耐える数式表示 = 純 LaTeX 正本 + ローカル KaTeX + 機械検証。目視は代表例だけ。**
