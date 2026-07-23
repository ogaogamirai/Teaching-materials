/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountEuler(root, onInteract) {
    let ang = 0.8;
    const canvas = el("canvas", { class: "demo", width: "420", height: "240" });
    const ctx = canvas.getContext("2d");
    const read = el("p", { class: "kv" });
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const cx=120, cy=120, R=70;
      ctx.strokeStyle="#38bdf8"; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
      const x=cx+R*Math.cos(ang), y=cy-R*Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.strokeStyle="#a78bfa"; ctx.stroke();
      ctx.fillStyle="#34d399"; ctx.fillRect(260,120,Math.cos(ang)*80,12);
      ctx.fillStyle="#f43f5e"; ctx.fillRect(260,150,Math.sin(ang)*80,12);
      ctx.fillStyle="#0f172a"; ctx.font="12px sans-serif";
      ctx.fillText("cos（実部・横）",260,110); ctx.fillText("sin（虚部・縦）",260,180);
      ctx.fillStyle="#5b21b6"; ctx.font="13px sans-serif";
      ctx.fillText("e^{iθ} = cosθ + i sinθ", 250, 50);
      read.innerHTML = "e<sup>iθ</sup> は回転のまとめ書き。中身は (cosθ, sinθ) のペアです。実数経路は無効になりません。";
    }
    root.append(canvas, read, bindRange("θ",0,Math.PI*2,0.02,ang,function(v){ ang=v; draw(); onInteract(); }).wrap);
    draw(); return function(){};
  }
  FT.demos = FT.demos || {};
  FT.demos.mountEuler = mountEuler;
})(window.FT = window.FT || {});
