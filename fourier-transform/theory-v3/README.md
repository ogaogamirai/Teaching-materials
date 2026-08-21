# Fourier theory-v3（動機主導版・フーリエへ直行する）

theory-v2（積み上げ型・凍結保存）とは完全独立の、**別バージョン**。
ゴール（音・画像のフーリエ変換）から逆算して、必要になった瞬間に前提を最小限だけ注入する
**Problem-Driven / 動機主導型** の理論ルート。

> **v2 との関係:** 兄弟フォルダ。v2 は検証済み正本として凍結し、誰も触らない。
> v3 は v2 の本文（検証済みの数式・証明骨格）を**参照して再配置**したもの。
> 失敗したらこのフォルダごと捨てればよく、v2 への影響はゼロ。

## 正本

| ファイル | 内容 |
|----------|------|
| [`docs/MOTIVATION_PATH_OUTLINE.md`](./docs/MOTIVATION_PATH_OUTLINE.md) | 設計思想・章立て・v2→v3 再配置マップ（現行） |
| [`docs/MATH_DISPLAY_CONTRACT.md`](./docs/MATH_DISPLAY_CONTRACT.md) | 数式表示契約（v2 から移植・共通） |
| `chapters/` | 静的 Markdown 本文（正本） |
| `tools/` | v2 からコピーした build/verify パイプライン（v3 用に独立改造可） |
| `book/` | 学習用一冊 HTML（build 出力） |

## 学習用 HTML（一冊）

```powershell
cd theory-v3
python tools/build_book_html.py
python tools/verify_review_html.py --html book/index.html
```

`book/index.html` を開く（同じフォルダの `vendor/katex` が必要。ネット不要）。

## 中心目標

v2 と同じ最終到達点——中2が数式で大学レベルのフーリエ変換へ届き、公式を自分で導出でき、
波・画像の簡単な応用ができる——を、**「最初に魔法を見せて、その謎を解きに行く」順序**で達成する。

## やらないこと

- theory-v2 の改変・削除（絶対にしない）
- interactive 基盤の再構築（静的でよい。後付け可）
