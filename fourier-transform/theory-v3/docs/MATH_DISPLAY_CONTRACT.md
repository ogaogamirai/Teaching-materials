# 数式表示契約（theory-v2）

> **一行:** 純 LaTeX 正本 + Markdown 前の math_protect + ローカル KaTeX + 機械検証。目視は代表例だけ。  
> **由来:** 教材プレイブック §3.2 / SD `math_protect.py` / fourier `KNOW_MATH_DISPLAY_ENVIRONMENTS.md`  
> **日付:** 2026-08-11（レビュー HTML 再発を契機に theory-v2 へ移植）

---

## 0. なぜこの文書があるか

数式表示で何度もハマった。知見はあったのに、**作成モードに吸い込まれて検証モードへ切り替わらなかった**（教材プレイブック §1）。

theory-v2 のレビュー HTML は「知見にアクセスしやすくする」ための薄い入口でもある。  
**ここを読めば、どこに正本知見があるか・ビルドで何を守るかが分かる。**

---

## 1. 正本知見（読む順）

| 優先 | 文書 | 中身 |
|------|------|------|
| 1 | [`archive/interactive-v1/docs/KNOW_MATH_DISPLAY_ENVIRONMENTS.md`](../../archive/interactive-v1/docs/KNOW_MATH_DISPLAY_ENVIRONMENTS.md) | 環境別チェック・Do/Don't・一行結論 |
| 2 | [`archive/interactive-v1/docs/PLAN_MATH_DISPLAY_FUNDAMENTAL.md`](../../archive/interactive-v1/docs/PLAN_MATH_DISPLAY_FUNDAMENTAL.md) | 純 LaTeX + KaTeX 一本化の決定 |
| 3 | `system-dynamics/tools/math_protect.py` | MD→HTML の保護パイプ（theory-v2 に移植済） |
| 4 | J.T. `memory/aether_know_teaching_materials_playbook_v01.txt` §3.2 | 作成時／検証時の使い分け |

歴史メモ（superseded）: `MATH_DISPLAY_ROOT_CAUSE.md`（Unicode 上付き寄せ案 → 破棄）

---

## 2. theory-v2 での契約

| 項目 | 決め |
|------|------|
| 正本 | `chapters/*.md` の **純 LaTeX**（`\(...\)` / `$$...$$`）。Unicode 数学記号を混ぜない |
| MD→HTML | `tools/math_protect.py` で退避→Markdown→復元（`_` 斜体化・`\(` 食いを防ぐ） |
| 描画 | **ローカル** `review/vendor/katex/`（archive からビルド時コピー）。**CDN 禁止** |
| 日本語 in math | `\text{対辺}`。CSS で `.katex .text` を本文ゴシックに。display は `<div class="math-block">`（`<p>` に入れない）。**`.katex-display` に overflow:auto を付けない**（overflow-x だけ指定すると y も auto になり、分数がスクロール枠に切れる） |
| file:// | fonts 同梱・相対パス・Ctrl+F5。オフライン前提 |
| 出荷ゲート | `python tools/verify_review_html.py`（integrity + node KaTeX compile + 長い1行 display） |
| 目視 | Captain は代表箇所だけ。全式は verify に任せる |

### 書き方（作成時）

```markdown
インライン: \(\sin\theta\)、\(A\sin(\omega t+\phi)\)
ブロック:
$$
y(t)=A\sin(\omega t+\phi)
$$
ギリシャのあとにラテン: `\omega t` または `{\omega}t`（`\omegat` 禁止）
日本語ラベル: `\text{対辺}`（ビルド時に未ラップ分は math_protect が補助）
長い display: `align*` / `aligned` で折り返す。ソースの改行だけでは KaTeX は1行のまま
```

### 長い式の折り返し（レンダリング時）

`$$` 内の改行は **Markdown の見た目だけ**。KaTeX は 1 行に組む。  
折り返すには `align*` / `aligned` と行末 `\\`。`align` だけ付けて `\\` が無いのも 1 行。

知見: J.T. `memory/aether_know_katex_display_wrap_v01.txt` / Aether `KNOW-KATEX-DISPLAY-WRAP-20260811`

### やってはいけない（Don't）

- CDN の KaTeX を HTML に直書きする（`file://` で死ぬ）
- Markdown 変換の前に数式を保護しない
- 「画面で一箇所直した」だけで全体 OK
- Unicode `ωt` / `·` / `<sub>` を正本に混ぜる
- verify を飛ばしてレビュー依頼する
- `.katex-display` に `overflow-x: auto` だけ足して「横は直った」とみなす（縦も枠になる）
- 長い式をソース上で改行しただけで「折り返した」とみなす（`align` が要る）
- はみ出しを横スクロール枠で逃がす
- 表示欠けをその場の CSS 1行パッチで繰り返し直す（契約・ゲートに上げない）
- Python の raw 文字列 `r"""` にレビュー HTML と同じ `\\\\(` をコピーする（HTML 上は `\\\\(` になり、`\\(` が生表示のまま）
- 見出し・本文で生の `<`（例: `0<h<\pi/2`）を書く。HTML がタグ開始とみなし **見出しが途中で切れる**。比較は `\lt` / `\gt`（例: `\(0 \lt h \lt \pi/2\)`）

---

## 3. コマンド

```powershell
cd theory-v2
python tools/build_review_html.py
python tools/verify_review_html.py
python tools/build_book_html.py
python tools/verify_review_html.py --html book/index.html
# ブラウザ: review/test.html または book/index.html を Ctrl+F5（ネット不要）
# 目視サンプル: 分数＋日本語（A2 §7 cos 定義）がスクロール無しで全体見えること
```

---

## 4. 再発した症状 → どの知見か

| 症状（2026-08-11） | 原因 | 既知の対策 |
|-------------------|------|------------|
| `(\sin)` と生表示 | Markdown が `\(` をエスケープ食い | math_protect（プレイブック L1） |
| `$$...$$` が生のまま | CDN が `file://` で読めない | ローカル vendor（KNOW §3.1） |
| 分数＋日本語が枠で切れ、スライドしないと読めない | `$$` が `<p>` 内 + `overflow-x:auto`→仕様上 y も auto | `<div class="math-block">` + `overflow: visible`。verify で `<p>$$` 残存を禁止 |
| `\( \sin \)` が生表示（学習用 HTML） | `r"""` テンプレに `\\\\(` を入れて区切りが `\\\\(` になった | 生文字列では `"\\("`。verify が過エスケープを落とす |
| 「直したつもり」 | ゲート無しで目視のみ | `verify_review_html.py`（KNOW §5） |
| 長い式が本文幅からはみ出す | ソース改行だけでは KaTeX は1行 | `align*` で折り返す。verify が長い1行 display を落とす |

---

## 5. コスト教訓（旧フーリエで高くついた型）

Captain 確認（2026-08-11）: **この手の表示修正を何度も繰り返したことが、過去のフーリエ教材コスト跳ね上がりの一因**だった。

| 高くつくやり方 | 安く済むやり方 |
|----------------|----------------|
| 症状ごとに CSS / 1式を場当たり修正 | 契約1枚に症状→原因→禁止を書く |
| 「見えた／見えない」を会話だけで回す | build → **verify 緑** → 代表目視 |
| 表示トラブルを本文執筆と同時並行で延々 | 表示パイプを先にゲート化し、本文は正本 MD に集中 |
| 知見は archive の奥にだけある | **作業パス**（本契約・review README）に入口を置く |

**型:** 数式表示の不具合は「見た目の微修正」ではなく **パイプライン欠陥**。同じクラスの修正が2回目に入ったら、契約と verify に昇格させる（3回目の場当たりを禁止）。

---

## 6. 一行（再掲）

> **環境差に耐える数式表示 = 純 LaTeX 正本 + ローカル KaTeX + 機械検証。レイアウト欠けも契約化。目視は代表例だけ。**
