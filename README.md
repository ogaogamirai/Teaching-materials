# Teaching-materials

動機主導・直感と王道をセットにした学習教材の monorepo。

| フォルダ | 内容 |
|----------|------|
| [fourier-transform](./fourier-transform/) | 画像圧縮の直感から学ぶフーリエ（実数主経路・対話型 HTML） |
| [math-integers-guide](./math-integers-guide/) | 整数が面白いほどわかるシリーズ |
| [math-combinatorics-guide](./math-combinatorics-guide/) | 組合せの直感ガイド |
| [math-combinatorics-tool](./math-combinatorics-tool/) | 組合せツール（HTML） |
| [path-to-structure](./path-to-structure/) | 組合せ探索　道から構造へ（最短路→ZDD、Dual-View HTML） |

## フーリエ教材（すぐ見る）

1. [`fourier-transform/index.html`](./fourier-transform/index.html) をブラウザで開く（`file://` 可）
2. 説明文の編集正本: `fourier-transform/data/explanations/P-*.json`
3. 反映: 教材フォルダで `python tools/expl_pipeline.py all`

## path-to-structure（すぐ見る）

1. [`path-to-structure/index.html`](./path-to-structure/index.html) をブラウザで開く（`file://` 可）
2. 原稿の編集正本: `path-to-structure/chapters/*.md`
3. プレーン版: [`path-to-structure/plain.html`](./path-to-structure/plain.html)

詳細は各フォルダの `README.md` / `PLAN_*.md` を参照。
