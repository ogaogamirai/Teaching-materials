#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""One-shot: write pure LaTeX into formula_html* (explanations + math_cards).

Does NOT touch hotspots (interactive HTML spans stay unicode).
Run from project root, then:
  python tools/expl_pipeline.py merge
  python tools/expl_pipeline.py bundle   # or whatever rebuild cmd
  python tools/verify_math.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
EXPL = ROOT / "data" / "explanations"
MATH_CARDS = ROOT / "data" / "math_cards.json"

# id -> { formula_html, formula_html_2?, ... }  pure LaTeX only
PROOF_TEX = {
    "P-WAVE": {
        "formula_html": r"y(t)=A\cdot\sin(\omega t+\phi)",
        "formula_html_2": r"\omega=\dfrac{2\pi}{T}",
    },
    "P-RATIO": {
        "formula_html": r"\sin\theta=\dfrac{\text{対辺}}{\text{斜辺}}",
        "formula_html_2": r"\text{単位円では}\ \text{高さ}=\sin\theta",
    },
    "P-RAD": {
        "formula_html": r"\pi\,\mathrm{rad}=180^{\circ}",
        "formula_html_2": r"2\pi\,\mathrm{rad}=360^{\circ}\ (\text{1周})",
        "formula_html_3": r"\omega=\dfrac{2\pi}{T}",
    },
    "P-CIRCLE": {
        "formula_html": r"P(x,y)=(\cos\theta,\sin\theta)",
        "formula_html_2": r"\cos^{2}\theta+\sin^{2}\theta=1",
        "formula_html_3": r"y(t)=R\cdot\sin(\omega t+\phi)",
    },
    "P-SUPER": {
        "formula_html": r"(f+g)(t)=f(t)+g(t)",
        "formula_html_2": r"y(t)=A_{1}\sin(\omega_{1} t)+A_{2}\sin(\omega_{2} t)",
    },
    "P-SERIES": {
        "formula_html": (
            r"f(t)=a_{1}\sin(\omega t)+a_{2}\sin(2\omega t)+a_{3}\sin(3\omega t)+\cdots"
            r"=\sum_{n=1}^{N}a_{n}\sin(n\omega t)"
        ),
    },
    "P-ORTHO": {
        "formula_html": r"\langle f,g\rangle=\int_{0}^{2\pi}f(x)g(x)\,dx",
        "formula_html_2": r"\int_{0}^{2\pi}\sin(mx)\sin(nx)\,dx=0\quad(m\neq n)",
    },
    "P-COEFF": {
        "formula_html": r"a_{n}=\dfrac{1}{\pi}\int_{0}^{2\pi}f(x)\cos(nx)\,dx",
        "formula_html_2": r"b_{n}=\dfrac{1}{\pi}\int_{0}^{2\pi}f(x)\sin(nx)\,dx",
        "formula_html_3": r"C_{n}=\sqrt{a_{n}^{2}+b_{n}^{2}}",
    },
    "P-APP": {
        "formula_html": (
            r"f_{\mathrm{approx}}(x)=\sum_{n=1}^{K}"
            r"\bigl[a_{n}\cos(nx)+b_{n}\sin(nx)\bigr]\quad(K\lt N)"
        ),
    },
    "P-CAP": {
        "formula_html": (
            r"\text{波}\to R\sin(\omega t+\phi)\to\sum(a\cos+b\sin)"
            r"\to\text{係数＝似ている度}\to\text{捨てて再合成}"
        ),
    },
    "P-MAP": {
        "formula_html": (
            r"\text{級数（和）}\ /\ \text{変換（見取り図）}\ /\ \text{離散 DFT・FFT（配列）}"
        ),
    },
    "P-ADD-TRIG": {
        "formula_html": r"\sin(\alpha+\beta)=\sin\alpha\cos\beta+\cos\alpha\sin\beta",
        "formula_html_2": r"\cos(\alpha+\beta)=\cos\alpha\cos\beta-\sin\alpha\sin\beta",
    },
    "P-CALC-TRIG": {
        "formula_html": r"(\sin x)'=\cos x,\quad(\cos x)'=-\sin x",
        "formula_html_2": r"\int\sin(ax)\,dx=-\dfrac{1}{a}\cos(ax)",
    },
    "P-CALC-ORTHO": {
        "formula_html": r"\sin A\sin B=\dfrac{1}{2}\bigl[\cos(A-B)-\cos(A+B)\bigr]",
        "formula_html_2": (
            r"\int_{0}^{2\pi}\sin(mx)\sin(nx)\,dx=0\ (m\neq n),\ \pi\ (m=n)"
        ),
    },
    "P-EULER-PROOF": {
        "formula_html": (
            r"e^{i\theta}=1+i\theta-\dfrac{\theta^{2}}{2!}"
            r"-i\dfrac{\theta^{3}}{3!}+\dfrac{\theta^{4}}{4!}+\cdots"
            r"=\cos\theta+i\sin\theta"
        ),
        "formula_html_2": r"F(\omega)=\int_{-\infty}^{\infty}f(t)\,e^{-i\omega t}\,dt",
    },
    "P-MACLAURIN": {
        "formula_html": (
            r"f(x)=f(0)+f'(0)x+\dfrac{f''(0)}{2!}x^{2}"
            r"+\dfrac{f'''(0)}{3!}x^{3}+\cdots"
            r"=\sum_{n=0}^{\infty}\dfrac{f^{(n)}(0)}{n!}x^{n}"
        ),
    },
    "P-DIFF": {
        "formula_html": r"f'(x)=\lim_{h\to 0}\dfrac{f(x+h)-f(x)}{h}",
        "formula_html_2": r"(x^{2})'=2x",
    },
    "P-INTEG": {
        "formula_html": r"\int_{a}^{b}f(x)\,dx=\bigl[F(x)\bigr]_{a}^{b}=F(b)-F(a)",
        "formula_html_2": r"\int_{0}^{2}x\,dx=2",
    },
    "P-INT": {
        "formula_html": (
            r"\text{【微分導出】}\ "
            r"f'(x)=\lim_{h\to 0}\dfrac{f(x+h)-f(x)}{h}"
        ),
        "formula_html_2": (
            r"\text{【積分導出】}\ "
            r"\int_{a}^{b}f(x)\,dx=F(b)-F(a)"
        ),
    },
    # already pure — keep explicit for idempotency
    "P-EULER": {
        "formula_html": r"e^{i\theta}=\cos\theta+i\sin\theta",
        "formula_html_2": r"e^{i\pi}+1=0",
        "formula_html_3": (
            r"\cos\theta=\dfrac{e^{i\theta}+e^{-i\theta}}{2},"
            r"\quad\sin\theta=\dfrac{e^{i\theta}-e^{-i\theta}}{2i}"
        ),
    },
    "P-POLAR": {
        "formula_html": (
            r"z=r(\cos\theta+i\sin\theta),\quad"
            r"(\cos\theta+i\sin\theta)^{n}=\cos(n\theta)+i\sin(n\theta)\ (n\in\mathbb{Z})"
        ),
    },
    "P-COMPLEX": {
        "formula_html": (
            r"i^{2}=-1,\quad z=a+bi=r(\cos\theta+i\sin\theta),"
            r"\quad i\cdot z\ \text{は}\ z\ \text{を}\ 90^{\circ}\ \text{反時計回り}"
        ),
    },
    "P-E": {
        "formula_html": (
            r"e=\lim_{n\to\infty}\left(1+\dfrac{1}{n}\right)^{n},"
            r"\quad\dfrac{d}{dx}e^{x}=e^{x},"
            r"\quad\int e^{x}\,dx=e^{x}+C"
        ),
    },
    "P-COMPARE": {
        "formula_html": (
            r"\text{実数}\quad f(x)=\dfrac{a_0}{2}"
            r"+\sum_{n=1}^{\infty}\bigl(a_n\cos(nx)+b_n\sin(nx)\bigr)"
        ),
        "formula_html_2": (
            r"\text{複素数}\quad f(x)=\sum_{n=-\infty}^{\infty} c_n\,e^{i\cdot n\cdot x}"
        ),
        "formula_html_3": (
            r"n\ge 1:\quad c_n=\dfrac{a_n-i\,b_n}{2},"
            r"\quad c_{-n}=\dfrac{a_n+i\,b_n}{2},"
            r"\quad c_0=\dfrac{a_0}{2}"
        ),
        "formula_html_4": (
            r"\dfrac{\mathrm{d}}{\mathrm{d}x}\,e^{i\cdot n\cdot x}"
            r"=i\cdot n\,e^{i\cdot n\cdot x}"
        ),
    },
}

MATH_CARD_NODE_TEX = {
    "FT-WAVE-1": r"y=A\sin(\omega t+\phi),\quad\omega=\dfrac{2\pi}{T}",
    "FT-RATIO-1": r"\sin\theta=\dfrac{\text{対辺}}{\text{斜辺}}",
    "FT-RAD-1": r"\pi\,\mathrm{rad}=180^{\circ},\quad\omega=\dfrac{2\pi}{T}",
    "FT-CIRCLE-1": r"y(t)=R\sin(\omega t+\phi),\quad\cos^{2}\theta+\sin^{2}\theta=1",
    "FT-SUPER-1": r"(f+g)(t)=f(t)+g(t)",
    "FT-SERIES-1": r"f(t)\approx\sum_{n=1}^{N}a_{n}\sin(n\omega t)",
    "FT-ORTHO-1": r"\langle f,g\rangle=\int f(t)g(t)\,dt",
    "FT-COEFF-1": r"a_{n},b_{n}\ \text{は}\ f\ \text{と}\ \cos/\sin\ \text{の似ている度}",
    "FT-APP-1": r"f_{\mathrm{approx}}=\sum_{n=1}^{K}(\cdots)",
    "FT-CAP-1": r"\text{波}\to\sin/\cos\to\sum\to\text{係数}\to\text{再合成}",
    "FT-EULER-1": r"e^{i\theta}=\cos\theta+i\sin\theta",
    "FT-TRANSFORM-1": r"\text{級数}\ /\ \text{変換}\ /\ \text{離散}",
}

MATH_CARD_CHAPTER_TEX = {
    "pyth_chapter": r"a^{2}+b^{2}=c^{2}\ \Rightarrow\ \cos^{2}\theta+\sin^{2}\theta=1",
    "sum_chapter": r"\sum_{n=1}^{N}x_{n}=x_{1}+x_{2}+\cdots+x_{N}",
    "int_chapter": r"\langle f,g\rangle\sim\int f(t)\cdot g(t)\,dt",
}


def dump(path: Path, obj):
    path.write_text(
        json.dumps(obj, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def migrate_proof():
    n = 0
    for sid, fields in PROOF_TEX.items():
        path = EXPL / f"{sid}.json"
        if not path.exists():
            print(f"[warn] missing {path.name}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        # clear old multi-line slots then set
        for k in ("formula_html", "formula_html_2", "formula_html_3", "formula_html_4"):
            if k in data and k not in fields:
                # remove stale multi parts when new set is shorter
                if k != "formula_html":
                    del data[k]
        for k, v in fields.items():
            data[k] = v
        dump(path, data)
        n += 1
        print(f"[ok] {path.name}")
    return n


def migrate_math_cards():
    if not MATH_CARDS.exists():
        print("[warn] math_cards.json missing")
        return 0
    data = json.loads(MATH_CARDS.read_text(encoding="utf-8"))
    n = 0
    chapters = data.get("chapters") or {}
    for cid, tex in MATH_CARD_CHAPTER_TEX.items():
        if cid in chapters:
            chapters[cid]["formula_html"] = tex
            n += 1
    nodes = data.get("nodes") or {}
    for nid, tex in MATH_CARD_NODE_TEX.items():
        if nid in nodes:
            nodes[nid]["formula_html"] = tex
            n += 1
    dump(MATH_CARDS, data)
    print(f"[ok] math_cards.json ({n} fields)")
    return n


def main():
    a = migrate_proof()
    b = migrate_math_cards()
    print(f"done: {a} proof files, {b} math_card fields")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
