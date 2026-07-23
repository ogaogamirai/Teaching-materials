# 計画改訂：理論・数式＋数学前提モジュール（v2）

> **Status:** v2 + **Phase A/B/C 実装済（2026-07-23）**  
> **Phase A 済:** FT-RAD-1, insert_rules, 診断キー, router, checks, rad demo  
> **Phase B 済:** math_cards, 前提章, math_render, 理論チェック  
> **Phase C 済:** hotspots.json, hotspots.js, WAVE/CIRCLE/SERIES/COEFF/RAD/ORTHO 連動  
> **入力:** Ellie #26 + `KNOW-CAPTAIN-SPEC-FOURIER-MATH-DEPENDENCY`  
> （knowledge body は空だったため、summary・メッセージ・既存設計から依存ツリーを再構成し正本化）  
> **前版:** 数式レイヤーのみ → **本版: 前提単元モジュールをスキルグラフに正式編入**

---

## 0. 一文

**中2起点の前提モジュールを「必要になったら差し込む枝」として持ち、主経路では直観→看板式→（足りなければ前提へ戻る）で、フーリエ実数完走まで理論を学ばせる。**

---

## 1. Ellie 前提パッケージ（受領内容）

メッセージと KNOW 摘要に明示された不足要素:

| コード | 単元・概念 | 役割（なぜフーリエに要るか） |
|--------|------------|------------------------------|
| M-PYTH | 三平方の定理 | 単位円・距離・sin/cos の幾何土台 |
| M-TRIG | 三角関数 | 波の原子、円の座標 |
| M-RAD | ラジアン | \(\omega t\)・周期と角度の接続（度だけのままだと式が読めない） |
| M-UNIT | 単位円 | 円→波、位相、の共通画面 |
| M-SUM | 和の記号 \(\sum\) | 級数・部分和の読み方 |
| M-ORTH | 関数の直交性 | 係数を「取り出せる」理由 |
| M-INT | 定積分（の意味） | 内積・係数定義の記号（計算ドリルではない） |
| M-CPLX | 複素数 | （主経路外）表記の拡張 |
| M-EUL | オイラーの公式 | （主経路外）回転のまとめ書き |

**Ellie do:** 依存に基づく動的分岐／各概念の「なぜ必要か」を常に明示  
**Ellie don't:** 中2に無理な前提スキップで挫折／受験テク計算に終始

---

## 2. 依存関係ツリー（正本化）

```
[中2] 三平方 M-PYTH
        ↓
[中3〜] 三角比 → 三角関数 M-TRIG
        ↓
      単位円 M-UNIT ←—— ラジアン M-RAD（式を読む段階で hard 化可）
        ↓
      円運動→サイン（教材 CIRCLE）
        ↓
      重ね合わせ SUPER
        ↓
      Σ M-SUM ──→ 級数 SERIES
        ↓
      直交 M-ORTH ←—— 定積分の意味 M-INT（係数の式を読む段階）
        ↓
      係数 COEFF → 圧縮 APP → CAP【実数完走】
        ↓（任意）
      複素 M-CPLX → オイラー M-EUL → 地図 TRANSFORM
```

### 2.1 主経路 vs 前提枝

| 種類 | モジュール | 既定 |
|------|------------|------|
| 主経路（現行 core） | HOOK…CAP | 全員 |
| 前提・早期 | PYTH, TRIG, RAD, UNIT | 診断 or つまずきで挿入 |
| 前提・中盤 | SUM | SERIES 前に短縮 or 同梱 |
| 前提・核 | ORTH 直観は主経路／厳密＋INT は COEFF 前に厚く |
| 後段任意 | CPLX, EUL | CAP 後（決定 D2 維持） |

---

## 3. 現行教材とのギャップ分析

| Ellie 要素 | 現行 | ギャップ | 夜の扱い |
|------------|------|----------|----------|
| 三平方 | なし | **欠落** | 新 `FT-PYTH-1`（短） |
| 三角比/関数 | `FT-RATIO-1` のみ薄い | 関数・グラフが弱い | RATIO 拡充 or `FT-TRIG-1` |
| ラジアン | ほぼ触れるだけ | **式が読めない主因** | 新 `FT-RAD-1` |
| 単位円 | RATIO/CIRCLE に分散 | 独立カード不足 | RATIO に UNIT 統合強化 |
| Σ | SERIES で口頭のみ | 記号の読み方なし | SERIES 学ぶ内 or `FT-SUM-1` |
| 直交 | ORTHO 直観あり | 理論・式が薄い | ORTHO Math Card 厚く |
| 定積分 | なし | **係数式の壁** | `FT-INT-1`（意味のみ） |
| 複素/オイラー | EULER 任意 | 方針どおり後段 | 計画維持・中身は薄くて可 |
| 数式レイヤー全体 | 直観本文のみ | **Lyr-S 未達** | Math Card 一式 |

**追加が必要な要素（この改訂の新規）**

1. **三平方ミニ**  
2. **ラジアン・弧度法ミニ**（優先度高）  
3. **Σ の読み方**  
4. **定積分＝面積・累積の意味**（計算技術は不要）  
5. 前提モジュールの **診断キーと挿入ルール**  
6. 各前提の **「なぜ今これが要るか」1文**（Ellie do の実装）

---

## 4. 改訂スキルグラフ（目標形）

```
FT-HOOK-1
    ↓
FT-WAVE-1
    ↓
┌─(need)─ FT-PYTH-1 ─┐
│                    ↓
│              FT-RATIO-1 / FT-TRIG-1（単位円含む）
│                    ↓
│              FT-RAD-1（式導入前に）
└────────────────────↓
              FT-CIRCLE-1
                    ↓
              FT-SUPER-1
                    ↓
              FT-SUM-1（短縮可・SERIESに同梱可）
                    ↓
              FT-SERIES-1
                    ↓
              FT-ORTHO-1
                    ↓
              FT-INT-1（意味のみ・COEFF前）
                    ↓
              FT-COEFF-1 → FT-APP-1 → FT-CAP-1
                    ↓ optional
              FT-EULER-1（CPLX内包）→ FT-TRANSFORM-1
```

### 4.1 ノード仕様（追加分）

| id | 目標L | 看板 | 挿入条件 | 所要目安 |
|----|-------|------|----------|----------|
| FT-PYTH-1 | L1–2 | \(a^2+b^2=c^2\) → 単位円上の点 | conf 幾何弱い / CIRCLE前失敗 | 8–12分 |
| FT-TRIG-1 | L2 | sin/cos の定義とグラフの形 | RATIO を拡張するなら統合可 | 10–15分 |
| FT-RAD-1 | L2 | \(\pi\) rad＝180°、弧の長さ | SERIES/CIRCLE 式を出す前 | 8–12分 |
| FT-SUM-1 | L1–2 | \(\sum_{n=1}^{N} x_n\) の読み | SERIES 学ぶの冒頭でも可 | 5–8分 |
| FT-INT-1 | L2 | \(\int_a^b f\)＝面積の極限のイメージ | COEFF の定義式の前 | 10–15分 |

**統合案（ノード爆発を防ぐ）**

| 案 | 内容 | 推奨 |
|----|------|------|
| A | 全部独立ノード | 分岐は明確だが地図が長い |
| **B** | PYTH+UNIT を RATIO に内包、SUM を SERIES 冒頭、INT を COEFF 冒頭、**RAD だけ独立** | **推奨** |
| C | 前提は全部「学ぶ」内の折りたたみ章 | 実装は楽、適応分岐が弱い |

**夜のデフォルト: 案B**  
- 独立新ノード: **`FT-RAD-1` のみ必須追加**  
- 章として同梱: PYTH→RATIO、SUM→SERIES、INT→COEFF  
- 既存 RATIO を **TRIG+UNIT+PYTH の前提ハブ**に昇格  

---

## 5. 診断・ルーティング改訂

### 5.1 自己申告キー追加

| キー | 文言 | 失敗時 |
|------|------|--------|
| conf_trig | sin/cos を説明できる | RATIO フル |
| conf_rad | ラジアンを見たことがある | **RAD 挿入** |
| conf_sum | Σ を読める | SERIES 冒頭 SUM 章 |
| conf_area | 積分＝面積の話を知っている | COEFF 前 INT 章 |
| conf_pyth | 三平方を使える | RATIO 内 PYTH 節 |

確認1問は各キーに1つ（非数式入力）。

### 5.2 つまずきバックリンク

| 症状 | 戻す先 |
|------|--------|
| 円と波が繋がらない | RATIO / PYTH |
| \(\omega t\) が読めない | **RAD** |
| N個足すが理解できない | SUM 章 |
| 係数が「魔法」に見える | ORTHO → INT 章 |
| 圧縮と式が繋がらない | COEFF 記号表 |

---

## 6. 数式レイヤー（Lyr-S）— 前版を統合

### 6.1 看板公式（実数主経路・表記統一）

**決定（本計画のデフォルト）**

- 時間領域: \( y = A \sin(\omega t + \varphi) \)、\(\omega = 2\pi / T\)  
- 級数: \( f(t) \approx \dfrac{a_0}{2} + \sum_{n=1}^{N} \big( a_n \cos(n\omega t) + b_n \sin(n\omega t) \big) \)  
  （係数の正規化定数は「読み方」で触れ、暗記させない）  
- 内積（表示）: \(\langle f,g\rangle = \int_{0}^{T} f(t)g(t)\,dt\) の **意味**  
- 係数: \( a_n, b_n \) は「cos/sin との似ている度」  

積分の計算実行・部分積分ドリルは **しない**。

### 6.2 ノード × 理論ブロック

| ノード | 理論ブロック必須 | 前提章 |
|--------|------------------|--------|
| HOOK | 概念のみ | — |
| WAVE | 式 \(A,\omega,\varphi\) | — |
| RATIO | 三角定義＋単位円＋三平方1節 | PYTH |
| RAD | 度↔ラジアン、\(\omega t\) | — |
| CIRCLE | \(R\sin(\omega t+\varphi)\) 導出ミニ | RAD 推奨 |
| SUPER | 点ごと和 | — |
| SERIES | Σ読み＋級数看板 | SUM |
| ORTHO | 直交の直観→内積記号 | — |
| COEFF | \(a_n,b_n\) 定義の意味 | INT |
| APP | 係数0化と式 | — |
| CAP | 式一覧＋指差し TB | — |
| EULER | オイラー（任意） | CPLX 一言 |

### 6.3 成果物リスト（夜）

| ID | 成果物 |
|----|--------|
| C0 | 本ファイル確定・表記凍結 |
| C1 | `data/math_cards.json`（全 core＋RAD） |
| C2 | RATIO/SERIES/COEFF の前提章コピー |
| C3 | 診断キー＋確認1問（rad/sum/area/pyth） |
| C4 | ホットスポット台本（CIRCLE, SERIES, COEFF） |
| U1 | 学ぶ＝本文＋理論ブロック（折りたたみ） |
| U2 | 式表示（HTML数式優先、KaTeX任意） |
| U3 | skill_graph に RAD・挿入ルール |
| U4 | data_bundle 再生成 |
| Q1 | file:// で WAVE→COEFF の理論が見えること |

---

## 7. 夜の実行フェーズ（改訂版）

### Phase 0 — 受領固定（15分）

- [ ] Ellie 依存を本ツリーで承認（欠落があれば追記）  
- [ ] 案B（RAD独立＋他は同梱）で行くか最終確認  
- [ ] knowledge `KNOW-CAPTAIN-SPEC-FOURIER-MATH-DEPENDENCY` に body（本ツリー要約）を後で埋める  

### Phase A — グラフ＆診断（40分）

- [ ] `SKILL_GRAPH.md` / `skill_graph.json` に FT-RAD-1 と挿入条件  
- [ ] 診断 UI に conf_rad / conf_sum / conf_area / conf_pyth  
- [ ] remediation マップ更新  

### Phase B — 前提＋Math Card 執筆（100–130分）★本体

優先順:

1. **RAD**（式を読む鍵）  
2. **CIRCLE** 看板＋導出ミニ  
3. **SERIES**（Σ章＋級数読み）  
4. **ORTHO → COEFF**（直交＋INT章＋係数定義）  
5. **RATIO** に PYTH+UNIT 厚く  
6. WAVE / SUPER / APP / CAP  
7. EULER は時間があれば  

### Phase C — UI（60–80分）

- [ ] renderLearn: 理論ブロック＋前提章  
- [ ] 式表示コンポーネント（入力なし）  
- [ ] CIRCLE/SERIES/COEFF ホットスポット最小  
- [ ] 理論用 check（M3/M5）追加  

### Phase D — 検証（30分）

- [ ] ラジアン未習ルートで RAD が入る  
- [ ] CAP 前に複素が出ない  
- [ ] 積分は「意味」だけ、計算ゲートがない  
- [ ] 学ぶ→やってみる→例→確認の順が崩れない  
- [ ] Teach-Back に式の指差し欄が使える  

---

## 8. 成功指標（v2）

| 指標 | 合格 |
|------|------|
| 前提カバレッジ | Ellie 列挙9要素が「主経路／枝／後段」のどれかに配置 |
| 動的分岐 | rad/trig 弱点で余分な枝が実際に挿入される |
| L2 | CIRCLE・SERIES・COEFF で記号↔UI |
| 挫折防止 | 定積分・複素を主経路必須にしない |
| なぜ必要か | 各前提章の先頭に goal_link 1文 |

---

## 9. やらないこと（再掲＋追加）

- 中2に高校範囲を全部積み上げてからフーリエ  
- 定積分の計算テスト  
- 複素を CAP 前必須化  
- 数式キーボード必須  
- Ellie ツリーに無い単元の網羅（極限のε論法等）  

---

## 10. 夜チェックリスト（コピペ）

```
[ ] PLAN v2 の案B・表記を確認
[ ] skill_graph に RAD + 診断キー
[ ] math_cards: RAD, CIRCLE, SERIES, ORTHO, COEFF
[ ] RATIO+=PYTH/UNIT, SERIES+=SUM, COEFF+=INT
[ ] renderLearn 理論ブロック
[ ] checks 追加（rad/sum/area + 理論M3/M5）
[ ] data_bundle 再生成
[ ] file:// 通し（未習ラジアン想定）
[ ] knowledge DEPENDENCY に body 要約を追記
[ ] Ellie へ受領＋グラフ反映を短く msg（任意）
```

---

## 11. 旧版からの差分サマリ

| 項目 | v1 | v2 |
|------|----|----|
| 前提単元 | RATIO のみ | Ellie ツリー全面マップ |
| 新ノード | （数式カードのみ） | **RAD 必須**、他は同梱章 |
| 定積分 | 触れず | 意味モジュールとして COEFF 前 |
| Σ | 口頭 | 明示章 |
| 三平方 | なし | RATIO 内 |
| 診断 | trig/wave 中心 | +rad/sum/area/pyth |
| 完了点 | 式L2 | 式L2 ＋ 前提不足時の枝 |

---

*Ellie #26 / KNOW-CAPTAIN-SPEC-FOURIER-MATH-DEPENDENCY 受領。Nova 再計画 v2。実行は夜。*
