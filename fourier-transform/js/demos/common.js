/* global FT */
(function (FT) {
  function clearDemo(el) {
    if (!el) return;
    el.innerHTML = "";
  }

  function el(tag, attrs, children) {
    attrs = attrs || {};
    children = children || [];
    const n = document.createElement(tag);
    Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.indexOf("on") === 0 && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    children.forEach(function (c) {
      n.append(c);
    });
    return n;
  }

  function bindRange(label, min, max, step, value, onChange, hotspotIds) {
    const wrap = el("label", { class: "row hs-target" });
    if (hotspotIds) wrap.setAttribute("data-hs", hotspotIds);
    const span = el("span", { class: "kv", text: label + ": " + value });
    const input = el("input", { type: "range", min: min, max: max, step: step, value: value });
    input.addEventListener("input", function () {
      span.textContent = label + ": " + input.value;
      onChange(parseFloat(input.value));
    });
    wrap.append(span, input);
    return { wrap: wrap, input: input, get: function () { return parseFloat(input.value); } };
  }

  function makeSampleImageData(ctx, w, h) {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const ny = y / h;
        const low = 0.55 + 0.35 * Math.sin(nx * Math.PI * 2) * Math.cos(ny * Math.PI * 2);
        const mid = 0.15 * Math.sin(nx * 18 + ny * 4);
        const high = 0.12 * Math.sin(nx * 55) * Math.sin(ny * 40);
        const edge = Math.exp(-Math.pow((nx - 0.5) * 4, 2)) * 0.25 * Math.sin(ny * 30);
        let v = Math.max(0, Math.min(1, low + mid + high + edge));
        const i = (y * w + x) * 4;
        const g = Math.floor(v * 255);
        img.data[i] = g;
        img.data[i + 1] = Math.floor(g * 0.95);
        img.data[i + 2] = Math.floor(40 + g * 0.75);
        img.data[i + 3] = 255;
      }
    }
    return img;
  }

  function boxBlur(src, w, h, radius) {
    if (radius < 1) return src;
    const out = new ImageData(w, h);
    const r = Math.floor(radius);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rs = 0, gs = 0, bs = 0, c = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const xx = Math.min(w - 1, Math.max(0, x + dx));
            const yy = Math.min(h - 1, Math.max(0, y + dy));
            const i = (yy * w + xx) * 4;
            rs += src.data[i];
            gs += src.data[i + 1];
            bs += src.data[i + 2];
            c++;
          }
        }
        const o = (y * w + x) * 4;
        out.data[o] = rs / c;
        out.data[o + 1] = gs / c;
        out.data[o + 2] = bs / c;
        out.data[o + 3] = 255;
      }
    }
    return out;
  }

  function highBoost(src, blurred) {
    const w = src.width;
    const h = src.height;
    const out = new ImageData(w, h);
    for (let i = 0; i < src.data.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const v = src.data[i + k] - blurred.data[i + k] + 128;
        out.data[i + k] = Math.max(0, Math.min(255, v));
      }
      out.data[i + 3] = 255;
    }
    return out;
  }

  FT.demoCommon = {
    clearDemo: clearDemo,
    el: el,
    bindRange: bindRange,
    makeSampleImageData: makeSampleImageData,
    boxBlur: boxBlur,
    highBoost: highBoost,
  };
})(window.FT = window.FT || {});
