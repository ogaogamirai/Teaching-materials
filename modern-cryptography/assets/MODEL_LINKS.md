# 2D / 3D 個別モデルリンク台帳

この台帳がモデルURLの正本です。HTML本文には、原則としてここに登録した個別URLだけをリンクします。

| 概念 | 種別 | 個別URL | 状態 | 学習上の役割 |
|---|---|---|---|---|
| 通信者・攻撃者 | 2D | `models/https_roles.html` | ready | 暗号が守るもの |
| `mod` の時計 | 2D | `models/mod_clock.html` | ready | 剰余の導入 |
| RSAの順方向・逆方向 | 2D | `models/rsa_explorer.html` | ready | 計算量の非対称 |
| 実数上の楕円曲線 | 2D | `models/elliptic_curve_real.html` | ready | 曲線の形 |
| 有限体上の点集合 | 2D | `models/elliptic_curve_finite.html` | ready | 星空への移行 |
| 楕円曲線上の点加算 | 2D | `models/elliptic_curve_addition.html` | ready | 群の操作 |
| ECDLPのスカラー倍 | 2D | `models/ecdlp_scalar.html` | ready | 行きと帰りの難しさ |
| HTTPSの役割分担 | 2D | `models/https_roles.html` | ready | ECC・AES・ハッシュ |
| 量子計算機の暗号攻撃 | 2D | `models/quantum_attack_intro.html` | ready | Shor・Grover・PQCの動機 |
| 量子コンピューターの基本 | interactive | `models/quantum_basics.html` | ready | 量子ビット・測定・干渉・Grover |
| PQCの格子と誤差 | 2D | `models/pqc_lattice.html` | ready | PQC・LWEの入口 |
| 方式別暗号化ラボ | interactive | `models/crypto_lab.html` | ready | 入力・秘密・出力・復号の比較 |

## 運用ルール

- URLを推測して書かない。
- カタログURLは、個別モデルがない場合の補助案内にとどめる。
- 個別モデルを作ったら、まずこの台帳を更新し、次にMarkdown本文のリンクを更新する。
- モデルは「何を操作し、何を観察し、次の章へ何を渡すか」を説明できる状態で公開する。
