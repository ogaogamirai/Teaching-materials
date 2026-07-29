# 組合せ探索　道から構造へ（path-to-structure）

> **対象**: 中学2年生 〜 社会人（前提: 中学数学＋「点と線」）  
> **コンセプト**: 最短路 → 組合せ爆発 → 記号化 → 圧縮 → 演算。地図を読みながら、解の集まりを圧縮するインタラクティブ教材。

## すぐ読む

1. [`index.html`](./index.html) をブラウザで開く（`file://` 可・GitHub Pages 可）
2. 第1–10章は **Dual-View**（左: インタラクティブ地図 / 右: コマ送り本文）
3. 地図連動なしの読みやすい版: [`plain.html`](./plain.html)

## 構成

| 章 | ファイル | 内容 |
|---|---|---|
| 00 | `chapters/00_glossary.md` | 用語図鑑 |
| 01 | `chapters/01_shortest_path.md` | 最短路（ダイクストラ / A*） |
| 02 | `chapters/02_tsp_and_combination_math.md` | TSP と組合せ |
| 03 | `chapters/03_heuristics_and_algorithms.md` | ヒューリスティック |
| 04 | `chapters/04_boolean_bdd_foundations.md` | ブール変数と BDD |
| 05 | `chapters/05_shannon_expansion_and_zdd.md` | シャノン展開と ZDD |
| 06 | `chapters/06_frontier_method.md` | フロンティア法 |
| 07 | `chapters/07_zdd_compression_engine.md` | ZDD 圧縮エンジン |
| 08 | `chapters/08_multi_edge_zdd_data.md` | 合流と ZDD データ |
| 09 | `chapters/09_branching_graph_zdd.md` | 多分岐グラフ |
| 10 | `chapters/10_zdd_apply_operations.md` | Apply 演算 |
| 11 | `chapters/11_zdd_apply_numerical_examples.md` | Apply 数値例 |
| 12 | `chapters/12_set_algebra_on_zdd_data.md` | 集合演算 |
| 13 | `chapters/13_applications_and_horizons.md` | 応用と地平 |
| A1 | `chapters/A1_zdd_data_structure.md` | 付録（内部データ構造） |

図版: [`figures/`](./figures/)（SVG・日本語ラベル）

## 読み方

- **直感層**: 本文の例・図・コマ送りだけで先へ進める
- **発展的な理論補足**: 章末や付録 A1 で形式定義・還元規則を読む

## ビルドについて

このフォルダは **読者向け配布物**（HTML + 原稿 MD + 図）です。  
統合 HTML の再生成や Rich View 検証は、開発用プロジェクト `path-to-structure` の `tools/` で行います。
