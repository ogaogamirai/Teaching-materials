# G5. 係数公式を自分の手で導く — フーリエ級数、完成

> **到達:** 直交性から \(a_0,a_n,b_n\) の公式を自分で導出し、方形波の例で係数を積分から最後まで計算できる。G1 で「与えられたもの」として使った係数の**由来が閉じる**。  
> **この章で導くこと:** 実数形フーリエ級数の完成公式＋方形波の完全計算。  
> <!-- eq-source: v2-C4 / v2-C5 -->

---

## 0. 前章からの引き

G4 の最後で、魔法は一度だけ実演しました。\(s_N\) に \(\sin(mt)\) を掛けて一周積分すると——\(b_m\) だけが残った。

あと残っているのは整理です。

1. \(b_m\) と同じ手続きで \(a_m\) も取り出す  
2. 底上げ成分 \(a_0\) も取り出す  
3. 「なぜ級数では \(a_0/2\) と書くのか」を揃える  
4. 完成公式を、本物の波（方形波）で試す  

これが終わると、**G0 の宣言「信号＝波の足し算」が、積分で計算できる技術になります。**

---

## 1. \(b_m\) — 前章の完成

まず前章の結論を正式に置きます（\(1\leq m\leq N\)）:

$$
b_m=\frac{1}{\pi}\int_0^{2\pi}s_N(t)\sin(mt)\,dt.
$$

- **読み:** 「ビーエム イコール ワンパイ カケル、エスエヌにサイン・エムティーを掛けて一周足したもの」  
- **よみ:** 掛けて一周足して、\(\pi\) で割る。\(\pi\) は「自分自身との面積」（G4 §4.2）だった。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 168" width="440" height="168" role="img" aria-label="掛けて一周積分すると、欲しい係数だけが残る">
  <rect width="440" height="168" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">混ざった束から、一本分だけ取り出す</text>
  <rect x="20" y="40" width="44" height="52" rx="4" fill="#eee8dc" stroke="#bbb"/>
  <text x="28" y="70" font-size="11" fill="#555">a₀/2</text>
  <rect x="72" y="40" width="44" height="52" rx="4" fill="#eee8dc" stroke="#bbb"/>
  <text x="80" y="62" font-size="11" fill="#555">a₁</text>
  <text x="76" y="78" font-size="10" fill="#888">cos t</text>
  <rect x="124" y="36" width="52" height="60" rx="4" fill="#c45c26" fill-opacity="0.18" stroke="#c45c26" stroke-width="1.8"/>
  <text x="134" y="62" font-size="12" fill="#c45c26">b₁</text>
  <text x="128" y="80" font-size="10" fill="#c45c26">sin t</text>
  <rect x="184" y="40" width="44" height="52" rx="4" fill="#eee8dc" stroke="#bbb"/>
  <text x="192" y="62" font-size="11" fill="#555">a₂</text>
  <text x="186" y="78" font-size="10" fill="#888">cos 2t</text>
  <rect x="236" y="40" width="44" height="52" rx="4" fill="#eee8dc" stroke="#bbb"/>
  <text x="244" y="62" font-size="11" fill="#555">b₂</text>
  <text x="238" y="78" font-size="10" fill="#888">sin 2t</text>
  <text x="290" y="70" font-size="16" fill="#888">…</text>
  <path d="M 150 100 L 150 118" stroke="#c45c26" stroke-width="1.6" marker-end="url(#arr)"/>
  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="#c45c26"/>
    </marker>
  </defs>
  <text x="162" y="116" font-size="11" fill="#c45c26">× sin t して一周積分</text>
  <rect x="108" y="128" width="84" height="28" rx="4" fill="#c45c26" fill-opacity="0.16" stroke="#c45c26"/>
  <text x="118" y="146" font-size="12" fill="#c45c26">b₁ × π だけ残る</text>
  <text x="220" y="146" font-size="11" fill="#555">ほかは打ち消し（G4）</text>
</svg>
<figcaption>欲しい部品を掛けて一周足すと、自分以外は 0。残りを \(\pi\) で割ると係数になる。</figcaption>
</figure>

---

## 2. \(a_m\) — 同じ作戦をコサインで

\(s_N\) の両辺に \(\cos(mt)\) を掛けて、\(0\) から \(2\pi\) まで積分します。

$$
\begin{aligned}
\int_0^{2\pi}s_N(t)\cos(mt)\,dt
&=\underbrace{\int \frac{a_0}{2}\cos(mt)\,dt}_{=0}
+\sum_{n=1}^{N}a_n\underbrace{\int\cos(nt)\cos(mt)\,dt}_{n=m \text{ のみ } \pi}\\
&\quad+\sum_{n=1}^{N}b_n\underbrace{\int\sin(nt)\cos(mt)\,dt}_{\text{いつも }0}.
\end{aligned}
$$

消える項を G4 の一覧表で確認:

- 定数項 … \(\int 1\cdot\cos = 0\)  
- \(b_n\) の項 … \(\sin\times\cos\) は同じ番号でも 0  
- \(a_n\) の項 … \(n=m\) だけ \(\pi\) を残す  

だから:

$$
\int_0^{2\pi}s_N(t)\cos(mt)\,dt=a_m\,\pi
\implies
a_m=\frac{1}{\pi}\int_0^{2\pi}s_N(t)\cos(mt)\,dt.
$$

- **よみ:** コサインを掛けて一周足してパイで割る。\(b_m\) と**まったく同じ型**です。

---

## 3. \(a_0\) — 何も掛けずに積分する

定数を取り出すには、定数 \(1\) を掛ければいい（＝何も掛けない）。

$$
\begin{aligned}
\int_0^{2\pi}s_N(t)\,dt
&=\frac{a_0}{2}\cdot 2\pi
+\sum_{n=1}^{N}a_n\underbrace{\int\cos(nt)\,dt}_{=0}\\
&\quad+\sum_{n=1}^{N}b_n\underbrace{\int\sin(nt)\,dt}_{=0}
=a_0\,\pi.
\end{aligned}
$$

$$
a_0=\frac{1}{\pi}\int_0^{2\pi}s_N(t)\,dt.
$$

- **よみ:** 振動部品は一周で打ち消すから、残るのは底上げだけ。「一周の平均」は \(\dfrac{1}{2\pi}\int s_N=\dfrac{a_0}{2}\)、つまり \(a_0\) は「**平均の 2 倍**」。

### なぜ級数では \(a_0/2\) と書くのか

ここで小さな疑問が生まれます。なぜ本体側で半分にしておくのか？

| 書き方 | 取り出し公式 |
|---|---|
| 定数を「ただの \(a_0\)」と書く | \(a_0=\dfrac{1}{2\pi}\int s_N\) —— \(n\geq 1\) の \(\dfrac{1}{\pi}\) と**ずれる** |
| 定数を「\(a_0/2\)」と書く | \(a_0=\dfrac{1}{\pi}\int s_N\) —— **すべての係数が同じ型** |

観察してみましょう。定数関数 1 は \(\cos(0\cdot t)=1\) と見えます。すると三つの公式はどれも

$$
(\text{係数})=\frac{1}{\pi}\int_0^{2\pi}s_N(t)\times(\text{その部品})\,dt
$$

という**一つの型**に統一されます。半分に書いておくのは暗記のためではなく、**公式を一本に揃えるため**なのです。

---

## 4. 本体へ — もとの信号 \(f\) への読み替え

いままで取り出しの練習台だったのは近似 \(s_N\) でした。
周期 \(2\pi\) の信号 \(f\) が無限の部品で表されるとき（収束の細部は後回しでよい）、

$$
f(t)
=
\frac{a_0}{2}
+\sum_{n=1}^{\infty}\bigl(a_n\cos(nt)+b_n\sin(nt)\bigr),
$$

係数は \(s_N\) を \(f\) に替えるだけで出ます:

$$
\begin{align*}
a_0&=\frac{1}{\pi}\int_0^{2\pi}f(t)\,dt,\\[4pt]
a_n&=\frac{1}{\pi}\int_0^{2\pi}f(t)\cos(nt)\,dt
&& (n\geq 1),\\[4pt]
b_n&=\frac{1}{\pi}\int_0^{2\pi}f(t)\sin(nt)\,dt
&& (n\geq 1).
\end{align*}
$$

- **読み:** 「ワンパイ カケル、エフに部品を掛けて一周足したもの」  
- **よみ:** **もとの波形に、取りたい部品を掛けて一周足し、パイで割る。** それが全部です。

### 小さな検算 — 公式が逆操作になっているか

G1 で「与えられたもの」として使った \(s_1(t)=\dfrac{4}{\pi}\sin t\)。この \(b_1\) を新しい公式で求め直します:

$$
b_1
=\frac{1}{\pi}\int_0^{2\pi}\frac{4}{\pi}\sin t\cdot\sin t\,dt
=\frac{4}{\pi^2}\int_0^{2\pi}\sin^2 t\,dt.
$$

さらに $\int_0^{2\pi}\sin^2 t\,dt=\pi$ を代入:

$$
b_1=\frac{4}{\pi^2}\cdot\pi=\frac{4}{\pi}.
$$

- **よみ:** 公式に入れたら、もとの値が戻ってきた。取り出しが正しく逆向きの操作になっている確認です。

---

## 5. 完成！　実数形フーリエ級数

道具が全部揃いました。完成形を掲げます。

$$
f(t)
\sim
\frac{a_0}{2}
+\sum_{n=1}^{\infty}\bigl(a_n\cos(nt)+b_n\sin(nt)\bigr),
$$

$$
\begin{aligned}
a_0&=\frac{1}{\pi}\int_0^{2\pi}f(t)\,dt,\\
a_n&=\frac{1}{\pi}\int f\cos(nt)\,dt,\quad
b_n=\frac{1}{\pi}\int f\sin(nt)\,dt.
\end{aligned}
$$

（記号 \(\sim\) は「級数として対応する」。連続な点では等号と思ってよい、と当面は扱います。）

**G0 の「信号＝単純な波の足し算」が、積分ひとつで部品ごとの強さを測れる技術になりました。**

でもまだ終わりません。公式が本当に動くところを、自分の手で見ます。

---

## 6. 実戦 — 方形波を分解する

### 例の設定

値が \(\pm1\) だけの方形波（半周 \(+1\)、次の半周 \(-1\)、くり返し）。切り替え点の一两点の値は積分に影響しないので気にしません。

$$
f(t)=
\begin{cases}
\phantom{-}1 & 0<t<\pi,\\
-1 & \pi<t<2\pi.
\end{cases}
$$

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 170" width="440" height="170" role="img" aria-label="方形波は半周プラス1、次の半周マイナス1">
  <rect width="440" height="170" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">方形波 f(t) — 半周 +1、半周 −1</text>
  <line x1="40" y1="90" x2="400" y2="90" stroke="#bbb" stroke-width="1"/>
  <line x1="40" y1="28" x2="40" y2="152" stroke="#bbb" stroke-width="1"/>
  <path d="M 40 90 L 40 44 L 210 44 L 210 136 L 380 136 L 380 90" fill="none" stroke="#c45c26" stroke-width="2.4"/>
  <rect x="40" y="44" width="170" height="46" fill="#2c5f4a" fill-opacity="0.12"/>
  <rect x="210" y="90" width="170" height="46" fill="#c45c26" fill-opacity="0.12"/>
  <text x="108" y="72" font-size="13" fill="#2c5f4a">+1</text>
  <text x="278" y="118" font-size="13" fill="#c45c26">−1</text>
  <text x="36" y="162" font-size="11" fill="#555">0</text>
  <text x="204" y="162" font-size="11" fill="#555">π</text>
  <text x="368" y="162" font-size="11" fill="#555">2π</text>
  <text x="48" y="38" font-size="11" fill="#888">このあと同じ形がくり返す</text>
</svg>
<figcaption>値が \(\pm 1\) だけなので、積分は区間を二つに切るだけ。</figcaption>
</figure>

### \(a_0\) — 上と下は打ち消す

区間の分割（G3）で二つに切ります:

$$
a_0
=\frac{1}{\pi}\left(
\int_0^{\pi}1\,dt+\int_{\pi}^{2\pi}(-1)\,dt
\right)
=\frac{1}{\pi}\bigl(\pi-\pi\bigr)=0.
$$

- **よみ:** 上半分と下半分の面積が同じ。底上げなし。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 150" width="440" height="150" role="img" aria-label="方形波の上半分と下半分の面積が打ち消してエーゼロはゼロ">
  <rect width="440" height="150" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">a₀：上の面積と下の面積が同じ</text>
  <line x1="40" y1="78" x2="400" y2="78" stroke="#bbb" stroke-width="1"/>
  <rect x="40" y="36" width="170" height="42" fill="#2c5f4a" fill-opacity="0.28" stroke="#2c5f4a"/>
  <rect x="210" y="78" width="170" height="42" fill="#c45c26" fill-opacity="0.28" stroke="#c45c26"/>
  <text x="104" y="62" font-size="13" fill="#2c5f4a">+π</text>
  <text x="274" y="104" font-size="13" fill="#c45c26">−π</text>
  <text x="36" y="136" font-size="11" fill="#555">0</text>
  <text x="204" y="136" font-size="11" fill="#555">π</text>
  <text x="368" y="136" font-size="11" fill="#555">2π</text>
  <text x="300" y="28" font-size="12" fill="#555">足すと 0 → a₀ = 0</text>
</svg>
<figcaption>\(a_0\) は「一周の合計」。プラス半周とマイナス半周が同じ量なので 0。</figcaption>
</figure>

### \(a_n\) — コサインは混ざらない

$$
a_n
=\frac{1}{\pi}\left(
\int_0^{\pi}\cos(nt)\,dt
-\int_{\pi}^{2\pi}\cos(nt)\,dt
\right).
$$

原始関数は \(\dfrac{\sin(nt)}{n}\)。端点は \(\sin(n\pi)=\sin(2\pi n)=0\)（\(n\) 整数）なので両方の積分が 0:

$$
a_n=0
\quad(n\geq 1).
$$

- **よみ:** この上下対称な波には、コサイン部品が一つも混ざらない。

### \(b_n\) — サインだけが残る

$$
b_n
=\frac{1}{\pi}\left(
\int_0^{\pi}\sin(nt)\,dt
-\int_{\pi}^{2\pi}\sin(nt)\,dt
\right).
$$

原始関数は \(-\dfrac{\cos(nt)}{n}\)。各区間を計算すると:

$$
\int_0^{\pi}\sin(nt)\,dt
=\Bigl[-\frac{\cos(nt)}{n}\Bigr]_0^{\pi}
=\frac{1-\cos(n\pi)}{n},
$$

$$
\int_{\pi}^{2\pi}\sin(nt)\,dt
=\Bigl[-\frac{\cos(nt)}{n}\Bigr]_{\pi}^{2\pi}
=\frac{-1+\cos(n\pi)}{n}.
$$

代入してまとめる:

$$
b_n
=\frac{1}{\pi}\cdot\frac{2\bigl(1-\cos(n\pi)\bigr)}{n}.
$$

あとは \(\cos(n\pi)\) の場合分けだけです:

| \(n\) | \(\cos(n\pi)\) | \(b_n\) |
|---|---|---|
| 偶数 | \(1\) | \(0\) |
| 奇数 | \(-1\) | \(\dfrac{2\times 2}{n\pi}=\dfrac{4}{n\pi}\) |

$$
b_n=
\begin{cases}
\dfrac{4}{n\pi} & n\text{ が奇数},\\[6pt]
0 & n\text{ が偶数}.
\end{cases}
$$

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 150" width="440" height="150" role="img" aria-label="偶数番号のビーはゼロ、奇数番号だけ残る">
  <rect width="440" height="150" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">残る部品は、奇数倍のサインだけ</text>
  <rect x="16" y="36" width="52" height="70" rx="4" fill="#eee8dc" stroke="#ccc"/>
  <text x="28" y="58" font-size="11" fill="#888">b₁</text>
  <text x="22" y="78" font-size="12" fill="#c45c26">4/π</text>
  <text x="24" y="96" font-size="10" fill="#888">奇数</text>
  <rect x="76" y="36" width="52" height="70" rx="4" fill="#f3f1ea" stroke="#ddd"/>
  <text x="88" y="58" font-size="11" fill="#aaa">b₂</text>
  <text x="94" y="80" font-size="14" fill="#aaa">0</text>
  <rect x="136" y="36" width="52" height="70" rx="4" fill="#eee8dc" stroke="#ccc"/>
  <text x="148" y="58" font-size="11" fill="#888">b₃</text>
  <text x="140" y="78" font-size="12" fill="#c45c26">4/(3π)</text>
  <text x="144" y="96" font-size="10" fill="#888">奇数</text>
  <rect x="196" y="36" width="52" height="70" rx="4" fill="#f3f1ea" stroke="#ddd"/>
  <text x="208" y="58" font-size="11" fill="#aaa">b₄</text>
  <text x="214" y="80" font-size="14" fill="#aaa">0</text>
  <rect x="256" y="36" width="52" height="70" rx="4" fill="#eee8dc" stroke="#ccc"/>
  <text x="268" y="58" font-size="11" fill="#888">b₅</text>
  <text x="260" y="78" font-size="12" fill="#c45c26">4/(5π)</text>
  <text x="264" y="96" font-size="10" fill="#888">奇数</text>
  <text x="318" y="76" font-size="16" fill="#888">…</text>
  <text x="16" y="132" font-size="11" fill="#555">a₀ も aₙ も 0。級数はサインの奇数倍だけになる。</text>
</svg>
<figcaption>偶数番は計算すると消える。強さは番号 \(n\) で割られるので、高い倍音ほど小さい。</figcaption>
</figure>

### 級数の完成形

$$
f(t)
=
\frac{4}{\pi}\left(
\sin t+\frac{1}{3}\sin(3t)+\frac{1}{5}\sin(5t)+\cdots
\right).
$$

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 170" width="440" height="170" role="img" aria-label="方形波に部分和を重ねると、段差に近づく">
  <rect width="440" height="170" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">いま出した級数を、もとの方形波に重ねる</text>
  <line x1="40" y1="90" x2="400" y2="90" stroke="#ddd" stroke-width="1"/>
  <path d="M 40 90 L 40 54 L 220 54 L 220 126 L 400 126 L 400 90" fill="none" stroke="#bbb" stroke-width="1.6"/>
  <path d="M 40.0 90.0 L 49.0 69.4 L 58.0 54.3 L 67.0 47.6 L 76.0 48.5 L 85.0 53.3 L 94.0 57.4 L 103.0 58.0 L 112.0 55.4 L 121.0 51.9 L 130.0 50.3 L 139.0 51.9 L 148.0 55.4 L 157.0 58.0 L 166.0 57.4 L 175.0 53.3 L 184.0 48.5 L 193.0 47.6 L 202.0 54.3 L 211.0 69.4 L 220.0 90.0 L 229.0 110.6 L 238.0 125.7 L 247.0 132.4 L 256.0 131.5 L 265.0 126.7 L 274.0 122.6 L 283.0 122.0 L 292.0 124.6 L 301.0 128.1 L 310.0 129.7 L 319.0 128.1 L 328.0 124.6 L 337.0 122.0 L 346.0 122.6 L 355.0 126.7 L 364.0 131.5 L 373.0 132.4 L 382.0 125.7 L 391.0 110.6 L 400.0 90.0" fill="none" stroke="#c45c26" stroke-width="2"/>
  <text x="36" y="156" font-size="11" fill="#555">0</text>
  <text x="212" y="156" font-size="11" fill="#555">π</text>
  <text x="384" y="156" font-size="11" fill="#555">2π</text>
  <text x="300" y="36" font-size="11" fill="#888">薄い線＝方形波</text>
  <text x="300" y="52" font-size="11" fill="#c45c26">太い線＝s₅</text>
</svg>
<figcaption>G1 で「与えられたもの」として眺めた曲線が、いまは自分で導いた係数から出ている。</figcaption>
</figure>

> 🔬 **Living Figure:** [足すほど段差になる — フーリエ部分和](https://ogaogamirai.github.io/public/2d-commons/viewer.html?model=fourier-partials)　（いま導いた係数の足し算を、\(N\) を変えながら眺め直してみてください）

**G1 の思い出:** あのとき \(b_n=\frac{4}{n\pi}\) は「与えられた混ざり方」でした。いまは、積分三つで**あなた自身の手が導いた**ものです。

### 一点での検算

連続区間の代表点 \(t=\pi/2\)（そこでは \(f=1\)）で級数を見ると:

$$
\frac{4}{\pi}\left(1-\frac{1}{3}+\frac{1}{5}-\frac{1}{7}+\cdots\right).
$$

括弧内は有名な交代和で \(\pi/4\) に向かいます（証明は必須にしない）。向かう先は \(\dfrac{4}{\pi}\cdot\dfrac{\pi}{4}=1\)——もとの値に戻ります。

---

## 7. 章のまとめ

| 係数 | 公式 | 掛けたもの |
|---|---|---|
| \(a_0\) | \(\dfrac{1}{\pi}\int_0^{2\pi}f\,dt\) | \(1\) |
| \(a_n\) | \(\dfrac{1}{\pi}\int_0^{2\pi}f\cos(nt)\,dt\) | \(\cos(nt)\) |
| \(b_n\) | \(\dfrac{1}{\pi}\int_0^{2\pi}f\sin(nt)\,dt\) | \(\sin(nt)\) |

- 級数本体は定数を \(a_0/2\) と書く（公式を一本に揃えるため）  
- 方形波: \(a_0=a_n=0\)、奇数 \(n\) のみ \(b_n=4/(n\pi)\)  
- **実数の \(\sin,\cos\) だけで、分解の道はここまで完走しました**

## 8. 導出チェック（白紙で）

1. \(a_m\) の取り出しを、直交関係の引用つきで再現せよ。  
2. \(a_0\) が「一周平均の 2 倍」になる理由を言え。  
3. \(a_0/2\) 表記の利点を一文で述べよ。  
4. 方形波の \(b_n\) 計算を、原始関数の代入から場合分けまで通して書け。  

## 9. 確認

1. 完成公式（級数＋係数三つ）を何も見ずに書け。  
2. \(a_2\) を求める手順を、言葉だけで（何を掛け、どこまで足し、何で割るか）述べよ。  
3. 方形波にコサインが混ざらない理由を、波形の対称性で一言考察せよ。  
4. （振り返り）G0 の宣言が、この章でどんな「技術」になったか一文で。  

---

## 10. 次の章への引き

ここまでの道のりを振り返ってください。

- 部品: 円の影（G2）  
- 文法: 足し算（G1）  
- 測り方: 面積（G3）  
- 分離: 直交（G4）  
- 完成: 係数公式（G5）  

**実数だけで、ここまで来ました。**

でも、少し不格好なところがあります。部品が \(\sin\) と \(\cos\) の**ペア**で、式がどうしても縦長になる。そして「回転」という円の本質を、実数の世界では横に抱えているだけです。

複素数を使えば、**回転そのものを一文字 \(e^{i\theta}\) で書ける**——そうなると級数は劇的に引き締まり、そして「有限から無限への橋」（フーリエ変換）が見えてきます。

→ [G6. e^{iθ} — 回転を一文字で書く](./G6_complex_rotation.md)
