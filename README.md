# Teaching-materials

動機主導・直感と王道をセットにした学習教材の monorepo。

| フォルダ | 内容 |
|----------|------|
| [fourier-theory-v2](./fourier-theory-v2/) | フーリエ theory-v2 **学習用一冊**（GitHub Pages） |
| [fourier-transform](./fourier-transform/) | フーリエ（原稿・正本 [`theory-v2`](./fourier-transform/theory-v2/)／旧 interactive は archive） |
| [modern-cryptography](./modern-cryptography/) | 現代暗号の基礎（RSA・ECC・量子計算・PQC） |
| [math-integers-guide](./math-integers-guide/) | 整数が面白いほどわかるシリーズ |
| [math-combinatorics-guide](./math-combinatorics-guide/) | 組合せの直感ガイド |
| [math-combinatorics-tool](./math-combinatorics-tool/) | 組合せツール（HTML） |
| [path-to-structure](./path-to-structure/) | 組合せ探索　道から構造へ（最短路→ZDD、Dual-View HTML） |
| [system-dynamics](./system-dynamics/) | SD×TOC 教材（統合 HTML・Pages） |
| [category-theory](./category-theory/) | 圏論（Category Theory）直感と構造の探求ガイド（[GitHub Pages](https://ogaogamirai.github.io/Teaching-materials/category-theory/)・原稿） |
| [tropical-math](./tropical-math/) | トロピカル代数とフロンティア法（4駅モデル・ZDD コマ送り実況） |
| [tropical-jr-simulator](./tropical-jr-simulator/) | 都内JR 87駅全体シミュレーター（トロピカル最短路・最長一筆書き・ZDDフロンティア法） |

## 正本の置き場（三家共通）

**地図の正本:** [`Tools/DRIVE_REGISTRY_v01.md`](../../Tools/DRIVE_REGISTRY_v01.md)  
**閉じ役:** J.T. → [`GITHUB_CLOSER_ROLES_v01.md`](../../Tools/GITHUB_CLOSER_ROLES_v01.md)

| 層 | パス |
|---|---|
| ローカル正本 | `G:\マイドライブ\Projects\Teaching-materials\` |
| GitHub | [ogaogamirai/Teaching-materials](https://github.com/ogaogamirai/Teaching-materials) |

各家の `tools/` に教材全文をコピーしない。Agent は [`Projects/README.md`](../README.md) の正本で作業する。

## 圏論教材（すぐ見る）

1. **学習用一冊（ブラウザ）:** [category-theory（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/category-theory/)
2. **半環カートリッジ実験室:** [tool/index.html（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/category-theory/tool/index.html)
3. **応用実験室（裁定・波及・停止ドミノ）:** [applications-lab.html（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/category-theory/tool/applications-lab.html)
4. **原稿・章立て:** [`category-theory/chapters/`](./category-theory/chapters/)

## フーリエ教材（すぐ見る）

1. **学習用一冊（ブラウザ）:** [fourier-theory-v2（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/fourier-theory-v2/)
2. **原稿・章立て:** [`fourier-transform/theory-v2/`](./fourier-transform/theory-v2/)（正本は `chapters/`）
3. **旧 interactive（归档）:** [`fourier-transform/archive/interactive-v1/index.html`](./fourier-transform/archive/interactive-v1/index.html)（`file://` 可・本編正本ではない）

## path-to-structure（すぐ見る）

1. [`path-to-structure/index.html`](./path-to-structure/index.html) をブラウザで開く（`file://` 可）
2. 原稿の編集正本: `path-to-structure/chapters/*.md`
3. プレーン版: [`path-to-structure/plain.html`](./path-to-structure/plain.html)

詳細は各フォルダの `README.md` / `PLAN_*.md` を参照。

## 現代暗号の基礎（すぐ見る）

1. **学習用一冊（ブラウザ）:** [modern-cryptography（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/modern-cryptography/)
2. **量子計算の操作盤:** [quantum_basics.html（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/modern-cryptography/models/quantum_basics.html)
3. **原稿・設計:** [`modern-cryptography/`](./modern-cryptography/)

## トロピカル数学とZDD（すぐ見る）

1. **学習用一冊（ブラウザ）:** [`tropical-math/index.html`](./tropical-math/index.html)（`file://` 可）
2. **原稿正本:** [`tropical-math/textbook.md`](./tropical-math/textbook.md)
3. **ビルド:** `cd tropical-math && python build_html.py`
4. **連動シミュレーター:** [`tropical-math/simulator.html`](./tropical-math/simulator.html)

---

## 🛠️ 教材品質検査ツール（Universal Material Validator）

教材のMarkdown太字・KaTeX数式・Mermaid図表・目次リンクの破綻を全自動で検査するツールです：

```bash
# 全教材または特定教材を検査
python tools/verify_material.py category-theory
python tools/verify_material.py modern-cryptography
python tools/verify_material.py .
```

### 主な検査項目（Checks）
- **[L1] Markdown太字×括弧境界**: `**「...」**` のようなパーサー破綻記法を検出。
- **[L2] KaTeX数式構文**: 生の `<` 不等号（`\lt` 推奨）や未ラップ日本語を検出。
- **[L3] Mermaid構文**: `subgraph` に日本語が直書きされてレンダリングエラーになる問題を検出。
- **[L4] 内部アンカーリンク**: 目次やリンクの `href="#..."` が実在する `id` を指しているか検証。
- **[L5] ツールチップ整合性**: `.term-pop` と `.pop-card` のペアが一致しているか検証。

