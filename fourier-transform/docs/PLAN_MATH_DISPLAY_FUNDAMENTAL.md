# 計画: 数式表示の根本解決（KaTeX 一本化）

**日付:** 2026-07-25  
**対象:** `projects/teaching-materials/fourier-transform`  
**トリガ:** FT-WAVE-1 看板式が `sin(\omegat + φ)` のまま表示（キャプチャ確認）  
**方針:** 場当たりパッチ禁止。**正本フォーマット + 単一路線 + 検証ゲート**で根絶する。

---

## 0. 受け入れ条件（Done の定義）

| # | 条件 |
|---|------|
| A1 | FT-WAVE-1 看板が \(y(t)=A\sin(\omega t+\phi)\) / \(\omega=2\pi/T\) と **正しく**出る（バックスラッシュ・`omegat` 結合なし） |
| A2 | 全 proof ノード（23）の看板式 `formula_html*` が KaTeX でエラーなく display される |
| A3 | 学ぶ本文・morph・beats・記号表のインライン数式も同じエンジン経由（経路漏れゼロ） |
| A4 | `file://` + Edge/Chrome で Ctrl+F5 後も再現（CDN 依存なし・既存 `vendor/katex`） |
| A5 | データ変更時に **自動検証**（未知コマンド・空出力・変換失敗）が落ちる |
| A6 | まなびタイムズ準拠: displayMode・∑/∫ 上下限・指数は \(e^{i\theta}\), \(e^{i\cdot n\cdot x}\) |

**非目標（今回やらない）:** MathJax 導入、サーバ側 SSR、数式入力 UI、SVG 内の手書き曲線の再描画。

---

## 1. 現状の診断（なぜ直らないか）

### 1.1 キャプチャの直接原因（FT-WAVE-1）

データ正本（`P-WAVE.json`）:

```text
y(t) = A · sin(ωt + φ)　／　ω = 2π / T
```

`math_tex.js` の `htmlToLatex` が Unicode を機械置換する:

```text
ω  →  \omega
```

その結果 **`ωt` → `\omegat`**（コマンド名が `omegat` になり KaTeX が未知コマンドとして生表示）。  
これが画面の `sin(\omegat + φ)` そのもの。

| 入力断片 | 変換後 | KaTeX 結果 |
|---------|--------|------------|
| `ωt` | `\omegat` | 失敗（未知コマンド） |
| `ω t` または `{\omega}t` | `\omega t` / `{\omega}t` | 成功 ω·t |
| `φ` 単独 | `\phi` | 成功（φ に見える） |

→ **「ほぼ見えている」のに一箇所だけバックスラッシュが残る**典型パターン。

### 1.2 構造的な病（パッチが効かない理由）

```
                    ┌─ Unicode 混在  (P-WAVE: ωt · φ)
  formula_html  ────┼─ HTML タグ     (P-SERIES: <sub>/<sup>)
  （名前が html）    ├─ 生 LaTeX      (P-EULER / P-COMPARE)
                    └─ ハイブリッド   (P-COEFF: span.math-sqrt + sub)
                              │
              htmlToLatex / formatTexScripts / unicode sup
              （推測変換が二重・三重）
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   math_tex (KaTeX)    proof_ui (Unicode fallback)  math_render (生 HTML 注入)
```

1. **正本フォーマットが無い** — 同じキーに 3〜4 方言が同居。  
2. **推測変換が本体** — `ω→\omega` のような置換は、後続文字の境界を知らない。  
3. **描画経路が複数** — 直したつもりでも別経路が古い見た目を出す。  
4. **方針ドキュメントが衝突**  
   - `MATH_DISPLAY_ROOT_CAUSE.md` … Unicode 上付きへ寄せる  
   - `MATH_STYLE_MANABITIMES.md` … LaTeX + KaTeX  
   → 実装が両方を抱え、どちらも中途半端。  
5. **検証ゲートが無い** — 壊れた式が目視まで到達する。

### 1.3 これまでの「r5〜r12」が足りなかった点

- 症状（平らな sup、√、個別ノード）への局所修正は有効だったが、  
  **「データ方言 × 変換器 × 複数経路」** を解いていない。  
- WAVE のような「Unicode ギリシャ + 隣接ラテン」は、変換器を直しても  
  **次のノードで別パターンが再発**する。

---

## 2. 根本方針（決定事項）

### 決定 D1 — 正本は **LaTeX のみ**

| キー | 中身 | 例 |
|------|------|-----|
| `formula_html`（互換名のまま） | **純 LaTeX 文字列**（`$` なし） | `y(t)=A\\sin(\\omega t+\\phi)` |
| `formula_html_2` … | 同上（複数行は分割） | |
| 本文・morph・beats | インラインは `\\(...\\)` または限定マクロ | 下記 D3 |

- HTML タグ・Unicode 上付き・`·` `／` 混在は **データから追放**。  
- キー名 `formula_html` は後方互換のため残すが、中身は HTML ではない（将来 `formula_tex` へリネーム可・任意）。

### 決定 D2 — 描画エンジンは **KaTeX のみ**（ローカル vendor）

- display: `katex.renderToString(tex, { displayMode: true })`  
- inline: 同上 `displayMode: false`  
- 失敗時は **赤いエラーボックス + 生 TeX**（黙って部分表示しない）  
- Unicode-sup フォールバック経路は **削除または開発時のみ**（本番 UI に出さない）

### 決定 D3 — インラインの書き方を 2 択に固定

**推奨 A（明確）:** 区切り子

```text
波の式は \\( y(t)=A\\sin(\\omega t+\\phi) \\) です。
```

**許容 B（短い記号のみ）:** ホワイトリストトークンを KaTeX 化  
`\\omega`, `\\phi`, `\\pi`, `\\theta`, `sin`, `cos`, `e^{...}`, `a_n` 等 —  
**新規の推測正規表現は増やさない。** 既存 `renderInline` は縮小する。

### 決定 D4 — 変換器 `htmlToLatex` は「移行ツール」に降格

- ランタイムの主経路から外す。  
- データ移行スクリプトとして一度走らせ、結果を JSON に書き戻す。  
- ランタイムに残すなら **厳格モード**: 変換後に未知コマンドがあれば throw / エラー表示。

### 決定 D5 — 単一路線 API

| 用途 | 唯一の入口 |
|------|-----------|
| 看板（display） | `FT.mathTex.renderFormulaHtml(tex)` ※中身は純 TeX 前提に簡略化 |
| インライン | `FT.mathTex.renderInline(text)` ※`\(...\)` 優先 |
| それ以外 | **禁止**（`innerHTML = formula_html` 直接挿入を grep で禁止） |

`math_render.js` / `readings.js` / `proof_ui.js` は上記 API のみ呼ぶ。

---

## 3. 実装フェーズ

### Phase 0 — 凍結ルール（作業開始前・30 分）

- [ ] 本計画を正とする（Unicode 全面寄せ案は破棄）。  
- [ ] `MATH_DISPLAY_ROOT_CAUSE.md` 冒頭に「superseded by PLAN_MATH_DISPLAY_FUNDAMENTAL」を追記。  
- [ ] 新規 explanation JSON は **LaTeX のみ** で書く（Ellie/Nova 共通）。

### Phase 1 — ランタイムを「純 TeX 前提」に矯正（半日）

**目的:** 変換バグをランタイムから消す。

1. **`math_tex.js` 簡略化**
   - `renderFormulaHtml(tex)`:
     - 入力を **すでに LaTeX** とみなす（`htmlToLatex` を通さない）
     - `polishLatex` はスタイル整形のみ残す（`inx`→`i\cdot n\cdot x` 等）
     - `throwOnError: true`（または false でも出力に `.katex-error` があれば失敗扱い）
     - 失敗時 UI:  
       `<div class="formula-error">数式エラー: …</div>` + 生 TeX
   - ギリシャ結合の応急は **データ側で `\omega t`** と書く（コードで `ω` を置換しない）

2. **経路の一本化**
   - `proof_ui.renderFormulaBlock` → 既に `mathTex` 呼び出し済み。unwrap ロジック維持。  
   - `math_render.renderMathCard` / `renderChapter`:  
     `formula_html` を **必ず** `FT.mathTex.renderFormulaHtml` 経由に変更（生差し込み禁止）。  
   - `readings.formulaWithRead` も同様。

3. **キャッシュバスティング**  
   - `index.html` の `?v=` を一括更新（例 `20260725m1`）。

**ゲート G1:** 手動で P-EULER / P-COMPARE（既に純 TeX）が崩れないこと。  
P-WAVE はまだ Unicode なので、Phase 2 まで看板はエラー表示でも可（「壊れていると分かる」方が良い）。

### Phase 2 — データ全量を純 LaTeX に正規化（半日〜1 日）

**目的:** 方言を根絶。

1. **移行スクリプト** `tools/migrate_formula_to_tex.mjs`（または `.py`）
   - 入力: `data/explanations/P-*.json`
   - 処理:
     - 既存の改良版 `htmlToLatex` を **オフライン**で実行
     - **必須後処理:**  
       `\\omega(?=[A-Za-z])` → `\\omega `（他: theta, phi, pi, alpha, … 全ギリシャ）  
       `\\sin(?=[A-Za-z(])` 等は KaTeX が関数として扱うので `\\sin(` 形を保証
     - 全角 `／` → `\\quad/\\quad` または式を `formula_html` / `_2` に分割
     - `·` → `\\cdot`
   - 出力: JSON 上書き + 差分レポート `docs/_migrate_formula_report.md`
   - 各式を Node 上で KaTeX コンパイル（`npx katex` または jsdom + vendor）

2. **人手レビュー優先リスト**（自動では危ない）

| 優先 | ファイル | 理由 |
|------|----------|------|
| P0 | P-WAVE | 本件キャプチャ |
| P0 | P-CIRCLE, P-RAD, P-SUPER | 同様の ωt パターン |
| P1 | P-SERIES, P-ORTHO, P-COEFF, P-APP | sub/sup/√ HTML |
| P1 | P-DIFF, P-INTEG, P-INT, P-MACLAURIN | 混在 |
| P2 | P-EULER, P-COMPARE, P-COMPLEX, P-POLAR, P-E | 既に TeX寄り・確認のみ |
| P2 | 本文 story/full_explain/morph | インライン |

3. **WAVE 正解例（書き直し見本）**

```json
"formula_html": "y(t) = A \\cdot \\sin(\\omega t + \\phi)",
"formula_html_2": "\\omega = \\dfrac{2\\pi}{T}"
```

### Phase 3 — インライン本文の整備（半日）

1. `renderInline` を縮小:
   - 第一: `\(...\)` / `$...$`（後者はデータに無いなら未使用で可）
   - 第二: 既存の限定パターン（`e^{...}`, ∑, ∫）のみ残す  
   - Unicode `ω` の自動 TeX 化は **しない**（本文も `\omega` か `ω` をそのまま文字として出すか選択。数式意味なら TeX 区切り必須）

2. morph_steps の `<b>y = A · sin(ωt)</b>` 等を  
   `y = A \\cdot \\sin(\\omega t)` を `\(...\)` で囲む形へ。

3. geometry.beats は短文のため、記号だけなら Unicode 表示も可。  
   **数式が続く beats だけ** TeX 化する（全部無理に TeX にしない）。

### Phase 4 — 検証ゲート（必須・半日）

1. **`tools/verify_math.mjs`**
   - 全 `P-*.json` の `formula_html*` を KaTeX で compile
   - 失敗一覧を exit code 1 で出力
   - オプション: proof 本文から `\\[a-zA-Z]+` を抽出し、看板外の生 TeX 漏れを検出

2. **ビジュアル確認チェックリスト**（キャプテン or Nova）

| ノード | 見る場所 | 期待 |
|--------|----------|------|
| FT-WAVE-1 | 学ぶ・看板 | ωt が分離、φ が φ |
| FT-SERIES-1 | 看板 | Σ の上下限 |
| FT-COEFF-1 | 看板 | √(a²+b²) |
| FT-ORTHO-1 | 看板 | ∫ の 0〜2π |
| FT-EULER-1 | 看板 | e^{iθ} |
| FT-COMPARE-1 | 複数行 | 実数/複素が別行で明瞭 |
| FT-MACLAURIN-1 | 看板 | 階乗・上付き |

3. **回帰**  
   - `?v=` 更新後 Ctrl+F5  
   - file:// で KaTeX CSS（fonts）が 404 でないこと（`vendor/katex/fonts` の有無を確認。無ければ CDN ではなく fonts 同梱を追加）

### Phase 5 — 掃除と文書固定（数時間）

- [ ] `proof_ui` の巨大な Unicode SUPER_MAP 経路を、本番から切り離し（`formatMathHtmlLocal` は test only）  
- [ ] `MATH_STYLE_MANABITIMES.md` を「正本の書き方」に更新  
- [ ] `MATH_DISPLAY_ROOT_CAUSE.md` を歴史文書化  
- [ ] Ellie 向け 1 枚: 「explanation の数式は LaTeX のみ。ωt は `\omega t`」  
- [ ] knowledge に 1 件: `KNOW-PROCESS-MATH-TEX-ONLY`

---

## 4. 作業分担案

| 役割 | 担当 | 内容 |
|------|------|------|
| 設計・ランタイム | Nova | Phase 1, 4, 5 |
| データ移行スクリプト | Nova (coder) | Phase 2 ツール |
| JSON 目視・教育上の式の正しさ | Ellie / Captain | Phase 2 レビュー、Phase 4 目視 |
| 最終 OK | Captain | A1–A6 |

DELM を使う場合:

1. **researcher** — 全 `formula_html` 方言の棚卸し表（1 ページ）  
2. **coder** — Phase 1 ランタイム + migrate/verify スクリプト  
3. **verifier** — verify_math 全緑 + WAVE/COEFF/COMPARE の表示確認観点

Ariadne: JS の `renderFormulaHtml` / `formula_html` 参照の呼び出し一意性確認に使用（索引は一度）。

---

## 5. リスクと回避

| リスク | 回避 |
|--------|------|
| 移行スクリプトが式を壊す | レポート + KaTeX コンパイル必須。失敗は手修正キュー |
| fonts 欠落で file:// が四角になる | `vendor/katex` に fonts を同梱、CSS の url を確認 |
| 本文まで一気に触りすぎる | Phase 2 は看板のみ → Phase 3 で本文 |
| キャッシュで古 JS | `?v=` 一括 + 確認手順に Ctrl+F5 を明記 |
| Ellie がまた Unicode で書く | `_meta.json` + 検証スクリプトで CI 的に拒否 |

---

## 6. スケジュール目安

| 日 | 成果 |
|----|------|
| Day 1 前半 | Phase 0–1（ランタイム純 TeX、経路一本化） |
| Day 1 後半 | Phase 2 P0（WAVE/CIRCLE/RAD/SUPER）+ verify |
| Day 2 前半 | Phase 2 残り看板 + Phase 3 主要 morph |
| Day 2 後半 | Phase 4 全ノード目視、Phase 5 文書、Captain 受け入れ |

ブロッカーが「fonts 欠落」または「特定式の数学的表記ゆれ」だけの状態になれば、表示バグとしてはクローズ可能。

---

## 7. 最初の具体パッチ（実装着手時の順番）

実装開始時は **計画承認後** に以下の順で小さく着地する:

1. `P-WAVE.json` の `formula_html` / `_2` を上記見本の純 TeX に手修正（即効・デモ用）  
2. `math_tex.renderFormulaHtml` から `htmlToLatex` を外す（純 TeX 前提）  
3. `math_render.js` の生差し込みを API 経由に  
4. `tools/verify_math` で P-WAVE が緑  
5. 全 JSON 移行スクリプト  
6. インライン・掃除

---

## 8. 一行の原則（チーム共有）

> **数式の正本は LaTeX。画面は KaTeX。推測変換は移行時だけ。壊れたら赤く落とす。**

これ以外の「見え方パッチ」は原則マージしない。
