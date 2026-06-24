# -*- coding: utf-8 -*-
import os
import re
import sys
import shutil

# WindowsでのUTF-8出力対策
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# パス設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SECTIONS_DIR = os.path.join(BASE_DIR, "sections")
OUTPUT_MD = os.path.join(BASE_DIR, "combinatorics_intuitive_guide_v2.md")
OUTPUT_HTML = os.path.join(BASE_DIR, "combinatorics_intuitive_guide_v2.html")

# Eleanor Arroway ワークスペース側の同期先パス
WORKSPACE_DIR = r"g:\マイドライブ\Eleanor Arroway\TeachingText"
WORKSPACE_MD = os.path.join(WORKSPACE_DIR, "combinatorics_intuitive_guide_v2.md")
WORKSPACE_HTML = os.path.join(WORKSPACE_DIR, "combinatorics_intuitive_guide_v2.html")
WORKSPACE_SECTIONS = os.path.join(WORKSPACE_DIR, "sections")

HTML_TEMPLATE_START = """<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>場合の数・直感的完全学習ガイド V2.3</title>
    
    <!-- KaTeX for beautiful math equations -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
    
    <style>
        :root {
            --bg-color: #0f172a;
            --text-color: #f8fafc;
            --card-bg: #1e293b;
            --border-color: #334155;
            --primary: #3b82f6;
            --primary-glow: rgba(59, 130, 246, 0.15);
            --accent: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --meta-text: #94a3b8;
            --font-main: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", sans-serif;
        }

        @media (prefers-color-scheme: light) {
            :root {
                --bg-color: #f8fafc;
                --text-color: #0f172a;
                --card-bg: #ffffff;
                --border-color: #e2e8f0;
                --primary: #2563eb;
                --primary-glow: rgba(37, 99, 235, 0.08);
                --accent: #059669;
                --warning: #d97706;
                --danger: #dc2626;
                --meta-text: #64748b;
            }
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--font-main);
            line-height: 1.7;
            padding: 24px 16px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 880px;
            margin: 0 auto;
        }

        header {
            margin-bottom: 40px;
            text-align: center;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 20px;
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 12px;
            line-height: 1.3;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .metadata {
            font-size: 0.9rem;
            color: var(--meta-text);
            margin-bottom: 10px;
        }

        h2 {
            font-size: 1.5rem;
            margin: 36px 0 16px;
            border-left: 5px solid var(--primary);
            padding-left: 12px;
            line-height: 1.2;
        }

        h3 {
            font-size: 1.2rem;
            margin: 24px 0 12px;
            color: var(--accent);
        }

        p {
            margin-bottom: 16px;
            font-size: 1.05rem;
        }

        ul, ol {
            margin: 0 0 20px 24px;
        }

        li {
            margin-bottom: 8px;
            font-size: 1.02rem;
        }

        .card {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .card.idea {
            border-left: 5px solid var(--warning);
            background-color: var(--primary-glow);
        }

        .card.step {
            border-left: 5px solid var(--primary);
        }

        .card.warning {
            border-left: 5px solid var(--danger);
        }

        .badge-idea {
            color: var(--warning);
            font-weight: bold;
            margin-right: 8px;
        }

        .badge-step {
            color: var(--primary);
            font-weight: bold;
            margin-right: 8px;
        }

        .table-container {
            width: 100%;
            overflow-x: auto;
            margin: 24px 0;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            -webkit-overflow-scrolling: touch;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
            min-width: 600px;
        }

        th {
            background-color: var(--card-bg);
            font-weight: bold;
            color: var(--primary);
        }

        th, td {
            padding: 12px 16px;
            border: 1px solid var(--border-color);
            text-align: left;
        }

        tr:nth-child(even) td {
            background-color: rgba(255, 255, 255, 0.02);
        }

        .svg-container {
            width: 100%;
            overflow-x: auto;
            margin: 24px 0;
            -webkit-overflow-scrolling: touch;
        }
        
        .svg-container svg {
            min-width: 650px;
            display: block;
            margin: 0 auto;
        }

        code {
            background-color: var(--card-bg);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.9em;
            border: 1px solid var(--border-color);
        }

        .katex-display {
            overflow-x: auto;
            overflow-y: hidden;
            padding: 8px 0;
            -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 640px) {
            body {
                padding: 16px 8px;
            }
            h1 {
                font-size: 1.6rem;
            }
            h2 {
                font-size: 1.3rem;
            }
            .card {
                padding: 16px;
                border-radius: 8px;
            }
            p, li {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌌 場合の数・直感的完全学習ガイド V2.3</h1>
            <div class="metadata">最終更新: 2026-06-24</div>
            <div class="metadata">スマートフォン & PC 完全レスポンシブ調律仕様</div>
        </header>
"""

HTML_TEMPLATE_END = """
    </div>
</body>
</html>
"""

def inline_replace(text):
    # 1. 数式の退避 (保護)
    maths = []
    def save_math(match):
        maths.append(match.group(0))
        return f"___MATH_{len(maths)-1}___"
        
    # $$ と $ を順に退避
    text = re.sub(r'\$\$(.*?)\$\$', save_math, text)
    text = re.sub(r'\$(.*?)\$', save_math, text)
    
    # 2. 太字
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    
    # 3. リンク [text](url) -> <a href="url">text</a>
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', text)
    
    # 4. 数式の復元
    for idx, math_str in enumerate(maths):
        text = text.replace(f"___MATH_{idx}___", math_str)
        
    return text

def convert_md_to_html(md_text):
    html_lines = []
    lines = md_text.splitlines()
    
    in_p = False
    in_ul = False
    in_ol = False
    in_math_block = False
    in_warning = False
    warning_lines = []

    def close_p_if_open():
        nonlocal in_p
        if in_p:
            html_lines.append("</p>")
            in_p = False
            
    def close_lists_if_open():
        nonlocal in_ul, in_ol
        if in_ul:
            html_lines.append("</ul>")
            in_ul = False
        if in_ol:
            html_lines.append("</ol>")
            in_ol = False

    def close_warning_if_open():
        nonlocal in_warning, warning_lines
        if in_warning:
            content = " ".join(warning_lines)
            content = content.replace("[!WARNING]", "").strip()
            content = inline_replace(content)
            if "！" in content:
                parts = content.split("！", 1)
                html_lines.append(f'<div class="card warning"><span class="badge-idea">⚠️</span><strong>{parts[0]}！</strong>{parts[1]}</div>')
            else:
                html_lines.append(f'<div class="card warning"><span class="badge-idea">⚠️</span>{content}</div>')
            in_warning = False
            warning_lines = []

    idx = 0
    while idx < len(lines):
        line = lines[idx]
        line_strip = line.strip()
        
        # 数式ブロック $$ の処理
        if line_strip == "$$":
            close_p_if_open()
            close_lists_if_open()
            close_warning_if_open()
            in_math_block = not in_math_block
            html_lines.append(line)
            idx += 1
            continue
            
        if in_math_block:
            html_lines.append(line)
            idx += 1
            continue

        # HTMLタグやSVGなどの生HTML行はそのまま通すが、インライン要素は置換する
        if line_strip.startswith("<") or line_strip.startswith("</") or any(tag in line_strip for tag in ["<table", "</table>", "<tr", "</tr>", "<td", "</td>", "<th", "</th>", "<thead", "</thead>", "<tbody", "</tbody>", "<svg", "</svg>", "<rect", "<circle", "<line", "<text", "<path", "<defs", "<marker"]):
            close_p_if_open()
            close_lists_if_open()
            close_warning_if_open()
            html_lines.append(inline_replace(line))
            idx += 1
            continue

        # 空行の処理
        if not line_strip:
            close_p_if_open()
            close_lists_if_open()
            close_warning_if_open()
            html_lines.append("")
            idx += 1
            continue

        # 警告引用の処理 (> [!WARNING])
        if line_strip.startswith(">"):
            close_p_if_open()
            close_lists_if_open()
            if not in_warning:
                in_warning = True
                warning_lines = []
            content = re.sub(r'^>\s*', '', line_strip)
            warning_lines.append(content)
            idx += 1
            continue
        else:
            close_warning_if_open()

        # 見出しの処理
        if line_strip.startswith("## "):
            close_p_if_open()
            close_lists_if_open()
            content = line_strip[3:]
            html_lines.append(f"<h2>{inline_replace(content)}</h2>")
            idx += 1
            continue
            
        if line_strip.startswith("### 🔹 "):
            close_p_if_open()
            close_lists_if_open()
            content = line_strip[6:]
            html_lines.append(f"<h3>🔹 {inline_replace(content)}</h3>")
            idx += 1
            continue
            
        if line_strip.startswith("### "):
            close_p_if_open()
            close_lists_if_open()
            content = line_strip[4:]
            html_lines.append(f"<h3>{inline_replace(content)}</h3>")
            idx += 1
            continue
            
        if line_strip.startswith("#### 🎨 "):
            close_p_if_open()
            close_lists_if_open()
            content = line_strip[7:]
            html_lines.append(f"<h4>🎨 {inline_replace(content)}</h4>")
            idx += 1
            continue
            
        if line_strip.startswith("#### "):
            close_p_if_open()
            close_lists_if_open()
            content = line_strip[5:]
            html_lines.append(f"<h4>{inline_replace(content)}</h4>")
            idx += 1
            continue

        # 水平線
        if line_strip == "---":
            close_p_if_open()
            close_lists_if_open()
            html_lines.append("<hr>")
            idx += 1
            continue

        # 思考のステップ・直感イメージカード
        if line_strip.startswith("✍️ **"):
            close_p_if_open()
            close_lists_if_open()
            content = re.sub(r'^✍️\s*\*\*(.*?)\*\*$', r'\1', line_strip)
            html_lines.append(f'<div class="card step"><span class="badge-step">✍️</span>{inline_replace(content)}</div>')
            idx += 1
            continue
            
        if line_strip.startswith("💡 **直感イメージ：**"):
            close_p_if_open()
            close_lists_if_open()
            content = line_strip[13:]
            html_lines.append(f'<div class="card idea"><span class="badge-idea">💡 直感イメージ</span>{inline_replace(content)}</div>')
            idx += 1
            continue
            
        if line_strip.startswith("💡 **"):
            close_p_if_open()
            close_lists_if_open()
            content = re.sub(r'^💡\s*\*\*(.*?)\*\*$', r'\1', line_strip)
            html_lines.append(f'<div class="card idea"><span class="badge-idea">💡</span>{inline_replace(content)}</div>')
            idx += 1
            continue

        # リスト
        if line_strip.startswith("* "):
            close_p_if_open()
            if in_ol:
                html_lines.append("</ol>")
                in_ol = False
            if not in_ul:
                html_lines.append("<ul>")
                in_ul = True
            content = line_strip[2:]
            html_lines.append(f"<li>{inline_replace(content)}</li>")
            idx += 1
            continue
            
        if re.match(r'^\d+\.\s+', line_strip):
            close_p_if_open()
            if in_ul:
                html_lines.append("</ul>")
                in_ul = False
            if not in_ol:
                html_lines.append("<ol>")
                in_ol = True
            content = re.sub(r'^\d+\.\s+', '', line_strip)
            html_lines.append(f"<li>{inline_replace(content)}</li>")
            idx += 1
            continue

        # 通常の段落
        close_lists_if_open()
        if not in_p:
            html_lines.append("<p>")
            in_p = True
        html_lines.append(inline_replace(line_strip))
        idx += 1
        
    # 後始末
    close_p_if_open()
    close_lists_if_open()
    close_warning_if_open()
    
    return "\n".join(html_lines)

def build():
    print("Building combinatorics guide...")
    
    # 1. 幕ごとのファイルを結合して完成版 Markdown を作成
    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith(".md")])
    combined_md_lines = []
    
    # メタ情報ヘッダー
    combined_md_lines.append("# 🌌 場合の数・直感的完全学習ガイド V2.3")
    combined_md_lines.append("")
    
    for fn in section_files:
        path = os.path.join(SECTIONS_DIR, fn)
        print(f"  Reading {fn}...")
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            combined_md_lines.append(content)
            combined_md_lines.append("") # 結合時の境界空行

    full_md_content = "\n".join(combined_md_lines)
    
    # 完成版 Markdown の保存
    with open(OUTPUT_MD, 'w', encoding='utf-8', newline='\n') as f_out:
        f_out.write(full_md_content)
    print(f"Saved completed MD to: {OUTPUT_MD}")
    
    # 2. Markdown から同期 HTML を作成
    html_body = convert_md_to_html(full_md_content)
    full_html_content = HTML_TEMPLATE_START + html_body + HTML_TEMPLATE_END
    
    with open(OUTPUT_HTML, 'w', encoding='utf-8', newline='\n') as f_out:
        f_out.write(full_html_content)
    print(f"Saved completed HTML to: {OUTPUT_HTML}")
    
    # 3. Eleanor Arroway ワークスペース側への自動同期コピー
    if os.path.exists(WORKSPACE_DIR):
        print("Synchronizing build artifacts to Eleanor Arroway workspace...")
        shutil.copyfile(OUTPUT_MD, WORKSPACE_MD)
        shutil.copyfile(OUTPUT_HTML, WORKSPACE_HTML)
        
        # sections 内の Markdown ファイルも双方向で同期可能にするためコピー
        os.makedirs(WORKSPACE_SECTIONS, exist_ok=True)
        for fn in section_files:
            shutil.copyfile(os.path.join(SECTIONS_DIR, fn), os.path.join(WORKSPACE_SECTIONS, fn))
        print("Synchronization completed successfully!")
    else:
        print("Warning: Eleanor Arroway workspace directory not found. Skipping synchronization.")

if __name__ == "__main__":
    build()
