"""一時ツール: verify の FAIL display を章とTeXで特定する"""
import re

html = open("book/index.html", encoding="utf-8").read()

displays = [(m.start(), m.group(1)) for m in re.finditer(r"\$\$(.+?)\$\$", html, re.S)]

chaps = [(m.start(), m.group(1)) for m in re.finditer(
    r'<section class="chapter"[^>]*id="([^"]+)"', html)]


def chap_of(pos):
    c = "?"
    for p, name in chaps:
        if p <= pos:
            c = name
        else:
            break
    return c


flagged = [39, 49, 53, 59, 63, 65, 70, 72, 99, 103, 117, 123, 128, 130, 134, 141, 151]
for i in flagged:
    if i - 1 < len(displays):
        pos, tex = displays[i - 1]
        compact = re.sub(r"\s+", "", tex)
        print(f"display#{i} [{chap_of(pos)}] len={len(compact)}")
        print("   ", re.sub(r"\s+", " ", tex).strip()[:100])
