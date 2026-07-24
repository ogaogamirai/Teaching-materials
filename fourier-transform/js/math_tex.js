/* global FT, katex */
/**
 * Math display via KaTeX (local vendor). file:// OK.
 * Replaces home-grown unicode/HTML hacks for correct textbooks look.
 */
(function (FT) {
  function hasKatex() {
    return typeof katex !== "undefined" && katex && typeof katex.renderToString === "function";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** HTML formula fragments → rough LaTeX */
  function htmlToLatex(html) {
    var s = String(html == null ? "" : html);
    // Already mostly LaTeX (from curated formula_html)
    if (/\\[a-zA-Z]+/.test(s) && s.indexOf("<") < 0) {
      return s;
    }
    // decode entities we might have
    s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    // strip our math-sqrt wrappers if any
    s = s.replace(/<span class="math-sqrt"[^>]*>[\s\S]*?<span class="math-sqrt-sym">√<\/span><span class="math-sqrt-body">([\s\S]*?)<\/span><\/span>/gi, "\\sqrt{$1}");
    s = s.replace(/<span class="math-sqrt-body">([\s\S]*?)<\/span>/gi, "$1");
    // sub/sup tags
    s = s.replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, "_{$1}");
    s = s.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, "^{$1}");
    s = s.replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "$1");
    s = s.replace(/<[^>]+>/g, "");
    // unicode → latex
    s = s
      .replace(/Σ|∑/g, "\\sum")
      .replace(/∫/g, "\\int")
      .replace(/π/g, "\\pi")
      .replace(/∞/g, "\\infty")
      .replace(/θ/g, "\\theta")
      .replace(/φ|ϕ/g, "\\phi")
      .replace(/ω/g, "\\omega")
      .replace(/·/g, "\\cdot ")
      .replace(/×/g, "\\times ")
      .replace(/−/g, "-")
      .replace(/＝/g, "=")
      .replace(/≠/g, "\\neq ")
      .replace(/≤/g, "\\leq ")
      .replace(/≥/g, "\\geq ")
      .replace(/≈/g, "\\approx ")
      .replace(/√/g, "\\sqrt");
    // unicode subscripts/superscripts back to latex
    var subMap = {
      "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
      "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
      "ₙ": "n", "ₘ": "m", "ₐ": "a", "ₑ": "e", "ₓ": "x",
      "ᵢ": "i", "₊": "+", "₋": "-", "₍": "(", "₎": ")"
    };
    var supMap = {
      "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
      "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
      "ⁿ": "n", "ⁱ": "i", "ˣ": "x", "ᵃ": "a", "ᵇ": "b",
      "ᵉ": "e", "ᵏ": "k", "ᵐ": "m", "ᵗ": "t", "⁺": "+", "⁻": "-",
      "⁽": "(", "⁾": ")"
    };
    // group runs of unicode sub/sup
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉ₙₘₐₑₓᵢ₊₋₍₎]+/g, function (run) {
      var body = "";
      for (var i = 0; i < run.length; i++) body += subMap[run.charAt(i)] || run.charAt(i);
      return "_{" + body + "}";
    });
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱˣᵃᵇᵉᵏᵐᵗ⁺⁻⁽⁾]+/g, function (run) {
      var body = "";
      for (var i = 0; i < run.length; i++) body += supMap[run.charAt(i)] || run.charAt(i);
      return "^{" + body + "}";
    });
    // a_n → a_n (latex) already; ensure cos/sin
    s = s.replace(/\bcos\b/g, "\\cos").replace(/\bsin\b/g, "\\sin").replace(/\btan\b/g, "\\tan");
    s = s.replace(/\blim\b/g, "\\lim");
    // e^{inx} already ok; bare e^inx
    s = s.replace(/e\^([a-zA-Z0-9+\-\\{}]+)/g, "e^{$1}");
    return s;
  }

  function katexSafe(latex, display) {
    if (!hasKatex()) return null;
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: !!display,
        strict: "ignore",
        trust: false,
        output: "html"
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Render a whole formula_html (may include Japanese labels) as HTML with KaTeX math.
   * Splits on Japanese / fullwidth separators so only math-ish chunks go to KaTeX.
   */
  function renderFormulaHtml(formulaHtml) {
    if (!formulaHtml) return "";
    if (!hasKatex()) {
      return '<div class="formula-box">' + String(formulaHtml) + "</div>";
    }
    var raw = String(formulaHtml);
    // Prefer one-shot: wrap all CJK as \text{}, rest as latex
    var latex = htmlToLatex(raw);
    latex = latex.replace(/([\u3040-\u30ff\u4e00-\u9fff]+)/g, function (m) {
      return "\\text{" + m + "}";
    });
    // Normalize VS as text
    latex = latex.replace(/\bVS\b/g, "\\text{ VS }");
    var out = katexSafe(latex, false);
    if (out) {
      return '<div class="formula-box formula-katex">' + out + "</div>";
    }
    // Fallback: split on fullwidth space / VS
    var parts = raw.split(/(　+|VS)/);
    var html = parts
      .map(function (part) {
        if (!part) return "";
        if (/^(　+|VS)$/.test(part)) {
          return '<span class="formula-sep">' + esc(part === "VS" ? " VS " : " ") + "</span>";
        }
        var L = htmlToLatex(part);
        L = L.replace(/([\u3040-\u30ff\u4e00-\u9fff]+)/g, function (m) {
          return "\\text{" + m + "}";
        });
        return katexSafe(L, false) || esc(part);
      })
      .join("");
    return '<div class="formula-box formula-katex">' + html + "</div>";
  }

  /**
   * Inline mixed JP + TeX-ish: convert e^{}, a_n, ∫, √( ), (e^{})' etc. via KaTeX.
   */
  function renderInline(text) {
    if (text == null || text === "") return "";
    var s = String(text);
    if (!hasKatex()) return esc(s);

    // Protect already-safe: work on plain text (escape first, then inject katex html)
    // Strategy: find math spans on original, replace with placeholders, esc rest, fill katex
    var chunks = [];
    function pushMath(latex) {
      var id = chunks.length;
      var html = katexSafe(latex, false);
      chunks.push(html || esc(latex));
      return "\uE000" + id + "\uE001";
    }

    // order matters
    s = s.replace(/√\(([^)]+)\)/g, function (m, body) {
      return pushMath("\\sqrt{" + htmlToLatex(body) + "}");
    });
    s = s.replace(/∫([₀-₉ₙₘ]*)([⁰-⁹ⁿ]*)(π?)/g, function (m, lo, up, pi) {
      var latex = "\\int";
      if (lo || up || pi) {
        var low = htmlToLatex(lo || "0");
        var high = htmlToLatex((up || "") + (pi || "2\\pi"));
        if (!up && pi) high = "2\\pi";
        if (!up && !pi) high = "2\\pi";
        latex += "_{" + low + "}^{" + high + "}";
      }
      return pushMath(latex);
    });
    // (e^{inx})' or e^{...}
    s = s.replace(/\(e\^\{([^}]+)\}\)'/g, function (m, ex) {
      return pushMath("(e^{" + ex + "})'");
    });
    s = s.replace(/e\^\{([^}]+)\}/g, function (m, ex) {
      return pushMath("e^{" + ex + "}");
    });
    s = s.replace(/e\^([A-Za-z0-9+\-]+)/g, function (m, ex) {
      return pushMath("e^{" + ex + "}");
    });
    // ∑_{n=1}^∞ or sum
    s = s.replace(/[∑Σ]_\{([^}]+)\}\^\{([^}]+)\}/g, function (m, a, b) {
      return pushMath("\\sum_{" + a + "}^{" + b + "}");
    });
    s = s.replace(/[∑Σ]_\{([^}]+)\}\^([A-Za-z0-9∞\\]+)/g, function (m, a, b) {
      return pushMath("\\sum_{" + a + "}^{" + b + "}");
    });
    // a_n, b_n, c_n (letter_letter/digit)
    s = s.replace(/\b([a-zA-Z])_([a-zA-Z0-9]+)\b/g, function (m, a, b) {
      return pushMath(a + "_{" + b + "}");
    });
    // unicode already-subscripts aₙ
    s = s.replace(/\b([a-zA-Z])([ₙₘₐₓᵢ]+)\b/g, function (m, a, sub) {
      return pushMath(a + htmlToLatex(sub));
    });

    // escape remaining and restore
    var out = esc(s);
    out = out.replace(/\uE000(\d+)\uE001/g, function (m, id) {
      return chunks[parseInt(id, 10)] || "";
    });
    return out;
  }

  /** After proof DOM mount, enhance any [data-tex] or leave as already rendered */
  function enhanceRoot(root) {
    if (!root || !hasKatex()) return;
    // optional: nothing if we render at build time
  }

  function formatMathHtml(s) {
    // For morph steps etc.: HTML-ish snippet → KaTeX inline HTML (no outer box)
    if (!s) return "";
    if (!hasKatex()) return String(s);
    var latex = htmlToLatex(s);
    latex = latex.replace(/([\u3040-\u30ff\u4e00-\u9fff\u3000-\u303f]+)/g, function (m) {
      return "\\text{" + m + "}";
    });
    var out = katexSafe(latex, false);
    return out || String(s);
  }

  FT.mathTex = {
    hasKatex: hasKatex,
    htmlToLatex: htmlToLatex,
    renderFormulaHtml: renderFormulaHtml,
    renderInline: renderInline,
    formatMathHtml: formatMathHtml,
    enhanceRoot: enhanceRoot,
    katexSafe: katexSafe
  };

  FT.formatMathHtml = formatMathHtml;
  FT.escMath = renderInline;
})(window.FT = window.FT || {});
