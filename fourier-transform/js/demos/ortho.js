/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountOrtho(root, onInteract) {
    let fProbe = 1;
    const canvas = el("canvas", { class: "demo hs-target", width: "640", height: "220" });
    canvas.setAttribute("data-hs", "prod");
    const bar = el("canvas", { class: "demo hs-target", width: "640", height: "48" });
    bar.setAttribute("data-hs", "bar");
    const ctx = canvas.getContext("2d");
    const bctx = bar.getContext("2d");
    const read = el("p", { class: "kv hs-target" });
    read.setAttribute("data-hs", "bar");
    let glowProd = false;
    let glowBar = false;

    function similarity() {
      let s = 0;
      const N = 400;
      for (let i = 0; i < N; i++) {
        const t = i / N;
        s += Math.sin(2 * Math.PI * t) * Math.sin(2 * Math.PI * fProbe * t);
      }
      return (2 * s) / N;
    }
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      function drawSin(freq, color) {
        ctx.beginPath(); ctx.strokeStyle = color;
        for (let x = 0; x < w; x++) {
          const t = x / w;
          const y = h / 2 - Math.sin(2 * Math.PI * freq * t) * 60;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      drawSin(1, "#38bdf8");
      drawSin(fProbe, "#a78bfa");
      ctx.fillStyle = glowProd ? "rgba(251,191,36,0.35)" : "rgba(244,63,94,0.15)";
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = x / w;
        const p = Math.sin(2 * Math.PI * t) * Math.sin(2 * Math.PI * fProbe * t);
        const y = h / 2 - p * 50;
        if (x === 0) ctx.moveTo(x, h / 2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h / 2);
      ctx.closePath();
      ctx.fill();
      const sim = similarity();
      bctx.clearRect(0, 0, bar.width, bar.height);
      bctx.fillStyle = "#cbd5e1";
      bctx.fillRect(20, 16, 600, 16);
      bctx.fillStyle = glowBar ? "#fbbf24" : "#34d399";
      bctx.fillRect(20, 16, Math.min(600, Math.abs(sim) * 600), 16);
      read.innerHTML =
        "似ている度（正規化内積）≈ <strong>" +
        sim.toFixed(2) +
        "</strong>（周波数一致で大きく）";
    }
    root.append(
      el("p", { class: "muted", text: "青＝対象、紫＝試し波、赤系＝かけ算。" }),
      canvas,
      bar,
      read,
      bindRange("試し波の周波数", 0.5, 3, 0.05, fProbe, function (v) {
        fProbe = v; draw(); onInteract();
      }, "freq").wrap
    );
    const mo = new MutationObserver(function () {
      glowProd = false;
      glowBar = false;
      root.querySelectorAll(".hs-lit[data-hs]").forEach(function (node) {
        const k = node.getAttribute("data-hs") || "";
        if (k.indexOf("prod") >= 0) glowProd = true;
        if (k.indexOf("bar") >= 0) glowBar = true;
      });
      draw();
    });
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: ["class"] });
    draw();
    return function () { mo.disconnect(); };
  }
  FT.demos = FT.demos || {};
  FT.demos.mountOrtho = mountOrtho;
})(window.FT = window.FT || {});
