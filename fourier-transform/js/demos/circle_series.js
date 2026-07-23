/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountCircleSeries(root, onInteract, opts) {
    opts = opts || {};
    const mode = opts.mode || "circle";
    let N = mode === "circle" ? 1 : 3;
    let speed = 1, ampScale = 1, showGhost = false, ghostN = 8;
    const enabled = {};
    for (let i = 0; i < 15; i++) enabled[i] = true;
    const canvas = el("canvas", { class: "demo hs-target", width: "800", height: "360" });
    canvas.setAttribute("data-hs", mode === "circle" ? "circle y R" : "sum y n N");
    const ctx = canvas.getContext("2d");
    let time = 0, wave = [], raf = 0, touched = false;
    let hl = null;

    function mark() { if (!touched) { touched = true; onInteract(); } }

    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const maxTerms = mode === "circle" ? 1 : 15;
      const terms = Math.min(N, maxTerms);
      const glowCircle = hl === "circle" || hl === "R" || hl === "sum" || hl === "n";
      const glowWave = hl === "y";
      const glowOmega = hl === "omega";

      function drawSeries(nTerms, alpha, color) {
        let px = 180, py = 180;
        for (let i = 0; i < nTerms; i++) {
          if (mode !== "circle" && enabled[i] === false) continue;
          const n = i * 2 + 1;
          const radius = 70 * ampScale * (4 / (n * Math.PI));
          const nx = px + radius * Math.cos(n * time);
          const ny = py + radius * Math.sin(n * time);
          ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.strokeStyle = glowCircle
            ? "rgba(250,204,21," + (0.55 * alpha) + ")"
            : "rgba(56,189,248," + (0.2 * alpha) + ")";
          ctx.lineWidth = glowCircle ? 3 : 1;
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny);
          ctx.strokeStyle = glowOmega ? "#fbbf24" : color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = glowOmega ? 3 : 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 1;
          px = nx; py = ny;
        }
        return { px: px, py: py };
      }
      if (showGhost && mode === "series") drawSeries(ghostN, 0.35, "#a78bfa");
      const tip = drawSeries(terms, 1, "#38bdf8");
      wave.unshift(tip.py); if (wave.length > 420) wave.pop();
      ctx.beginPath(); ctx.moveTo(tip.px, tip.py); ctx.lineTo(360, wave[0]);
      ctx.strokeStyle = "rgba(248,250,252,0.35)"; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(360, wave[0]);
      for (let i = 0; i < wave.length; i++) ctx.lineTo(360 + i, wave[i]);
      ctx.strokeStyle = glowWave ? "#fbbf24" : "#f43f5e";
      ctx.lineWidth = glowWave ? 4 : 2.5;
      ctx.stroke();
      ctx.lineWidth = 1;
      // region labels
      ctx.fillStyle = "rgba(148,163,184,0.9)";
      ctx.font = "12px sans-serif";
      if (mode === "circle") {
        ctx.fillText("円 (R, ω)", 120, 24);
        ctx.fillText("波 y(t)", 500, 24);
      } else {
        ctx.fillText("Σ 成分", 120, 24);
        ctx.fillText("部分和", 500, 24);
      }
      time += 0.02 * speed;
      raf = requestAnimationFrame(drawFrame);
    }

    const controls = el("div", { class: "stack" });
    if (mode !== "circle") {
      controls.append(
        bindRange("成分数 N", 1, 15, 1, N, function (v) { N = v; wave = []; mark(); }, "N sum").wrap
      );
    } else {
      controls.append(
        bindRange("半径スケール R（振幅）", 0.4, 1.4, 0.05, 1, function (v) {
          ampScale = v; wave = []; mark();
        }, "R").wrap
      );
    }
    controls.append(
      bindRange("回転速度 ω", 0.3, 2.5, 0.1, speed, function (v) {
        speed = v; mark();
      }, "omega").wrap
    );

    let toggles = null;
    if (mode === "series" || mode === "cap") {
      const ghostBtn = el("button", { class: "btn", type: "button", text: "予測ゴースト表示（N=8）" });
      ghostBtn.addEventListener("click", function () {
        showGhost = !showGhost;
        ghostBtn.textContent = showGhost ? "ゴーストOFF" : "予測ゴースト表示（N=8）";
        mark();
      });
      controls.append(ghostBtn);
      toggles = el("div", { class: "chips hs-target" });
      toggles.setAttribute("data-hs", "n");
      for (let i = 0; i < 8; i++) {
        const n = i * 2 + 1;
        const c = el("button", { class: "chip", type: "button", text: "n=" + n });
        c.addEventListener("click", function () {
          enabled[i] = !enabled[i];
          c.style.opacity = enabled[i] ? "1" : "0.35";
          wave = []; mark();
        });
        toggles.append(c);
      }
      controls.append(el("p", { class: "muted", text: "成分 ON/OFF" }), toggles);
    }

    // listen highlight from hotspot bar (bubbles on root)
    function onHs(e) {
      // mutation observer alternative: poll class on canvas parent
    }
    const mo = new MutationObserver(function () {
      if (canvas.classList.contains("hs-lit")) {
        // if whole canvas lit, keep; check which control lit
      }
      const lit = root.querySelector(".hs-lit[data-hs]");
      if (!lit) { hl = null; return; }
      const keys = (lit.getAttribute("data-hs") || "").split(/\s+/);
      hl = keys[0] || null;
      // prefer more specific from any lit
      root.querySelectorAll(".hs-lit[data-hs]").forEach(function (node) {
        const k = (node.getAttribute("data-hs") || "").split(/\s+/);
        if (k.indexOf("R") >= 0) hl = "R";
        else if (k.indexOf("omega") >= 0) hl = "omega";
        else if (k.indexOf("y") >= 0 && node.tagName === "CANVAS") hl = "y";
        else if (k.indexOf("circle") >= 0) hl = "circle";
        else if (k.indexOf("n") >= 0 && node !== canvas) hl = "n";
        else if (k.indexOf("N") >= 0) hl = "N";
        else if (k.indexOf("sum") >= 0) hl = "sum";
      });
    });

    root.append(canvas, controls);
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: ["class"] });
    drawFrame();
    return function () {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }
  FT.demos = FT.demos || {};
  FT.demos.mountCircleSeries = mountCircleSeries;
})(window.FT = window.FT || {});
