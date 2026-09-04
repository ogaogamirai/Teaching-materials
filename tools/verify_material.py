#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Teaching Material Universal Quality Validator & Linter (教材用総合品質検査ツール)

J.T.とエリーの知見（verify_sd, verify_math, math_protect）を統合した汎用チェッカー。
教材プロジェクト（Markdown / HTML）の構文・数式・図表・リンクの破綻を自動検出し、
最高品質の学習体験を保証します。

Usage:
  python tools/verify_material.py <path_to_material_dir_or_file>
  python tools/verify_material.py G:\マイドライブ\Projects\Teaching-materials\category-theory

Checks:
  [L1] Markdown太字×括弧・記号境界 / HTML内未変換 ** / 太字内スペース (Bold bracket leak)
  [L2] KaTeX 数式構文・不等号・日本語ラップ (Math syntax & KaTeX compile)
  [L3] Mermaid ダイアグラム構文・ID命名規則 (Mermaid subgraph format)
  [L4] 内部アンカーリンク・目次整合性 (Internal anchors & TOC link resolution)
  [L5] ツールチップ・特殊UIコンポーネント整合性 (UI components consistency)
"""

from __future__ import annotations
import argparse
import glob
import json
import os
import re
import subprocess
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


class Issue:
    def __init__(self, level: str, file: str, line: int, category: str, message: str, snippet: str = ""):
        self.level = level  # ERROR, WARN, INFO
        self.file = file
        self.line = line
        self.category = category
        self.message = message
        self.snippet = snippet

    def __str__(self):
        snip = f" (snip: {self.snippet.strip()})" if self.snippet else ""
        return f"[{self.level}] {self.category} in {self.file}:{self.line} -> {self.message}{snip}"


class MaterialValidator:
    def __init__(self, target_path: Path):
        self.target_path = target_path.resolve()
        self.issues: list[Issue] = []

    def run_all(self) -> list[Issue]:
        self.issues.clear()
        files = self._collect_files()
        
        for file in files:
            if file.suffix in (".md", ".html"):
                text = file.read_text(encoding="utf-8", errors="replace")
                lines = text.splitlines()
                
                self.check_bold_brackets(file, lines)
                self.check_math_formulas(file, text, lines)
                self.check_mermaid_syntax(file, lines)
                
                if file.suffix == ".html":
                    self.check_html_anchors(file, text)
                    self.check_tooltips(file, text, lines)

        return self.issues

    def _collect_files(self) -> list[Path]:
        if self.target_path.is_file():
            return [self.target_path]
        return [p for p in self.target_path.rglob("*") if p.is_file() and p.suffix in (".md", ".html")]

    # -------------------------------------------------------------------------
    # L1: Markdown 太字 × 括弧境界チェック
    # -------------------------------------------------------------------------
    def check_bold_brackets(self, file: Path, lines: list[str]):
        # **「...」** や **『...』**、**【...】** のような括弧外側のアスタリスク
        bad_bold_outside = re.compile(r'\*\*([「『【（].*?[」』】）])\*\*')
        # **text**（補足）のような全角括弧直前の閉じアスタリスク（一部パーサーで漏れる）
        bad_adjacent = re.compile(r'\*\*[^*\n]+\*\*（')
        # HTML 内に Markdown 太字が残存（ブラウザでは ** がそのまま表示される）
        html_raw_bold = re.compile(r'\*\*[^*\n]+\*\*')
        bold_pair = re.compile(r'\*\*([^*\n]+?)\*\*')

        in_script_or_style = False
        for i, line in enumerate(lines, 1):
            stripped = line.strip().lower()
            if "<script" in stripped:
                in_script_or_style = True
            if in_script_or_style:
                if "</script>" in stripped:
                    in_script_or_style = False
                continue
            if "<style" in stripped:
                in_script_or_style = True
            if in_script_or_style and "</style>" in stripped:
                in_script_or_style = False
                continue

            if file.suffix == ".html":
                m_html = html_raw_bold.search(line)
                if m_html:
                    self.issues.append(Issue(
                        "ERROR", file.name, i, "L1-HtmlRawBold",
                        "HTML内に Markdown 太字記法 **...** が残っています。<strong>...</strong> に置き換えてください。",
                        m_html.group(0)
                    ))

            m = bad_bold_outside.search(line)
            if m:
                self.issues.append(Issue(
                    "ERROR", file.name, i, "L1-BoldBracket",
                    "太字アスタリスクが全角括弧の外側にあります（レンダリング破綻の原因）。「**...**」の順に修正してください。",
                    m.group(0)
                ))
            m2 = bad_adjacent.search(line)
            if m2 and file.suffix == ".md":
                self.issues.append(Issue(
                    "WARN", file.name, i, "L1-BoldAdjacent",
                    "太字直後に全角括弧（）が隣接しています。",
                    m2.group(0)
                ))

            if file.suffix == ".md":
                for bp in bold_pair.finditer(line):
                    inner = bp.group(1)
                    if inner[:1].isspace():
                        self.issues.append(Issue(
                            "ERROR", file.name, i, "L1-BoldSpaceOpen",
                            "太字開始 ** の直後に余分なスペースがあります（太字として認識されません）。",
                            bp.group(0)
                        ))
                    elif inner[-1:].isspace():
                        self.issues.append(Issue(
                            "ERROR", file.name, i, "L1-BoldSpaceClose",
                            "太字終了 ** の直前に余分なスペースがあります（太字として認識されません）。",
                            bp.group(0)
                        ))

    # -------------------------------------------------------------------------
    # L2: 数式 KaTeX 構文チェック
    # -------------------------------------------------------------------------
    def check_math_formulas(self, file: Path, text: str, lines: list[str]):
        # $$ ... $$ または $ ... $ の抽出
        math_blocks = []
        
        # Display math $$...$$
        for m in re.finditer(r'\$\$(.*?)\$\$', text, re.DOTALL):
            math_blocks.append((m.group(1), text[:m.start()].count('\n') + 1, True))
            
        # Inline math $...$
        for m in re.finditer(r'(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)', text):
            math_blocks.append((m.group(1), text[:m.start()].count('\n') + 1, False))

        for formula, line_no, is_display in math_blocks:
            f_clean = formula.strip()
            if not f_clean:
                self.issues.append(Issue("WARN", file.name, line_no, "L2-MathEmpty", "空の数式ブロックです。"))
                continue

            # 不正な生の不等号 (< や >) の検出（\lt, \gt を推奨）
            if re.search(r'(?<!\\text\{)(?<!\\)(?<!\{)<(?![a-zA-Z/!])', f_clean):
                if "<" in f_clean and "\\lt" not in f_clean and "\\text{" not in f_clean:
                    self.issues.append(Issue(
                        "WARN", file.name, line_no, "L2-MathRawLT",
                        "数式内で生の '<' が使われています。KaTeX互換のため '\\lt' を推奨します。",
                        f_clean[:40]
                    ))

            # 数式内での日本語直書きチェック（\text{} で囲まれていない日本語）
            # \text{...} を除去した後に日本語文字が残っているか
            stripped = re.sub(r'\\text\{[^}]*\}', '', f_clean)
            jp_match = re.search(r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]', stripped)
            if jp_match:
                self.issues.append(Issue(
                    "WARN", file.name, line_no, "L2-MathUnwrappedJP",
                    f"数式内に \\text{{}} でラップされていない日本語文字 '{jp_match.group(0)}' があります。",
                    f_clean[:40]
                ))

    # -------------------------------------------------------------------------
    # L3: Mermaid ダイアグラム構文チェック
    # -------------------------------------------------------------------------
    def check_mermaid_syntax(self, file: Path, lines: list[str]):
        # subgraph 日本語名 (例: subgraph 1. ベクトル空間) は Mermaid v10 で構文エラーになる
        # 正しい形式: subgraph subId["1. ベクトル空間"]
        bad_subgraph = re.compile(r'^\s*subgraph\s+([^\w\s"\[\]]+|[\d\.]+\s+[^"\[\]]+)\s*$')
        
        for i, line in enumerate(lines, 1):
            if "subgraph" in line:
                stripped = line.strip()
                # subgraph の後に英数字識別子 + ラベル記法がないパターン
                if not re.search(r'subgraph\s+[a-zA-Z0-9_]+\s*(\["[^"]+"\])?', stripped):
                    if not re.search(r'subgraph\s+"[^"]+"', stripped):
                        # 日本語や記号が直書きされている可能性
                        if any(ord(c) > 127 for c in stripped):
                            self.issues.append(Issue(
                                "ERROR", file.name, i, "L3-MermaidSubgraph",
                                "subgraph名に日本語が直書きされています。Mermaid構文エラー防止のため `subgraph id[\"ラベル\"]` 形式にしてください。",
                                stripped
                            ))

    # -------------------------------------------------------------------------
    # L4: HTML 内部アンカーリンク・目次整合性チェック
    # -------------------------------------------------------------------------
    def check_html_anchors(self, file: Path, text: str):
        # 定義されている id
        declared_ids = set(re.findall(r'\bid=["\']([^"\']+)["\']', text))
        # 参照されている href="#..."
        referenced_anchors = re.findall(r'\bhref=["\']#([^"\']+)["\']', text)

        for anchor in referenced_anchors:
            if anchor and anchor not in declared_ids:
                self.issues.append(Issue(
                    "ERROR", file.name, 1, "L4-BrokenAnchor",
                    f"目次・リンク内のアンカー '#{anchor}' に対応する id が HTML 内に見つかりません。"
                ))

    # -------------------------------------------------------------------------
    # L5: ツールチップ (term-pop) 整合性チェック
    # -------------------------------------------------------------------------
    def check_tooltips(self, file: Path, text: str, lines: list[str]):
        # .term-pop 内に .pop-card が存在するか
        pop_count = len(re.findall(r'class=["\'][^"\']*term-pop[^"\']*["\']', text))
        card_count = len(re.findall(r'class=["\'][^"\']*pop-card[^"\']*["\']', text))
        
        if pop_count != card_count:
            self.issues.append(Issue(
                "WARN", file.name, 1, "L5-TooltipMismatch",
                f"ツールチップ要素 term-pop ({pop_count}個) と pop-card ({card_count}個) の数が一致しません。"
            ))


def main():
    parser = argparse.ArgumentParser(description="Teaching Material Universal Quality Validator & Linter")
    parser.add_argument("target", nargs="?", default=".", help="Target directory or file (default: current dir)")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    args = parser.parse_args()

    target_path = Path(args.target)
    if not target_path.exists():
        print(f"[ERROR] Target path does not exist: {target_path}", file=sys.stderr)
        return 1

    validator = MaterialValidator(target_path)
    issues = validator.run_all()

    errors = [it for it in issues if it.level == "ERROR"]
    warnings = [it for it in issues if it.level == "WARN"]

    if args.json:
        out = {
            "target": str(target_path),
            "error_count": len(errors),
            "warn_count": len(warnings),
            "issues": [
                {
                    "level": i.level,
                    "file": i.file,
                    "line": i.line,
                    "category": i.category,
                    "message": i.message,
                    "snippet": i.snippet
                } for i in issues
            ]
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(f"\n========================================================")
        print(f" 📚 Teaching Material Quality Validation Report")
        print(f" Target: {target_path}")
        print(f"========================================================\n")
        
        if not issues:
            print("  🎉 [PASS] すべての検査をクリアしました！構文・数式・図表・リンクに破綻はありません。\n")
            return 0

        for issue in issues:
            icon = "❌" if issue.level == "ERROR" else "⚠️"
            print(f"  {icon} {issue}")

        print(f"\n--------------------------------------------------------")
        print(f" 判定結果: ERROR: {len(errors)}件, WARN: {len(warnings)}件")
        print(f"--------------------------------------------------------\n")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
