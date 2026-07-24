/* global FT, katex */
/**
 * Math via local KaTeX — pure LaTeX in, HTML out.
 * Board formulas must already be LaTeX (no Unicode/HTML dialect).
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

  /** Style-only polish (input is already LaTeX). */
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

  /**
   * Guard: if legacy Unicode/HTML slips in, attempt safe conversion.
   * Prefer pure TeX in data — this is a safety net only.
   */
  function ensureLatex(input) {
    var s = String(input == null ? "" : input);
    if (!s) return "";
    // Already looks like TeX commands and no HTML
    if (/\\[a-zA-Z]+/.test(s) && s.indexOf("<") < 0 && !/[ωφθπαβΣ∫∞√]/.test(s)) {
      return s;
    }
    // HTML tags
    if (s.indexOf("<") >= 0) {
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
    }
    // Fullwidth / CJK punctuation separators
    s = s.replace(/\u3000/g, " ");
    s = s.replace(/／/g, "\\quad");
    s = s.replace(/→/g, "\\to ");
    s = s.replace(/≠/g, "\\neq ");
    s = s.replace(/≤/g, "\\leq ");
    s = s.replace(/≥/g, "\\geq ");
    s = s.replace(/≈/g, "\\approx ");
    s = s.replace(/＝/g, "=");
    s = s.replace(/−/g, "-");
    s = s.replace(/·/g, "\\cdot ");
    s = s.replace(/×/g, "\\times ");
    s = s.replace(/°/g, "^{\\circ}");
    // Greek — ALWAYS brace so ωt → {\omega}t not \omegat
    s = s
      .replace(/α/g, "{\\alpha}")
      .replace(/β/g, "{\\beta}")
      .replace(/γ/g, "{\\gamma}")
      .replace(/δ/g, "{\\delta}")
      .replace(/θ/g, "{\\theta}")
      .replace(/λ/g, "{\\lambda}")
      .replace(/μ/g, "{\\mu}")
      .replace(/ξ/g, "{\\xi}")
      .replace(/π/g, "{\\pi}")
      .replace(/σ/g, "{\\sigma}")
      .replace(/φ|ϕ/g, "{\\phi}")
      .replace(/ω/g, "{\\omega}")
      .replace(/Σ|∑/g, "\\sum")
      .replace(/∫/g, "\\int")
      .replace(/∞/g, "\\infty")
      .replace(/√/g, "\\sqrt");
    // unicode sub/sup runs
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
    // CJK → \text{...}
    s = s.replace(/([\u3040-\u30ff\u4e00-\u9fff\u3001-\u303f]+)/g, function (m) {
      return "\\text{" + m + "}";
    });
    return s;
  }

  function katexSafe(latex, display) {
    if (!hasKatex()) return null;
    try {
      return katex.renderToString(polishLatex(latex), {
        throwOnError: true,
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

  function formulaErrorBox(raw, reason) {
    return (
      '<div class="formula-box formula-error" role="alert">' +
      '<div class="formula-error-label">数式エラー' +
      (reason ? "（" + esc(reason) + "）" : "") +
      "</div>" +
      '<code class="formula-error-src">' +
      esc(raw) +
      "</code></div>"
    );
  }

  /** Board formula — displayMode. Input should be pure LaTeX. */
  function renderFormulaHtml(formulaHtml) {
    if (!formulaHtml) return "";
    var raw = String(formulaHtml);
    if (!hasKatex()) {
      return formulaErrorBox(raw, "KaTeX未読込");
    }
    var latex = ensureLatex(raw);
    latex = polishLatex(latex);
    var out = katexSafe(latex, true);
    if (out && out.indexOf("katex-error") < 0) {
      return (
        '<div class="formula-box formula-katex formula-display">' +
        out +
        "</div>"
      );
    }
    // retry once with throwOnError false to surface message
    try {
      katex.renderToString(latex, {
        throwOnError: true,
        displayMode: true,
        strict: "ignore"
      });
    } catch (e) {
      return formulaErrorBox(raw, e && e.message ? e.message : "compile");
    }
    return formulaErrorBox(raw, "render failed");
  }

  /** Inline JP + math: prefer \\(...\\), else limited patterns */
  function renderInline(text) {
    if (text == null || text === "") return "";
    var s = String(text);
    if (!hasKatex()) return esc(s);

    var chunks = [];
    function pushMath(latex) {
      var id = chunks.length;
      var html = katexSafe(ensureLatex(latex), false);
      chunks.push(html || '<span class="formula-error-inline">' + esc(latex) + "</span>");
      return "\uE000" + id + "\uE001";
    }

    // Explicit delimiters first
    s = s.replace(/\\\(([\s\S]+?)\\\)/g, function (m, body) {
      return pushMath(body);
    });
    s = s.replace(/\$([^\$]+)\$/g, function (m, body) {
      return pushMath(body);
    });

    s = s.replace(/√\(([^)]+)\)/g, function (m, body) {
      return pushMath("\\sqrt{" + ensureLatex(body) + "}");
    });
    s = s.replace(/∫([₀-₉ₙₘ]*)([⁰-⁹ⁿ]*)(π?)/g, function (m, lo, up, pi) {
      var latex = "\\displaystyle\\int";
      if (lo || up || pi) {
        var low = ensureLatex(lo || "0");
        var high = "2\\pi";
        if (up || pi) {
          high = ensureLatex((up || "") + (pi || ""));
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
      return pushMath(a + ensureLatex(sub));
    });

    var out = esc(s);
    out = out.replace(/\uE000(\d+)\uE001/g, function (m, id) {
      return chunks[parseInt(id, 10)] || "";
    });
    return out;
  }

  function formatMathHtml(s) {
    if (!s) return "";
    if (!hasKatex()) return esc(String(s));
    var latex = polishLatex(ensureLatex(s));
    return katexSafe(latex, false) || esc(String(s));
  }

  function enhanceRoot() {}

  FT.mathTex = {
    hasKatex: hasKatex,
    ensureLatex: ensureLatex,
    polishLatex: polishLatex,
    renderFormulaHtml: renderFormulaHtml,
    renderInline: renderInline,
    formatMathHtml: formatMathHtml,
    enhanceRoot: enhanceRoot,
    katexSafe: katexSafe
  };

  FT.formatMathHtml = formatMathHtml;
  FT.escMath = renderInline;
})((window.FT = window.FT || {}));
