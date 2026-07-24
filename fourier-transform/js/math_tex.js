/* global FT, katex */
/**
 * Math via local KaTeX — manabitimes-like display (displayMode, clear limits).
 * file:// OK (vendor/katex).
 */
(function (FT) {
  function hasKatex() {
    return (
      typeof katex !== "undefined" &&
      katex &&
      typeof katex.renderToString === "function"
    );
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function polishExpBody(ex) {
    var t = String(ex || "").replace(/\s+/g, "");
    // Prefer i·n·x so factors read separately (manabitimes-friendly)
    if (/^inx$/i.test(t) || t === "\\mathrm{i}nx") return "i\\cdot n\\cdot x";
    if (t === "i\\theta" || t === "iθ") return "i\\theta";
    if (t === "ix\\xi" || t === "ixξ") return "i\\cdot x\\cdot\\xi";
    t = t.replace(/inx/g, "i\\cdot n\\cdot x");
    t = t.replace(/iθ/g, "i\\theta");
    t = t.replace(/iπ/g, "i\\pi");
    return t;
  }

  function normalizeInfty(b) {
    var t = String(b || "");
    if (t === "∞" || t === "+∞" || t === "+\\infty") return "+\\infty";
    if (t === "-∞" || t === "-\\infty") return "-\\infty";
    if (t === "\\infty") return "+\\infty";
    return t;
  }

  /** Cramped → spaced manabitimes-style exponents / products */
  function polishLatex(latex) {
    var s = String(latex == null ? "" : latex);
    s = s.replace(/e\^\{\\mathrm\{i\}nx\}/g, "e^{i\\cdot n\\cdot x}");
    s = s.replace(/e\^\{\\mathrm\{i\} n x\}/g, "e^{i\\cdot n\\cdot x}");
    s = s.replace(/e\^\{i n x\}/g, "e^{i\\cdot n\\cdot x}");
    s = s.replace(/e\^\{inx\}/g, "e^{i\\cdot n\\cdot x}");
    s = s.replace(/e\^\{i\\theta\}/g, "e^{i\\theta}");
    s = s.replace(/e\^\{iθ\}/g, "e^{i\\theta}");
    s = s.replace(/e\^\{i\\pi\}/g, "e^{i\\pi}");
    s = s.replace(
      /\(e\^\{i(\\cdot)?\s*n(\\cdot)?\s*x\}\)'/g,
      "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}e^{i\\cdot n\\cdot x}"
    );
    s = s.replace(
      /\(e\^\{inx\}\)'/g,
      "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}e^{i\\cdot n\\cdot x}"
    );
    s = s.replace(/=\s*in\s*e\^/g, "= i\\cdot n\\, e^");
    s = s.replace(/=\s*i\s*n\s*e\^/g, "= i\\cdot n\\, e^");
    s = s.replace(/=\s*\\mathrm\{i\}\s*n\s*e\^/g, "= i\\cdot n\\, e^");
    s = s.replace(/i\\,n\\,/g, "i\\cdot n\\,");
    s = s.replace(/\\mathrm\{i\}/g, "i");
    if (
      s.indexOf("\\displaystyle") < 0 &&
      /\\sum|\\int|\\frac|\\dfrac|\\lim/.test(s)
    ) {
      s = "\\displaystyle " + s;
    }
    return s;
  }

  function htmlToLatex(html) {
    var s = String(html == null ? "" : html);
    if (/\\[a-zA-Z]+/.test(s) && s.indexOf("<") < 0) {
      return s;
    }
    s = s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"');
    s = s.replace(
      /<span class="math-sqrt"[^>]*>[\s\S]*?<span class="math-sqrt-sym">√<\/span><span class="math-sqrt-body">([\s\S]*?)<\/span><\/span>/gi,
      "\\sqrt{$1}"
    );
    s = s.replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, "_{$1}");
    s = s.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, "^{$1}");
    s = s.replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "$1");
    s = s.replace(/<[^>]+>/g, "");
    s = s
      .replace(/Σ|∑/g, "\\sum")
      .replace(/∫/g, "\\int")
      .replace(/π/g, "\\pi")
      .replace(/∞/g, "\\infty")
      .replace(/θ/g, "\\theta")
      .replace(/φ|ϕ/g, "\\phi")
      .replace(/ω/g, "\\omega")
      .replace(/ξ/g, "\\xi")
      .replace(/·/g, "\\cdot ")
      .replace(/×/g, "\\times ")
      .replace(/−/g, "-")
      .replace(/＝/g, "=")
      .replace(/≠/g, "\\neq ")
      .replace(/≤/g, "\\leq ")
      .replace(/≥/g, "\\geq ")
      .replace(/≈/g, "\\approx ")
      .replace(/√/g, "\\sqrt");
    var subMap = {
      "₀": "0",
      "₁": "1",
      "₂": "2",
      "₃": "3",
      "₄": "4",
      "₅": "5",
      "₆": "6",
      "₇": "7",
      "₈": "8",
      "₉": "9",
      "ₙ": "n",
      "ₘ": "m",
      "ₐ": "a",
      "ₑ": "e",
      "ₓ": "x",
      "ᵢ": "i",
      "₊": "+",
      "₋": "-",
      "₍": "(",
      "₎": ")"
    };
    var supMap = {
      "⁰": "0",
      "¹": "1",
      "²": "2",
      "³": "3",
      "⁴": "4",
      "⁵": "5",
      "⁶": "6",
      "⁷": "7",
      "⁸": "8",
      "⁹": "9",
      "ⁿ": "n",
      "ⁱ": "i",
      "ˣ": "x",
      "ᵃ": "a",
      "ᵇ": "b",
      "ᵉ": "e",
      "ᵏ": "k",
      "ᵐ": "m",
      "ᵗ": "t",
      "⁺": "+",
      "⁻": "-",
      "⁽": "(",
      "⁾": ")"
    };
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉ₙₘₐₑₓᵢ₊₋₍₎]+/g, function (run) {
      var body = "";
      for (var i = 0; i < run.length; i++)
        body += subMap[run.charAt(i)] || run.charAt(i);
      return "_{" + body + "}";
    });
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱˣᵃᵇᵉᵏᵐᵗ⁺⁻⁽⁾]+/g, function (run) {
      var body = "";
      for (var i = 0; i < run.length; i++)
        body += supMap[run.charAt(i)] || run.charAt(i);
      return "^{" + body + "}";
    });
    s = s
      .replace(/\bcos\b/g, "\\cos")
      .replace(/\bsin\b/g, "\\sin")
      .replace(/\btan\b/g, "\\tan")
      .replace(/\blim\b/g, "\\lim");
    s = s.replace(/e\^([a-zA-Z0-9+\-\\{}]+)/g, "e^{$1}");
    return s;
  }

  function katexSafe(latex, display) {
    if (!hasKatex()) return null;
    try {
      return katex.renderToString(polishLatex(latex), {
        throwOnError: false,
        displayMode: !!display,
        strict: "ignore",
        trust: false,
        output: "html",
        fleqn: false
      });
    } catch (e) {
      return null;
    }
  }

  /** Board formula — displayMode (∑/∫ limits above/below), centered like manabitimes */
  function renderFormulaHtml(formulaHtml) {
    if (!formulaHtml) return "";
    if (!hasKatex()) {
      return '<div class="formula-box">' + esc(formulaHtml) + "</div>";
    }
    var raw = String(formulaHtml);
    var latex = htmlToLatex(raw);
    latex = latex.replace(/([\u3040-\u30ff\u4e00-\u9fff]+)/g, function (m) {
      return "\\text{" + m + "}";
    });
    latex = latex.replace(/\bVS\b/g, "\\quad\\text{VS}\\quad");
    latex = polishLatex(latex);
    var out = katexSafe(latex, true);
    if (out) {
      return (
        '<div class="formula-box formula-katex formula-display">' +
        out +
        "</div>"
      );
    }
    return (
      '<div class="formula-box formula-katex formula-display">' +
      esc(raw) +
      "</div>"
    );
  }

  /** Inline JP + math */
  function renderInline(text) {
    if (text == null || text === "") return "";
    var s = String(text);
    if (!hasKatex()) return esc(s);

    var chunks = [];
    function pushMath(latex) {
      var id = chunks.length;
      var html = katexSafe(latex, false);
      chunks.push(html || esc(latex));
      return "\uE000" + id + "\uE001";
    }

    s = s.replace(/√\(([^)]+)\)/g, function (m, body) {
      return pushMath("\\sqrt{" + htmlToLatex(body) + "}");
    });
    s = s.replace(/∫([₀-₉ₙₘ]*)([⁰-⁹ⁿ]*)(π?)/g, function (m, lo, up, pi) {
      var latex = "\\displaystyle\\int";
      if (lo || up || pi) {
        var low = htmlToLatex(lo || "0");
        var high = "2\\pi";
        if (up || pi) {
          high = htmlToLatex((up || "") + (pi || ""));
          if (!up && pi) high = "2\\pi";
        }
        latex += "_{" + low + "}^{" + high + "}";
      }
      return pushMath(latex);
    });
    s = s.replace(
      /\(e\^\{([^}]+)\}\)'\s*=\s*([^\s。．、,]+)\s*e\^\{([^}]+)\}/g,
      function (m, ex1, coef, ex2) {
        var c = String(coef);
        if (c === "in" || c === "inn") c = "i n";
        return pushMath(
          "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}e^{" +
            polishExpBody(ex1) +
            "}=" +
            c +
            " e^{" +
            polishExpBody(ex2) +
            "}"
        );
      }
    );
    s = s.replace(/\(e\^\{([^}]+)\}\)'/g, function (m, ex) {
      return pushMath(
        "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}e^{" + polishExpBody(ex) + "}"
      );
    });
    s = s.replace(/e\^\{([^}]+)\}/g, function (m, ex) {
      return pushMath("e^{" + polishExpBody(ex) + "}");
    });
    s = s.replace(/e\^([A-Za-z0-9+\-θπ]+)/g, function (m, ex) {
      return pushMath("e^{" + polishExpBody(ex) + "}");
    });
    s = s.replace(/[∑Σ]_\{([^}]+)\}\^\{([^}]+)\}/g, function (m, a, b) {
      return pushMath(
        "\\displaystyle\\sum_{" + a + "}^{" + normalizeInfty(b) + "}"
      );
    });
    s = s.replace(/[∑Σ]_\{([^}]+)\}\^([A-Za-z0-9∞\\+\-]+)/g, function (
      m,
      a,
      b
    ) {
      return pushMath(
        "\\displaystyle\\sum_{" + a + "}^{" + normalizeInfty(b) + "}"
      );
    });
    s = s.replace(/\b([a-zA-Z])_([a-zA-Z0-9]+)\b/g, function (m, a, b) {
      return pushMath(a + "_{" + b + "}");
    });
    s = s.replace(/\b([a-zA-Z])([ₙₘₐₓᵢ]+)\b/g, function (m, a, sub) {
      return pushMath(a + htmlToLatex(sub));
    });

    var out = esc(s);
    out = out.replace(/\uE000(\d+)\uE001/g, function (m, id) {
      return chunks[parseInt(id, 10)] || "";
    });
    return out;
  }

  function formatMathHtml(s) {
    if (!s) return "";
    if (!hasKatex()) return String(s);
    var latex = polishLatex(
      htmlToLatex(s).replace(/([\u3040-\u30ff\u4e00-\u9fff]+)/g, function (m) {
        return "\\text{" + m + "}";
      })
    );
    return katexSafe(latex, false) || String(s);
  }

  function enhanceRoot() {}

  FT.mathTex = {
    hasKatex: hasKatex,
    htmlToLatex: htmlToLatex,
    polishLatex: polishLatex,
    renderFormulaHtml: renderFormulaHtml,
    renderInline: renderInline,
    formatMathHtml: formatMathHtml,
    enhanceRoot: enhanceRoot,
    katexSafe: katexSafe
  };

  FT.formatMathHtml = formatMathHtml;
  FT.escMath = renderInline;
})(window.FT = window.FT || {});
