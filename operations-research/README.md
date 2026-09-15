# Operations Research & CP-SAT 教材（共有正本）

- **教材ID**: `operations-research`
- **正本パス**: `G:\マイドライブ\Projects\Teaching-materials\operations-research\`
- **公開用HTML**: [`index.html`](./index.html)（上部固定ナビ・現在地自動追従・完全自己完結型インタラクティブ教材）
- **教育設計原則**: `Projects\Teaching-materials\PEDAGOGY_GUIDELINES.md` に完全準拠。
- **品質検査結果**: `tools/verify_material.py` による全項目自動検証 **[PASS]**

---

## 📚 正本章立て一覧（全9ステップ）

本教材は `chapters/` ディレクトリにモジュール分割されており、`python build_html.py` で瞬時に結合ビルドされます。

| 章 | ファイル | 主なテーマ |
| :--- | :--- | :--- |
| **第0章** | [`chapters/00_intro_and_explosion.html`](./chapters/00_intro_and_explosion.html) | なぜ素朴なプログラミングでは解けないのか？（22兆通りとNP困難の壁） |
| **第1章** | [`chapters/01_cpsat_origin_drama.html`](./chapters/01_cpsat_origin_drama.html) | CP-SAT誕生のドラマ：2つの流派の「奇跡の合体」（CP × SAT） |
| **第2章** | [`chapters/02_cdcl_heartbeat_simulator.html`](./chapters/02_cdcl_heartbeat_simulator.html) | 衝突駆動節学習（CDCL）：失敗から自律学習する現場（コマ送りシミュレータ） |
| **第3章** | [`chapters/03_maxsat_and_flexibility.html`](./chapters/03_maxsat_and_flexibility.html) | 白黒判定器がなぜ「柔軟なシフト」を作れるのか？（MaxSAT締め上げ二分探索） |
| **第4章** | [`chapters/04_request_matrix_construction.html`](./chapters/04_request_matrix_construction.html) | 【要望マトリクス入門】自然言語 ➔ 0/1表 ➔ Pythonデータ構造への変換術（3D直方体・2D配列・辞書） |
| **第5章** | [`chapters/05_constraint_logic_dictionary.html`](./chapters/05_constraint_logic_dictionary.html) | 【制約ロジック完全マスター】現場ルール ➔ 論理式 ➔ CP-SATコードの黄金対応表（6大制約と対照表） |
| **第6章** | [`chapters/06_penalty_and_objective_design.html`](./chapters/06_penalty_and_objective_design.html) | 【不満度の測定と設計】人間の心理を数理モデルにする技術（絶対値線形化・痛みの分散） |
| **第7章** | [`chapters/07_python_production_template.html`](./chapters/07_python_production_template.html) | 【実践】Python (Google OR-Tools) で書く黄金の型（コピペ用コードと実測解） |
| **第8章** | [`chapters/08_realworld_applications.html`](./chapters/08_realworld_applications.html) | 【応用】あらゆるビジネス課題への横展開（配車VRP・予算Knapsack・工程RCPSP） |

---

## 🔨 ビルド & 実行コマンド

```bash
# 1. chapters/ から index.html をビルド
python build_html.py

# 2. 教材品質の自動検証
python ../tools/verify_material.py .

# 3. シフトスケジューラー（Pythonテンプレート）の実行
uv run --with ortools python shift_cpsat_template.py
```
