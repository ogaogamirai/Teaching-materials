/* global FT */
(function (FT) {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function list() {
    const d = FT.DATA_READINGS;
    return (d && d.symbols) || [];
  }

  /** Compact chips: θ（シータ） */
  function renderChips(filterSyms) {
    let items = list();
    if (filterSyms && filterSyms.length) {
      const set = {};
      filterSyms.forEach(function (s) {
        set[s] = true;
      });
      items = items.filter(function (it) {
        return set[it.sym] || set[it.read];
      });
    }
    if (!items.length) return "";
    return (
      '<div class="reading-chips" aria-label="記号の読み方">' +
      items
        .map(function (it) {
          return (
            '<span class="reading-chip" title="' +
            esc(it.hint || "") +
            '"><b>' +
            esc(it.sym) +
            "</b>（" +
            esc(it.read) +
            "）</span>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderGlossary(open) {
    const d = FT.DATA_READINGS;
    if (!d || !d.symbols || !d.symbols.length) return "";
    const rows = d.symbols
      .map(function (it) {
        return (
          "<tr><th>" +
          esc(it.sym) +
          '</th><td><span class="reading-kana">' +
          esc(it.read) +
          "</span></td><td class=\"kv\">" +
          esc(it.hint || "") +
          "</td></tr>"
        );
      })
      .join("");
    return (
      '<details class="reading-glossary"' +
      (open ? " open" : "") +
      "><summary>記号・ギリシャ文字の読み方一覧</summary>" +
      '<p class="muted" style="margin:0.35rem 0">' +
      esc(d.note || "") +
      "</p>" +
      '<table class="term-table reading-table"><thead><tr><th>記号</th><th>読み</th><th>意味のヒント</th></tr></thead><tbody>' +
      rows +
      "</tbody></table></details>"
    );
  }

  function formulaWithRead(formulaHtml, formulaRead) {
    if (!formulaHtml) return "";
    var read =
      formulaRead
        ? '<div class="formula-read">よみ: ' + esc(formulaRead) + "</div>"
        : "";
    // Already a formula-box (e.g. KaTeX output) — append よみ inside/after without nesting
    if (/class="[^"]*formula-box/.test(String(formulaHtml))) {
      if (!read) return formulaHtml;
      if (/<\/div>\s*$/.test(String(formulaHtml))) {
        return String(formulaHtml).replace(/<\/div>\s*$/, read + "</div>");
      }
      return formulaHtml + read;
    }
    return (
      '<div class="formula-box">' + formulaHtml + read + "</div>"
    );
  }

  FT.readings = {
    list: list,
    renderChips: renderChips,
    renderGlossary: renderGlossary,
    formulaWithRead: formulaWithRead,
  };
})(window.FT = window.FT || {});
