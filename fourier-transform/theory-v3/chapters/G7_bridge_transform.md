# G7. 級数から変換へ — 有限から無限の橋

> **到達:** 複素級数を書け、\(T\to\infty\) で周波数が連続になり和が積分に見える橋を式で辿れる。フーリエ変換対を定義として使い、矩形パルスの \(F(\omega)\) を積分から出し、混ぜる・ずらす・伸ばすの三性質を導出できる。  
> **この章で理論はゴールです。** G8 で JPEG の謎に答えに行きます。  
> <!-- eq-source: v2-D2 / v2-D3 / v2-D4 / v2-D5（地図部分は章末に圧縮収録） -->

---

## 0. 前章からの引き — 部品を一本にする

G6 で回転を一文字 \(e^{i\theta}\) に書けるようになりました。まずは G5 の級数を、この新部品で書き直します。すると式が劇的に引き締まり——そして「くり返さない信号」への扉が開きます。

この章の道のり:

1. \(\cos,\sin\) を \(e^{\pm int}\) で書く → 級数が一本の和になる  
2. 周期 \(T\) を無限に伸ばす → とびとびの周波数が連続になる  
3. 和が積分に変わる → **フーリエ変換対**の完成  
4. 矩形パルスで変換を実際に計算する  
5. 混ぜる・ずらす・伸ばすの三性質を導出する  

---

## 1. \(\cos,\sin\) を回転で書く

G6 のオイラー公式とその共役:

$$
e^{i\theta}=\cos\theta+i\sin\theta,
\qquad
e^{-i\theta}=\cos\theta-i\sin\theta.
$$

足すと縦成分が消え、引くと横成分が消えます:

$$
\cos\theta=\frac{e^{i\theta}+e^{-i\theta}}{2},
\qquad
\sin\theta=\frac{e^{i\theta}-e^{-i\theta}}{2i}.
$$

- **読み:** 「コサイン イコール、イーのアイシータ プラス マイナス、オーバー ツー」  
- **よみ:** コサイン ＝ 右回転と左回転の**平均**。サイン ＝ 差を \(2i\) で割ったもの。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 210" width="400" height="210" role="img" aria-label="コサインは右回転と左回転の平均">
  <rect width="400" height="210" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">cos θ ＝ 右回りと左回りの平均</text>
  <line x1="40" y1="120" x2="280" y2="120" stroke="#bbb" stroke-width="1"/>
  <line x1="160" y1="28" x2="160" y2="190" stroke="#bbb" stroke-width="1"/>
  <circle cx="160" cy="120" r="70" fill="none" stroke="#ddd" stroke-width="1.2"/>
  <line x1="160" y1="120" x2="220" y2="62" stroke="#2a6fad" stroke-width="2"/>
  <circle cx="220" cy="62" r="4.5" fill="#2a6fad"/>
  <text x="226" y="58" font-size="12" fill="#2a6fad">e^{iθ}</text>
  <line x1="160" y1="120" x2="220" y2="178" stroke="#2c5f4a" stroke-width="2"/>
  <circle cx="220" cy="178" r="4.5" fill="#2c5f4a"/>
  <text x="226" y="190" font-size="12" fill="#2c5f4a">e^{-iθ}</text>
  <circle cx="220" cy="120" r="4" fill="#c45c26"/>
  <line x1="220" y1="62" x2="220" y2="178" stroke="#c45c26" stroke-dasharray="3 3" stroke-width="1"/>
  <text x="228" y="116" font-size="12" fill="#c45c26">平均 → cos θ</text>
</svg>
<figcaption>同じ角で逆向きに回る二つの平均。縦は打ち消し、横の \(\cos\theta\) だけ残る。</figcaption>
</figure>

「波 ＝ 往復」だったものが、「波 ＝ 二つの逆向き回転」になりました。

---

## 2. 複素形フーリエ級数

### ペアを束ねる

G5 の一項 \(a_n\cos(nt)+b_n\sin(nt)\) に上の式を代入してまとめると:

$$
\begin{aligned}
a_n\cos(nt)+b_n\sin(nt)
&=\underbrace{\Bigl(\frac{a_n-i b_n}{2}\Bigr)}_{c_n}e^{int}\\
&\quad+\underbrace{\Bigl(\frac{a_n+i b_n}{2}\Bigr)}_{c_{-n}}e^{-int}.
\end{aligned}
$$

そこで複素係数をこう定義します:

$$
c_0=\frac{a_0}{2},
\qquad
c_n=\frac{a_n-i b_n}{2},
\qquad
c_{-n}=\frac{a_n+i b_n}{2}
\quad(n\geq1).
$$

- **よみ:** \(c_n\) は「コサイン部品とサイン部品を一つの矢印に束ねたもの」。実部が cos の混ざり、虚部が sin の混ざり。

すると級数全体が、たった一本になります:

$$
f(t)
\sim
\sum_{n=-\infty}^{\infty} c_n e^{int}.
$$

- **よみ:** 正負すべての整数番号の**回転部品**の和。番号の符号は回る向き（プラス＝反時計、マイナス＝時計）。

### 取り出し — 逆回転を掛けて一周積分

G4 の魔法はそのまま使えます。\(e^{int}\) どうしには次の直交性があります（\(\int e^{ikt}=\int\cos+\,i\int\sin=0\)、\(k\neq0\)；\(k=0\) では \(2\pi\)）:

$$
\int_0^{2\pi}e^{i(n-m)t}\,dt
=
\begin{cases}
2\pi & n=m\\
0 & n\neq m
\end{cases}
$$

だから両辺に \(e^{-imt}\)（逆回転）を掛けて一周積分すれば、\(n=m\) だけ残ります:

$$
c_n
=\frac{1}{2\pi}\int_0^{2\pi}f(t)e^{-int}\,dt.
$$

- **読み:** 「シーエヌ イコール、ワン オーバー ツーパイ カケル、エフにマイナスアイエヌティーを掛けて一周足したもの」

### 実数形との行き来（検算）

\(n\geq1\) で \(e^{-int}=\cos(nt)-i\sin(nt)\) を入れると:

$$
\begin{aligned}
c_n
&=\frac{1}{2}\underbrace{\frac{1}{\pi}\int f\cos(nt)\,dt}_{a_n}
-\frac{i}{2}\underbrace{\frac{1}{\pi}\int f\sin(nt)\,dt}_{b_n}\\
&=\frac{a_n-i b_n}{2}.
\end{aligned}
$$

一致しました。逆方向は \(a_n=c_n+c_{-n},\ b_n=i(c_n-c_{-n}),\ a_0=2c_0\)。

> **G5 の三つの積分公式が、\(c_n\) 一つに束ねられました。** これが複素化の恩恵です。

---

## 3. 橋 — 周期を無限に伸ばす

### 問い

級数は「同じ形がいつまでもくり返す」信号向けでした。
でも G0 で見たのは、音の一撃・画像の一枚きり——**くり返さない信号**です。

あれも周波数で語れないのでしょうか？

### 作戦: 周期 \(T\) をどんどん大きくする

まず周期を一般の \(T\) に広げます。基本角周波数（一周期でちょうど一周する速さ）は:

$$
\omega_0=\frac{2\pi}{T}.
$$

部品は整数倍 \(e^{in\omega_0 t}\)。級数と係数は（区間長 \(2\pi\)→\(T\)、角速度 \(n\)→\(n\omega_0\) への置き換え）:

$$
\begin{aligned}
f(t)
&\sim
\sum_{n=-\infty}^{\infty} c_n e^{in\omega_0 t},\\
c_n
&=\frac{1}{T}\int_{-T/2}^{T/2}f(t)e^{-in\omega_0 t}\,dt.
\end{aligned}
$$

（\(T=2\pi\) とすれば \(\omega_0=1\) で前節に戻る検算もできます。）

### 刻みが細くなる

隣り合う周波数の間隔は:

$$
\Delta\omega=(n+1)\omega_0-n\omega_0=\omega_0=\frac{2\pi}{T}.
$$

| \(T\) | \(\Delta\omega\) | イメージ |
|---|---|---|
| 小さい | 粗い | とびとびの純音だけ |
| 大きい | 細かい | 目盛りが密集 |
| \(\to\infty\) | \(\to 0\) | **連続な周波数軸** |

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 200" width="440" height="200" role="img" aria-label="周期を長くすると周波数の目盛りが密集する">
  <rect width="440" height="200" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">周期 T を伸ばすと、周波数の刻みが細かくなる</text>
  <text x="16" y="48" font-size="11" fill="#555">T 小</text>
  <line x1="70" y1="44" x2="420" y2="44" stroke="#ddd" stroke-width="1"/>
  <line x1="100" y1="34" x2="100" y2="54" stroke="#c45c26" stroke-width="2"/>
  <line x1="190" y1="34" x2="190" y2="54" stroke="#c45c26" stroke-width="2"/>
  <line x1="280" y1="34" x2="280" y2="54" stroke="#c45c26" stroke-width="2"/>
  <line x1="370" y1="34" x2="370" y2="54" stroke="#c45c26" stroke-width="2"/>
  <text x="16" y="96" font-size="11" fill="#555">T 大</text>
  <line x1="70" y1="92" x2="420" y2="92" stroke="#ddd" stroke-width="1"/>
  <line x1="88" y1="82" x2="88" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="124" y1="82" x2="124" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="160" y1="82" x2="160" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="196" y1="82" x2="196" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="232" y1="82" x2="232" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="268" y1="82" x2="268" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="304" y1="82" x2="304" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="340" y1="82" x2="340" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="376" y1="82" x2="376" y2="102" stroke="#c45c26" stroke-width="2"/>
  <line x1="412" y1="82" x2="412" y2="102" stroke="#c45c26" stroke-width="2"/>
  <text x="16" y="144" font-size="11" fill="#555">T→∞</text>
  <line x1="70" y1="140" x2="420" y2="140" stroke="#c45c26" stroke-width="3"/>
  <text x="70" y="178" font-size="11" fill="#555">とびとびの純音 → 目盛りが密集 → 連続な周波数軸</text>
</svg>
<figcaption>一本一本が番号 \(n\omega_0\)。周期が長いほど隙間 \(\Delta\omega\) が狭い。隙間ゼロの極限が積分。</figcaption>
</figure>

### 和を積分に並べ替える

係数の式に \(T\) を掛けます:

$$
T c_n
=\int_{-T/2}^{T/2}f(t)e^{-in\omega_0 t}\,dt.
$$

右辺は「周期の窓の中だけの \(f\)」に逆回転を掛けて足したもの。窓（\(T\)）が広がると、これは全時間の積分

$$
F(\omega):=\int_{-\infty}^{\infty}f(t)e^{-i\omega t}\,dt
$$

の標本点 \(\omega=n\omega_0=n\Delta\omega\) での値に近づきます（窓の外は \(f=0\) とみなす）。つまり \(T c_n \approx F(n\Delta\omega)\)。

次に級数側。\(1=\dfrac{\Delta\omega}{2\pi}\cdot T\)（\(\Delta\omega=2\pi/T\) より）を使って:

$$
\begin{aligned}
f(t)
&\sim
\sum_{n=-\infty}^{\infty}
(T c_n)\,e^{i(n\Delta\omega) t}\cdot\frac{\Delta\omega}{2\pi}\\
&\approx
\sum_{n=-\infty}^{\infty}
F(n\Delta\omega)\,e^{i(n\Delta\omega) t}\cdot\frac{\Delta\omega}{2\pi}.
\end{aligned}
$$

- **よみ:** 「高さ \(F\)・位置 \(n\Delta\omega\)・幅 \(\Delta\omega\)」の**短冊**を足して最後に \(2\pi\) で割る。

\(\Delta\omega\to 0\) で短冊の和は積分そのものに見える:

$$
f(t)
\sim
\frac{1}{2\pi}\int_{-\infty}^{\infty}F(\omega)\,e^{i\omega t}\,d\omega.
$$

**橋を渡りました。**

| 級数（周期あり） | 変換（くり返さない） |
|---|---|
| とびとびの \(n\omega_0\) | 連続な \(\omega\) |
| 和 \(\sum_n\) | 積分 \(\int d\omega\) |
| 係数 \(c_n\)（各番号の分量） | 密度 \(F(\omega)\) |
| 一周期で割る \(1/T\) | 全時間で積分 |

---

## 4. フーリエ変換対 — 定義

ほどく側と組み立てる側を、正式な定義として固定します。

$$
F(\omega):=\int_{-\infty}^{\infty}f(t)\,e^{-i\omega t}\,dt
\qquad\text{（フーリエ変換：ほどいて測る）}
$$

$$
f(t)=\frac{1}{2\pi}\int_{-\infty}^{\infty}F(\omega)\,e^{i\omega t}\,d\omega
\qquad\text{（逆変換：測った分量で組み立て直す）}
$$

組 \((f,F)\) を**フーリエ変換対**と呼びます。

### なぜ「逆」が要るのか

数学で「逆」とは「やって、もう一度やると出発点に戻る」操作です。\(+5\) の逆は \(-5\)。
時間を逆回しする、という意味ではありません。

G5 ですでに同じ往復をしていました:

1. \(f\) に部品を掛けて一周積分 → 係数（**ほどく**）  
2. 係数で部品を足す → 波（**組み立てる**）  

2 がなければ 1 は数字の表で終わります。足し戻せてはじめて「この波はこれらの部品だった」と言える。
そして逆が本当に効くのはここからです——

> **周波数側で手を加えてから、時間に戻せる。**
> 高い周波数だけ弱めて戻すと、波はなめらかになる。……あれ？　これは、あの魔法の話では？

（G8 で答え合わせです。）

### 符号と \(2\pi\) の居場所

- 測るときは相手の回転を打ち消す向き \(e^{-i\omega t}\)、戻すときは本物の回転 \(e^{+i\omega t}\)——符号が逆なのは往復の往と復だから  
- \(2\pi\) が片側だけ付くのは、橋で出た前因子 \(\Delta\omega/(2\pi)\) の行き先。「戻すときの単位換算」と覚えます

---

## 5. 実戦 — 矩形パルスを変換する

### 例の設定

幅 \(a\) の矩形パルス（時刻ゼロ付近だけ高さ 1、外は 0）:

$$
f(t)=
\begin{cases}
1 & |t|\le a/2,\\
0 & |t|>a/2.
\end{cases}
$$

ゼロの区間は積分に寄与しないので:

$$
F(\omega)=\int_{-a/2}^{a/2}e^{-i\omega t}\,dt.
$$

### \(\omega=0\) のとき

\(e^0=1\) なので:

$$
F(0)=\int_{-a/2}^{a/2}1\,dt=a.
$$

- **よみ:** ゼロ周波数の重み ＝ パルスの面積。

### \(\omega\neq 0\) のとき

原始関数は \(e^{-i\omega t}/(-i\omega)\)（\((e^{kt})'=ke^{kt}\) で \(k=-i\omega\)）。端点代入すると:

$$
F(\omega)
=\Bigl[\frac{e^{-i\omega t}}{-i\omega}\Bigr]_{-a/2}^{a/2}.
$$

分子を整理すると:

$$
F(\omega)=\frac{e^{-i\omega a/2}-e^{i\omega a/2}}{-i\omega}.
$$

分子は \(\alpha=\omega a/2\) として \(e^{-i\alpha}-e^{i\alpha}=-2i\sin\alpha\)（§1 の式の裏返し）。よって:

$$
F(\omega)
=\frac{-2i\sin(\omega a/2)}{-i\omega}
=\frac{2\sin(\omega a/2)}{\omega}.
$$

\(\omega\to 0\) では \(\sin x\sim x\) なので \(a\) に戻り、\(\omega=0\) の結果とつながります。
そこで \(\operatorname{sinc}\)（シンク）関数

$$
\operatorname{sinc}(x):=\frac{\sin x}{x}
\quad(x\neq 0),\qquad
\operatorname{sinc}(0):=1
$$

を使えば、まとめて:

$$
\boxed{\ F(\omega)=a\,\operatorname{sinc}\Bigl(\frac{\omega a}{2}\Bigr)\ }
$$

- **読み:** 「エフオメガ イコール エー カケル シンク、オメガエー パー ツー」

### 読み取り — 幅のトレードオフ

| 時間側 | 周波数側 |
|---|---|
| 幅 \(a\) が**広い** | sinc の山が**細い**（低周波に集中） |
| 幅 \(a\) が**狭い** | 山が**広い**（高い周波数まで広がる） |

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 200" width="440" height="200" role="img" aria-label="短い矩形パルスの変換は、中央が高く左右に波打つ形">
  <rect width="440" height="200" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">短いパルス → 周波数は広くにじむ</text>
  <text x="40" y="40" font-size="11" fill="#555">時間 f(t)</text>
  <line x1="24" y1="110" x2="200" y2="110" stroke="#bbb" stroke-width="1"/>
  <path d="M 40 110 L 80 110 L 80 58 L 150 58 L 150 110 L 190 110" fill="none" stroke="#2c5f4a" stroke-width="2"/>
  <text x="96" y="80" font-size="11" fill="#2c5f4a">幅 a</text>
  <text x="230" y="40" font-size="11" fill="#555">周波数 F(ω)</text>
  <line x1="220" y1="110" x2="428" y2="110" stroke="#bbb" stroke-width="1"/>
  <path d="M 228.0 111.4 L 234.0 110.6 L 240.0 109.8 L 246.0 108.9 L 252.0 108.0 L 258.0 107.4 L 264.0 106.9 L 270.0 106.8 L 276.0 107.1 L 282.0 107.7 L 288.0 108.6 L 294.0 109.8 L 300.0 111.2 L 306.0 112.6 L 312.0 113.8 L 318.0 114.8 L 324.0 115.4 L 330.0 115.4 L 336.0 114.8 L 342.0 113.4 L 348.0 111.5 L 354.0 108.8 L 360.0 105.7 L 366.0 102.3 L 372.0 98.7 L 378.0 95.1 L 384.0 91.8 L 390.0 89.0 L 396.0 86.8 L 402.0 85.5 L 408.0 85.0 L 414.0 85.5 L 420.0 86.8" fill="none" stroke="#c45c26" stroke-width="1.8"/>
  <text x="24" y="188" font-size="11" fill="#555">時間で短い ↔ 周波数で広い。</text>
</svg>
<figcaption>矩形の変換は sinc 型。パルスが短いほど、スペクトルの山は横に広がる。</figcaption>
</figure>

> 🔬 **Living Figure:** [短いパルスほど広くにじむ — sinc](https://ogaogamirai.github.io/public/2d-commons/viewer.html?model=pulse-sinc-tradeoff)　（幅 \(a\) のスライダーに対して、山の広さが即座に応答します）

- **よみ:** 短いパルスほど、いろいろな速さの回転を混ぜないと作れない。長いパルスはゆっくり成分だけで足りる。

---

## 6. 三つの性質 — 毎回積分しなくてよくする

新しい波形のたびに変換をゼロから積分するのは大変です。でも波の作り方には、何度も出る変形が三つあります。**時間側で変形してからほどくのと、ほどいてから周波数側で同じことをするのは同じ**——を定義から導きます。

### 線形性（混ぜる）

$$
\mathcal{F}\{\alpha f+\beta g\}=\alpha F+\beta G.
$$

- **導出:** 積分の線形性（G3）でばらすだけ。  
- **よみ:** 二つの音を同時に鳴らした全体の混ざりは、それぞれの混ざりの和。そうでなければ部品に分ける意味がない。

### 平行移動（ずらす）

$$
\mathcal{F}\bigl\{f(t-t_0)\bigr\}=e^{-i\omega t_0}F(\omega).
$$

- **導出:** 置換 \(u=t-t_0\)。指数の中のたし算が、オイラーの積則で外に出る:
$$
\int f(u)e^{-i\omega(u+t_0)}du=e^{-i\omega t_0}\int f(u)e^{-i\omega u}du.
$$
- **よみ:** 遅れても、混ざりの大きさ \(|F|\) は同じ。動くのは各回転のスタート角だけ（\(e^{-i\omega t_0}\) は距離 1 の回転なので、掛けても大きさが変わらない——G6 §8）。

### スケール（伸ばす／縮める）

$$
\mathcal{F}\bigl\{f(at)\bigr\}=\frac{1}{|a|}F\Bigl(\frac{\omega}{a}\Bigr).
$$

- **導出（\(a>0\)）:** 置換 \(u=at,\ dt=du/a\) で
$$
\int f(u)\,e^{-i(\omega/a)u}\,\frac{du}{a}=\frac{1}{a}F(\omega/a).
$$
（\(a<0\) では向きの反転ともう一度打ち消し合って、前因子はやはり \(1/|a|\)。）
- **よみ:** 時間をつぶす ↔ 周波数が広がる。§5 の「短いパルス ↔ 広いスペクトル」の一般形。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 170" width="440" height="170" role="img" aria-label="時間を縮めると周波数は広がる">
  <rect width="440" height="170" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">時間を縮める ↔ 周波数は広がる</text>
  <text x="36" y="42" font-size="11" fill="#555">時間</text>
  <line x1="24" y1="88" x2="200" y2="88" stroke="#ddd" stroke-width="1"/>
  <path d="M 50 88 L 80 88 L 80 48 L 160 48 L 160 88 L 190 88" fill="none" stroke="#2a6fad" stroke-width="1.5"/>
  <path d="M 70 88 L 95 88 L 95 58 L 130 58 L 130 88 L 155 88" fill="none" stroke="#c45c26" stroke-width="2"/>
  <text x="86" y="120" font-size="10" fill="#2a6fad">広い（遅い）</text>
  <text x="100" y="136" font-size="10" fill="#c45c26">狭い（速い）</text>
  <text x="236" y="42" font-size="11" fill="#555">周波数</text>
  <line x1="220" y1="88" x2="428" y2="88" stroke="#ddd" stroke-width="1"/>
  <path d="M 250 88 L 280 40 L 310 88 L 340 70 L 370 88" fill="none" stroke="#c45c26" stroke-width="2"/>
  <path d="M 270 88 L 290 58 L 310 88 L 330 76 L 350 88" fill="none" stroke="#2a6fad" stroke-width="1.5"/>
  <text x="292" y="120" font-size="10" fill="#c45c26">広い</text>
  <text x="268" y="136" font-size="10" fill="#2a6fad">狭い</text>
</svg>
<figcaption>時間側でつぶすと、周波数側は横に伸びる。</figcaption>
</figure>

### 使用例 — 積分やり直さずに書く

矩形を \(t_0=1\) 遅らせた信号の変換は、積分なしで \(e^{-i\omega}F(\omega)\)（山の形そのまま）。
さらに時間方向に 2 倍へ伸ばした \(f(t/2)\) なら \(a=1/2\) で \(2F(2\omega)\)（細く・高く）。
線形性と合わせれば、「遅らせた矩形を二つ足した波」の \(F\) も即座に書けます。

---

## 7. 理論の地図 — G0 からここまで

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 250" width="440" height="250" role="img" aria-label="体験から変換までの一本道">
  <rect width="440" height="250" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">theory-v3 の一本道</text>
  <rect x="16" y="36" width="96" height="36" rx="5" fill="#eee8dc" stroke="#888"/>
  <text x="30" y="58" font-size="12" fill="#555">G0 体験（魔法）</text>
  <text x="118" y="58" font-size="14" fill="#888">→</text>
  <rect x="134" y="36" width="90" height="36" rx="5" fill="#eee8dc" stroke="#888"/>
  <text x="146" y="58" font-size="12" fill="#555">G1-G2 足し算・円</text>
  <text x="230" y="58" font-size="14" fill="#888">→</text>
  <rect x="246" y="36" width="88" height="36" rx="5" fill="#eee8dc" stroke="#888"/>
  <text x="260" y="58" font-size="12" fill="#555">G3-G4 面積・直交</text>
  <text x="340" y="58" font-size="14" fill="#888">→</text>
  <rect x="356" y="36" width="68" height="36" rx="5" fill="#eee8dc" stroke="#888"/>
  <text x="366" y="58" font-size="12" fill="#555">G5 級数</text>
  <rect x="16" y="96" width="96" height="36" rx="5" fill="#c45c26" fill-opacity="0.12" stroke="#c45c26"/>
  <text x="32" y="118" font-size="12" fill="#c45c26">G6 オイラー</text>
  <text x="118" y="118" font-size="14" fill="#888">→</text>
  <rect x="134" y="96" width="90" height="36" rx="5" fill="#c45c26" fill-opacity="0.12" stroke="#c45c26"/>
  <text x="148" y="118" font-size="12" fill="#c45c26">G7 複素級数</text>
  <text x="230" y="118" font-size="14" fill="#888">→</text>
  <rect x="246" y="96" width="88" height="36" rx="5" fill="#c45c26" fill-opacity="0.12" stroke="#c45c26"/>
  <text x="264" y="118" font-size="12" fill="#c45c26">橋 Δω→0</text>
  <text x="340" y="118" font-size="14" fill="#888">→</text>
  <rect x="356" y="96" width="68" height="36" rx="5" fill="#2a6fad" fill-opacity="0.12" stroke="#2a6fad"/>
  <text x="366" y="118" font-size="12" fill="#2a6fad">変換対</text>
  <rect x="16" y="156" width="180" height="36" rx="5" fill="#2c5f4a" fill-opacity="0.12" stroke="#2c5f4a"/>
  <text x="34" y="178" font-size="12" fill="#2c5f4a">ほどく／戻す・混ぜるずらす伸ばす</text>
  <text x="202" y="178" font-size="14" fill="#888">→</text>
  <rect x="222" y="156" width="202" height="36" rx="5" fill="#2c5f4a" fill-opacity="0.12" stroke="#2c5f4a"/>
  <text x="240" y="178" font-size="12" fill="#2c5f4a">G8 音・画像への答え合わせ</text>
  <text x="16" y="220" font-size="11" fill="#555">灰色＝土台。オレンジ＝回転で一本化。緑＝測って戻す。青＝到達点。</text>
</svg>
<figcaption>謎の提示から、測って戻す技術まで。残りは答え合わせと卒業。</figcaption>
</figure>

### 忘れたときの飛び先

| 思い出すこと | 章 |
|---|---|
| なぜ足し算で表すか / 円の影 | G0–G2 |
| 面積（積分）の道具 | G3 |
| 直交と係数公式 | G4–G5 |
| 複素・オイラー | G6 |
| 橋・変換対・三性質 | 本章 |

---

## 8. 章のまとめ

| 項目 | 式 |
|---|---|
| 回転で書く | \(\cos\theta=(e^{i\theta}+e^{-i\theta})/2\) |
| 複素級数 | \(f\sim\sum c_n e^{int}\)、\(c_n=\frac{1}{2\pi}\int fe^{-int}dt\) |
| 橋 | \(\Delta\omega=2\pi/T\to0\) で \(\sum\to\int\) |
| 変換対 | \(F=\int fe^{-i\omega t}dt\)、\(f=\frac{1}{2\pi}\int Fe^{i\omega t}d\omega\) |
| 矩形例 | \(F=a\,\mathrm{sinc}(\omega a/2)\) |
| 三性質 | 線形性／平行移動／スケール |

## 9. 導出チェック（白紙で）

1. \(\cos,\sin\) を \(e^{\pm i\theta}\) で書け。  
2. \(c_n\) の積分公式を、直交性の引用つきで導け。  
3. (153) 型の並べ替えで \(T\Delta\omega/(2\pi)=1\) を確認せよ。  
4. 矩形の \(F(\omega)\) を、端点代入から sinc まで通して計算せよ。  
5. 平行移動の性質を、置換積分で再現せよ。  

## 10. 確認

1. 変換対の二式を何も見ずに書き、どちらが測る側か言え。  
2. 「逆変換の逆」は何の逆か、一文で述べよ。  
3. パルスが狭いほど \(F\) が横に広がる理由を、sinc の式から説明せよ。  
4. 「時間を 2 倍速につぶす」と周波数側で何が起きるか、性質の式で言え。  
5. （振り返り）級数と変換の違いを「周期」「周波数」「組み立て方」の三点で対比せよ。  

---

## 11. 次の章への引き

道具は、すべて揃いました。

- 分解する技術: 変換 \(F(\omega)\)  
- 弱める技術: 周波数側で手を加える  
- 戻す技術: 逆変換  

さあ、最初の駅に戻りましょう。

**G0 で見たあの魔法——JPEG は何を捨てていたのか？——の正体に、自分の手で答え合わせをします。**

→ [G8. JPEG の正体に戻る](./G8_answer_jpeg.md)
