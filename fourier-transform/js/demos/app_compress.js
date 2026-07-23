/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  const makeSampleImageData = C.makeSampleImageData;
  const boxBlur = C.boxBlur;
  const highBoost = C.highBoost;
  function mountApp(root, onInteract) {
    let cut = 0.3, mode = "low";
    const canvas = el("canvas", { class: "demo", width: "320", height: "200" });
    const ctx = canvas.getContext("2d");
    const base = makeSampleImageData(ctx, 320, 200);
    const bars = el("canvas", { class: "demo", width: "320", height: "70" });
    const bctx = bars.getContext("2d");
    function redraw() {
      let img;
      if (mode === "low") img = boxBlur(base, 320, 200, 1 + cut * 12);
      else if (mode === "high") {
        const blur = boxBlur(base, 320, 200, 1 + (1 - cut) * 10);
        img = highBoost(base, blur);
      } else img = base;
      ctx.putImageData(img, 0, 0);
      bctx.clearRect(0,0,320,70);
      for (let i=0;i<10;i++){
        const keep = mode==="full" ? true : mode==="low" ? i < 10*(1-cut*0.85) : i > 10*cut*0.7;
        bctx.fillStyle = keep ? "#38bdf8" : "#475569";
        bctx.fillRect(15+i*30, 50-(keep?30+i*2:8), 22, keep?30+i*2:8);
      }
    }
    const modes = el("div", { class: "row" });
    [["low","低周波だけ残す"],["high","高周波だけ残す"],["full","全部"]].forEach(function(pair){
      const b = el("button", { class: "btn", type: "button", text: pair[1] });
      b.addEventListener("click", function(){ mode=pair[0]; redraw(); onInteract(); });
      modes.append(b);
    });
    const grid = el("div", { class: "grid-2" });
    grid.append(canvas, bars);
    root.append(el("p",{class:"note-warn",text:"係数を選んで捨てる＝圧縮、の直感。実JPEGではありません。"}), grid, modes,
      bindRange("カット量",0,1,0.01,cut,function(v){ cut=v; redraw(); onInteract(); }).wrap);
    redraw(); return function(){};
  }
  FT.demos = FT.demos || {};
  FT.demos.mountApp = mountApp;
})(window.FT = window.FT || {});
