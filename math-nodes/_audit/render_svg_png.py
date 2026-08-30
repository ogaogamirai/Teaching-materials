#!/usr/bin/env python3
"""Render math-nodes diagram.svg to PNG via Chrome headless (if available)."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_audit" / "svg_png"
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def find_browser() -> Path | None:
    for p in CHROME_CANDIDATES:
        if Path(p).exists():
            return Path(p)
    return shutil.which("chrome") or shutil.which("msedge")


def render(browser: Path, svg: Path, png: Path) -> tuple[bool, str]:
    url = svg.resolve().as_uri()
    cmd = [
        str(browser),
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--screenshot={png}",
        "--window-size=900,600",
        url,
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if png.exists() and png.stat().st_size > 500:
            return True, "ok"
        return False, (r.stderr or r.stdout or "no png")[:200]
    except Exception as e:
        return False, str(e)


def main() -> int:
    browser = find_browser()
    if not browser:
        print("[skip] no Chrome/Edge found for headless render")
        return 2

    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith(("_", ".")) or d.name == "ontology":
            continue
        svg = d / "diagram.svg"
        if not svg.exists():
            continue
        png = OUT / f"{d.name}.png"
        ok, msg = render(browser, svg, png)
        results.append({"node": d.name, "ok": ok, "msg": msg, "png": str(png) if ok else None})
        print(f"{'[ok]' if ok else '[fail]'} {d.name}: {msg}")

    out = ROOT / "_audit" / "svg_render_report.json"
    ok_n = sum(1 for r in results if r["ok"])
    out.write_text(
        json.dumps({"browser": str(browser), "total": len(results), "ok": ok_n, "nodes": results}, indent=2),
        encoding="utf-8",
    )
    print(f"\n[ok] {ok_n}/{len(results)} rendered -> {OUT}")
    return 0 if ok_n == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
