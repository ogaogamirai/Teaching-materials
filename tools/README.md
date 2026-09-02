# 🛠️ Teaching-materials 共通ツール群

本ディレクトリには、教材全体の品質向上・保守・自動検証を支える共通ツールが配置されています。

---

## 📚 1. 教材総合品質検査ツール: `verify_material.py`

### 概要
J.T. と Ellie の知見（`system-dynamics/tools/verify_sd.py`, `fourier-transform/tools/verify_math.py` 等）を完全に統合した、**教材用の総合リンター＆バリデーター**です。

Markdown原稿や統合HTMLにおいて、ブラウザやパーサーで発生しやすいレンダリング崩れ、数式構文エラー、Mermaid図表エラー、リンク切れを全自動で検出し、中学生から専門家まで快適に読める最高品質の教材体験を保証します。

---

### 🚀 使い方

プロジェクトルート（`Teaching-materials`）または本ディレクトリから実行します：

```bash
# ① 特定の教材フォルダを検査する
python tools/verify_material.py category-theory
python tools/verify_material.py modern-cryptography

# ② すべての教材を一括検査する
python tools/verify_material.py .

# ③ 機械可読な JSON 形式で出力する（CI・自動化用）
python tools/verify_material.py category-theory --json
```

---

### 📋 5大自動検査項目（Checks）

| レベル | カテゴリ | 検査内容と理由 |
| :---: | :--- | :--- |
| **L1** | **太字×括弧境界**<br>`L1-BoldBracket` | `**「テキスト」**` や `（**テキスト**）` のように全角括弧とアスタリスクが隣接すると、Markdownパーサーで太字にならず記号がそのまま漏れる問題を検出。<br>➔ `「**テキスト**」` 形式への修正を促します。 |
| **L2** | **KaTeX 数式構文**<br>`L2-MathSyntax` | 空の数式ブロック、数式内の生の `<`（`\lt` 推奨）、`\text{}` でラップされていない日本語文字（KaTeXでのレンダリング破綻原因）を検出。 |
| **L3** | **Mermaid 構文**<br>`L3-MermaidSubgraph` | Mermaid v10 で構文エラーになる `subgraph 日本語名` の直書きを検出。<br>➔ `subgraph id["ラベル"]` 形式への修正を促します。 |
| **L4** | **内部アンカーリンク**<br>`L4-BrokenAnchor` | 目次や本文中の `href="#..."` が、HTML内に実在する `id` を正しく指しているか検証（目次ジャンプの破損を防止）。 |
| **L5** | **ツールチップ整合性**<br>`L5-TooltipMismatch` | 用語解説ポップアップ（`.term-pop`）と解説カード（`.pop-card`）のペア数が一致しているか検証。 |

---

### 🛡️ 開発・執筆時の運用ルール
新しい教材を作成した際、または既存の教材を加筆・修正した際は、**コミット前に必ず `python tools/verify_material.py <対象教材>` を実行し、`ERROR: 0件` を確認すること**を標準ワークフローとします。
