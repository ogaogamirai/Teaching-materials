/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;
  const bindRange = C.bindRange;

  function mountSuper(root, onInteract) {
    let phase = 0, a2 = 1;
    const canvas = el("canvas", { class: "demo", width: "640", height: "240" });
    const ctx = canvas.getContext("2d");
    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);
      ctx.strokeStyle="#cbd5e1"; ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke();
      const paths = [
        ["#38bdf8", function(t){ return Math.sin(t); }],
        ["#a78bfa", function(t){ return a2 * Math.sin(t + phase); }],
        ["#f43f5e", function(t){ return Math.sin(t) + a2 * Math.sin(t + phase); }]
      ];
      paths.forEach(function(p){
        ctx.beginPath(); ctx.strokeStyle=p[0]; ctx.lineWidth = p[0]==="#f43f5e" ? 2.5 : 1.5;
        for (let x=0;x<w;x++){
          const t=(x/w)*Math.PI*4; const y=h/2 - p[1](t)*40;
          if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
      });
    }
    root.append(el("p",{class:"muted",text:"青・紫＝部品、赤＝足し算。"}), canvas,
      bindRange("位相差",0,Math.PI,0.02,phase,function(v){ phase=v; draw(); onInteract(); }).wrap,
      bindRange("2波目の振幅",0,1.2,0.05,a2,function(v){ a2=v; draw(); onInteract(); }).wrap);
    draw(); return function(){};
  }
  FT.demos = FT.demos || {};
  FT.demos.mountSuper = mountSuper;
})(window.FT = window.FT || {});
