# NODE: FT-RAD-1 — ラジアン（弧度法）ミニ

> Phase A 実装。案Bの**唯一の必須追加独立ノード**。

## ゴール接続（1文）
ωt や周期と角度をつなぎ、円→波の式を読むために必要。

## 前提
なし（CIRCLE 前に条件挿入）

## 目標レベル
L2

## 挿入条件
- conf_rad = no
- D-RAD-01 fail
- radForced（CIRCLE つまずき等）

## 経路上の位置
RATIO の後（RATIO がある場合）、CIRCLE の前。

## Checks
C-RAD-01, C-RAD-02

## Demo
`rad` — 度↔ラジアン対応
