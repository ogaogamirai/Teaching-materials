#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Operations Research 教材 自動ビルドスクリプト (build_html.py)
〜 chapters/ ディレクトリの各章を読み込み、上部固定ナビゲーション付き index.html を生成 〜
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHAPTERS_DIR = os.path.join(BASE_DIR, "chapters")
OUTPUT_HTML = os.path.join(BASE_DIR, "index.html")

# 章の定義リスト（順序・ID・タイトル・バッジ・ファイル名）
CHAPTERS_ORDER = [
    {
        "id": "ch0",
        "num": "第0章",
        "file": "00_intro_and_explosion.html",
        "title": "なぜ素朴なプログラミングでは解けないのか？",
        "nav_title": "0. なぜ素朴に解けないのか？（22兆通り）",
        "desc": "組み合わせ爆発の絶望とNP困難の壁"
    },
    {
        "id": "ch1",
        "num": "第1章",
        "file": "01_cpsat_origin_drama.html",
        "title": "CP-SAT誕生のドラマ：2つの流派の「奇跡の合体」",
        "nav_title": "1. CP-SAT誕生ドラマ（CP×SATの奇跡）",
        "desc": "制約プログラミングとSATエンジンの合体"
    },
    {
        "id": "ch2",
        "num": "第2章",
        "file": "02_cdcl_heartbeat_simulator.html",
        "title": "衝突駆動節学習（CDCL）：失敗から自律学習する現場",
        "nav_title": "2. CDCLコマ送り実況（失敗から学ぶAI）",
        "desc": "自律的に学習節を生み出すCDCLシミュレータ"
    },
    {
        "id": "ch3",
        "num": "第3章",
        "file": "03_maxsat_and_flexibility.html",
        "title": "白黒判定器がなぜ「柔軟なシフト」を作れるのか？",
        "nav_title": "3. 白黒判定器で柔軟なシフト（MaxSAT二分探索）",
        "desc": "不満度を締め上げる超高速ピストン"
    },
    {
        "id": "ch4",
        "num": "第4章",
        "file": "04_request_matrix_construction.html",
        "title": "【要望マトリクス入門】自然言語 ➔ 0/1表 ➔ Pythonデータ構造への変換術",
        "nav_title": "4. 【要望マトリクス入門】自然言語 ➔ 0/1表 ➔ Python",
        "desc": "生の要望を3Dグリッド・2D配列・辞書へと落とし込む基礎技術"
    },
    {
        "id": "ch5",
        "num": "第5章",
        "file": "05_constraint_logic_dictionary.html",
        "title": "【制約ロジック完全マスター】現場ルール ➔ 論理式 ➔ CP-SATコードの黄金対応表",
        "nav_title": "5. 【制約ロジック完全マスター】現場ルール ➔ 判定式 ➔ コード",
        "desc": "1日1シフト・必要人数・連休制約など6大制約の大対照マップ"
    },
    {
        "id": "ch6",
        "num": "第6章",
        "file": "06_penalty_and_objective_design.html",
        "title": "【不満度の測定と設計】人間の心理を数理モデルにする技術",
        "nav_title": "6. 【不満度の測定と設計】人間の心理を数理化",
        "desc": "重み付け・不公平ペナルティ（絶対値線形化）・痛みの分散"
    },
    {
        "id": "ch7",
        "num": "第7章",
        "file": "07_python_production_template.html",
        "title": "【実践】Python (Google OR-Tools) で書く黄金の型",
        "nav_title": "7. 【実践】Python OR-Tools 黄金の型",
        "desc": "コピペで動く実務テンプレートと実測出力"
    },
    {
        "id": "ch8",
        "num": "第8章",
        "file": "08_realworld_applications.html",
        "title": "【応用】あらゆるビジネス課題への横展開",
        "nav_title": "8. 【応用】配車・予算・工程への横展開",
        "desc": "VRP・ナップサック・RCPSPへのモデル移植"
    },
]

HTML_TEMPLATE_HEADER = """<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CP-SATの数理：組み合わせ爆発を瞬殺する技術 〜 衝突駆動節学習（CDCL）から学ぶ最適化入門 〜</title>
    <!-- KaTeX -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            function initKaTeX() {
                if (window.renderMathInElement) {
                    renderMathInElement(document.body, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false}
                        ],
                        throwOnError: false,
                        errorColor: '#f43f5e',
                        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"]
                    });
                } else {
                    setTimeout(initKaTeX, 50);
                }
            }
            initKaTeX();
        });
    </script>
    
    <style>
        :root {
            --bg: #0b1120;
            --surface: #1e293b;
            --surface-hover: #334155;
            --border: #38bdf8;
            --border-subtle: #334155;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --primary: #38bdf8;
            --primary-glow: rgba(56, 189, 248, 0.15);
            --accent: #f59e0b;
            --success: #10b981;
            --danger: #ef4444;
            --code-bg: #030712;
            --font-sans: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'BIZ UDPGothic', sans-serif;
            --font-mono: 'JetBrains Mono', Consolas, monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: var(--font-sans);
            line-height: 1.8;
            padding-bottom: 4rem;
        }

        /* 🌟 上部固定ナビゲーションバー (Sticky Top Nav) */
        .sticky-nav {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(11, 17, 32, 0.94);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-subtle);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .sticky-nav-inner {
            max-width: 980px;
            margin: 0 auto;
            padding: 0.6rem 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        .nav-brand {
            font-weight: 700;
            font-size: 1rem;
            color: var(--primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            white-space: nowrap;
        }
        .nav-select-wrapper {
            flex: 1;
            max-width: 480px;
        }
        .nav-select-wrapper select {
            width: 100%;
            padding: 0.45rem 0.8rem;
            font-size: 0.88rem;
            color: var(--text);
            background: #0f172a;
            border: 1px solid var(--border-subtle);
            border-radius: 6px;
            outline: none;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        .nav-select-wrapper select:focus, .nav-select-wrapper select:hover {
            border-color: var(--primary);
        }
        .nav-actions {
            display: flex;
            align-items: center;
            gap: 0.6rem;
        }
        .nav-btn-outline {
            color: var(--primary);
            font-weight: 600;
            font-size: 0.85rem;
            text-decoration: none;
            padding: 0.35rem 0.75rem;
            border: 1px solid var(--border-subtle);
            border-radius: 6px;
            background: #0f172a;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .nav-btn-outline:hover {
            border-color: var(--primary);
            background: var(--surface-hover);
        }

        .container {
            max-width: 980px;
            margin: 0 auto;
            padding: 2.5rem 1rem 1rem;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border-subtle);
        }

        .badge-header {
            display: inline-block;
            background: var(--primary-glow);
            color: var(--primary);
            padding: 0.35rem 1.2rem;
            border-radius: 9999px;
            font-size: 0.85rem;
            font-weight: bold;
            margin-bottom: 1rem;
            border: 1px solid var(--primary);
            letter-spacing: 0.05em;
        }

        h1 {
            font-size: 2.2rem;
            font-weight: 800;
            line-height: 1.35;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .lead {
            font-size: 1.1rem;
            color: var(--text-muted);
            max-width: 780px;
            margin: 0 auto;
        }

        /* 🗺️ 全体ロードマップ目次カード */
        .roadmap-card {
            background: #0f172a;
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 3rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .roadmap-title {
            font-size: 1.15rem;
            color: var(--primary);
            font-weight: bold;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .roadmap-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 0.8rem;
        }
        .roadmap-item {
            background: #1e293b;
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 0.8rem 1rem;
            text-decoration: none;
            color: var(--text);
            transition: all 0.2s;
            display: block;
        }
        .roadmap-item:hover {
            border-color: var(--primary);
            background: #24344d;
            transform: translateY(-2px);
        }
        .roadmap-item-num {
            font-size: 0.75rem;
            color: var(--primary);
            font-weight: bold;
            display: block;
            margin-bottom: 0.2rem;
        }
        .roadmap-item-name {
            font-size: 0.9rem;
            font-weight: bold;
            display: block;
            line-height: 1.4;
        }

        section {
            background: var(--surface);
            border: 1px solid var(--border-subtle);
            border-radius: 14px;
            padding: 2.5rem;
            margin-bottom: 3rem;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
            scroll-margin-top: 4.5rem;
        }

        h2 {
            font-size: 1.6rem;
            color: var(--primary);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        h3 {
            font-size: 1.3rem;
            color: #f1f5f9;
            margin: 2rem 0 1rem;
            border-left: 4px solid var(--primary);
            padding-left: 0.75rem;
        }

        p { margin-bottom: 1.2rem; font-size: 1.05rem; }

        .callout {
            background: rgba(56, 189, 248, 0.07);
            border-left: 4px solid var(--primary);
            padding: 1.2rem 1.5rem;
            border-radius: 0 8px 8px 0;
            margin: 1.5rem 0;
        }

        .callout-accent {
            background: rgba(245, 158, 11, 0.07);
            border-left: 4px solid var(--accent);
        }

        /* Interactive CDCL Step-by-Step Simulator */
        .cdcl-box {
            background: #030712;
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 1.75rem;
            margin: 2rem 0;
        }

        .cdcl-controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        button.btn-step {
            background: #1e293b;
            color: var(--text);
            border: 1px solid var(--primary);
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }

        button.btn-step:hover {
            background: var(--primary);
            color: #030712;
        }

        button.btn-auto {
            background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%);
            color: white;
            border: none;
            padding: 0.6rem 1.4rem;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
        }

        .tree-visualizer {
            background: #0f172a;
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 1.2rem;
            font-family: var(--font-mono);
            font-size: 0.95rem;
            min-height: 180px;
            margin-bottom: 1rem;
            white-space: pre-wrap;
            line-height: 1.6;
        }

        .learned-clauses-box {
            background: #111827;
            border: 1px dashed var(--accent);
            border-radius: 8px;
            padding: 1rem;
            font-size: 0.9rem;
        }

        .learned-title {
            color: var(--accent);
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        /* Schedule Table */
        table.sched {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
            text-align: center;
            margin-top: 1rem;
        }

        table.sched th, table.sched td {
            border: 1px solid var(--border-subtle);
            padding: 0.6rem;
        }

        table.sched th {
            background: var(--surface-hover);
            color: var(--text-muted);
        }

        .b-day { background: #0284c7; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; font-weight: bold; }
        .b-night { background: #6366f1; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; font-weight: bold; }
        .b-off { background: #334155; color: #94a3b8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; font-weight: bold; }

        /* Code Block */
        pre.code-block {
            background: var(--code-bg);
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 1.2rem;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 0.9rem;
            color: #e2e8f0;
            line-height: 1.6;
            margin: 1.2rem 0;
        }

        .code-comment { color: #64748b; }
        .code-keyword { color: #f472b6; font-weight: bold; }
        .code-func { color: #38bdf8; }
        .code-var { color: #fbbf24; }

        /* 要望 ➔ 判定式 ➔ Python 対照表 & インタラクティブカード */
        .mapping-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            font-size: 0.95rem;
        }

        .mapping-table th {
            background: #0f172a;
            color: var(--primary);
            padding: 0.9rem;
            border: 1px solid var(--border-subtle);
            text-align: left;
        }

        .mapping-table td {
            border: 1px solid var(--border-subtle);
            padding: 1rem;
            vertical-align: top;
            background: rgba(15, 23, 42, 0.6);
        }

        .human-badge {
            display: inline-block;
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            border: 1px solid #f59e0b;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 0.4rem;
        }

        .math-badge {
            display: inline-block;
            background: rgba(56, 189, 248, 0.15);
            color: #38bdf8;
            border: 1px solid #38bdf8;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 0.4rem;
        }

        .code-badge {
            display: inline-block;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid #10b981;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 0.4rem;
        }

        .interactive-card {
            background: #030712;
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
            transition: border-color 0.2s;
        }

        .interactive-card:hover {
            border-color: var(--primary);
        }

        .pattern-title {
            font-size: 1.1rem;
            font-weight: bold;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.8rem;
        }

        .code-snippet {
            background: #090d16;
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 0.8rem;
            font-family: var(--font-mono);
            font-size: 0.85rem;
            color: #38bdf8;
            overflow-x: auto;
            margin-top: 0.5rem;
        }

        .intuition-box {
            background: rgba(99, 102, 241, 0.08);
            border-left: 3px solid #818cf8;
            padding: 0.6rem 0.9rem;
            font-size: 0.9rem;
            color: #cbd5e1;
            margin-top: 0.6rem;
            border-radius: 0 6px 6px 0;
        }
    </style>
</head>
<body id="top">

<!-- 🌟 上部固定ナビゲーションバー -->
<nav class="sticky-nav" aria-label="読書ナビゲーション">
    <div class="sticky-nav-inner">
        <a href="#top" class="nav-brand">⚡ CP-SAT & CDCL</a>
        <div class="nav-select-wrapper">
            <select id="chapter-select" onchange="if(this.value) location.hash = this.value;">
                <option value="">📑 章を選択してジャンプ...</option>
"""

HTML_TEMPLATE_FOOTER = """
<script>
    // 🌟 スクロール連動：現在読んでいる章をセレクトボックスに反映
    document.addEventListener("DOMContentLoaded", function() {
        const sections = document.querySelectorAll('section[id]');
        const select = document.getElementById('chapter-select');
        window.addEventListener('scroll', () => {
            let currentId = '';
            const scrollPos = window.scrollY + 120;
            sections.forEach(sec => {
                if (sec.offsetTop <= scrollPos) {
                    currentId = '#' + sec.id;
                }
            });
            if (select && currentId && select.value !== currentId) {
                select.value = currentId;
            }
        });
    });

    // CDCL コマ送りシミュレーション
    const cdclSteps = [
        {
            status: "Step 1: 変数の仮定 (Decision Level 1)",
            log: "【探索開始】\\n[決定] Alice の月曜日を [日勤 (D)] と仮定しました。\\n[制約伝播] 月曜の日勤枠(1名)が埋まったため、Bob, Charlie, Dave の月曜[日勤]候補がドミノ倒しで消滅。",
            learned: "(まだ衝突なし)"
        },
        {
            status: "Step 2: 変数の仮定 (Decision Level 2)",
            log: "【探索進行】\\n[決定] Alice の火曜日を [夜勤 (N)] と仮定しました。\\n[決定] Alice の水曜日を [日勤 (D)] と仮定しました。\\n➔ [⚠️ 衝突検知 (Conflict!)]\\n「夜勤の翌日は日勤禁止」というハード制約に直面！\\nAlice: 火曜[夜勤] かつ 水曜[日勤] は両立不可能です。",
            learned: "(衝突原因を逆算中...)"
        },
        {
            status: "Step 3: 衝突解析 & 学習節の生成 (Clause Learning)",
            log: "【衝突解析 (Conflict Analysis)】\\n含意グラフを逆算し、破綻の根本原因を特定。\\n\\n⚡ 新しいルール（学習節）を自律生成：\\n「¬(Alice_火_N ∧ Alice_水_D)」\\n（＝Aliceの火曜夜勤と水曜連勤の組み合わせは永久追放！）\\n\\nこの新ルールをソルバー自身のデータベースに追加しました。",
            learned: "Learned Clause #1: [NOT Alice_火_N OR NOT Alice_水_D]"
        },
        {
            status: "Step 4: ノンクロノロジカル・バックトラック (大ジャンプ)",
            log: "【バックトラック実行】\\n1歩戻るのではなく、原因となった決定まで一気にジャンプ！\\nAliceの水曜候補から[日勤]を消去し、[休日 (O)] に自動決定。\\n\\n先ほど学習したルールがあるため、今後この先何千万通りの探索で\\n同じ失敗ルートへ迷い込むことは二度とありません！",
            learned: "Learned Clause #1: [NOT Alice_火_N OR NOT Alice_水_D]"
        },
        {
            status: "Step 5: 最適解へ収束！",
            log: "【探索完了 (OPTIMAL)】\\nドミノ倒しと学習節の累積により、22兆通りの探索空間が瞬時に刈り取られました。\\n\\n全員の希望休を100%充足し、夜勤回数が平等な最適シフトが確定しました！",
            learned: "Learned Clause #1: [NOT Alice_火_N OR NOT Alice_水_D]\\nLearned Clause #2: [NOT Bob_土_D OR NOT Bob_日_D]"
        }
    ];

    let currentStep = 0;

    function renderCdcl() {
        if (currentStep >= cdclSteps.length) currentStep = cdclSteps.length - 1;
        const data = cdclSteps[currentStep];
        document.getElementById("cdcl-status").innerText = data.status;
        document.getElementById("tree-log").innerText = data.log;
        document.getElementById("learned-list").innerText = data.learned;
    }

    function nextStep() {
        if (currentStep < cdclSteps.length - 1) {
            currentStep++;
            renderCdcl();
        }
    }

    function resetCdcl() {
        currentStep = 0;
        document.getElementById("cdcl-status").innerText = "Step 0: 探索開始前";
        document.getElementById("tree-log").innerText = "【探索ログ】\\n[Step 0] 待機中。「次の一手を進める」を押してください。";
        document.getElementById("learned-list").innerText = "(まだ衝突は発生していません)";
    }

    function runAuto() {
        let i = 0;
        resetCdcl();
        const interval = setInterval(() => {
            if (i < cdclSteps.length) {
                currentStep = i;
                renderCdcl();
                i++;
            } else {
                clearInterval(interval);
            }
        }, 1200);
    }
</script>

</body>
</html>
"""

def build():
    print("=== Building Operations Research Material (index.html) ===")
    
    # 1. セレクトボックスのオプション生成
    select_options = []
    for ch in CHAPTERS_ORDER:
        select_options.append(f'                <option value="#{ch["id"]}">{ch["nav_title"]}</option>')
    
    nav_select_html = "\n".join(select_options) + "\n            </select>\n        </div>\n"
    nav_tail_html = """        <div class="nav-actions">
            <a href="#roadmap" class="nav-btn-outline">🗺️ 目次一覧</a>
        </div>
    </div>
</nav>

<div class="container">
    <header>
        <div class="badge-header">Teaching-materials / Operations Research & CP-SAT</div>
        <h1>CP-SATの数理：組み合わせ爆発を瞬殺する技術</h1>
        <p class="lead">なぜ4人のシフト（22兆通り）が一瞬で解けるのか？ 衝突駆動節学習（CDCL）のメカニズムから、Google OR-Toolsによる汎用応用まで完全解剖</p>
    </header>

    <!-- 🗺️ 全体ロードマップ目次カード -->
    <div class="roadmap-card" id="roadmap">
        <div class="roadmap-title">
            <span>🗺️ 全体ロードマップ・章立て一覧（全9ステップ）</span>
        </div>
        <div class="roadmap-grid">
"""
    roadmap_items = []
    for ch in CHAPTERS_ORDER:
        item = f"""            <a href="#{ch['id']}" class="roadmap-item">
                <span class="roadmap-item-num">{ch['num']}</span>
                <span class="roadmap-item-name">{ch['title']}</span>
            </a>"""
        roadmap_items.append(item)

    roadmap_html = "\n".join(roadmap_items) + "\n        </div>\n    </div>\n\n"

    # 2. 各章のファイルを読み込んで結合
    chapters_content = []
    for ch in CHAPTERS_ORDER:
        fpath = os.path.join(CHAPTERS_DIR, ch["file"])
        if not os.path.exists(fpath):
            print(f"Error: Chapter file not found: {fpath}")
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read().strip()
        chapters_content.append(content)
        print(f"Loaded: {ch['file']} ({ch['num']})")

    body_html = "\n\n    ".join(chapters_content)

    full_html = (
        HTML_TEMPLATE_HEADER
        + nav_select_html
        + nav_tail_html
        + roadmap_html
        + "    " + body_html
        + "\n</div>\n"
        + HTML_TEMPLATE_FOOTER
    )

    with open(OUTPUT_HTML, "w", encoding="utf-8") as out:
        out.write(full_html)

    print(f"Successfully generated: {OUTPUT_HTML}")
    print(f"Total size: {os.path.getsize(OUTPUT_HTML)} bytes")

if __name__ == "__main__":
    build()
