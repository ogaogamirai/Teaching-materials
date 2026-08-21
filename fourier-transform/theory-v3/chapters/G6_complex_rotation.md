# G6. e^{iθ} — 回転を一文字で書く

> **到達:** \(a+bi\) の四則ができ、極形式で**掛け算＝拡大と回転**を加法定理から導出できる。\(e^{i\theta}=\cos\theta+i\sin\theta\)（オイラーの公式）を微分の一意性から導出し、回転の合成を指数の積として使える。  
> **この章で導くこと:** 複素数の最小セット＋オイラーの公式。  
> <!-- eq-source: v2-D0 / v2-D1 -->

---

## 0. 前章からの引き — 実数だけの不格好さ

G5 でフーリエ級数は完成しました。でも、もう一度式を見てください。

$$
f(t)=\frac{a_0}{2}+\sum_{n=1}^{\infty}\bigl(a_n\cos(nt)+b_n\sin(nt)\bigr)
$$

部品が **\(\sin\) と \(\cos\) のペア**です。一つの周波数 \(n\) を表すのに、係数が二つ、関数も二つ。G2 では「縦と横の影は同じ円の見方の違い」と言いました——ならば、円をまるごと一つの数にまとめられないのか？

この章で立てる問いはこうです。

> **「角を足す」ことを、「掛け算」で書けないか？**

答えは **はい** です。しかもその鍵は、数学で最も美しい公式の一つにたどり着きます。

---

## 1. 新しい数 — \(i\) と複素数

実数の世界には、二乗して \(-1\) になる数はありません。そこで新しい記号を導入し、ルールを**ひとつだけ**置きます。

$$
i^2=-1.
$$

- **読み:** 「アイの二乗はマイナスいち」

これを使って、実数 \(a,b\) で次の形の数を作ります:

$$
z=a+bi.
$$

- **読み:** 「エー足すビーアイ」  
- \(a\) を **実部**、\(b\) を **虚部** と呼ぶ。

### 平面の点として読む

\(z=a+bi\) を、座標平面の点 \((a,b)\) だと思ってください。横が実部、縦が虚部。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" role="img" aria-label="複素数は平面の点。横が実部、縦が虚部">
  <rect width="360" height="240" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">z = a + bi は、点 (a, b)</text>
  <line x1="40" y1="150" x2="330" y2="150" stroke="#bbb" stroke-width="1"/>
  <line x1="80" y1="28" x2="80" y2="220" stroke="#bbb" stroke-width="1"/>
  <line x1="80" y1="150" x2="230" y2="70" stroke="#c45c26" stroke-width="2"/>
  <circle cx="230" cy="70" r="5" fill="#c45c26"/>
  <line x1="230" y1="70" x2="230" y2="150" stroke="#2a6fad" stroke-dasharray="4 3" stroke-width="1.2"/>
  <line x1="80" y1="150" x2="230" y2="150" stroke="#2c5f4a" stroke-width="2"/>
  <text x="140" y="168" font-size="12" fill="#2c5f4a">a（実部・横）</text>
  <text x="238" y="118" font-size="12" fill="#2a6fad">b（虚部・縦）</text>
  <text x="236" y="62" font-size="13" fill="#c45c26">z</text>
  <text x="118" y="100" font-size="12" fill="#555">r = |z|</text>
  <path d="M110 150 A 30 30 0 0 0 104 128" fill="none" stroke="#888" stroke-width="1.2"/>
  <text x="118" y="138" font-size="12" fill="#555">θ</text>
  <text x="310" y="166" font-size="11" fill="#888">Re</text>
  <text x="56" y="36" font-size="11" fill="#888">Im</text>
</svg>
<figcaption>横が実部、縦が虚部。原点からの長さが \(|z|\)、実軸からの角が偏角。</figcaption>
</figure>

原点からの距離は三平方で:

$$
|z|=|a+bi|=\sqrt{a^2+b^2}.
$$

- **よみ:** ゼットの絶対値 ＝ 原点からの長さ。

### \(i\) を掛けるたび、\(90^\circ\) 回る

\(i^2=-1\) というたった一つのルールが、単位円上の回転を生みます。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" width="360" height="240" role="img" aria-label="アイを掛けるたびに単位円を90度ずつ回る">
  <rect width="360" height="240" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">i を掛けるたびに、90° ずつ回る</text>
  <line x1="30" y1="130" x2="250" y2="130" stroke="#ddd" stroke-width="1"/>
  <line x1="140" y1="28" x2="140" y2="220" stroke="#ddd" stroke-width="1"/>
  <circle cx="140" cy="130" r="70" fill="none" stroke="#ccc" stroke-width="1.4"/>
  <circle cx="210" cy="130" r="5" fill="#2c5f4a"/>
  <text x="218" y="128" font-size="12" fill="#2c5f4a">1</text>
  <circle cx="140" cy="60" r="5" fill="#2a6fad"/>
  <text x="148" y="54" font-size="12" fill="#2a6fad">i</text>
  <circle cx="70" cy="130" r="5" fill="#c45c26"/>
  <text x="28" y="128" font-size="12" fill="#c45c26">−1</text>
  <circle cx="140" cy="200" r="5" fill="#555"/>
  <text x="148" y="214" font-size="12" fill="#555">−i</text>
  <path d="M200 100 A 50 50 0 0 0 170 80" fill="none" stroke="#c45c26" stroke-width="1.4"/>
  <path d="M110 80 A 50 50 0 0 0 90 110" fill="none" stroke="#c45c26" stroke-width="1.4"/>
  <path d="M90 150 A 50 50 0 0 0 120 180" fill="none" stroke="#c45c26" stroke-width="1.4"/>
  <path d="M170 180 A 50 50 0 0 0 200 150" fill="none" stroke="#c45c26" stroke-width="1.4"/>
  <text x="260" y="70" font-size="12" fill="#1c1a16">i¹ = i</text>
  <text x="260" y="92" font-size="12" fill="#1c1a16">i² = −1</text>
  <text x="260" y="114" font-size="12" fill="#1c1a16">i³ = −i</text>
  <text x="260" y="136" font-size="12" fill="#1c1a16">i⁴ = 1</text>
</svg>
<figcaption>掛けるたびに反時計まわりへ四分の一円。一周すると 1 に戻る。</figcaption>
</figure>

---

## 2. 四則 — ルールは「展開＋\(i^2=-1\)」だけ

### たし算・ひき算

実部どうし・虚部どうし:

$$
(a+bi)+(c+di)=(a+c)+(b+d)i.
$$

- **よみ:** 平面では矢印（ベクトル）を足すのと同じ。

### かけ算

普通の括弧展開をして、\(i^2=-1\) だけ使います:

$$
\begin{align*}
(a+bi)(c+di)
&=ac+adi+bci+bd\underbrace{i^2}_{=-1}\\
&=(ac-bd)+(ad+bc)i.
\end{align*}
$$

- **よみ:** 実部は「実×実 − 虚×虚」、虚部は「実×虚＋虚×実」。  

例: \((1+i)(1+i)=1+2i+i^2=2i\)。

### 共役とわり算

虚部の符号だけ反転したものを**共役**といいます: \(\overline{a+bi}=a-bi\)。
共役を掛けると虚部が消えます:

$$
(a+bi)(a-bi)=a^2+b^2=|z|^2.
$$

わり算は、分母に共役を掛けて分母を実数化するだけ:

$$
\frac{a+bi}{c+di}
=\frac{(a+bi)(c-di)}{(c+di)(c-di)}
=\frac{(a+bi)(c-di)}{c^2+d^2}.
$$

これで足し引き掛け割れる。\(\mathbb{R}^2\) の平面が、四則のそろった「数の世界」になりました。

---

## 3. 極形式 — 「距離と角」で書く

点を「横・縦」ではなく「距離・角」で書きます。\(r=|z|\)、そして

$$
\cos\theta=\frac{a}{r},
\qquad
\sin\theta=\frac{b}{r}
$$

となる角 \(\theta\) を取れば:

$$
z=a+bi=r\cos\theta+i\,r\sin\theta=r(\cos\theta+i\sin\theta).
$$

- **読み:** 「アール カケル コサインシータ プラス アイ サインシータ」  
- **よみ:** 「長さ \(r\) だけ進んだ方向 \(\theta\)」の点。

\(r=1\) なら、単位円上の点 \((\cos\theta,\sin\theta)\) に \(i\) を付けたものそのもの——**G2 の絵がそのまま使えます**。

---

## 4. 掛け算＝拡大と回転

### 主張

$$
\begin{align*}
&r_1(\cos\theta_1+i\sin\theta_1)
\cdot
r_2(\cos\theta_2+i\sin\theta_2)\\
&=
r_1 r_2\Bigl(\cos(\theta_1+\theta_2)+i\sin(\theta_1+\theta_2)\Bigr).
\end{align*}
$$

- **読み:** 長さは掛け算、角はたし算。  
- **つまり: 掛けることは、伸ばすことと、回すこと。**

### 導出 — 加法定理がここで効く

左辺を展開します:

$$
\begin{align*}
&(r_1\cos\theta_1+i r_1\sin\theta_1)(r_2\cos\theta_2+i r_2\sin\theta_2)\\
&=r_1 r_2\Bigl(
\underbrace{\cos\theta_1\cos\theta_2-\sin\theta_1\sin\theta_2}_{=\,\cos(\theta_1+\theta_2)}
+i\underbrace{(\cos\theta_1\sin\theta_2+\sin\theta_1\cos\theta_2)}_{=\,\sin(\theta_1+\theta_2)}
\Bigr),
\end{align*}
$$

括弧の中身は、まさに G1・G4 で何度も使った**加法定理**そのものでした:

$$
\cos(\theta_1+\theta_2)=\cos\theta_1\cos\theta_2-\sin\theta_1\sin\theta_2,
$$

$$
\sin(\theta_1+\theta_2)=\sin\theta_1\cos\theta_2+\cos\theta_1\sin\theta_2.
$$

これで主張が出ました。**G4 で「積を和に直す機械」として使った加法定理が、ここでは「掛け算を回転に翻訳する機械」として戻ってくる**のです。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 230" width="400" height="230" role="img" aria-label="二つの複素数を掛けると長さは積、角は和">
  <rect width="400" height="230" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">掛ける ＝ 長さは積、角は和</text>
  <line x1="30" y1="170" x2="280" y2="170" stroke="#ddd" stroke-width="1"/>
  <line x1="80" y1="28" x2="80" y2="210" stroke="#ddd" stroke-width="1"/>
  <line x1="80" y1="170" x2="190" y2="130" stroke="#2a6fad" stroke-width="2"/>
  <circle cx="190" cy="130" r="4" fill="#2a6fad"/>
  <text x="196" y="126" font-size="12" fill="#2a6fad">z₁（角 θ₁）</text>
  <line x1="80" y1="170" x2="150" y2="90" stroke="#2c5f4a" stroke-width="2"/>
  <circle cx="150" cy="90" r="4" fill="#2c5f4a"/>
  <text x="70" y="78" font-size="12" fill="#2c5f4a">z₂（角 θ₂）</text>
  <line x1="80" y1="170" x2="230" y2="48" stroke="#c45c26" stroke-width="2.4"/>
  <circle cx="230" cy="48" r="5" fill="#c45c26"/>
  <text x="238" y="46" font-size="12" fill="#c45c26">z₁z₂（角 θ₁+θ₂）</text>
  <path d="M115 170 A 35 35 0 0 0 112 152" fill="none" stroke="#2a6fad" stroke-width="1.2"/>
  <path d="M118 170 A 38 38 0 0 0 108 138" fill="none" stroke="#2c5f4a" stroke-width="1.2"/>
  <path d="M122 170 A 42 42 0 0 0 104 122" fill="none" stroke="#c45c26" stroke-width="1.3"/>
  <text x="290" y="100" font-size="12" fill="#555">長さ r₁r₂</text>
  <text x="290" y="120" font-size="12" fill="#555">向きは足した角</text>
</svg>
<figcaption>新しい矢印の長さは元の長さの積、向きは元の角の和。</figcaption>
</figure>

### 検算 — \(i\) を掛けると \(90^\circ\)

\(i=\cos\frac{\pi}{2}+i\sin\frac{\pi}{2}\) なので、\(i\) を掛ける＝\(90^\circ\) 回す。
座標でも確認できます: \((a+bi)\cdot i=ai+bi^2=-b+ai\)。点 \((a,b)\to(-b,a)\)。確かに \(90^\circ\) 回転です。

### 単位円上なら「回転のみ」

\(r_1=r_2=1\) だと長さは変わらず:

$$
(\cos\theta_1+i\sin\theta_1)(\cos\theta_2+i\sin\theta_2)
=\cos(\theta_1+\theta_2)+i\sin(\theta_1+\theta_2).
$$

- **よみ:** 単位の複素数を掛けることは、**その角だけ回すこと**。

---

## 5. 問いの答えが近づく — しかし記法が重い

問い「角を足すことを掛け算で書けないか」には、もう答えられています:

$$
\begin{aligned}
&\text{角の和 } \theta_1+\theta_2\\
&\quad\Longleftrightarrow\quad
(\cos\theta_1+i\sin\theta_1)\times(\cos\theta_2+i\sin\theta_2)
\end{aligned}
$$

ただし、まだ不満が残ります。\(\cos\theta+i\sin\theta\) は**毎回二文字ぶんの式**です。

一方、実数の世界にはこんな性質がありました:

> 🪜 **足場を渡す:** 指数関数 \(e^x\)（イーのエックス エックス乗）
> $$
> e^x:=\sum_{n=0}^{\infty}\frac{x^n}{n!}=1+x+\frac{x^2}{2!}+\cdots,
> \qquad
> (e^x)'=e^x,
> \qquad
> e^{x+y}=e^x e^y.
> $$
> （級数定義から項ごとに微分すると \((e^x)'=e^x\)、そこから指数法則まで出ます。導出の全道程は v2 本編 B′6 章。ここでは「自分自身が微分になる魔法の定数 \(e\simeq 2.718\cdots\)」として使います。）

もし

$$
e^{i\theta}\overset{?}{=}\cos\theta+i\sin\theta
$$

と言ってよいなら、回転の合成は

$$
e^{i\theta_1}e^{i\theta_2}=e^{i(\theta_1+\theta_2)}
$$

——**回転が、ただのべき乗になります。**

これは等号が成立するかどうか確かめるべき主張です。次節で証明します。

---

## 6. e^{iθ} を定義して、微分する

### 定義（級数）

実数版の定義に \(i\theta\) を代入します:

$$
e^{i\theta}
:=\sum_{n=0}^{\infty}\frac{(i\theta)^n}{n!}.
$$

展開すると:

$$
e^{i\theta}=1+i\theta+\frac{(i\theta)^2}{2!}+\frac{(i\theta)^3}{3!}+\cdots.
$$

- **読み:** 「イーのアイシータ」  
- \(i\) の累乗は \(i^2=-1\) だけで回ります: \(i^0=1,\ i=i,\ i^2=-1,\ i^3=-i,\ i^4=1,\ldots\)  
- 特に \(\theta=0\) で \(e^{i\cdot 0}=1\)。

### 微分すると \(i\) 倍

級数を項ごとに \(\theta\) で微分します（\(n=0\) 項は消える）:

$$
\frac{d}{d\theta}\frac{(i\theta)^n}{n!}
=\frac{n(i\theta)^{n-1}\cdot i}{n!}
=\frac{i\,(i\theta)^{n-1}}{(n-1)!}.
$$

番号を \(m=n-1\) と置き直して集めると:

$$
\frac{d}{d\theta}e^{i\theta}
=i\sum_{m=0}^{\infty}\frac{(i\theta)^m}{m!}
=i\,e^{i\theta}.
$$

- **よみ:** 微分すると、自分の \(i\) 倍になる。

なぜ \(i\) 倍が自然かは、絵で見ると美しいです。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 230" width="380" height="230" role="img" aria-label="微分するとアイ倍。半径に直角な接線方向へ進む">
  <rect width="380" height="230" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">微分する ＝ i 倍 ＝ 接線方向へ進む</text>
  <line x1="30" y1="140" x2="250" y2="140" stroke="#ddd" stroke-width="1"/>
  <line x1="130" y1="28" x2="130" y2="210" stroke="#ddd" stroke-width="1"/>
  <circle cx="130" cy="140" r="70" fill="none" stroke="#ccc" stroke-width="1.5"/>
  <line x1="130" y1="140" x2="180" y2="82" stroke="#2a6fad" stroke-width="2"/>
  <circle cx="180" cy="82" r="5" fill="#2a6fad"/>
  <text x="186" y="76" font-size="12" fill="#2a6fad">e^{iθ}</text>
  <line x1="180" y1="82" x2="250" y2="120" stroke="#c45c26" stroke-width="2.2"/>
  <text x="230" y="108" font-size="12" fill="#c45c26">i e^{iθ}</text>
  <text x="16" y="222" font-size="11" fill="#555">i 倍は 90° 回すこと。円の上を進む向きは、半径と直角（接線）。</text>
</svg>
<figcaption>\(\theta\) を少し増やすと点は円に沿って動く。その瞬間の進む向きが \(i\,e^{i\theta}\)。</figcaption>
</figure>

また、\(-i\theta\) 版も同様に \((e^{-i\theta})'=-i\,e^{-i\theta}\)。積の微分で

$$
\frac{d}{d\theta}\bigl(e^{i\theta}e^{-i\theta}\bigr)=0
$$

なので \(e^{i\theta}e^{-i\theta}\) は定数、\(\theta=0\) での値より

$$
e^{i\theta}e^{-i\theta}=1
$$

——\(e^{-i\theta}\) は逆数です。

---

## 7. オイラーの公式 — 証明

比較相手を用意します:

$$
u(\theta):=\cos\theta+i\sin\theta,
\qquad
u(0)=\cos 0+i\sin 0=1.
$$

微分すると（G3 の 🪜 足場の \((\sin)'=\cos,\ (\cos)'=-\sin\) —— こちらの導出は v2 本編 B′2→B′3 の鎖）:

$$
u'(\theta)=-\sin\theta+i\cos\theta.
$$

一方、

$$
i\,u(\theta)=i\cos\theta+i^2\sin\theta=i\cos\theta-\sin\theta.
$$

一致しました:

$$
u'(\theta)=i\,u(\theta).
$$

### 一意性 — 比 w を見る

\(e^{i\theta}\) と \(u\) は、どちらも「**微分すると \(i\) 倍、かつ \(\theta=0\) で 1**」を満たします。
比を見ましょう:

$$
w(\theta):=u(\theta)\,e^{-i\theta}.
$$

積の微分で

$$
w'(\theta)
=u'e^{-i\theta}+u(e^{-i\theta})'
=i u e^{-i\theta}-i u e^{-i\theta}
=0.
$$

だから \(w\) は**定数**。\(\theta=0\) で \(w(0)=1\times1=1\)。ゆえに \(w(\theta)\equiv 1\)、すなわち

$$
u(\theta)=e^{i\theta}.
$$

$$
\boxed{\ e^{i\theta}=\cos\theta+i\sin\theta\ }
$$

- **読み:** オイラーの公式  
- **よみ:** 回転を一文字で書いた数。円の縦成分（\(\sin\)）と横成分（\(\cos\)）が、一つのべき乗に統合されました。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250" role="img" aria-label="単位円上の点がイーのアイシータ。横がコサイン、縦がサイン">
  <rect width="400" height="250" fill="#fffdf8"/>
  <text x="16" y="20" font-size="12" fill="#1c1a16">e^{iθ} は、単位円上の点</text>
  <line x1="30" y1="150" x2="300" y2="150" stroke="#bbb" stroke-width="1"/>
  <line x1="160" y1="30" x2="160" y2="230" stroke="#bbb" stroke-width="1"/>
  <circle cx="160" cy="150" r="80" fill="none" stroke="#2c5f4a" stroke-width="1.8"/>
  <line x1="160" y1="150" x2="208" y2="78" stroke="#c45c26" stroke-width="2"/>
  <circle cx="208" cy="78" r="5" fill="#c45c26"/>
  <line x1="208" y1="78" x2="208" y2="150" stroke="#c45c26" stroke-dasharray="4 3" stroke-width="1.2"/>
  <line x1="160" y1="150" x2="208" y2="150" stroke="#2a6fad" stroke-width="2"/>
  <text x="214" y="72" font-size="13" fill="#c45c26">e^{iθ}</text>
  <text x="164" y="168" font-size="11" fill="#2a6fad">cos θ</text>
  <text x="214" y="118" font-size="11" fill="#c45c26">sin θ</text>
  <path d="M188 150 A 28 28 0 0 0 176 126" fill="none" stroke="#888" stroke-width="1.2"/>
  <text x="190" y="136" font-size="12" fill="#555">θ</text>
  <text x="300" y="80" font-size="12" fill="#1c1a16">横 = cos θ</text>
  <text x="300" y="100" font-size="12" fill="#1c1a16">縦 = sin θ</text>
  <text x="300" y="128" font-size="12" fill="#555">だから</text>
  <text x="300" y="148" font-size="12" fill="#c45c26">e^{iθ} = cosθ + i sinθ</text>
</svg>
<figcaption>G2 の単位円の絵が、一文字の数になった。</figcaption>
</figure>

> 🔬 **Living Figure:** [複素正弦波とオイラーの螺旋 — 3D で観察](https://ogaogamirai.github.io/public/3d-commons/viewer.html?model=euler-spiral)　（見る角度によって真円・サイン波・コサイン波に姿を変えます）

---

## 8. すぐに使う帰結

### 回転の合成＝指数の積（問いの完全回答）

$$
e^{i\theta_1}e^{i\theta_2}=e^{i(\theta_1+\theta_2)}.
$$

- **よみ:** 角の足し算が、指数の掛け算になった。§0 の問いへの最終回答。

### 実部・虚部・共役

$$
\begin{aligned}
&\cos\theta=\operatorname{Re}(e^{i\theta}),
\qquad
\sin\theta=\operatorname{Im}(e^{i\theta}),\\
&\overline{e^{i\theta}}=e^{-i\theta}=\cos\theta-i\sin\theta.
\end{aligned}
$$

### 有名な特別値

$$
e^{i\pi}=\cos\pi+i\sin\pi=-1
\quad\Longrightarrow\quad
e^{i\pi}+1=0.
$$

- **よみ:** 半周回ると 1 の反対側。\(e,i,\pi,1,0\) が一行に並ぶ、有名な式の正体は「円の半周」でした。

<figure class="review-fig">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 230" width="380" height="230" role="img" aria-label="特別な角は円の四隅">
  <rect width="380" height="230" fill="#fffdf8"/>
  <text x="16" y="18" font-size="12" fill="#1c1a16">特別な角は、円の四隅</text>
  <line x1="30" y1="130" x2="250" y2="130" stroke="#ddd" stroke-width="1"/>
  <line x1="140" y1="28" x2="140" y2="210" stroke="#ddd" stroke-width="1"/>
  <circle cx="140" cy="130" r="70" fill="none" stroke="#ccc" stroke-width="1.5"/>
  <circle cx="210" cy="130" r="5" fill="#2c5f4a"/>
  <text x="218" y="126" font-size="11" fill="#2c5f4a">e^{i·0}=1</text>
  <circle cx="140" cy="60" r="5" fill="#2a6fad"/>
  <text x="148" y="52" font-size="11" fill="#2a6fad">e^{iπ/2}=i</text>
  <circle cx="70" cy="130" r="5" fill="#c45c26"/>
  <text x="8" y="126" font-size="11" fill="#c45c26">e^{iπ}=−1</text>
  <circle cx="140" cy="200" r="5" fill="#555"/>
  <text x="148" y="214" font-size="11" fill="#555">e^{i3π/2}=−i</text>
</svg>
<figcaption>四隅は検算用の目印。</figcaption>
</figure>

### 極形式の書き換え

§3 の極形式は、いまこう書けます:

$$
z=r(\cos\theta+i\sin\theta)=r\,e^{i\theta}.
$$

掛け算も一目です:

$$
(r_1 e^{i\theta_1})(r_2 e^{i\theta_2})=r_1 r_2\,e^{i(\theta_1+\theta_2)}.
$$

---

## 9. 章のまとめ

| 段 | 結果 |
|---|---|
| 定義 | \(i^2=-1\)、\(z=a+bi\)、平面の点 |
| 四則 | 展開＋共役 |
| 積 | 長さは積、角は和（加法定理） |
| 定義 | \(e^{i\theta}=\sum(i\theta)^n/n!\)、微分で \(i\) 倍 |
| 一意性 | \(u=\cos+i\sin\) も \(u'=iu\)、\(u(0)=1\) → 等しい |
| 結論 | \(e^{i\theta}=\cos\theta+i\sin\theta\)、合成は \(e^{i(\theta_1+\theta_2)}\) |

## 10. 導出チェック（白紙で）

1. \((a+bi)(c+di)\) を展開せよ。  
2. 極形式の積「長さは積・角は和」を加定理を引用して再現せよ。  
3. \((e^{i\theta})'=i e^{i\theta}\) を、項ごと微分で再現せよ。  
4. \(w=u e^{-i\theta}\) の微分が 0 になる変形を書け。  
5. \(e^{i\pi}+1=0\) を、オイラーの公式から計算せよ。  

## 11. 確認

1. \(i^0\) から \(i^5\) を書け。  
2. \(\dfrac{1+i}{1-i}\) を計算せよ。  
3. 「\(i\) を掛けると \(90^\circ\) 回る」を、座標変換で確認せよ。  
4. \(e^{-i\theta}=\cos\theta-i\sin\theta\) を導け。  
5. （振り返り）\(\cos\theta+i\sin\theta\) が「回転の一文字表記」であることを、合成の式で示せ。  

---

## 12. 次の章への引き

回転を一文字で書けるようになりました。これで道具は、すべて揃っています。

- 波の部品: \(e^{int}\)（回転そのもの）  
- 分離の技術: 掛けて一周積分（G4）  
- 測る道具: 積分（G3）  

次章は仕上げです。級数を複素形に書き直し、周期 \(T\) を無限に伸ばして——**有限のくり返しから、無限の一本道（フーリエ変換）へ橋を渡します。**

→ [G7. 級数から変換へ — 有限から無限の橋](./G7_bridge_transform.md)
