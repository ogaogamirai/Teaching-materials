/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountCoeff(root, onInteract) {
    const base = [1, 1 / 3, 1 / 5, 1 / 7, 1 / 9];
    const scale = base.map(function () { return 1; });
    const canvas = el("canvas", { class: "demo hs-target", width: "640", height: "220" });
    canvas.setAttribute("data-hs", "y an");
    const ctx = canvas.getContext("2d");
    let hlBars = false;
    let hlWave = false;

    function yAt(t) {
      let s = 0;
      for (let i = 0; i < base.length; i++) {
        const n = i * 2 + 1;
        s += scale[i] * base[i] * Math.sin(n * t);
      }
      return s;
    }
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      ctx.strokeStyle = hlWave ? "#fbbf24" : "#f43f5e";
      ctx.lineWidth = hlWave ? 4 : 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = (x / w) * Math.PI * 2;
        const y = h / 2 - yAt(t) * 50;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < base.length; i++) {
        const bh = scale[i] * base[i] * 80;
        ctx.fillStyle = hlBars ? "#fbbf24" : "#38bdf8";
        ctx.fillRect(20 + i * 50, h - 10 - bh, 30, bh);
      }
    }
    const box = el("div", { class: "stack hs-target" });
    box.setAttribute("data-hs", "an");
    base.forEach(function (_, i) {
      const n = i * 2 + 1;
      box.append(
        bindRange("係数 n=" + n, 0, 1.5, 0.05, 1, function (v) {
          scale[i] = v; draw(); onInteract();
        }, "an").wrap
      );
    });
    root.append(
      el("p", { class: "muted", text: "下の棒＝係数。式の a_n, b_n の強さに対応。" }),
      canvas,
      box
    );
    const mo = new MutationObserver(function () {
      hlBars = false;
      hlWave = false;
      root.querySelectorAll(".hs-lit[data-hs]").forEach(function (node) {
        const k = node.getAttribute("data-hs") || "";
        if (k.indexOf("an") >= 0) hlBars = true;
        if (k.indexOf("y") >= 0 && node === canvas) hlWave = true;
      });
      draw();
    });
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: ["class"] });
    draw();
    return function () { mo.disconnect(); };
  }
  FT.demos = FT.demos || {};
  FT.demos.mountCoeff = mountCoeff;
})(window.FT = window.FT || {});
