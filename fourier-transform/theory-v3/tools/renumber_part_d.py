# -*- coding: utf-8 -*-
"""Align Part D filenames with learning order.

Old (historical): D0, D2 euler, D3 complex FS, D1 bridge, D4, D5, D6
New (reading):    D0, D1 euler, D2 complex FS, D3 bridge, D4, D5, D6

Already applied 2026-08-11. Do not run again unless reverting.

Was: python tools/renumber_part_d.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CH = ROOT / "chapters"

RENAMES = [
    ("D2_euler.md", "D1_euler.md"),
    ("D3_complex_fourier.md", "D2_complex_fourier.md"),
    ("D1_series_to_transform.md", "D3_series_to_transform.md"),
]


def rename_files() -> None:
    tmps: list[tuple[Path, Path]] = []
    for src_name, dst_name in RENAMES:
        src = CH / src_name
        if not src.is_file():
            if (CH / dst_name).is_file():
                print(f"skip rename (already done): {dst_name}")
                continue
            raise SystemExit(f"missing {src}")
        tmp = CH / f"_renumber_tmp_{dst_name}"
        src.rename(tmp)
        tmps.append((tmp, CH / dst_name))
    for tmp, dst in tmps:
        if dst.exists():
            raise SystemExit(f"would overwrite {dst}")
        tmp.rename(dst)
        print(f"renamed -> {dst.name}")


def rewrite_text(text: str, path: Path) -> str:
    # --- unique filenames (safe) ---
    text = text.replace("D2_euler.md", "D1_euler.md")
    text = text.replace("D3_complex_fourier.md", "D2_complex_fourier.md")
    text = text.replace("D1_series_to_transform.md", "D3_series_to_transform.md")

    # learning-order banners
    text = text.replace(
        "D0 → D2 → D3 → D1 → D4 → D5 → D6",
        "D0 → D1 → D2 → D3 → D4 → D5 → D6",
    )
    text = text.replace(
        "D0 → D2 → D3 → D1 → D4 → D5 →（本章）",
        "D0 → D1 → D2 → D3 → D4 → D5 →（本章）",
    )
    text = text.replace(
        "D0 → **D2** → D3 → D1 → D4",
        "D0 → **D1** → D2 → D3 → D4",
    )
    text = text.replace("D0→D2→D3→D1→D4", "D0→D1→D2→D3→D4")

    # headings / titled refs
    text = text.replace("# D2. オイラー", "# D1. オイラー")
    text = text.replace("# D3. 複素形", "# D2. 複素形")
    text = text.replace("# D1. 級数から変換へ", "# D3. 級数から変換へ")
    text = text.replace("D2. オイラーの公式", "D1. オイラーの公式")
    text = text.replace("D3. 複素形フーリエ級数", "D2. 複素形フーリエ級数")
    text = text.replace("D1. 級数から変換へ", "D3. 級数から変換へ")

    # ASCII map in D6
    text = text.replace("D2 オイラー", "D1 オイラー")
    text = text.replace("D3 複素級数", "D2 複素級数")
    text = text.replace("D1 橋", "D3 橋")
    text = text.replace("| D0–D2 |", "| D0–D1 |")
    text = text.replace("| D3–D1 |", "| D2–D3 |")

    # drop obsolete "historical filename" notes
    text = re.sub(
        r"\n\*学習順（2026-08-11 改訂）:\* \*\*D0 → D1 → D2 → D3 → D4 → D5 → D6\*\*  \n"
        r"（オイラーで回転＝掛け算を閉じてから複素級数へ。周期→変換の橋は、\\?\$e\^\{i\\omega t\}\\?\$ が使えるあとに置く。）\n\n",
        "\n",
        text,
    )
    text = text.replace(
        "*ファイル名の番号（D1, D2…）は歴史的ラベル。読む順番は上表の学習順に従う。*\n\n",
        "",
    )

    # chapter-body phrases (not E3 checklist **D1.**)
    if path.name != "E3_teachback.md":
        repls = [
            ("証明（D2）", "証明（D1）"),
            ("複素形級数（D3）", "複素形級数（D2）"),
            ("5. D2（オイラー）", "5. D1（オイラー）"),
            ("## 9. D2 への予告", "## 9. D1 への予告"),
            ("D2 で証明", "D1 で証明"),
            ("このあとの使い方（D2）", "このあとの使い方（D1）"),
            ("## 8. D2 への橋", "## 8. D1 への橋"),
            ("（D0–D2）", "（D0–D1）"),
            ("D0–D2）", "D0–D1）"),
            ("橋を渡す（D1,D4）", "橋を渡す（D3,D4）"),
            ("既知:** D1 の橋", "既知:** D3 の橋"),
            ("D1 で選んだ組", "D3 で選んだ組"),
            ("D1 で、級数の極限", "D3 で、級数の極限"),
            ("D1 の (155)", "D3 の (155)"),
            ("（D3）。", "（D2）。"),
            ("D1 で \(\\Delta\\omega", "D3 で \(\\Delta\\omega"),
            ("D1 の物語", "D3 の物語"),
            ("D3 までの級数", "D2 までの級数"),
            ("式は D3 のまま", "式は D2 のまま"),
            ("倍音（D3 の", "倍音（D2 の"),
            ("D3 の (140)", "D2 の (140)"),
            ("D3 の (144)", "D2 の (144)"),
            ("閉じ、D1 以降", "閉じ、D3 以降"),
            ("## 7. 次への橋（D1）", "## 7. 次への橋（D3）"),
            ("それが D1→D4", "それが D3→D4"),
            ("- **D3:**", "- **D2:**"),
            ("- **D1→D4:**", "- **D3→D4:**"),
            ("のち [D3](./D3_series_to_transform.md)（学習順では D3 のあと）",
             "のち [D3](./D3_series_to_transform.md)"),
            ("（C5）(D3)", "（C5）(D2)"),
            ("(C5)(D3)", "(C5)(D2)"),
            ("（C / D3）", "（C / D2）"),
            ("（D3 §6）", "（D2 §6）"),
            ("*D2 は B′6", "*D1 は B′6"),
            ("| FT-EULER-1 | D2 |", "| FT-EULER-1 | D1 |"),
            ("| FT-TRANSFORM-1 | D1, D4 |", "| FT-TRANSFORM-1 | D3, D4 |"),
            (
                "| D2 | オイラーの公式 |",
                "| D1 | オイラーの公式 |",
            ),
            (
                "| D3 | 複素形フーリエ級数 |",
                "| D2 | 複素形フーリエ級数 |",
            ),
            (
                "| D1 | 級数から変換へ |",
                "| D3 | 級数から変換へ |",
            ),
            (
                "| D2 | [D1_euler.md](./D1_euler.md) |",
                "| D1 | [D1_euler.md](./D1_euler.md) |",
            ),
            (
                "| D3 | [D2_complex_fourier.md](./D2_complex_fourier.md) |",
                "| D2 | [D2_complex_fourier.md](./D2_complex_fourier.md) |",
            ),
            (
                "| D1 | [D3_series_to_transform.md](./D3_series_to_transform.md) |",
                "| D3 | [D3_series_to_transform.md](./D3_series_to_transform.md) |",
            ),
        ]
        for a, b in repls:
            text = text.replace(a, b)

    # front-matter learning-order lines (obsolete once numbers match)
    text = re.sub(r"^> \*\*学習順:\*\*.+\n", "", text, flags=re.M)
    text = re.sub(r"^- 学習順: .+\n", "", text, flags=re.M)

    return text


def walk_and_rewrite() -> None:
    for path in sorted(ROOT.rglob("*.md")):
        if "archive" in path.parts:
            continue
        if path.name == "renumber_part_d.py":
            continue
        raw = path.read_text(encoding="utf-8")
        new = rewrite_text(raw, path)
        if new != raw:
            path.write_text(new, encoding="utf-8", newline="\n")
            print(f"rewrote {path.relative_to(ROOT)}")


def main() -> None:
    rename_files()
    walk_and_rewrite()
    print("done")


if __name__ == "__main__":
    main()
