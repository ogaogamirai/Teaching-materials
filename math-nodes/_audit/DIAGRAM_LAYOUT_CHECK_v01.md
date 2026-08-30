# diagram.svg レイアウト検査 — 定式化 v01

更新: 2026-08-30  
対象: `math-nodes/<NODE-ID>/diagram.svg`（全ノード共通）

Captain レビューと一括監査（2026-08-30）で見つかった不具合を、**再発防止・新作時の再利用**のために整理した手順書。

---

## 1. 起こりやすい不具合（3類型）

| ID | 名称 | 典型例 | 原因 |
|---|---|---|---|
| **L1** | パネルはみ出し | 右側説明枠から数式・日本語が切れる | パネル幅固定のまま長文1行 |
| **L2** | 角度弧のずれ | 同位角・錯角の弧が交点から浮く | 弧 `path` を手置き座標で書いた |
| **L3** | 図エリアの重なり | ×2 と矢印、ラベルと注釈が重なる | 注釈を図形・他テキストと同座標に置いた |
| **L4** | 半径ベクトルのはみ出し | 単位円の動径が円周を突き抜ける | 角度は正しいが終点 y（または x）を別の動径から流用した |
| **L5** | 円弧矢じりずれ | 円周の色線の先の三角形が浮く・向きが違う | 弧の終点・接線方向を計算せず `polygon` を手置きした |

**L1・L2** は機械検出が比較的安定。**L3** は意図的配置と区別が必要（自動＋目視）。**L4** は単位円・極座標図で起きやすい（終点 = 中心 + r·(cos θ, −sin θ) で計算）。**L5** は大半径円弧（r≥50）＋隣接 `polygon` を `verify_svg_layout.py` が検出。

---

## 2. レイアウト設計ルール（新作時の予防）

### 2.1 キャンバスとパネル（L1 予防）

| 項目 | 推奨値 | 備考 |
|---|---|---|
| viewBox 幅 | `860` | 旧テンプレ `820` より余裕あり |
| 背景 `rect` 幅 | viewBox と同じ | |
| 右パネル | `x=548` `width=292` `height=336` 前後 | 下端はみ出し時は height を延ばす |
| パネル内テキスト起点 | `x=568` | 左マージン 20px |
| 区切り線 | `x2=824` 前後 | パネル右端 −12px |
| 長文 | **1行 24 全角字相当以内** | 超える場合は折り返し（2行）または `font-size` を 1px 下げる |

パネル内の数式・日本語は **推定右端 ≤ 828**（パネル右 840 − マージン 12）を目安にする。

### 2.2 角度弧（L2 予防）

小さな角度マーカー（半径 ≤ 50、`fill="none"`）は **頂点を中心に計算**する。

```
頂点 (cx, cy)、半径 r、辺上の2点 p1, p2 から:
  angle(p) = atan2(py−cy, px−cx)   ※ SVG: 0°=右, 90°=下, 時計回り正
  始点 = (cx + r·cos θ1, cy + r·sin θ1)
  終点 = (cx + r·cos θ2, cy + r·sin θ2)
  path: M 始点 A r r 0 0 sweep 終点
```

- 交点は `<circle r≤12>` または `<line>` の交点から取る
- 手計算の座標をそのまま `A` に書かない

### 2.4 円弧＋矢じり（L5 予防）

円周に沿う回転矢印（半径 **r ≥ 50**）は **弧の終点＝矢じりの先端**、向きは **接線方向**。

```
中心 (cx, cy)、半径 r、始角 t1 → 終角 t2（反時計回り CCW）:
  始点 = (cx + r·cos t1, cy − r·sin t1)
  終点 = (cx + r·cos t2, cy − r·sin t2)
  path: M 始点 A r r 0 0 0 終点        ← sweep=0 で CCW 短弧
  接線方向（終点）= atan2(−cos t2, −sin t2)
  矢じり: 先端＝終点、底辺は接線に垂直（後方へ size px）
```

**生成ヘルパー（推奨）:**

```powershell
cd math-nodes
python _audit\svg_arc_arrow.py --cx 290 --cy 240 --r 108 --t1 0 --t2 1.5708 --color "#0ea5e9"
```

モジュール `svg_arc_arrow.py` の `arc_path` / `arrow_polygon` / `arc_arrow_snippet` を使う。手置き `polygon` は禁止。

円と重なるときは弧半径を **r+6〜10** 外側にずらす（`HS2-TRIG-GENERALANGLE-01` と同型）。

### 2.5 注釈・ラベル（L3 予防）

| 要素 | ルール |
|---|---|
| 辺ラベル（3, 5, θ 等） | 辺から **≥ 12px** オフセット。辺の中点付近に置く |
| スケール注釈（×2 等） | **テキストと矢印を縦または横に分離**（間隔 ≥ 16px） |
| 単位円の動径 | 終点は **必ず** `(cx + r·cosθ, cy − r·sinθ)`（SVG は y 下向き） |
| 矢印 | 三角形 `polygon` は線の端。**テキスト bbox と重ねない** |
| 2図のあいだ | 注釈は **図と図の隙間**に置く（頂点上に置かない） |

**悪い例:** ×2 と破線矢印を同じ y 座標に置く → 重なる  
**良い例:** ×2 を上（y≈246）、矢印を下（y≈272）に分離（`JH-GEO-SIMILAR-01`）

---

## 3. 検査手順（量産・レビュー共通）

### Step A — 自動（必須）

リポジトリルート（`math-nodes/`）で:

```powershell
python _audit\verify_svg_layout.py
python _audit\render_svg_png.py
```

| スクリプト | 検出内容 |
|---|---|
| `verify_svg_layout.py` | L1 パネルはみ出し / L2 角度弧ずれ / L3 図エリア重なり / **L5 円弧矢じり** |
| `svg_arc_arrow.py` | 円弧＋矢じり座標生成（§2.4） |
| `render_svg_png.py` | Chrome 描画可否（46/46 PNG 出力） |

結果: `_audit/svg_layout_report.json`  
**合格:** `flagged: 0`（該当ノードのみ確認する場合は JSON の `overlap_issues` / `panel_overflow` / `arc_issues` を見る）

補助（XML 構文・空 text 等）:

```powershell
python _audit\verify_svg_static.py
```

### Step B — PNG 目視（L3 の最終確認）

`_audit/svg_png/<NODE-ID>.png` を開き、次を **10秒チェック**:

- [ ] 右パネルの最下行が枠内に収まっている
- [ ] 角度弧が交点・頂点を中心にしている
- [ ] 注釈（×2、矢印、補助文字）が互いに重なっていない
- [ ] 辺ラベルが辺と判別できる（読めるが重なりすぎない）

### Step C — Obsidian（Captain レビュー時）

1. `lesson.md` の Reading View で `diagram.svg` を表示
2. 表示が古い場合: タブを閉じる → `Ctrl+P` →「Reload app without saving」
3. SVG 内コメント `<!-- layout vN ... -->` で修正版か確認

---

## 4. 自動検出の解釈（誤検知の読み方）

`verify_svg_layout.py` の **L3（overlap）** は保守的に動く。

| 報告 | 多くは | 要対応 |
|---|---|---|
| `text on line: 'x'` / `'O'` | 座標軸ラベルが軸の近くにある（意図的） | 軸から離れすぎ・切れているとき |
| `text on dashed line` | 補助線の近くの説明 | 文字が線と重なって読めないとき |
| `text overlap: 'A' ↔ 'B'` | 近接ラベル | 実際に重なって読めないとき |
| `text on arrow` | 矢印とラベルが接触 | **要修正**（×2 型） |

**判断:** PNG 目視で読めなければ修正。意図的配置ならそのまま可（レポートに残ってもよい）。

---

## 5. 修正パターン早見表

| 不具合 | 修正 |
|---|---|
| L1 パネル右はみ出し | パネル `width` 拡大 + viewBox 拡大、または長文を2行に分割 |
| L1 パネル下はみ出し | パネル `height` 拡大、または行間を詰める |
| L2 弧ずれ | 頂点・半径・2辺方向から `path` を再計算（§2.2） |
| L3 注釈重なり | テキストと矢印を縦分離、または図間の隙間へ移動 |
| L3 辺ラベル | 辺から法線方向に 12–20px オフセット |
| L4 動径はみ出し | 終点を `(cx + r·cosθ, cy − r·sinθ)` で再計算 |
| L5 円弧矢じりずれ | `svg_arc_arrow.py` で path＋polygon を再生成（§2.4） |

一括パネル拡張（既存ノード群）: `_audit/fix_svg_layout.py`  
弧の再計算テーブル: 同スクリプト内 `ARC_FIXES`（ノード固有のときは追記）

---

## 6. 完了ゲートへの組み込み

`AUTHORING_STANDARD.md` §7「完了ゲート」に次を追加済み:

- [ ] `verify_svg_layout.py` で当該ノードに `flagged` 問題がない（または目視で意図的配置と確認済み）
- [ ] `_audit/svg_png/<NODE-ID>.png` で L1–L3 を目視確認した

**新作フロー（diagram あり）:**

```
lesson.md 下書き
  → diagram.svg 作成（§2 ルール遵守）
  → Step A 自動検査
  → 問題あれば §5 で修正
  → Step B PNG 目視
  → Obsidian 確認（Captain）
  → approved
```

---

## 7. 関連ファイル

| ファイル | 役割 |
|---|---|
| `_audit/verify_svg_layout.py` | L1/L2/L3/L5 自動監査 |
| `_audit/svg_arc_arrow.py` | 円弧＋矢じり生成・L5 検出 |
| `_audit/fix_svg_layout.py` | パネル拡張・弧再計算の一括修正 |
| `_audit/render_svg_png.py` | PNG 一括レンダ |
| `_audit/svg_layout_report.json` | 最新監査結果 |
| `_audit/svg_png/` | 目視用 PNG |
| `AUTHORING_STANDARD.md` §4, §7 | 作成基準・完了ゲート |

---

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-08-30 | v01 初版。L1–L3 類型化、自動手順、設計ルール、SIMILAR/PARALLEL 事例を反映 |
