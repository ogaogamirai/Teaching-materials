/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountTransform(root, onInteract) {
    const box = el("div", { class: "grid-2" });
    const items = [
      ["級数（足し算）", "周期的な波を sin/cos の和で。あなたが主に通った道。"],
      ["変換（見取り図）", "もっと一般の信号への広がり。計算ドリルはしない。"],
      ["離散 DFT/FFT", "配列・画像・音声の実務。JPEG等の近所。"]
    ];
    items.forEach(function(it, i){
      const p = el("div", { class: "panel" });
      p.innerHTML = "<h2>"+it[0]+"</h2><p class=\"muted\">"+it[1]+"</p>";
      p.style.cursor = "pointer";
      p.addEventListener("click", function(){ p.style.outline = "2px solid #38bdf8"; onInteract(); });
      if (i === 0) p.style.outline = "2px solid #34d399";
      box.append(p);
    });
    root.append(el("p",{class:"muted",text:"箱をタップして地図を確認（緑＝今回の主経路）。"}), box);
    onInteract();
    return function(){};
  }
  FT.demos = FT.demos || {};
  FT.demos.mountTransform = mountTransform;
})(window.FT = window.FT || {});
