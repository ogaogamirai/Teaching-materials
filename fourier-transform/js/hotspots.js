/* global FT */
(function (FT) {
  let activeRoot = null;
  let activeId = null;

  function clearLit(root) {
    if (!root) return;
    root.querySelectorAll(".hs-lit").forEach(function (el) {
      el.classList.remove("hs-lit");
    });
    root.querySelectorAll("[data-hs-btn]").forEach(function (el) {
      el.classList.remove("hs-btn-on");
    });
  }

  function applyHighlight(root, id) {
    if (!root) return;
    activeId = id || null;
    clearLit(root);
    if (!id) {
      const hint = root.querySelector("[data-hs-hint]");
      if (hint) hint.textContent = "式の記号をタップすると、画面の対応が光ります。";
      return;
    }
    root.querySelectorAll("[data-hs]").forEach(function (el) {
      const keys = (el.getAttribute("data-hs") || "").split(/\s+/);
      if (keys.indexOf(id) >= 0) el.classList.add("hs-lit");
    });
    root.querySelectorAll('[data-hs-btn="' + id + '"]').forEach(function (el) {
      el.classList.add("hs-btn-on");
    });
    const item = root.querySelector('[data-hs-item="' + id + '"]');
    const hint = root.querySelector("[data-hs-hint]");
    if (hint && item) {
      hint.textContent = item.getAttribute("data-hint") || "";
    }
    // scroll first lit into view if needed
    const lit = root.querySelector(".hs-lit");
    if (lit && lit.scrollIntoView) {
      try {
        lit.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch (e) {}
    }
  }

  function wireBar(barEl, root, spec) {
    if (!barEl || !spec) {
      if (barEl) barEl.innerHTML = "";
      return;
    }
    const items = spec.items || [];
    barEl.innerHTML =
      '<div class="hs-bar">' +
      '<p class="kv"><strong>式 ↔ 画面</strong>（タップでハイライト）</p>' +
      '<div class="formula-box hs-formula">' +
      (spec.formula_html || "") +
      (spec.formula_read
        ? '<div class="formula-read">よみ: ' +
          String(spec.formula_read).replace(/</g, "&lt;") +
          "</div>"
        : "") +
      "</div>" +
      (FT.readings && spec.reading_keys
        ? FT.readings.renderChips(spec.reading_keys)
        : "") +
      '<div class="hs-chips">' +
      items
        .map(function (it) {
          const read = it.read ? "（" + it.read + "）" : "";
          return (
            '<button type="button" class="chip hs-chip" data-hs-btn="' +
            it.id +
            '" data-hs-item="' +
            it.id +
            '" data-hint="' +
            String(it.hint || "").replace(/"/g, "&quot;") +
            '">' +
            it.label +
            read +
            "</button>"
          );
        })
        .join("") +
      '<button type="button" class="chip" data-hs-clear="1">解除</button>' +
      "</div>" +
      '<p class="kv" data-hs-hint>式の記号をタップすると、画面の対応が光ります。</p>' +
      "</div>";

    function onPick(id) {
      applyHighlight(root, id);
      // also light formula spans inside bar
      barEl.querySelectorAll("[data-hs-btn]").forEach(function (b) {
        b.classList.toggle("hs-btn-on", b.getAttribute("data-hs-btn") === id);
      });
    }

    barEl.addEventListener("click", function (e) {
      const clr = e.target.closest("[data-hs-clear]");
      if (clr) {
        onPick(null);
        return;
      }
      const btn = e.target.closest("[data-hs-btn]");
      if (!btn || !barEl.contains(btn)) return;
      const id = btn.getAttribute("data-hs-btn");
      onPick(activeId === id ? null : id);
    });
  }

  function attach(demoRoot, nodeId) {
    activeRoot = demoRoot;
    activeId = null;
    const data = (FT.DATA_HOTSPOTS || {})[nodeId];
    const bar = document.getElementById("hs-bar-host");
    wireBar(bar, demoRoot, data);
    if (!data && bar) bar.innerHTML = "";
  }

  function detach() {
    if (activeRoot) clearLit(activeRoot);
    activeRoot = null;
    activeId = null;
    const bar = document.getElementById("hs-bar-host");
    if (bar) bar.innerHTML = "";
  }

  FT.hotspots = {
    attach: attach,
    detach: detach,
    applyHighlight: applyHighlight,
  };
})(window.FT = window.FT || {});
