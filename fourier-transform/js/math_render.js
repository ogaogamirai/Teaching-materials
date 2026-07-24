/* global FT */
(function (FT) {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderChapter(ch, labels) {
    if (!ch) return "";
    return (
      '<div class="chapter-box">' +
      "<h3>" +
      esc(ch.title || labels || "前提章") +
      "</h3>" +
      (ch.why
        ? '<p class="kv"><strong>なぜ必要か:</strong> ' + esc(ch.why) + "</p>"
        : "") +
      '<div class="lesson-block">' +
      (ch.body || [])
        .map(function (p) {
          return "<p>" + esc(p) + "</p>";
        })
        .join("") +
      "</div>" +
      (ch.formula_html
        ? FT.mathTex && FT.mathTex.renderFormulaHtml
          ? FT.mathTex.renderFormulaHtml(ch.formula_html)
          : '<div class="formula-box formula-error">' + esc(ch.formula_html) + "</div>"
        : "") +
      (ch.takeaway
        ? '<p class="takeaway" style="margin-top:0.5rem">' +
          esc(ch.takeaway) +
          "</p>"
        : "") +
      "</div>"
    );
  }

  function renderMathCard(card) {
    if (!card) return "";
    const symRows = (card.symbols || [])
      .map(function (s) {
        const read = s.read
          ? '<div class="reading-kana">よみ: ' + esc(s.read) + "</div>"
          : "";
        return (
          "<tr><th>" +
          (s.sym || "") +
          read +
          "</th><td>" +
          esc(s.meaning) +
          '</td><td class="kv">' +
          esc(s.ui) +
          "</td></tr>"
        );
      })
      .join("");
    const steps = (card.derivation_steps || [])
      .map(function (s) {
        return "<li>" + esc(s) + "</li>";
      })
      .join("");
    var renderedFormula = "";
    if (card.formula_html) {
      renderedFormula =
        FT.mathTex && FT.mathTex.renderFormulaHtml
          ? FT.mathTex.renderFormulaHtml(card.formula_html)
          : '<div class="formula-box formula-error">' +
            esc(card.formula_html) +
            "</div>";
      if (FT.readings && card.read_aloud) {
        renderedFormula = FT.readings.formulaWithRead(
          renderedFormula,
          card.read_aloud
        );
      }
    }
    const formulaBlock = renderedFormula;
    return (
      '<div class="math-card">' +
      '<p class="kv"><strong>理論・数式（Lyr-S）</strong> — 入力不要。読む・対応づける。</p>' +
      (card.why_math ? '<p class="kv">' + esc(card.why_math) + "</p>" : "") +
      formulaBlock +
      (card.read_aloud && !FT.readings
        ? '<p class="read-aloud">よみ: ' + esc(card.read_aloud) + "</p>"
        : "") +
      (symRows
        ? '<p class="kv"><strong>記号 ↔ 画面</strong>（よみ付き）</p><table class="term-table"><thead><tr><th>記号・よみ</th><th>意味</th><th>画面</th></tr></thead><tbody>' +
          symRows +
          "</tbody></table>"
        : "") +
      (FT.readings ? FT.readings.renderGlossary(false) : "") +
      (steps
        ? '<p class="kv"><strong>なぜその形か（導出ミニ）</strong></p><ol class="guide-list">' +
          steps +
          "</ol>"
        : "") +
      (card.common_error
        ? '<p class="mc-list" style="list-style:none;padding-left:0">注意: ' +
          esc(card.common_error) +
          "</p>"
        : "") +
      (card.link_to_demo
        ? '<p class="kv">操作で見る場所: ' + esc(card.link_to_demo) + "</p>"
        : "") +
      "</div>"
    );
  }

  /** chapters: string[] like sum_chapter; alwaysShow: if true show chapter when host has it even if not flagged - we only show when flagged OR always for host optional */
  function buildLearnExtra(mathRoot, nodeId, activeChapterIds, chapterLabels) {
    if (!mathRoot) return "";
    const chapters = mathRoot.chapters || {};
    const nodes = mathRoot.nodes || {};
    let html = "";
    (activeChapterIds || []).forEach(function (cid) {
      html += renderChapter(chapters[cid], (chapterLabels && chapterLabels[cid]) || cid);
    });
    html += renderMathCard(nodes[nodeId]);
    if (mathRoot.notation && (nodeId === "FT-CAP-1" || nodeId === "FT-WAVE-1")) {
      html +=
        '<p class="kv muted">表記の約束: ' +
        esc(mathRoot.notation.note) +
        "</p>";
    }
    return html;
  }

  FT.mathRender = {
    renderChapter: renderChapter,
    renderMathCard: renderMathCard,
    buildLearnExtra: buildLearnExtra,
  };
})(window.FT = window.FT || {});
