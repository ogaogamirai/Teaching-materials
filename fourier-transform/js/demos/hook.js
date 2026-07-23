/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  const makeSampleImageData = C.makeSampleImageData;
  const boxBlur = C.boxBlur;
  const highBoost = C.highBoost;

  function mountHook(root, onInteract) {
    let cut = 0;
    let mode = "lowpass";
    const canvas = el("canvas", { class: "demo", width: "320", height: "200" });
    const bars = el("canvas", { class: "demo", width: "320", height: "80" });
    const note = el("p", { class: "note-warn", text: "教育用モデルです。実JPEGエンコーダではありません。" });
    const ctx = canvas.getContext("2d");
    const bctx = bars.getContext("2d");
    const base = makeSampleImageData(ctx, 320, 200);
    let touched = false;

    function drawBars() {
      bctx.clearRect(0, 0, 320, 80);
      const n = 12;
      for (let i = 0; i < n; i++) {
        const keep = mode === "highpass" ? i / n > cut * 0.85 : i / n < 1 - cut * 0.9;
        const h = 20 + (i + 1) * 4;
        bctx.fillStyle = keep ? "#38bdf8" : "#cbd5e1";
        bctx.fillRect(12 + i * 25, 70 - h * (keep ? 1 : 0.25), 18, h * (keep ? 1 : 0.25));
      }
      bctx.fillStyle = "#94a3b8";
      bctx.font = "11px sans-serif";
      bctx.fillText("低周波 ← 周波数バー → 高周波", 12, 12);
    }

    function redraw() {
      const radius = 1 + cut * 10;
      let img;
      if (mode === "lowpass") img = boxBlur(base, 320, 200, radius);
      else if (mode === "highpass") {
        const blur = boxBlur(base, 320, 200, 2 + (1 - cut) * 8);
        img = highBoost(base, blur);
      } else img = base;
      ctx.putImageData(img, 0, 0);
      drawBars();
    }

    const r = bindRange("細かさの残量（右＝細部を切る）", 0, 1, 0.01, 0, function (v) {
      cut = v; touched = true; redraw(); if (touched) onInteract();
    });
    const modeRow = el("div", { class: "row" });
    [["lowpass","低周波寄り（細部カット）"],["highpass","高周波寄り"],["full","元画像"]].forEach(function (pair) {
      const b = el("button", { class: "btn", type: "button", text: pair[1] });
      b.addEventListener("click", function () { mode = pair[0]; touched = true; redraw(); onInteract(); });
      modeRow.append(b);
    });
    const grid = el("div", { class: "grid-2" });
    grid.append(el("div", { class: "demo-wrap" }, [canvas]), el("div", { class: "demo-wrap" }, [bars]));
    root.append(note, grid, r.wrap, modeRow);
    redraw();
    return function () {};
  }
  FT.demos = FT.demos || {};
  FT.demos.mountHook = mountHook;
})(window.FT = window.FT || {});
