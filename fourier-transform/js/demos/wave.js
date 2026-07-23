/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountWave(root, onInteract) {
    let amp = 1, period = 1, phase = 0, touched = 0;
    const canvas = el("canvas", { class: "demo hs-target", width: "640", height: "220" });
    canvas.setAttribute("data-hs", "y");
    const ctx = canvas.getContext("2d");
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
      ctx.strokeStyle = "#f43f5e"; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = (x / w) * Math.PI * 2 * (2 / period) + phase;
        const y = h / 2 - Math.sin(t) * 70 * amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    function bump() { touched++; draw(); if (touched >= 2) onInteract(); }
    root.append(
      canvas,
      bindRange("振幅 A", 0.2, 1.5, 0.05, amp, function (v) { amp = v; bump(); }, "A").wrap,
      bindRange("周期 T（短い⇔ω大）", 0.5, 2.5, 0.05, period, function (v) { period = v; bump(); }, "omega").wrap,
      bindRange("位相 φ", 0, Math.PI * 2, 0.05, phase, function (v) { phase = v; bump(); }, "phi").wrap
    );
    draw();
    return function () {};
  }
  FT.demos = FT.demos || {};
  FT.demos.mountWave = mountWave;
})(window.FT = window.FT || {});
