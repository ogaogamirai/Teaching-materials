/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountRatio(root, onInteract) {
    let ang = 0.7;
    const canvas = el("canvas", { class: "demo", width: "400", height: "240" });
    const ctx = canvas.getContext("2d");
    const read = el("p", { class: "kv" });
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);
      const cx=140, cy=120, R=80;
      ctx.strokeStyle="#38bdf8"; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
      const x = cx + R*Math.cos(ang), y = cy - R*Math.sin(ang);
      ctx.strokeStyle="#a78bfa"; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
      ctx.fillStyle="#f43f5e"; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#34d399"; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,cy); ctx.lineTo(cx,cy); ctx.stroke();
      ctx.setLineDash([]);
      read.innerHTML = "<strong>sin</strong>≈"+Math.sin(ang).toFixed(2)+"（高さ） / <strong>cos</strong>≈"+Math.cos(ang).toFixed(2)+"（横）";
    }
    root.append(canvas, read, bindRange("角度",0,Math.PI*2,0.02,ang,function(v){ ang=v; draw(); onInteract(); }).wrap);
    draw(); return function(){};
  }
  FT.demos = FT.demos || {};
  FT.demos.mountRatio = mountRatio;
})(window.FT = window.FT || {});
