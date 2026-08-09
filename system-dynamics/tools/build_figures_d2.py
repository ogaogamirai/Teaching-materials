#!/usr/bin/env python3
"""Render D2 diagram sources to stripped SVG under figures/.

For each figures/d2/*.d2:
  1. Render with the bundled D2 (tools/d2-bin/ or PATH d2) -> figures/<name>.svg (raw)
  2. Strip embedded fonts (strip_d2_fonts.py) so fonts are shared via CSS.

Usage:
    python tools/build_figures_d2.py
    python tools/build_figures_d2.py --check   # verify d2 is available
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
FIGURES = PROJECT_ROOT / "figures"
D2_DIR = FIGURES / "d2"
D2_BIN_DIR = PROJECT_ROOT / "tools" / "d2-bin"

# Source .d2 -> output .svg (under figures/), optionally with a different name.
D2_OUTPUT_OVERRIDES: dict[str, str] = {
    "unit7_crt.d2": "unit7_crt.svg",
    "unit8_evaporating_cloud.d2": "unit8_evaporating_cloud.svg",
    "unit3_feedback_loops.d2": "unit3_feedback_loops.svg",
}


def output_svg_name(source_name: str) -> str:
    if source_name in D2_OUTPUT_OVERRIDES:
        return D2_OUTPUT_OVERRIDES[source_name]
    return Path(source_name).stem + ".svg"


def find_d2() -> Path | None:
    which = shutil.which("d2")
    if which:
        return Path(which)
    # Canonical source: path-to-structure's bundled d2 (not committed here).
    base = PROJECT_ROOT.parents[1] / "path-to-structure" / "tools" / "d2-bin"
    for pattern in ("d2.exe", "bin/d2.exe", "*/bin/d2.exe"):
        matches = sorted(Path(base).glob(pattern))
        for m in matches:
            try:
                if m.is_file() and m.stat().st_size > 0:
                    return m
            except OSError:
                continue
    return None


def render_one(d2: Path, source: Path, output: Path) -> None:
    result = subprocess.run(
        [str(d2), str(source), str(output)],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        msg = result.stderr or result.stdout or "unknown d2 error"
        raise RuntimeError(f"d2 failed for {source.name}: {msg}")


def strip_fonts(svg_path: Path) -> None:
    """In-place: remove embedded @font-face and switch to CSS font stack."""
    import re

    from strip_d2_fonts import strip_fonts as do_strip

    text = svg_path.read_text(encoding="utf-8")
    svg_path.write_text(do_strip(text), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Render figures/d2/*.d2 to stripped SVG.")
    parser.add_argument("--check", action="store_true", help="Only verify d2 is available")
    args = parser.parse_args()

    d2 = find_d2()
    if d2 is None:
        print("D2 CLI not found.", file=sys.stderr)
        print("Bundled: tools/d2-bin/  or  winget install Terrastruct.D2", file=sys.stderr)
        return 1

    if args.check:
        print(f"D2 available: {d2}")
        return 0

    if not D2_DIR.is_dir():
        raise SystemExit(f"Missing {D2_DIR}")

    sources = sorted(D2_DIR.glob("*.d2"))
    if not sources:
        raise SystemExit(f"No .d2 files in {D2_DIR}")

    failed: list[str] = []
    for src in sources:
        raw = FIGURES / (Path(src.name).stem + "_raw.svg")
        out = FIGURES / output_svg_name(src.name)
        try:
            render_one(d2, src, raw)
            strip_fonts(raw)
            raw.replace(out)
            print(f"Wrote {out.name}  <-  {src.name}")
        except RuntimeError as exc:
            failed.append(f"{src.name}: {exc}")
            print(f"FAIL {src.name}: {exc}", file=sys.stderr)

    if failed:
        raise SystemExit(f"{len(failed)} diagram(s) failed:\n" + "\n".join(failed))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
