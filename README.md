# Teaching-materials

動機主導・直感と王道をセットにした学習教材の monorepo。

| 教材・ツール | ブラウザ閲覧（GitHub Pages） | 原稿・ローカル | 内容 |
|---|---|---|---|
| **トロピカル数学とフロンティア法** | [tropical-math（本編）](https://ogaogamirai.github.io/Teaching-materials/tropical-math/) | [`textbook.md`](./tropical-math/textbook.md) | トロピカル代数とフロンティア法（4駅モデル・ZDD コマ送り実況） |
| └ **4駅完全連動実験室** | [simulator.html](https://ogaogamirai.github.io/Teaching-materials/tropical-math/simulator.html) | [`simulator.html`](./tropical-math/simulator.html) | 状態・フロンティア・DPテーブルの全連動シミュレーター |
| └ **都内JR 87駅シミュレーター** | [tropical-jr-simulator](https://ogaogamirai.github.io/Teaching-materials/tropical-jr-simulator/) | [`index.html`](./tropical-jr-simulator/index.html) | 都内JR 87駅全体シミュレーター（トロピカル最短路・最長一筆書き・ZDD） |
| **圏論（Category Theory）** | [category-theory](https://ogaogamirai.github.io/Teaching-materials/category-theory/) | [`category-theory/`](./category-theory/) | 直感と構造の探求ガイド、半環カートリッジ実験室 |
| **フーリエ解析** | [fourier-theory-v2](https://ogaogamirai.github.io/Teaching-materials/fourier-theory-v2/) | [`theory-v2/`](./fourier-transform/theory-v2/) | フーリエ theory-v2 **学習用一冊** |
| **現代暗号の基礎** | [modern-cryptography](https://ogaogamirai.github.io/Teaching-materials/modern-cryptography/) | [`modern-cryptography/`](./modern-cryptography/) | RSA・ECC・量子計算（操作盤シミュレーター）・耐量子暗号（PQC） |
| **システムダイナミクス×TOC** | [system-dynamics](https://ogaogamirai.github.io/Teaching-materials/system-dynamics/) | [`system-dynamics/`](./system-dynamics/) | SD×TOC 教材（統合 HTML・Pages） |
| **道から構造へ** | [path-to-structure](https://ogaogamirai.github.io/Teaching-materials/path-to-structure/) | [`path-to-structure/`](./path-to-structure/) | 組合せ探索　道から構造へ（最短路→ZDD、Dual-View HTML） |
| **整数が面白いほどわかるシリーズ** | - | [`math-integers-guide`](./math-integers-guide/) | 整数が面白いほどわかるシリーズ原稿 |
| **組合せの直感ガイド** | - | [`math-combinatorics-guide`](./math-combinatorics-guide/) | 組合せの直感ガイド原稿・ツール |

## 正本の置き場（三家共通）

**地図の正本:** [`Tools/DRIVE_REGISTRY_v01.md`](../../Tools/DRIVE_REGISTRY_v01.md)  
**閉じ役:** J.T. → [`GITHUB_CLOSER_ROLES_v01.md`](../../Tools/GITHUB_CLOSER_ROLES_v01.md)

| 層 | パス |
|---|---|
| ローカル正本 | `G:\マイドライブ\Projects\Teaching-materials\` |
| GitHub | [ogaogamirai/Teaching-materials](https://github.com/ogaogamirai/Teaching-materials) |

各家の `tools/` に教材全文をコピーしない。Agent は [`Projects/README.md`](../README.md) の正本で作業する。

## 🪐 トロピカル数学とZDD（すぐ見る）

1. 📘 **学習用一冊（ブラウザ）:** [tropical-math（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/tropical-math/)
2. 🎮 **4駅完全連動Web実験室:** [simulator.html（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/tropical-math/simulator.html)
3. 🗺️ **都内JR 87駅全体シミュレーター:** [tropical-jr-simulator（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/tropical-jr-simulator/)
4. 📄 **原稿正本:** [`tropical-math/textbook.md`](./tropical-math/textbook.md)
5. 🔨 **ビルドコマンド:** `cd tropical-math && python build_html.py`

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

1. **ブラウザで開く:** [path-to-structure（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/path-to-structure/) / [`index.html`](./path-to-structure/index.html)
2. **原稿の編集正本:** `path-to-structure/chapters/*.md`
3. **プレーン版:** [`path-to-structure/plain.html`](./path-to-structure/plain.html)

## 現代暗号の基礎（すぐ見る）

1. **学習用一冊（ブラウザ）:** [modern-cryptography（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/modern-cryptography/)
2. **量子計算の操作盤:** [quantum_basics.html（GitHub Pages）](https://ogaogamirai.github.io/Teaching-materials/modern-cryptography/models/quantum_basics.html)
3. **原稿・設計:** [`modern-cryptography/`](./modern-cryptography/)

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

