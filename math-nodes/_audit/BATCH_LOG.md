# math-nodes バッチ検証ログ

更新: 2026-08-30

## 修正済み（検証で発見 → 修正）

| ノード | 内容 | 日付 |
|---|---|---|
| `JH-NUM-SIGN-01` | 「まずやってみる」(a) 5°→−3° = 8度下がる | 2026-08-30 |
| `JH-GEO-ROTATION-01` | 回転の正負：+90°CCW = −90°CW | 2026-08-30 |
| `JH-GEO-SIMILAR-01` | P0：30-60-90 の短辺/斜辺 = 1/2 に統一 | 2026-08-30 |
| `JH-GEO-TRI-BASIC-01` | よくある取り違え：誤った √(底×高)/2 表記を修正 | 2026-08-30 |
| `HS1-TRIG-AREA-01` | 入口文の高さ式・図リンク前の誤植削除 | 2026-08-30 |
| `HS2-CALC-DIFF-POLY-01` | 頂点 f'(-1)=0（f'(0)=2 と区別） | 2026-08-30 |

## バッチ進捗

| バッチ | ノード群 | 件数 | 結果 |
|---|---|---|---|
| B1 | ELEM-* + JH-NUM/ALG/COORD | 8 | ✅ PASS（JH-NUM-SIGN 修正済） |
| B2 | JH-GEO + JH-COORD + JH-FUNC | 10 | ✅ 7 PASS + 3 修正済 |
| B3 | HS1-TRIG-* | 7 | ✅ 6 PASS + 1 修正済 |
| B4 | HS2-* | 13 | ✅ 12 PASS + 1 修正済 |
| B5 | HS3 + UNIV + EULER | 8 | ✅ 8 PASS |

**合計:** 46/46 構造OK · 数学スポット 46/46 完了 · P1 修正 6件

## P2（任意・未修正）

| ノード | 内容 | 状態 |
|---|---|---|
| HS2-TRIG-GENERALANGLE-01 | C3「対象性」→「対称性」 | ✅ 修正済 |
| HS2-TRIG-GRAPH-01 | 前提表 RADIAN「未作成」表記 | ✅ 修正済 |
| HS2-TRIG-RADIAN-01 | 自己評価「抵抗」→「理解」 | ✅ 修正済 |
| HS2-COMPLEX-NUM-01 | まずやってみる i²⁰ 表記 | ✅ 修正済 |
| HS3-COMPLEX-DEMOIVRE-01 | ω 表記の括弧 | ✅ 修正済 |
| HS3-CALC-E-DEF-01 | L(a) ヒューリスティック | 保留（draft 許容） |

## メタデータ

- [x] 14ノード `ontology_snapshot_sha256` → `9DC454...` 一括同期（2026-08-30）

## Phase 4 — SVG

- [x] 静的監査 `verify_svg_static.py` — 46/46、WARN 8ノード（空 `<text>` のみ・描画影響小）
- [x] Chrome headless PNG 一括 `render_svg_png.py` — **46/46 成功** → `_audit/svg_png/`
- [x] 目視スポット（JH-NUM-SIGN, ELEM-RATIO, HS2-GRAPH, HS1-UNITCIRCLE）— 切れ・重なりなし
- [x] **レイアウト監査** `verify_svg_layout.py`（パネルはみ出し＋角度弧ずれ）— 初回 33/46 フラグ
- [x] **一括修正** `fix_svg_layout.py` — 29 ノードパネル拡張（viewBox 860・panel 292px）、8 ノード角度弧再計算
- [x] 手修正 4 ノード（長文折り返し）: `HS2-CALC-DIFF-POLY-01`, `HS3-CALC-HIGHER-DIFF-01`, `JH-ALG-QUADRATIC-01`, `JH-GEO-TRI-BASIC-01`
- [x] 再監査 **46/46 PASS** → `_audit/svg_layout_report.json`
- [x] **重なり検出**（図エリア内: テキスト同士・破線/注釈線・矢印）を `verify_svg_layout.py` に追加

## 未了（プロセス）

- [ ] Obsidian Reading View 確認 — Phase 5（Captain 推奨）
- [ ] status: draft → approved（Captain 判断）
