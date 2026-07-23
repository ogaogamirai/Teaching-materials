/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountRad(root, onInteract) {
    let deg = 180;
    const canvas = el("canvas", { class: "demo hs-target", width: "420", height: "240" });
    canvas.setAttribute("data-hs", "ang pi");
    const ctx = canvas.getContext("2d");
    const read = el("p", { class: "kv hs-target" });
    read.setAttribute("data-hs", "pi ang");
    let glow = false;

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = 140;
      const cy = 120;
      const R = 80;
      const rad = (deg * Math.PI) / 180;
      ctx.strokeStyle = glow ? "#fbbf24" : "#38bdf8";
      ctx.lineWidth = glow ? 3 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, R, -rad, 0, true);
      ctx.stroke();
      ctx.lineWidth = 1;
      const x = cx + R * Math.cos(rad);
      const y = cy - R * Math.sin(rad);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#f43f5e";
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.font = "13px sans-serif";
      ctx.fillText("0° / 0 rad", cx + R + 8, cy + 4);
      if (Math.abs(deg - 180) < 8) ctx.fillText("π", cx - 8, cy - R - 8);
      if (Math.abs(deg - 360) < 8 || deg < 2) ctx.fillText("2π", cx + R - 10, cy + 20);
      read.innerHTML =
        "<strong>" +
        deg.toFixed(0) +
        "°</strong> ≒ <strong>" +
        rad.toFixed(3) +
        " rad</strong>　（半周 180°＝π、一周 360°＝2π）";
    }

    root.append(
      el("p", {
        class: "muted",
        text: "紫の弧＝選んだ角度。式の θ・ωt の進みに対応。",
      }),
      canvas,
      read,
      bindRange("角度（度）θ", 0, 360, 1, deg, function (v) {
        deg = v;
        draw();
        onInteract();
      }, "ang").wrap
    );
    const mo = new MutationObserver(function () {
      glow = !!root.querySelector(".hs-lit");
      draw();
    });
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: ["class"] });
    draw();
    return function () { mo.disconnect(); };
  }

  FT.demos = FT.demos || {};
  FT.demos.mountRad = mountRad;
})(window.FT = window.FT || {});
