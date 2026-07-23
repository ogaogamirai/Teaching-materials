/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  let cleanup = null;
  function mountDemo(name, root, onInteract) {
    if (cleanup) cleanup();
    C.clearDemo(root);
    const D = FT.demos || {};
    const map = {
      hook: function(el, cb){ return D.mountHook(el, cb); },
      wave: function(el, cb){ return D.mountWave(el, cb); },
      ratio: function(el, cb){ return D.mountRatio(el, cb); },
      rad: function(el, cb){ return D.mountRad(el, cb); },
      circle: function(el, cb){ return D.mountCircleSeries(el, cb, { mode: "circle" }); },
      series: function(el, cb){ return D.mountCircleSeries(el, cb, { mode: "series" }); },
      super: function(el, cb){ return D.mountSuper(el, cb); },
      ortho: function(el, cb){ return D.mountOrtho(el, cb); },
      coeff: function(el, cb){ return D.mountCoeff(el, cb); },
      app: function(el, cb){ return D.mountApp(el, cb); },
      cap: function(el, cb){ return D.mountCircleSeries(el, cb, { mode: "cap" }); },
      euler: function(el, cb){ return D.mountEuler(el, cb); },
      transform: function(el, cb){ return D.mountTransform(el, cb); }
    };
    const fn = map[name];
    if (!fn) { root.textContent = "デモなし"; onInteract(); cleanup = null; return; }
    cleanup = fn(root, onInteract) || null;
  }
  function unmountDemo() {
    if (cleanup) cleanup();
    cleanup = null;
  }
  FT.mountDemo = mountDemo;
  FT.unmountDemo = unmountDemo;
})(window.FT = window.FT || {});
