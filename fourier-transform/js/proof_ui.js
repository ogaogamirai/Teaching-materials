/* global FT */
(function (FT) {
  var FAIL_FORCE_AT = 2;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var SUB_MAP = {
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
    "ₓ": "x"
  };
  var SUP_MAP = {
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
    "ⁿ": "n"
  };

  function mapChars(str, table) {
    if (!str) return "";
    var out = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      out += table[ch] != null ? table[ch] : ch;
    }
    return out;
  }

  /** Format √(...) in already-safe or HTML-ish text (does not escape). */
  function formatRoot(s) {
    if (!s) return "";
    var str = String(s);
    if (str.indexOf("√") < 0) return str;
    // √(body) | √{body} | √token — stop before HTML tag / CJK / punctuation
    return str.replace(
      /√(?:\(([^)]+)\)|\{([^}]+)\}|([A-Za-z0-9_+\-^=²³⁴ⁿ₀-₉\s\.]+))/g,
      function (m, p1, p2, p3) {
        var body = p1 || p2 || p3 || "";
        body = String(body).replace(/\s+$/, "");
        if (!body) return m;
        return (
          '<span class="math-sqrt"><span class="math-sqrt-sym">√</span><span class="math-sqrt-body">' +
          body +
          "</span></span>"
        );
      }
    );
  }

  /**
   * Format ∫ with unicode limits like ∫₀²π (plain-text explanations).
   * Hybrid HTML (∫₀<sup>2π</sup>) is left untouched so limits are not orphaned.
   * Bare ∫ becomes a styled symbol only (no invented 0..2π).
   */
  function formatIntegral(s) {
    if (!s) return "";
    var str = String(s);
    if (str.indexOf("∫") < 0) return str;
    return str.replace(/∫([₀₁₂₃₄₅₆₇₈₉ₙₘₐₓ]*)([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]*)(π?)/g, function (
      m,
      lowU,
      upU,
      pi,
      offset,
      full
    ) {
      var end = offset + m.length;
      // e.g. ∫₀<sup>2π</sup> — do not partially consume unicode sub
      if (end < full.length && full.charAt(end) === "<") {
        return m;
      }
      var hasLim = !!(lowU || upU || pi);
      if (!hasLim) {
        return '<span class="math-integral"><span class="int-sym">∫</span></span>';
      }
      var lower = mapChars(lowU, SUB_MAP) || "0";
      var upper = mapChars(upU, SUP_MAP) + (pi || "");
      if (!upper) upper = "2π";
      return (
        '<span class="math-integral"><span class="int-sym">∫</span>' +
        '<span class="int-limits"><span class="upper">' +
        upper +
        '</span><span class="lower">' +
        lower +
        "</span></span></span>"
      );
    });
  }

  /*
   * FUNDAMENTAL FIX (2026-07-24): Do NOT rely on HTML <sup>/<sub>.
   * Japanese UI fonts on Edge/Chromium often render them almost flat —
   * captains see "einx" / "cn" even when DOM has correct tags.
   * Always emit Unicode superscript/subscript code points.
   */
  var SUPER_MAP = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    "−": "⁻",
    "=": "⁼",
    "(": "⁽",
    ")": "⁾",
    a: "ᵃ",
    b: "ᵇ",
    c: "ᶜ",
    d: "ᵈ",
    e: "ᵉ",
    f: "ᶠ",
    g: "ᵍ",
    h: "ʰ",
    i: "ⁱ",
    j: "ʲ",
    k: "ᵏ",
    l: "ˡ",
    m: "ᵐ",
    n: "ⁿ",
    o: "ᵒ",
    p: "ᵖ",
    r: "ʳ",
    s: "ˢ",
    t: "ᵗ",
    u: "ᵘ",
    v: "ᵛ",
    w: "ʷ",
    x: "ˣ",
    y: "ʸ",
    z: "ᶻ",
    A: "ᴬ",
    B: "ᴮ",
    D: "ᴰ",
    E: "ᴱ",
    G: "ᴳ",
    H: "ᴴ",
    I: "ᴵ",
    J: "ᴶ",
    K: "ᴷ",
    L: "ᴸ",
    M: "ᴹ",
    N: "ᴺ",
    O: "ᴼ",
    P: "ᴾ",
    R: "ᴿ",
    T: "ᵀ",
    U: "ᵁ",
    V: "ⱽ",
    W: "ᵂ",
    θ: "ᶿ",
    "∞": "∞"
  };
  var SUB_U_MAP = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    "+": "₊",
    "-": "₋",
    "−": "₋",
    "=": "₌",
    "(": "₍",
    ")": "₎",
    a: "ₐ",
    e: "ₑ",
    h: "ₕ",
    i: "ᵢ",
    j: "ⱼ",
    k: "ₖ",
    l: "ₗ",
    m: "ₘ",
    n: "ₙ",
    o: "ₒ",
    p: "ₚ",
    r: "ᵣ",
    s: "ₛ",
    t: "ₜ",
    u: "ᵤ",
    v: "ᵥ",
    x: "ₓ",
    "∞": "∞"
  };

  function mapRun(str, table) {
    if (!str) return "";
    var out = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (table[ch] != null) out += table[ch];
      else if (table[ch.toLowerCase()] != null && /[A-Z]/.test(ch))
        out += table[ch.toLowerCase()];
      else out += ch; // keep unknown (θ, π, commas…) as-is
    }
    return out;
  }
  function toSuper(s) {
    return mapRun(String(s).replace(/\s+/g, ""), SUPER_MAP);
  }
  function toSub(s) {
    return mapRun(String(s).replace(/\s+/g, ""), SUB_U_MAP);
  }

  /** Turn existing <sup>/<sub> HTML into unicode (root cause of "flat" display). */
  function htmlScriptsToUnicode(s) {
    if (!s) return "";
    var str = String(s);
    if (str.indexOf("<") < 0) return str;
    str = str.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, function (m, inner) {
      // strip nested tags inside sup
      var plain = String(inner).replace(/<[^>]+>/g, "");
      return toSuper(plain);
    });
    str = str.replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, function (m, inner) {
      var plain = String(inner).replace(/<[^>]+>/g, "");
      return toSub(plain);
    });
    return str;
  }

  /**
   * TeX-like ^{}/_{} → unicode super/sub (not HTML tags).
   */
  function formatTexScripts(s) {
    if (!s) return "";
    var str = String(s);
    if (str.indexOf("^") < 0 && str.indexOf("_") < 0) return str;

    str = str.replace(
      /([^\s\\<{])_\{([^}]+)\}\^\{([^}]+)\}/g,
      function (m, base, low, up) {
        return base + toSub(low) + toSuper(up);
      }
    );
    str = str.replace(
      /([^\s\\<{])_\{([^}]+)\}\^([A-Za-z0-9+\-πθφ∞KNnm]+)/g,
      function (m, base, low, up) {
        return base + toSub(low) + toSuper(up);
      }
    );
    str = str.replace(/([^\s\\<{])\^\{([^}]+)\}/g, function (m, base, up) {
      return base + toSuper(up);
    });
    str = str.replace(/([^\s\\<{])_\{([^}]+)\}/g, function (m, base, low) {
      return base + toSub(low);
    });
    str = str.replace(
      /([A-Za-z0-9πθφωαβγλμσΣ∑∏])\^([A-Za-z0-9+\-πθφ∞]+)/g,
      function (m, base, up) {
        return base + toSuper(up);
      }
    );
    str = str.replace(
      /(^|[^\/\w])([A-Za-z])_([A-Za-z0-9ₙₘ]{1,6})\b/g,
      function (m, pre, base, low) {
        return pre + base + toSub(low);
      }
    );
    return str;
  }

  /** Trusted HTML or plain math → display string (unicode scripts + √/∫). */
  function formatMathHtml(s) {
    var t = String(s == null ? "" : s);
    t = htmlScriptsToUnicode(t);
    t = formatTexScripts(t);
    t = formatRoot(t);
    t = formatIntegral(t);
    return t;
  }

  /** Plain text → escape HTML entities, then unicode math decorate. */
  function escMath(s) {
    return formatMathHtml(esc(s));
  }

  function getScript(nodeId) {
    const root = FT.DATA_PROOF;
    if (!root || !root.node_index) return null;
    const id = root.node_index[nodeId];
    return id && root.scripts ? root.scripts[id] : null;
  }

  function resolveMode(mastery) {
    const m = (mastery && mastery.mode) || "deep";
    if (m === "sprint" || m === "teach" || m === "deep") return m;
    return "deep";
  }

  function ensureMaps(mastery) {
    if (!mastery) return;
    if (!mastery.proofPassed) mastery.proofPassed = {};
    if (!mastery.proofFailStreak) mastery.proofFailStreak = {};
    if (!mastery.proofSkipped) mastery.proofSkipped = {};
    if (!mastery.proofGeoForced) mastery.proofGeoForced = {};
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function destroyGeo(ctl) {
    if (!ctl) return;
    if (typeof ctl === "function") {
      try {
        ctl();
      } catch (e) {}
      return;
    }
    if (typeof ctl.destroy === "function") {
      try {
        ctl.destroy();
      } catch (e) {}
    }
  }

  function mountProof(host, nodeId, mastery, onPuzzlePass) {
    const script = getScript(nodeId);
    if (!host || !script) {
      if (host) host.innerHTML = "";
      return { destroy: function () {} };
    }

    ensureMaps(mastery);
    let morphI = 0;
    let geoCtl = null;
    let morphGuide = false;
    const mode = resolveMode(mastery);
    const sprint = mode === "sprint";
    const teach = mode === "teach";
    const order = script.puzzle_order || [];
    let pool = shuffle(script.puzzle_cards || []);
    let built = [];
    const sid = script.id;
    const passed = !!(mastery && mastery.proofPassed && mastery.proofPassed[sid]);
    const skipped = !!(mastery && mastery.proofSkipped && mastery.proofSkipped[sid]);
    let failStreak =
      (mastery && mastery.proofFailStreak && mastery.proofFailStreak[sid]) || 0;

    const storyInner = (script.story_steps || [])
      .map(function (s, i) {
        return (
          '<div class="story-step">' +
          '<div class="step-label">ステップ ' +
          (i + 1) +
          "</div>" +
          "<strong>" +
          escMath(s.title) +
          "</strong>" +
          "<p>" +
          escMath(s.body) +
          "</p></div>"
        );
      })
      .join("");

    const dots = (script.morph_steps || [])
      .map(function (_, i) {
        return '<span class="morph-dot" data-dot="' + i + '"></span>';
      })
      .join("");

    const hasGeoDemo =
      script.geometry &&
      script.geometry.demo &&
      FT.geometryProof &&
      FT.geometryProof.has(script.geometry.demo);

    // Canvas is always outside closed <details> so it paints and stays visible.
    const geoBeatsList =
      script.geometry && script.geometry.beats && script.geometry.beats.length
        ? '<ol class="guide-list geo-beats">' +
          script.geometry.beats
            .map(function (b) {
              return "<li>" + escMath(b) + "</li>";
            })
            .join("") +
          "</ol>"
        : "";

    const svgImgTag =
      script.geometry && script.geometry.svg_image
        ? '<div class="geo-svg-host" style="text-align:center;margin:12px auto;max-width:520px;"><img src="' +
          esc(script.geometry.svg_image) +
          '" alt="図解" style="width:100%;max-width:520px;height:auto;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,0.35);" /></div>'
        : "";

    const geoBlock = script.geometry
      ? '<div class="geo-box" id="geo-fold">' +
        '<p class="kv"><strong>図で先に納得</strong> — ' +
        escMath(script.geometry.caption || "") +
        "</p>" +
        svgImgTag +
        (hasGeoDemo
          ? '<div class="geo-proof-host" id="geo-proof-host"></div>'
          : "") +
        geoBeatsList +
        "</div>"
      : "";

    const storyBlock = storyInner
      ? sprint
        ? '<details class="proof-fold story-box" id="story-fold"><summary>道のり（読むだけでもOK）</summary>' +
          storyInner +
          "</details>"
        : '<div class="story-box" id="story-fold"><p class="kv"><strong>道のり（読むだけでもOK）</strong></p>' +
          storyInner +
          "</div>"
      : "";

    const morphInner =
      '<p class="kv"><strong>変形を追う</strong> — 「次へ」で式がどう育つか見てください</p>' +
      '<p class="note-warn hidden" id="morph-guide-note">適応ガイド: 1歩ずつ「次へ」で追ってから、もう一度パズルへ。</p>' +
      '<div class="morph-track">' +
      dots +
      "</div>" +
      '<div class="formula-box morph-step" id="morph-view"></div>' +
      '<div class="morph-change" id="morph-change"></div>' +
      '<p class="read-aloud" id="morph-say"></p>' +
      '<div class="row">' +
      '<button type="button" class="btn" id="morph-prev">← 前</button>' +
      '<button type="button" class="btn btn-primary" id="morph-next">次へ →</button>' +
      '<span class="kv" id="morph-idx"></span></div>';

    const morphBlock = sprint
      ? '<details class="proof-fold morph-box" id="morph-fold"><summary>変形を追う（任意）</summary>' +
        morphInner +
        "</details>"
      : '<div class="morph-box" id="morph-fold">' + morphInner + "</div>";

    const modeLabel =
      mode === "sprint"
        ? "sprint · 一言とパズル中心"
        : mode === "teach"
          ? "teach · 説明フル展開"
          : "deep · 標準";

    const skipBanner =
      skipped && passed
        ? '<div class="adapt-banner adapt-skip" id="skip-banner">' +
          "<strong>既習スキップ中</strong> — この導出は以前クリア済みです。" +
          ' <button type="button" class="btn btn-ghost" id="btn-proof-unskip">導出を開く</button>' +
          "</div>"
        : "";

    const skipActions =
      passed && !skipped
        ? '<div class="row adapt-skip-actions">' +
          '<button type="button" class="btn" id="btn-proof-skip">既習として折りたたむ</button>' +
          '<span class="muted">クリア済みの導出をコンパクトにします（中身は残せます）</span></div>'
        : "";

    host.innerHTML =
      '<div class="proof-root mode-' +
      esc(mode) +
      (skipped ? " proof-skipped" : "") +
      '" data-proof="' +
      esc(sid) +
      '" data-mode="' +
      esc(mode) +
      '">' +
      '<div class="proof-head-row">' +
      '<h2 class="proof-title">' +
      esc(script.title || "式の導出") +
      "</h2>" +
      '<span class="mode-pill mode-pill-' +
      esc(mode) +
      '">' +
      esc(modeLabel) +
      "</span></div>" +
      skipBanner +
      '<div class="adapt-banner adapt-force hidden" id="adapt-banner"></div>' +
      '<div class="proof-body" id="proof-body">' +
      '<div class="intuition-line">' +
      '<span class="il-badge">まず一言</span> ' +
      escMath(script.intuition_1line) +
      "</div>" +
      (sprint
        ? ""
        : '<p class="kv why-need"><strong>この式が要る理由:</strong> ' +
          escMath(script.why_needed) +
          "</p>") +
      (script.bridge_from && script.bridge_from.length && !sprint
        ? '<p class="bridge-line"><strong>最短ブリッジ（直前）:</strong> ' +
          esc(script.bridge_from.join(" → ")) +
          " → いまここ</p>"
        : "") +
      (FT.readings
        ? FT.readings.formulaWithRead(
            formatMathHtml(script.formula_html || ""),
            script.formula_read || null
          )
        : '<div class="formula-box">' +
          formatMathHtml(script.formula_html || "") +
          "</div>") +
      (FT.readings
        ? FT.readings.renderChips(script.reading_keys || null)
        : "") +
      geoBlock +
      storyBlock +
      morphBlock +
      '<details class="proof-full"' +
      (teach ? " open" : "") +
      "><summary>もっとくわしく読む（説明は削っていません）</summary>" +
      '<div class="lesson-block">' +
      (script.why_needed && sprint
        ? "<p><strong>要る理由:</strong> " + escMath(script.why_needed) + "</p>"
        : "") +
      (script.bridge_from && script.bridge_from.length && sprint
        ? "<p><strong>ブリッジ:</strong> " +
          esc(script.bridge_from.join(" → ")) +
          " → いま</p>"
        : "") +
      (script.full_explain || [])
        .map(function (p) {
          return "<p>" + escMath(p) + "</p>";
        })
        .join("") +
      "</div></details>" +
      '<div class="puzzle-box">' +
      '<p class="kv"><strong>自分で並べる</strong> — カードを正しい順番にタップ</p>' +
      (passed
        ? '<p class="takeaway">この導出はクリア済みです。復習にも使えます。</p>'
        : sprint
          ? '<p class="muted">迷ったら上の「道のり／変形／図」を開いてから。</p>'
          : '<p class="muted">上の「道のり」や「変形」を見てから挑戦すると簡単です。</p>') +
      '<p class="kv">連続まちがい: <strong id="fail-streak-label">' +
      failStreak +
      "</strong>（" +
      FAIL_FORCE_AT +
      "回で図を自動再生）</p>" +
      '<p class="kv">あなたの並び:</p>' +
      '<div class="puzzle-built" id="puzzle-built"></div>' +
      '<p class="kv">残りのカード:</p>' +
      '<div class="puzzle-pool chips" id="puzzle-pool"></div>' +
      '<div class="row puzzle-actions">' +
      '<button type="button" class="btn" id="puzzle-undo">一つ戻す</button>' +
      '<button type="button" class="btn" id="puzzle-reset">やりなおし</button>' +
      "</div>" +
      '<div id="puzzle-msg" class="kv"></div></div>' +
      (script.common_error
        ? '<p class="note-warn">よくあるまちがい: ' +
          escMath(script.common_error) +
          "</p>"
        : "") +
      (FT.readings ? FT.readings.renderGlossary(teach) : "") +
      '<p class="takeaway">人に話す用: ' +
      escMath(script.teach_line || "") +
      "</p>" +
      skipActions +
      "</div></div>";

    const rootEl = host.querySelector(".proof-root");
    const bodyEl = host.querySelector("#proof-body");
    const adaptBanner = host.querySelector("#adapt-banner");
    const streakLabel = host.querySelector("#fail-streak-label");
    const morphGuideNote = host.querySelector("#morph-guide-note");
    const morphView = host.querySelector("#morph-view");
    const morphSay = host.querySelector("#morph-say");
    const morphChange = host.querySelector("#morph-change");
    const morphIdx = host.querySelector("#morph-idx");
    const steps = script.morph_steps || [];
    const btnNext = host.querySelector("#morph-next");
    const btnPrev = host.querySelector("#morph-prev");

    function applySkipUi() {
      const isSkip = !!(mastery && mastery.proofSkipped && mastery.proofSkipped[sid]);
      if (rootEl) rootEl.classList.toggle("proof-skipped", isSkip);
      if (bodyEl) bodyEl.classList.toggle("hidden", isSkip);
      let ban = host.querySelector("#skip-banner");
      if (isSkip) {
        if (!ban) {
          ban = document.createElement("div");
          ban.id = "skip-banner";
          ban.className = "adapt-banner adapt-skip";
          ban.innerHTML =
            "<strong>既習スキップ中</strong> — この導出は以前クリア済みです。" +
            ' <button type="button" class="btn btn-ghost" id="btn-proof-unskip">導出を開く</button>';
          if (rootEl && bodyEl) rootEl.insertBefore(ban, bodyEl);
        }
        const un = host.querySelector("#btn-proof-unskip");
        if (un) {
          un.onclick = function () {
            mastery.proofSkipped[sid] = false;
            if (typeof FT.mastery.saveMastery === "function") {
              FT.mastery.saveMastery(mastery);
            }
            applySkipUi();
          };
        }
      } else if (ban && ban.parentNode) {
        ban.parentNode.removeChild(ban);
      }
    }

    const btnSkip = host.querySelector("#btn-proof-skip");
    if (btnSkip) {
      btnSkip.addEventListener("click", function () {
        mastery.proofSkipped[sid] = true;
        if (typeof FT.mastery.saveMastery === "function") {
          FT.mastery.saveMastery(mastery);
        }
        applySkipUi();
      });
    }
    applySkipUi();

    function openFold(sel) {
      const el = host.querySelector(sel);
      if (el && el.tagName === "DETAILS") el.open = true;
    }

    function setMorphGuide(on) {
      morphGuide = !!on;
      if (morphGuideNote) morphGuideNote.classList.toggle("hidden", !morphGuide);
      if (btnNext) {
        btnNext.classList.toggle("btn-primary", true);
        btnNext.textContent = morphGuide ? "次の1歩 →" : "次へ →";
      }
    }

    function renderMorph() {
      if (!morphView) return;
      host.querySelectorAll("[data-dot]").forEach(function (d) {
        const i = parseInt(d.getAttribute("data-dot"), 10);
        d.classList.toggle("on", i === morphI);
        d.classList.toggle("done", i < morphI);
      });
      if (!steps.length) {
        morphView.innerHTML = formatMathHtml(script.formula_html || "");
        if (morphSay) morphSay.innerHTML = "";
        if (morphChange) morphChange.innerHTML = "";
        if (morphIdx) morphIdx.textContent = "";
        return;
      }
      if (morphI < 0) morphI = 0;
      if (morphI >= steps.length) morphI = steps.length - 1;
      const st = steps[morphI];
      morphView.innerHTML =
        '<span class="step-label">' +
        (morphI + 1) +
        " / " +
        steps.length +
        "</span><br>" +
        formatMathHtml(st.html || "");
      if (morphSay) {
        morphSay.innerHTML = st.say ? "ひとこと: " + escMath(st.say) : "";
      }
      if (morphChange) {
        morphChange.innerHTML = st.change
          ? "<strong>いま変わったこと</strong><br>" + escMath(st.change)
          : "";
      }
      if (morphIdx) {
        morphIdx.textContent =
          morphI === steps.length - 1
            ? morphGuide
              ? "最後まで追いました。パズルへ戻ろう"
              : "完成！"
            : morphGuide
              ? "1歩ずつ進みます"
              : "まだ続きがあります";
      }
    }

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        if (morphI < steps.length - 1) morphI++;
        renderMorph();
      });
    }
    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        if (morphI > 0) morphI--;
        renderMorph();
      });
    }
    renderMorph();

    const geoHost = host.querySelector("#geo-proof-host");
    if (
      geoHost &&
      script.geometry &&
      script.geometry.demo &&
      FT.geometryProof &&
      FT.geometryProof.mount
    ) {
      try {
        geoCtl = FT.geometryProof.mount(geoHost, script.geometry.demo);
      } catch (err) {
        geoHost.innerHTML =
          '<p class="note-warn">図の読み込みに失敗しました: ' +
          esc(err && err.message ? err.message : err) +
          "</p>";
        geoCtl = null;
      }
      // paint after layout (file:// / first paint)
      if (geoCtl && typeof geoCtl.go === "function") {
        requestAnimationFrame(function () {
          try {
            geoCtl.go(0);
          } catch (e2) {}
        });
      }
    } else if (script.geometry && script.geometry.demo && !FT.geometryProof) {
      const box = host.querySelector("#geo-fold");
      if (box) {
        const warn = document.createElement("p");
        warn.className = "note-warn";
        warn.textContent =
          "図モジュール(geometry_proof.js)が読み込まれていません。ページを再読み込みしてください。";
        box.appendChild(warn);
      }
    }

    function forceRemediation(reason) {
      openFold("#geo-fold");
      openFold("#morph-fold");
      openFold("#story-fold");
      morphI = 0;
      setMorphGuide(true);
      renderMorph();
      if (geoCtl && typeof geoCtl.forcePlay === "function") {
        geoCtl.forcePlay();
      }
      if (mastery) {
        mastery.proofGeoForced[sid] = true;
        if (typeof FT.mastery.saveMastery === "function") {
          FT.mastery.saveMastery(mastery);
        }
      }
      if (adaptBanner) {
        adaptBanner.classList.remove("hidden");
        adaptBanner.innerHTML =
          "<strong>適応サポート</strong> — " +
          esc(reason || "パズルが連続で違う並びでした。") +
          " 図を最初から再生し、変形を1歩ずつ追えるようにしました。見てからやりなおしへ。";
      }
      const geoBox = host.querySelector("#geo-fold") || host.querySelector(".geo-box");
      if (geoBox && geoBox.scrollIntoView) {
        try {
          geoBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (e) {
          geoBox.scrollIntoView(true);
        }
      }
    }

    const poolEl = host.querySelector("#puzzle-pool");
    const builtEl = host.querySelector("#puzzle-built");
    const msgEl = host.querySelector("#puzzle-msg");

    function cardById(id) {
      const cards = script.puzzle_cards || [];
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].id === id) return cards[i];
      }
      return null;
    }

    function renderPuzzle() {
      if (!built.length) {
        builtEl.innerHTML =
          '<p class="muted">（まだ空です。下のカードを順に押してください）</p>';
      } else {
        builtEl.innerHTML = built
          .map(function (id) {
            const c = cardById(id);
            return (
              '<div class="puzzle-slot">' +
              escMath(c ? c.text : id) +
              "</div>"
            );
          })
          .join("");
      }
      poolEl.innerHTML = pool
        .map(function (c) {
          return (
            '<button type="button" class="chip puzzle-card" data-cid="' +
            esc(c.id) +
            '">' +
            escMath(c.text) +
            "</button>"
          );
        })
        .join("");
    }

    function updateStreakLabel() {
      if (streakLabel) streakLabel.textContent = String(failStreak);
    }

    function checkPuzzle() {
      if (built.length !== order.length) return;
      let ok = true;
      for (let i = 0; i < order.length; i++) {
        if (built[i] !== order[i]) ok = false;
      }
      if (ok) {
        failStreak = 0;
        if (mastery) {
          mastery.proofFailStreak[sid] = 0;
          if (typeof FT.mastery.saveMastery === "function") {
            FT.mastery.saveMastery(mastery);
          }
        }
        updateStreakLabel();
        setMorphGuide(false);
        if (adaptBanner) adaptBanner.classList.add("hidden");
        msgEl.innerHTML =
          '<p class="takeaway">導出クリア！ 式の意味を、自分の言葉でもう一度言ってみましょう。</p>';
        if (onPuzzlePass) onPuzzlePass(sid);
        // offer skip after pass without full remount
        if (!host.querySelector("#btn-proof-skip") && bodyEl) {
          const row = document.createElement("div");
          row.className = "row adapt-skip-actions";
          row.innerHTML =
            '<button type="button" class="btn" id="btn-proof-skip">既習として折りたたむ</button>' +
            '<span class="muted">クリア済みの導出をコンパクトにします</span>';
          bodyEl.appendChild(row);
          row.querySelector("#btn-proof-skip").addEventListener("click", function () {
            mastery.proofSkipped[sid] = true;
            if (typeof FT.mastery.saveMastery === "function") {
              FT.mastery.saveMastery(mastery);
            }
            applySkipUi();
          });
        }
      } else {
        failStreak += 1;
        if (mastery) {
          mastery.proofFailStreak[sid] = failStreak;
          if (typeof FT.mastery.saveMastery === "function") {
            FT.mastery.saveMastery(mastery);
          }
        }
        updateStreakLabel();
        msgEl.innerHTML =
          '<div class="feedback bad">順番が違います（連続 ' +
          failStreak +
          " 回）。「やりなおし」のあと、図や変形を見てから再挑戦してください。</div>";
        if (failStreak >= FAIL_FORCE_AT) {
          forceRemediation(
            "パズルが " + failStreak + " 回連続で違う並びでした。"
          );
        }
      }
    }

    poolEl.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-cid]");
      if (!btn) return;
      const cid = btn.getAttribute("data-cid");
      pool = pool.filter(function (c) {
        return c.id !== cid;
      });
      built.push(cid);
      msgEl.textContent = "";
      renderPuzzle();
      checkPuzzle();
    });

    host.querySelector("#puzzle-undo").addEventListener("click", function () {
      if (!built.length) return;
      const id = built.pop();
      const c = cardById(id);
      if (c) pool.push(c);
      msgEl.textContent = "";
      renderPuzzle();
    });
    host.querySelector("#puzzle-reset").addEventListener("click", function () {
      built = [];
      pool = shuffle(script.puzzle_cards || []);
      msgEl.textContent = "";
      renderPuzzle();
    });
    renderPuzzle();

    // re-open remediation if already in fail streak from prior session
    if (!passed && failStreak >= FAIL_FORCE_AT) {
      forceRemediation("前回この導出でつまずいていました。");
    }

    return {
      destroy: function () {
        destroyGeo(geoCtl);
        geoCtl = null;
        host.innerHTML = "";
      },
      scriptId: sid,
      mode: mode,
      forceRemediation: forceRemediation,
    };
  }

  function hasProof(nodeId) {
    return !!getScript(nodeId);
  }

  FT.formatMathHtml = formatMathHtml;
  FT.escMath = escMath;

  FT.proofUI = {
    getScript: getScript,
    mountProof: mountProof,
    hasProof: hasProof,
    resolveMode: resolveMode,
    FAIL_FORCE_AT: FAIL_FORCE_AT,
  };
})(window.FT = window.FT || {});
