# Ontology Snapshot

このディレクトリは、ノード教材が参照する機械可読オントロジーのプロジェクト内スナップショットを置く。

## 正本とスナップショット

- 機械的な正本（プロジェクト内スナップショット）: `math_euler_complete_ontology.json`
- 外部原本: `G:/マイドライブ/Eleanor Arroway/documents/math_euler_complete_ontology.json`
- スナップショット取得日: 2026-08-26（同日 46 ノードへ精緻化：前提知識のオントロジー内訳追加）
- SHA-256: `9DC454574BCF4823CFB4BE0A2433FD33EB675FE49352156645CA4D9F058EAD8C`
- 全ノード数: 46（当初 42 に、中学数学以上のオントロジー外前提 4 ノードを追加）

教材は、外部ドライブのパスではなく、このスナップショットを `ontology_source` として参照する。

## 更新手順

1. 外部原本をこのファイルへコピーする。
2. JSONとして読み込めることを確認する。
3. 変更差分でノードID・`prerequisites`・`diagnostic_query` を確認する。
4. 取得日とSHA-256を更新する。
5. 前提が変わった教材だけを再レビューする。

## 人間向け地図

`trigonometry_master_ontology.md` はMermaidと説明用の全体地図であり、機械的な依存関係の正本ではない。ID表記が異なる場合はJSONを優先する。
