# 実装仕様書 v0.1 — フーリエ縦一列 MVP（実装前）

> **Status:** MVP 実装済（2026-07-23）  
> 受け入れ条件・画面・データ契約の正本。実装は `index.html` + `js/` + `data/`。

---

## 1. MVP スコープ

### 1.1 含む（Must）

| ID | 内容 |
|----|------|
| S1 | スキルグラフに沿った **画面フロー**（HOOK→…→CAP） |
| S2 | 入口診断 UI（自己申告 + 確認1問） |
| S3 | マスタリーの localStorage 保存 |
| S4 | 各 core ノードの Interact + 必須 Checks（数式キーボードなし） |
| S5 | Teach-Back 6欄テキスト（ノード短＋CAP本番） |
| S6 | 画像Hookメタファ（教育用。真のJPEGエンコーダ不要） |
| S7 | CIRCLE/SERIES: 既存 epicycloid デモの拡張（予測・成分ON/OFF） |

### 1.2 含まない（Not now）

- 汎用エンジンの完全抽象化（他単元プラグイン）
- アカウント・サーバ同期・LLM採点必須化
- 音声Teach-Back
- 複素経路の必須化（EULER/TRANSFORMはルート外の「続き」）
- 数式自由入力ゲート
- 本格DFT/JPEGライブラリ依存

### 1.3 Phase 2 候補

- 音フィルタHook
- EULER/TRANSFORM 正式編入
- `data/*.json` 駆動の汎用Router抽出
- GitHub Pages 最適化・アクセシビリティ監査

---

## 2. 情報アーキテクチャ（画面）

```
/ (shell)
  ├─ onboarding/diagnostic
  ├─ map                 … 現在地・残りノード
  ├─ node/:id
  │    ├─ reveal
  │    ├─ interact
  │    ├─ check/:itemId
  │    └─ teachback
  ├─ capstone            … FT-CAP-1
  └─ complete            … チートシート出力
```

MVPは **SPA単一HTML+modules** または **複数HTML+共通app.js** どちらでも可。  
既存 `index.html` は `node/FT-CIRCLE-1` および `FT-SERIES-1` の interact 核として吸収。

---

## 3. データ契約

### 3.1 ファイル配置案

```
fourier-transform/
  index.html              # shell
  css/app.css
  js/
    app.js                # router, mastery
    diagnostic.js
    teachback.js
    items/                # または data/checks.json
    demos/
      hook_image.js
      wave.js
      circle_series.js    # 現行canvas進化
      ortho.js
      coeff.js
      app_compress.js
  data/
    skill_graph.json      # SKILL_GRAPH.md から生成
    checks.json           # CHECK_ITEMS.md から生成
    copy_ja.json          # Reveal文言
  nodes/                  # 設計原稿（実装はdataへ）
  LEARNING_DESIGN.md …
```

### 3.2 mastery レコード（localStorage key: `ft_mastery_v1`）

```json
{
  "version": 1,
  "mode": "deep",
  "nodes": {
    "FT-WAVE-1": { "state": "mastered", "level": 3, "fails": 0, "updated": 0 }
  },
  "diagnostic": { "conf_trig": true, "D-TRIG-01": "pass" },
  "tb_drafts": { "FT-CAP-1": { "r1": "...", "...": "..." } }
}
```

### 3.3 Router API（論理）

```
nextNode(mastery, graph) -> nodeId | "COMPLETE"
onCheckResult(nodeId, itemId, pass)
onTeachbackSubmit(nodeId, payload) -> { pass, rubric }
```

規則は SKILL_GRAPH.md §5 に従う。

---

## 4. デモ仕様（核）

### 4.1 Hook 画像（教育用）

- 入力: 組み込みサンプル画像（1枚、ライセンス明記）
- 処理:  
  - 簡易: 空間ローパス（box/gaussian）を「高周波カット量」にマップ **または**  
  - 1D: 選択した行のプロファイルに低次フーリエ近似
- 表示: 画像 + 「残している周波数」バー（相対表示で可）
- **禁止:** 「これは実JPEGです」と誤解させるコピー。必ず「直感モデル」と明記

### 4.2 Circle / Series（既存拡張）

| 機能 | 優先 |
|------|------|
| N, speed スライダ | 既存 |
| 成分ON/OFF | P0 |
| Ghost予測（実行前オーバーレイ） | P0 |
| 半径＝係数の手動対応 | P0（COEFFでも使用） |
| 式ホットスポット | P1 |
| 方形以外のターゲット波 | P2 |

### 4.3 Ortho

- 2波形、積の可視化、スカラバー
- 周波数オフセットスライダ

### 4.4 App 圧縮

- 係数ベクトルをスライダでゼロ化 → 1D再構成を画像行に戻す、または2D簡易

---

## 5. Check / Teach-Back UI

- 選択肢は大きいタップターゲット（モバイル考慮）
- 数式は KaTeX **表示のみ**（入力欄に数式エディタを置かない）
- Teach-Back: 6 textarea + チップ行 + 「模範と比較」
- 不合格時: どのノードに戻るか1ボタンで提示

---

## 6. コピー（トーン）

- です・ます調、短文、煽りすぎない
- 中3が読める語彙。専門語は初出で日常語併記
- 複素は CAP 前に出さない（注記で「後で出てくる表記」程度は可）

---

## 7. 受け入れ条件（実装完了の定義）

1. 診断→主経路→CAP をクリーン状態で通し、TB合格まで到達できる  
2. conf_trig=no で RATIO が挿入される  
3. どの Check も数式自由入力を要求しない  
4. リロード後も mastery が復元される  
5. CAP 合格後のみ EULER へのリンクが見える  
6. LEARNING_DESIGN の非目標（偏差値・一本道強制）に反するUIがない  

---

## 8. 実装順序（推奨スプリント）

| Sprint | 成果 |
|--------|------|
| A | shell + mastery + graph JSON + map |
| B | diagnostic + HOOK demo + WAVE |
| C | CIRCLE/SERIES 拡張（予測・ON/OFF） |
| D | SUPER, ORTHO, COEFF |
| E | APP 画像再接続 + CAP + TB |
| F | RATIO 分岐 + 研磨 + Pages |

---

## 9. リスクと緩和

| リスク | 緩和 |
|--------|------|
| 「偽JPEG」への批判 | コピーで教育モデルと明記、APPで係数言語に回収 |
| 直交が抽象的 | 必ずバーと積の視覚から入る |
| TBが書けない | チップ作文でL1までは救済、L3は短文必須 |
| スコープ膨張 | EULER以降を切断、Not now 厳守 |

---

## 10. 設計正本とのトレーサビリティ

| 仕様 | 正本 |
|------|------|
| 原則・決定 | LEARNING_DESIGN.md |
| ノード・経路 | SKILL_GRAPH.md |
| 問題形式 | CHECK_ITEMS.md |
| TB | TEACHBACK_TEMPLATE.md |
| 文言・操作詳細 | nodes/*.md |

---

*Implementation Spec v0.1 — 2026-07-23 Nova（コード未着手）*
