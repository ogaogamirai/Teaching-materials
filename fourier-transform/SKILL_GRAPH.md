# Skill Graph v1 — フーリエ縦一列（実数主経路）

> **決定:** D1画像 / D2実数→複素後段 / D4申告+1問 / D5縦一列  
> **案B:** RAD のみ独立前提。PYTH/SUM/INT は章フラグ（Phase B で本文）  
> **完了点:** `FT-CAP-1` で L3（テキスト Teach-Back）  
> **状態語彙:** `unknown | learning | mastered | struggling | stale | skipped`  
> **実装:** Phase A 済（graph v1.1 / router / 診断キー）

---

## 1. グラフ概観

```
                    ┌─ FT-RATIO-1（条件）— 三角+単位円+三平方ハブ
                    │
                    ├─ FT-RAD-1（条件・案B独立）
                    │
FT-HOOK-1 → FT-WAVE-1 → FT-CIRCLE-1 → FT-SUPER-1 → FT-SERIES-1〔Σ章〕
                                                      │
                                                      ▼
FT-CAP-1 ← FT-APP-1 ← FT-COEFF-1〔積分意味章〕 ← FT-ORTHO-1
   │
   └──(任意)→ FT-EULER-1 → FT-TRANSFORM-1
```

| 区分 | ノード | MVP必須 |
|------|--------|---------|
| 主経路 | HOOK, WAVE, CIRCLE, SUPER, SERIES, ORTHO, COEFF, APP, CAP | ✅ |
| 補修独立 | RATIO, **RAD** | 診断/失敗時 |
| 章フラグ | sum@SERIES, int@COEFF, pyth@RATIO | 診断で強調 |
| 拡張 | EULER, TRANSFORM | ❌（実数完走後） |

---

## 2. ノード定義表

| id | title | 目標L | hard前提 | soft前提 | 主I-pattern | checks | remediation |
|----|-------|-------|----------|----------|-------------|--------|-------------|
| FT-HOOK-1 | 画像は波の束：JPEG直感 | L1 | — | — | Dual:画像+スペクトル棒 | C-HOOK-01, C-HOOK-02 | — |
| FT-WAVE-1 | 波の三要素 | L3 | HOOK | — | Scrubbable 1D行 | C-WAVE-01..03 | — |
| FT-RATIO-1 | 三角比・単位円・三平方ハブ | L2 | — | WAVE | 直角三角形ホットスポット | C-RATIO-01,02 | — |
| FT-RAD-1 | ラジアンミニ（案B） | L2 | — | WAVE | 度↔rad 対応 | C-RAD-01,02 | RATIO |
| FT-CIRCLE-1 | 円の回転がサインを生む | L3 | WAVE | RATIO,RAD | Dual Canvas 円⇔波 | C-CIRC-01..03 | RAD, RATIO |
| FT-SUPER-1 | 波は足してよい | L3 | CIRCLE | — | Decomposition Mixer | C-SUP-01..03 | CIRCLE |
| FT-SERIES-1 | 足し算で形が変わる | L3 | SUPER | — | Nスライダ+Ghost予測 | C-SER-01..03 | SUPER |
| FT-ORTHO-1 | 「似ている度」で取り出す | L3 | SERIES | — | 重ね塗り/内積バー | C-ORT-01..03 | SERIES |
| FT-COEFF-1 | 係数の意味と決まり方 | L3 | ORTHO | — | カード→半径マップ | C-COE-01..03 | ORTHO |
| FT-APP-1 | 削る＝圧縮（画像再接続） | L3 | COEFF | HOOK | 係数マスク→画像 | C-APP-01..03 | COEFF,HOOK |
| FT-CAP-1 | Capstone + Teach-Back | L3 | APP | 主経路全て | Teach Desk | C-CAP-01, TB-CAP | 失敗ノード |
| FT-EULER-1 | 回転の言葉 e^{iθ} | L2 | CAP | — | 単位円+ペア | C-EUL-01,02 | CIRCLE |
| FT-TRANSFORM-1 | 連続と離散の地図 | L1 | EULER | APP | 対照図 | C-TR-01 | — |

---

## 3. エッジ詳細

| from | to | type | 説明 |
|------|-----|------|------|
| HOOK | WAVE | hard | 動機なしに波定義へ入らない |
| WAVE | CIRCLE | hard | 振幅・周期語彙が要る |
| WAVE | RATIO | soft | 円の投影で sin が詰まったら |
| RATIO | CIRCLE | hard※ | RATIO を踏んだ場合のみ必須化 |
| CIRCLE | SUPER | hard | |
| SUPER | SERIES | hard | |
| SERIES | ORTHO | hard | 「足せる」の次に「取り出せる」 |
| ORTHO | COEFF | hard | |
| COEFF | APP | hard | |
| HOOK | APP | soft | 画像文脈の再接続（弱くて可） |
| APP | CAP | hard | |
| CAP | EULER | motivational | 任意拡張 |
| EULER | TRANSFORM | soft | |

※ Router: `RATIO` は初期 `skipped`。CIRCLE で struggling または申告「三角比あやしい」で `learning` に格上げ。

---

## 4. 入口診断（D4: 自己申告 + 確認1問）

### 4.1 自己申告（チェックボックス）— Phase A

| キー | 文言 | 影響 |
|------|------|------|
| conf_trig | sin/cos を説明できる | no → RATIO 挿入 |
| conf_rad | ラジアンを見た・使った | no → **RAD 挿入** |
| conf_pyth | 三平方を使える | no → RATIO 挿入＋pyth章 |
| conf_sum | Σ を読める | no → sumChapter @ SERIES |
| conf_area | 積分＝面積を知っている | no → intChapter @ COEFF |
| conf_wave | 振幅・周期・位相 | 確認1問 |
| conf_image | JPEG直感 | （HOOK） |
| conf_series | 波の足し算を見た | （参考） |
| goal_time | sprint / deep / teach | モード |

申告 no は確認なしで枝へ。申告 yes のみ確認1問。

### 4.2 確認1問バンク（Phase A）

| 申告キー | 確認ID | 成功時 | 失敗時 |
|----------|--------|--------|--------|
| conf_trig=yes | D-TRIG-01 | — | ratioForced |
| conf_rad=yes | D-RAD-01 | — | radForced |
| conf_pyth=yes | D-PYTH-01 | — | ratioForced |
| conf_sum=yes | D-SUM-01 | — | sumChapterForced |
| conf_area=yes | D-AREA-01 | — | intChapterForced |
| conf_wave=yes | D-WAVE-01 | — | WAVE フル |
| （常時） | D-HOOK-01 | — | HOOK フル |

### 4.3 経路構築（実装: `js/router.js`）

```
path = core_path
if need RATIO: insert before CIRCLE
if need RAD: insert after RATIO if present, else before CIRCLE
chapters: sum@SERIES / int@COEFF / pyth@RATIO via flags（本文は Phase B）
```

---

## 5. ルーティング規則（運用）

1. 常に **CAP までのクリティカル未マスタ** を優先  
2. 同一ノード Check 連続2失敗 → `struggling` → remediation へ  
3. remediation 復帰後、元ノードは Check 1つから再開（説明最初から強制しない）  
4. `skipped` は CAP 直前に **stale チェック1問**（任意でOFF可）  
5. 学習者の「図から／式から」はノード内提示順のみ（到達 L は不変）  
6. EULER 以降は CAP 完了まで Router が提案しない（明示「続き」のみ）

---

## 6. マスタリー更新

| イベント | 更新 |
|----------|------|
| Interact 成功条件達成 | → 最低 L0 |
| Checks 必須セット合格 | → L2 |
| Teach-Back 30s 自己ルーブリック ≥ 閾値 | → L3 mastered |
| 14日以上未参照かつ CAP 前 | → stale |
| CAP 本番 TB 合格 | 主経路ノードを mastered に一括確認 |

Teach-Back 詳細 → `TEACHBACK_TEMPLATE.md`

---

## 7. 誤解カタログ（ノード横断・抜粋）

| mid | 誤解 | 正しい像 | 潰すノード |
|-----|------|----------|------------|
| MC01 | 周波数↑＝振幅↑ | 周波数は「速さ/細かさ」、振幅は「大きさ」 | WAVE, CIRCLE |
| MC02 | 円を足すと必ずぐちゃぐちゃ | 位相と係数が揃えば鋭い形にもなる | SERIES |
| MC03 | JPEGは画素をランダムに間引く | 周波数成分（係数）を選択的に捨てる | HOOK, APP |
| MC04 | 係数は見た目で勘 | 「似ている度」（射影）で決まる | ORTHO, COEFF |
| MC05 | 複素がないとフーリエできない | 実数 sin/cos で本質は完走できる | CAP 前注記 |
| MC06 | 直交＝直角三角形の話だけ | ここでは「かけ合わせて足すと0」 | ORTHO |

---

## 8. 時間予算（目安）

| モード | 想定 | 経路 |
|--------|------|------|
| sprint | 25–40分 | HOOK短縮 + 既習スキップ多め + CAP簡易 |
| deep | 60–90分 | 主経路フル L3 |
| teach | 90–120分 | deep + 各ノード TB + CAP厚め |

---

## 9. JSON 骨格（実装時）

```json
{
  "graph_id": "fourier-realpath-v1",
  "completion_node": "FT-CAP-1",
  "nodes": [
    {
      "id": "FT-HOOK-1",
      "title": "画像は波の束：JPEG直感",
      "tier": "core",
      "target_level": 1,
      "hard_prereq": [],
      "soft_prereq": [],
      "remediation": [],
      "checks_required": ["C-HOOK-01", "C-HOOK-02"],
      "teachback": null
    }
  ],
  "edges": [{ "from": "FT-HOOK-1", "to": "FT-WAVE-1", "type": "hard" }]
}
```

実装時ファイル案: `data/skill_graph.json`（本ドキュメントが設計正本）

---

*Skill Graph v1 — 2026-07-23 Nova*
