/* global FT */
(function (FT) {
  const C = FT.demoCommon;
  const el = C.el;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function mountShell(host, title, beatLabels) {
    const root = el("div", { class: "geo-proof" });
    const canvas = el("canvas", {
      class: "demo geo-proof-canvas",
      width: "640",
      height: "260",
    });
    const caption = el("p", { class: "geo-proof-caption kv" });
    const beatRow = el("div", { class: "geo-proof-beats" });
    beatLabels.forEach(function (lab, i) {
      beatRow.append(
        el("span", {
          class: "geo-beat-chip",
          "data-beat": String(i),
          text: i + 1 + ". " + lab,
        })
      );
    });
    const controls = el("div", { class: "row geo-proof-controls" });
    const btnPrev = el("button", {
      type: "button",
      class: "btn",
      text: "← 前の絵",
    });
    const btnNext = el("button", {
      type: "button",
      class: "btn btn-primary",
      text: "次の絵 →",
    });
    const btnPlay = el("button", {
      type: "button",
      class: "btn",
      text: "自動再生",
    });
    const idx = el("span", { class: "kv", text: "" });
    controls.append(btnPrev, btnNext, btnPlay, idx);
    root.append(
      el("p", {
        class: "kv",
        text: title || "図で先に納得する",
      }),
      canvas,
      caption,
      beatRow,
      controls
    );
    host.appendChild(root);
    return {
      root: root,
      canvas: canvas,
      ctx: canvas.getContext("2d"),
      caption: caption,
      beatRow: beatRow,
      btnPrev: btnPrev,
      btnNext: btnNext,
      btnPlay: btnPlay,
      idx: idx,
    };
  }

  function wireBeats(ui, state, n, draw, captions) {
    let raf = 0;
    let playing = false;
    let last = 0;

    function setBeatChips() {
      const chips = ui.beatRow.querySelectorAll
        ? ui.beatRow.querySelectorAll("[data-beat]")
        : [];
      for (let ci = 0; ci < chips.length; ci++) {
        const chip = chips[ci];
        const i = parseInt(chip.getAttribute("data-beat"), 10);
        if (chip.classList) {
          chip.classList.toggle("on", i === state.beat);
          chip.classList.toggle("done", i < state.beat);
        }
      }
      ui.idx.textContent = state.beat + 1 + " / " + n;
      ui.caption.textContent = captions[state.beat] || "";
    }

    function stopPlay() {
      playing = false;
      ui.btnPlay.textContent = "自動再生";
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function frame(ts) {
      if (!playing) return;
      if (!last) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;
      state.t += dt;
      const dur = state.beatDur || 2.2;
      if (state.t >= dur) {
        state.t = 0;
        if (state.beat < n - 1) {
          state.beat++;
          setBeatChips();
        } else {
          stopPlay();
          draw();
          return;
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function go(b) {
      state.beat = clamp(b, 0, n - 1);
      state.t = 0;
      setBeatChips();
      draw();
    }

    function startPlay(fromStart) {
      stopPlay();
      if (fromStart || state.beat >= n - 1) {
        state.beat = 0;
        state.t = 0;
        setBeatChips();
      }
      playing = true;
      ui.btnPlay.textContent = "停止";
      last = 0;
      draw();
      raf = requestAnimationFrame(frame);
    }

    ui.btnPrev.addEventListener("click", function () {
      stopPlay();
      go(state.beat - 1);
    });
    ui.btnNext.addEventListener("click", function () {
      stopPlay();
      go(state.beat + 1);
    });
    ui.btnPlay.addEventListener("click", function () {
      if (playing) {
        stopPlay();
        return;
      }
      startPlay(false);
    });
    ui.beatRow.addEventListener("click", function (e) {
      const chip = e.target.closest("[data-beat]");
      if (!chip) return;
      stopPlay();
      go(parseInt(chip.getAttribute("data-beat"), 10));
    });

    setBeatChips();
    draw();

    return {
      destroy: function () {
        stopPlay();
        if (ui.root && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root);
      },
      forcePlay: function () {
        startPlay(true);
      },
      go: go,
      stop: stopPlay,
      beatCount: n,
    };
  }

  /** WAVE: three knobs A / T(ω) / φ */
  function mountWaveKnobs(host) {
    const beats = ["波を見る", "A＝高さ", "T＝くり返し", "φ＝ずれ"];
    const captions = [
      "まず赤い波。まだつまみの名前は無い。",
      "振幅 A だけ上げる → 山が高くなる（細かさは同じ）。",
      "周期 T を短く → 山が細かく（高さは同じ）。ω=2π/T。",
      "位相 φ を動かす → 形はそのまま左右にずれる。",
    ];
    const ui = mountShell(host, "図形証明：波の3つまみ", beats);
    const state = { beat: 0, t: 0, beatDur: 2.5 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;

    function params(beat, p) {
      let A = 0.7;
      let T = 1;
      let phi = 0;
      if (beat === 1) A = 0.45 + 0.7 * p;
      if (beat === 2) {
        A = 0.75;
        T = 1.2 - 0.7 * p;
      }
      if (beat === 3) {
        A = 0.75;
        T = 0.85;
        phi = p * 1.8;
      }
      if (beat === 0) A = 0.55 + 0.15 * Math.sin(p * Math.PI);
      return { A: A, T: Math.max(0.35, T), phi: phi };
    }

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      const pr = params(state.beat, p);
      const mid = 120;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(24, mid);
      ctx.lineTo(W - 24, mid);
      ctx.stroke();

      // ghost baseline wave
      if (state.beat >= 1) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(148,163,184,0.45)";
        ctx.setLineDash([4, 4]);
        for (let x = 24; x <= W - 24; x++) {
          const u = (x - 24) / (W - 48);
          const y = mid - 0.55 * Math.sin(2 * Math.PI * u / 1) * 70;
          if (x === 24) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2.5;
      for (let x = 24; x <= W - 24; x++) {
        const u = (x - 24) / (W - 48);
        const y =
          mid -
          pr.A *
            Math.sin((2 * Math.PI * u) / pr.T + pr.phi) *
            70;
        if (x === 24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // knob meters
      const knobs = [
        { name: "A 振幅", v: pr.A / 1.2, on: state.beat === 1 },
        { name: "T 周期", v: (1.3 - pr.T) / 1.0, on: state.beat === 2 },
        { name: "φ 位相", v: pr.phi / 1.8, on: state.beat === 3 },
      ];
      knobs.forEach(function (k, i) {
        const x = 80 + i * 180;
        const y = H - 48;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(x, y, 120, 12);
        ctx.fillStyle = k.on ? "#8b5cf6" : "#38bdf8";
        ctx.fillRect(x, y, 120 * clamp(k.v, 0, 1), 12);
        ctx.fillStyle = k.on ? "#5b21b6" : "#475569";
        ctx.font = (k.on ? "bold " : "") + "12px sans-serif";
        ctx.fillText(k.name, x, y - 8);
      });

      ctx.fillStyle = "#0f766e";
      ctx.font = "12px sans-serif";
      if (state.beat === 0) ctx.fillText("担当を混ぜない：一度に1つまみ", 30, 28);
      if (state.beat === 1) ctx.fillText("高さだけ変化（細かさはそのまま）", 30, 28);
      if (state.beat === 2) ctx.fillText("細かさだけ変化 → ω = 2π/T", 30, 28);
      if (state.beat === 3) ctx.fillText("形はそのまま横ずれ", 30, 28);
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** RAD: degree ↔ radian arc */
  function mountRadArc(host) {
    const beats = ["度のものさし", "180°＝π", "360°＝2π", "ω＝2π/T"];
    const captions = [
      "なじみの『度』。半周は180°。",
      "同じ半周をラジアンで読むと π（パイ）。",
      "一周360°＝2π ラジアン。",
      "周期 T で一周する速さ ω＝2π/T。これで ωt が読める。",
    ];
    const ui = mountShell(host, "図形証明：度 ↔ ラジアン", beats);
    const state = { beat: 0, t: 0, beatDur: 2.3 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const cx = 200;
      const cy = 140;
      const R = 85;
      let frac = 0.5; // half turn default
      if (state.beat === 0) frac = 0.15 + 0.35 * p;
      if (state.beat === 1) frac = 0.5;
      if (state.beat === 2) frac = 0.5 + 0.5 * p;
      if (state.beat === 3) frac = (state.t * 0.35) % 1;

      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 6;
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false);
      ctx.stroke();
      ctx.lineWidth = 1;

      // radius
      const ang = -Math.PI / 2 + frac * Math.PI * 2;
      ctx.strokeStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(ang), cy + R * Math.sin(ang));
      ctx.stroke();
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(cx + R * Math.cos(ang), cy + R * Math.sin(ang), 6, 0, Math.PI * 2);
      ctx.fill();

      const deg = Math.round(frac * 360);
      const radLabel =
        Math.abs(frac - 0.5) < 0.02
          ? "π"
          : Math.abs(frac - 1) < 0.02 || frac < 0.02
            ? "2π"
            : (frac * 2).toFixed(2) + "π";

      ctx.fillStyle = "#0f172a";
      ctx.font = "16px sans-serif";
      ctx.fillText("度: " + deg + "°", 340, 80);
      ctx.fillStyle = "#5b21b6";
      ctx.font = "18px sans-serif";
      ctx.fillText("rad: " + radLabel, 340, 110);

      if (state.beat >= 1) {
        ctx.fillStyle = "#0369a1";
        ctx.font = "13px sans-serif";
        ctx.fillText("180° = π rad", 340, 150);
      }
      if (state.beat >= 2) {
        ctx.fillText("360° = 2π rad", 340, 172);
      }
      if (state.beat >= 3) {
        ctx.fillStyle = "#b45309";
        ctx.fillText("ω = 2π / T", 340, 200);
        ctx.fillText("（一周を周期Tで割る速さ）", 340, 220);
      }
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** SUPER: two waves add / cancel */
  function mountSuperAdd(host) {
    const beats = ["波 f と g", "同じ時刻で足す", "そろうと大きく", "ずれると打ち消し"];
    const captions = [
      "青い波 f と紫の波 g。",
      "同じ時刻 t の高さを足す（平均ではない）。",
      "山がそろうと赤（合計）が大きくなる。",
      "山と谷が重なると打ち消し、合計は小さくなる。",
    ];
    const ui = mountShell(host, "図形証明：波は足してよい", beats);
    const state = { beat: 0, t: 0, beatDur: 2.5 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      const mid = 120;
      const amp = 48;
      let phase = 0;
      if (state.beat === 2) phase = 0.15 * (1 - p);
      if (state.beat === 3) phase = 0.2 + p * (Math.PI - 0.2);
      if (state.beat <= 1) phase = 0.4;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(24, mid);
      ctx.lineTo(W - 24, mid);
      ctx.stroke();

      function strokeWave(fn, color, width, alpha) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.lineWidth = width || 2;
        for (let x = 24; x <= W - 24; x++) {
          const u = (x - 24) / (W - 48);
          const y = mid - fn(u) * amp;
          if (x === 24) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }

      const f = function (u) {
        return Math.sin(2 * Math.PI * u);
      };
      const g = function (u) {
        return Math.sin(2 * Math.PI * u + phase);
      };

      if (state.beat === 0) {
        const reveal = 24 + (W - 48) * (0.4 + 0.6 * p);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, reveal, H);
        ctx.clip();
        strokeWave(f, "#0ea5e9", 2.5, 1);
        strokeWave(g, "#8b5cf6", 2.5, 1);
        ctx.restore();
      } else {
        strokeWave(f, "#0ea5e9", 1.5, 0.55);
        strokeWave(g, "#8b5cf6", 1.5, 0.55);
        if (state.beat >= 1) {
          strokeWave(
            function (u) {
              return f(u) + g(u);
            },
            "#f43f5e",
            2.8,
            1
          );
        }
      }

      ctx.fillStyle = "#334155";
      ctx.font = "12px sans-serif";
      ctx.fillText("f（青）", 30, 24);
      ctx.fillText("g（紫）", 90, 24);
      if (state.beat >= 1) ctx.fillText("f+g（赤）", 150, 24);

      if (state.beat === 2) {
        ctx.fillStyle = "#b91c1c";
        ctx.fillText("同位相 → 強め合い", 400, 40);
      }
      if (state.beat === 3) {
        ctx.fillStyle = "#b91c1c";
        ctx.fillText("位相ずれ → 打ち消し", 400, 40);
      }
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** CIRCLE: rotating point height → wave trace */
  function mountCircleHeight(host) {
    const beats = ["円と点", "高さだけ", "時間で回す", "波になる"];
    const captions = [
      "半径 R の円の上に点。これが観覧車のゴンドラ。",
      "横は捨てて、高さだけ見る（緑の線）。",
      "時間が進むと角度が進む。点は回り続ける。",
      "高さの履歴を右に並べるとサイン波 y = R sin(ωt+φ)。",
    ];
    const ui = mountShell(host, "図形証明：円の高さ → 波", beats);
    const state = { beat: 0, t: 0, beatDur: 2.6 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;
    const trail = [];

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const cx = 150;
      const cy = 130;
      const R = 78;
      const spin =
        state.beat <= 1
          ? 0.9
          : 0.9 + (state.beat === 2 ? p * 4.2 : 4.2 + state.t * 1.4);
      const ang = spin;
      const px = cx + R * Math.cos(ang);
      const py = cy - R * Math.sin(ang);

      // circle
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - R - 12, cy);
      ctx.lineTo(cx + R + 12, cy);
      ctx.moveTo(cx, cy - R - 12);
      ctx.lineTo(cx, cy + R + 12);
      ctx.stroke();

      // radius arm
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // height drop
      if (state.beat >= 1) {
        ctx.strokeStyle = "#10b981";
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#047857";
        ctx.font = "12px sans-serif";
        ctx.fillText("高さ", px + 8, (py + cy) / 2);
      }

      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.font = "12px sans-serif";
      ctx.fillText("R", cx + R * 0.45 * Math.cos(ang) - 4, cy - R * 0.45 * Math.sin(ang) - 6);

      // wave panel
      const x0 = 320;
      if (state.beat >= 2) {
        if (state.beat >= 3 || p > 0.05) {
          trail.unshift(py);
          if (trail.length > 280) trail.pop();
        }
        ctx.strokeStyle = "rgba(148,163,184,0.5)";
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x0, py);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(x0, 24);
        ctx.lineTo(x0, H - 24);
        ctx.moveTo(x0, cy);
        ctx.lineTo(W - 24, cy);
        ctx.stroke();

        if (trail.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = "#f43f5e";
          ctx.lineWidth = 2.5;
          for (let i = 0; i < trail.length; i++) {
            const x = x0 + i;
            const y = trail[i];
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.lineWidth = 1;
        }
        ctx.fillStyle = "#9f1239";
        ctx.font = "12px sans-serif";
        ctx.fillText(
          state.beat >= 3 ? "y(t) = R sin(ωt+φ)" : "高さを右へメモ…",
          x0 + 8,
          36
        );
      } else {
        trail.length = 0;
      }

      if (state.beat === 0) {
        ctx.fillStyle = "#5b21b6";
        ctx.fillText("点 = ゴンドラ", 300, 70);
        ctx.fillText("円の半径 = R（振れ幅）", 300, 92);
      }
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** ORTHO: product cancellation → bar score */
  function mountOrthoCancel(host) {
    const beats = ["二つの波", "かけ算の塗り", "打ち消し", "バー＝点数"];
    const captions = [
      "青＝原曲 f、紫＝試し波 g。まずは重ねて見る。",
      "赤い塗り＝同じ時刻の f×g。山と谷が出る。",
      "周波数が違うと、正と負が打ち消しやすい。",
      "残った面積をまとめたのが緑バー（似ている度）。",
    ];
    const ui = mountShell(host, "図形証明：かけ算の打ち消し", beats);
    const state = { beat: 0, t: 0, beatDur: 2.4 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;

    function fAt(u) {
      return Math.sin(2 * Math.PI * u);
    }
    function gAt(u, freq) {
      return Math.sin(2 * Math.PI * freq * u);
    }

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      ctx.clearRect(0, 0, W, H);
      const mid = 100;
      const amp = 42;
      const freq = state.beat >= 2 ? 2 : 1;

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(24, mid);
      ctx.lineTo(W - 24, mid);
      ctx.stroke();

      function strokeWave(fn, color, width) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 2;
        for (let x = 24; x <= W - 24; x++) {
          const u = (x - 24) / (W - 48);
          const y = mid - fn(u) * amp;
          if (x === 24) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      if (state.beat === 0) {
        const reveal = 24 + (W - 48) * (0.35 + 0.65 * p);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, reveal, H);
        ctx.clip();
        strokeWave(fAt, "#0ea5e9", 2.5);
        strokeWave(function (u) {
          return gAt(u, 1);
        }, "#8b5cf6", 2.5);
        ctx.restore();
        ctx.fillStyle = "#64748b";
        ctx.font = "12px sans-serif";
        ctx.fillText("f（青）", 30, 22);
        ctx.fillText("g（紫）・同じ速さ", 100, 22);
      }

      if (state.beat >= 1) {
        strokeWave(fAt, "rgba(14,165,233,0.55)", 1.5);
        strokeWave(function (u) {
          return gAt(u, freq);
        }, "rgba(139,92,246,0.55)", 1.5);

        const fillProg = state.beat === 1 ? p : 1;
        const xEnd = 24 + (W - 48) * fillProg;
        ctx.beginPath();
        for (let x = 24; x <= xEnd; x++) {
          const u = (x - 24) / (W - 48);
          const prod = fAt(u) * gAt(u, freq);
          const y = mid - prod * amp * 0.85;
          if (x === 24) ctx.moveTo(x, mid);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(xEnd, mid);
        ctx.closePath();
        ctx.fillStyle =
          state.beat >= 2 && freq !== 1
            ? "rgba(244,63,94,0.22)"
            : "rgba(251,146,60,0.35)";
        ctx.fill();

        if (state.beat >= 2 && freq !== 1) {
          ctx.fillStyle = "#be123c";
          ctx.font = "12px sans-serif";
          ctx.fillText("＋と−が打ち消し → 面積が小さくなる", 160, 22);
          const pulse = 0.5 + 0.5 * Math.sin(state.t * 6);
          ctx.strokeStyle = "rgba(244,63,94," + (0.35 + 0.4 * pulse) + ")";
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(24, mid - amp, W - 48, amp * 2);
          ctx.setLineDash([]);
        } else if (state.beat === 1) {
          ctx.fillStyle = "#c2410c";
          ctx.font = "12px sans-serif";
          ctx.fillText("塗り＝ f × g（同じ時刻）", 200, 22);
        }
      }

      if (state.beat >= 3) {
        let s = 0;
        const N = 320;
        for (let i = 0; i < N; i++) {
          const u = i / N;
          s += fAt(u) * gAt(u, freq);
        }
        const sim = Math.abs((2 * s) / N);
        const barW = (W - 80) * sim * (0.4 + 0.6 * p);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(40, H - 48, W - 80, 18);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(40, H - 48, barW, 18);
        ctx.fillStyle = "#065f46";
        ctx.font = "13px sans-serif";
        ctx.fillText(
          "似ている度（バー）≈ " + sim.toFixed(2) + "　一致すると長い",
          40,
          H - 58
        );
      }
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** RATIO: right triangle → unit circle height = sin */
  function mountRatioPythShadow(host) {
    const beats = ["直角三角形", "三平方", "単位円へ", "高さ＝sin"];
    const captions = [
      "対辺・隣辺・斜辺。sin = 対辺 ÷ 斜辺。",
      "a²+b²=c²。斜辺を1にすると横²+高さ²=1。",
      "半径1の円に三角形を載せる。",
      "点の高さそのものが sin θ。影が波の原子へ。",
    ];
    const ui = mountShell(host, "図形証明：三平方 → 単位円の影", beats);
    const state = { beat: 0, t: 0, beatDur: 2.3 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;
    const theta = 0.85;

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const cx = state.beat >= 2 ? 220 : 160;
      const cy = 150;
      const R = 90;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      if (state.beat <= 1) {
        const hyp = 120;
        const adj = hyp * cos;
        const opp = hyp * sin;
        const ox = 80;
        const oy = 190;
        const scale = state.beat === 1 ? 1 - 0.25 * p : 1;
        const hlen = hyp * scale;
        const ax = ox + adj * scale;
        const ay = oy;
        const tipx = ox + adj * scale;
        const tipy = oy - opp * scale;

        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ax, ay);
        ctx.lineTo(tipx, tipy);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "rgba(14,165,233,0.08)";
        ctx.fill();

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        ctx.fillText("隣辺", ox + adj * scale * 0.35, oy + 16);
        ctx.fillText("対辺", tipx + 8, (oy + tipy) / 2);
        ctx.fillText("斜辺", ox + adj * scale * 0.2, oy - opp * scale * 0.55);

        if (state.beat === 0) {
          ctx.fillStyle = "#7c3aed";
          ctx.fillText("sin θ = 対辺 / 斜辺", 320, 80);
          ctx.fillText("cos θ = 隣辺 / 斜辺", 320, 102);
        }
        if (state.beat === 1) {
          ctx.fillStyle = "#b45309";
          ctx.fillText("a² + b² = c²", 320, 70);
          ctx.fillText(
            p > 0.5 ? "斜辺 → 1 にそろえる" : "三平方の関係",
            320,
            94
          );
          if (p > 0.55) {
            ctx.strokeStyle = "rgba(251,191,36,0.9)";
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(ox + 40, oy - 40, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillText("次：単位円", 320, 118);
          }
        }
        ctx.lineWidth = 1;
        return;
      }

      // unit circle
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - R - 10, cy);
      ctx.lineTo(cx + R + 10, cy);
      ctx.moveTo(cx, cy - R - 10);
      ctx.lineTo(cx, cy + R + 10);
      ctx.stroke();

      const px = cx + R * cos;
      const py = cy - R * sin;

      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.strokeStyle = "#10b981";
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, cy);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.font = "12px sans-serif";
      ctx.fillText("1", cx + R * 0.55 * cos - 4, cy - R * 0.55 * sin - 8);
      ctx.fillText("cos θ", (cx + px) / 2 - 10, cy + 16);
      ctx.fillText("sin θ", px + 10, (cy + py) / 2);

      if (state.beat >= 3) {
        const trail = 48;
        const x0 = cx + R + 40;
        ctx.strokeStyle = "rgba(244,63,94,0.35)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x0, py);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2.5;
        for (let i = 0; i <= trail; i++) {
          const u = i / trail;
          const ang = theta - u * 1.6 * (0.3 + 0.7 * p);
          const y = cy - R * Math.sin(ang);
          const x = x0 + i * 4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = "#9f1239";
        ctx.fillText("高さの履歴 → 波の原子", x0, 36);
        ctx.fillText("高さ = sin θ（半径1）", x0, 56);
        ctx.fillText("半径 R なら R sin θ", x0, 76);
      } else {
        ctx.fillStyle = "#5b21b6";
        ctx.fillText("点 = (cos θ, sin θ)", cx + R + 30, 50);
        ctx.fillText("横² + 高さ² = 1", cx + R + 30, 72);
      }
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** SERIES: partial sums sharpen toward a corner */
  function mountSeriesCorner(host) {
    const beats = ["N=1 なめらか", "項を足す", "角が立つ", "理由の一言"];
    const captions = [
      "基本の波だけ。角はまだ丸い。",
      "速さの違う波を足す（部分和）。",
      "N を増やすとカドが立ち上がる。",
      "速い波＝細かい部品。角に必要なギザを足している。",
    ];
    const ui = mountShell(host, "図形証明：部分和が角に近づく理由", beats);
    const state = { beat: 0, t: 0, beatDur: 2.5 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;

    function squarePartial(u, terms) {
      let s = 0;
      for (let k = 0; k < terms; k++) {
        const n = 2 * k + 1;
        s += Math.sin(2 * Math.PI * n * u) / n;
      }
      return (4 / Math.PI) * s;
    }

    function termsForBeat(beat, p) {
      if (beat === 0) return 1;
      if (beat === 1) return 1 + Math.floor(p * 2);
      if (beat === 2) return 3 + Math.floor(p * 5);
      return 9;
    }

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      const terms = termsForBeat(state.beat, p);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const mid = 120;
      const amp = 70;
      const left = 36;
      const right = W - 36;

      // target square ghost
      if (state.beat >= 1) {
        ctx.strokeStyle = "rgba(148,163,184,0.7)";
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        for (let x = left; x <= right; x++) {
          const u = (x - left) / (right - left);
          const sq = u < 0.5 ? 1 : -1;
          const y = mid - sq * amp * 0.85;
          if (x === left) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px sans-serif";
        ctx.fillText("目標の角ばった波（イメージ）", left, 22);
      }

      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(left, mid);
      ctx.lineTo(right, mid);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2.5;
      for (let x = left; x <= right; x++) {
        const u = (x - left) / (right - left);
        const y = mid - squarePartial(u, terms) * amp * 0.75;
        if (x === left) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // corner zoom hint
      if (state.beat >= 2) {
        const zx = left + (right - left) * 0.5;
        const zw = 70;
        ctx.strokeStyle = "rgba(251,191,36,0.95)";
        ctx.strokeRect(zx - zw / 2, mid - amp - 8, zw, amp * 2 + 16);
        ctx.fillStyle = "#a16207";
        ctx.font = "12px sans-serif";
        ctx.fillText("ここ（カド）を見る", zx - zw / 2, mid - amp - 14);
      }

      ctx.fillStyle = "#0f766e";
      ctx.font = "13px sans-serif";
      ctx.fillText("部分和の項数 N ≈ " + terms, left, H - 36);

      if (state.beat >= 3) {
        ctx.fillStyle = "#5b21b6";
        ctx.font = "13px sans-serif";
        ctx.fillText(
          "速い波（大きい n）＝細かいギザ。角を立てる部品になる。",
          left,
          H - 16
        );
        // mini bars for harmonic strength
        for (let k = 0; k < 5; k++) {
          const n = 2 * k + 1;
          const h = 28 / n;
          const bx = W - 160 + k * 28;
          ctx.fillStyle = k < terms ? "#8b5cf6" : "#e2e8f0";
          ctx.fillRect(bx, H - 70 - h * 3, 18, h * 3);
          ctx.fillStyle = "#64748b";
          ctx.font = "10px sans-serif";
          ctx.fillText("n=" + n, bx - 2, H - 56);
        }
      }
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** COEFF: measure → bar heights → resynthesize */
  function mountCoeffMixer(host) {
    const beats = ["測る", "棒の高さ", "つまみ", "合成が変わる"];
    const captions = [
      "周波数ごとに cos/sin との似ている度を測る。",
      "測った値が棒（係数 a_n, b_n）の高さになる。",
      "棒＝ミキサーのつまみ。分量の一覧表。",
      "つまみを動かすと、足し直した波の形が変わる。",
    ];
    const ui = mountShell(host, "図形証明：係数＝似ている度の一覧", beats);
    const state = { beat: 0, t: 0, beatDur: 2.4 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;
    const base = [1, 1 / 3, 1 / 5, 1 / 7, 1 / 9];

    function scalesForBeat(beat, p) {
      if (beat === 0) return base.map(function () { return 0.15 + 0.1 * p; });
      if (beat === 1) return base.map(function (b, i) {
        return (0.35 + 0.65 * p) * (i === 0 ? 1 : b / base[0]);
      });
      if (beat === 2) return base.map(function (b) { return b / base[0]; });
      // beat 3: animate reducing high harmonics
      return base.map(function (b, i) {
        const full = b / base[0];
        if (i === 0) return full;
        return full * (1 - 0.75 * p);
      });
    }

    function yAt(t, scales) {
      let s = 0;
      for (let i = 0; i < base.length; i++) {
        const n = i * 2 + 1;
        s += scales[i] * base[i] * Math.sin(n * t);
      }
      return s;
    }

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      const scales = scalesForBeat(state.beat, p);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const mid = 95;
      // wave
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(24, mid);
      ctx.lineTo(W - 24, mid);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2.5;
      for (let x = 24; x <= W - 24; x++) {
        const t = ((x - 24) / (W - 48)) * Math.PI * 2;
        const y = mid - yAt(t, scales) * 48;
        if (x === 24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      // bars
      const barBase = H - 36;
      for (let i = 0; i < base.length; i++) {
        const n = i * 2 + 1;
        const bh = Math.max(4, scales[i] * base[i] * 90);
        const bx = 40 + i * 55;
        ctx.fillStyle = state.beat >= 2 ? "#0ea5e9" : "#a5b4fc";
        ctx.fillRect(bx, barBase - bh, 34, bh);
        ctx.fillStyle = "#475569";
        ctx.font = "11px sans-serif";
        ctx.fillText("n=" + n, bx + 2, barBase + 14);
        if (state.beat >= 1) {
          ctx.fillStyle = "#5b21b6";
          ctx.font = "10px sans-serif";
          ctx.fillText(i % 2 === 0 ? "a" : "b", bx + 10, barBase - bh - 4);
        }
      }

      ctx.fillStyle = "#0f766e";
      ctx.font = "12px sans-serif";
      if (state.beat === 0) ctx.fillText("測っている…（棒はまだ仮）", 300, 28);
      if (state.beat === 1) ctx.fillText("棒の高さ＝係数の大きさ", 300, 28);
      if (state.beat === 2) ctx.fillText("一覧表＝ミキサーのつまみ", 300, 28);
      if (state.beat === 3) ctx.fillText("細い成分を弱める → 波が丸く", 280, 28);
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** APP: drop high coeffs → resynthesize softer image/wave */
  function mountAppCompress(host) {
    const beats = ["全部の係数", "細かい棒を切る", "再合成", "ぼんやり＆軽い"];
    const captions = [
      "係数の一覧が全部ある（フルのレシピ）。",
      "人が気にしにくい細かい成分（高周波）の棒を下げる。",
      "残った係数だけで足し直す＝再合成。",
      "細部が落ち、データも減らせる（教育用モデル）。",
    ];
    const ui = mountShell(host, "図形証明：係数を捨てて再合成＝圧縮", beats);
    const state = { beat: 0, t: 0, beatDur: 2.5 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;
    const base = [1, 0.55, 0.35, 0.22, 0.14, 0.1, 0.08, 0.06];

    function keepMask(beat, p) {
      return base.map(function (_, i) {
        if (beat <= 0) return 1;
        if (beat === 1) {
          // progressively kill high i
          const cut = 2 + Math.floor(p * 5);
          return i < cut ? 1 : Math.max(0, 1 - p);
        }
        if (beat >= 2) {
          return i < 3 ? 1 : 0.08;
        }
        return 1;
      });
    }

    function yAt(u, mask) {
      let s = 0;
      for (let i = 0; i < base.length; i++) {
        const n = i + 1;
        s += mask[i] * base[i] * Math.sin(2 * Math.PI * n * u);
      }
      return s;
    }

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      const mask = keepMask(state.beat, p);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      // coefficient bars top
      for (let i = 0; i < base.length; i++) {
        const h = base[i] * mask[i] * 70;
        const bx = 30 + i * 36;
        const on = mask[i] > 0.2;
        ctx.fillStyle = on ? "#38bdf8" : "#cbd5e1";
        ctx.fillRect(bx, 90 - h, 26, Math.max(3, h));
        ctx.fillStyle = "#64748b";
        ctx.font = "10px sans-serif";
        ctx.fillText(String(i + 1), bx + 6, 104);
      }
      ctx.fillStyle = "#334155";
      ctx.font = "12px sans-serif";
      ctx.fillText("係数バー（細かい＝右の方）", 30, 20);

      // wave
      const mid = 175;
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(24, mid);
      ctx.lineTo(W - 24, mid);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = state.beat >= 3 ? "#f59e0b" : "#f43f5e";
      ctx.lineWidth = 2.5;
      for (let x = 24; x <= W - 24; x++) {
        const u = (x - 24) / (W - 48);
        const y = mid - yAt(u, mask) * 42;
        if (x === 24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      if (state.beat >= 2) {
        ctx.fillStyle = "#9f1239";
        ctx.font = "12px sans-serif";
        ctx.fillText("残りで Σ（再合成）", 400, 130);
      }
      if (state.beat >= 3) {
        ctx.fillStyle = "#b45309";
        ctx.fillText("細部↓　データ量↓（トレードオフ）", 360, 150);
      }
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** CAP: story map of the real path */
  function mountCapStoryMap(host) {
    const beats = ["画像＝波", "円の原子", "Σ で足す", "測って係数", "捨てて軽い"];
    const captions = [
      "入口: 画像の変化を波として見る（Hook）。",
      "原子: 円の高さ R sin(ωt+φ)。",
      "組み立て: 速さの違う波を Σ で足す。",
      "分量: 似ている度で係数を決める。",
      "出口: いらない係数を捨て再合成＝圧縮。複素はまだ不要。",
    ];
    const ui = mountShell(host, "図形証明：実数経路の一本の糸", beats);
    const state = { beat: 0, t: 0, beatDur: 2.2 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;
    const nodes = [
      { label: "Hook\n波", x: 70 },
      { label: "円\nR sin", x: 190 },
      { label: "級数\nΣ", x: 310 },
      { label: "係数\n似ている度", x: 430 },
      { label: "圧縮\n捨てる", x: 550 },
    ];

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      const lit = state.beat;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const cy = 110;
      // chain
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        const active = i < lit || (i === lit - 1 && p > 0.3);
        ctx.strokeStyle = active ? "#8b5cf6" : "#e2e8f0";
        ctx.lineWidth = active ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(a.x + 36, cy);
        ctx.lineTo(b.x - 36, cy);
        ctx.stroke();
        if (active) {
          const mx = a.x + 36 + (b.x - a.x - 72) * (i < lit ? 1 : p);
          ctx.fillStyle = "#8b5cf6";
          ctx.beginPath();
          ctx.arc(mx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.lineWidth = 1;

      nodes.forEach(function (nd, i) {
        const on = i <= lit;
        const now = i === lit;
        ctx.beginPath();
        ctx.fillStyle = now ? "#ddd6fe" : on ? "#e0f2fe" : "#f1f5f9";
        ctx.strokeStyle = now ? "#7c3aed" : on ? "#0ea5e9" : "#cbd5e1";
        ctx.lineWidth = now ? 3 : 2;
        ctx.arc(nd.x, cy, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = now ? "#5b21b6" : "#334155";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        const lines = nd.label.split("\n");
        lines.forEach(function (ln, li) {
          ctx.fillText(ln, nd.x, cy - 4 + li * 14);
        });
        ctx.textAlign = "start";
        ctx.lineWidth = 1;
      });

      // mini formula strip
      ctx.fillStyle = "#0f172a";
      ctx.font = "13px sans-serif";
      const formulas = [
        "変化 〜 波",
        "y = R sin(ωt+φ)",
        "f ≈ Σ (…)",
        "a_n, b_n 〜 似ている度",
        "弱い係数 → 0 → 再合成",
      ];
      ctx.fillStyle = "#5b21b6";
      ctx.font = "14px sans-serif";
      ctx.fillText(formulas[lit] || "", 40, 200);
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText("実数のまま完走できる。e^{iθ} は CAP 後の任意拡張。", 40, 228);
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** EULER (post-CAP): rotation pair → one symbol */
  function mountEulerPair(host) {
    const beats = ["単位円の点", "横＝cos", "縦＝sin", "ひとまとめ e^{iθ}"];
    const captions = [
      "点は単位円の上。今までと同じ回転。",
      "横の長さが cos θ（実部のイメージ）。",
      "縦の長さが sin θ（虚部のイメージ）。",
      "ペアを一つの記号 e^{iθ} にまとめる。中身は変わらない。",
    ];
    const ui = mountShell(host, "図形証明：回転のまとめ書き e^{iθ}", beats);
    const state = { beat: 0, t: 0, beatDur: 2.4 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      const ang = 0.7 + (state.beat >= 3 ? state.t * 0.9 : p * 0.5);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const cx = 150;
      const cy = 130;
      const R = 75;
      const px = cx + R * Math.cos(ang);
      const py = cy - R * Math.sin(ang);

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - R - 10, cy);
      ctx.lineTo(cx + R + 10, cy);
      ctx.moveTo(cx, cy - R - 10);
      ctx.lineTo(cx, cy + R + 10);
      ctx.stroke();

      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      // cos / sin projections
      if (state.beat >= 1) {
        ctx.strokeStyle = "#10b981";
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, cy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        const cbar = Math.cos(ang) * 90;
        ctx.fillStyle = "#34d399";
        ctx.fillRect(320, 100, cbar, 16);
        ctx.fillStyle = "#065f46";
        ctx.font = "12px sans-serif";
        ctx.fillText("cos θ（横・実部）", 320, 90);
      }
      if (state.beat >= 2) {
        const sbar = Math.sin(ang) * 90;
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(320, 150, sbar, 16);
        ctx.fillStyle = "#9f1239";
        ctx.font = "12px sans-serif";
        ctx.fillText("sin θ（縦・虚部）", 320, 140);
      }
      if (state.beat >= 3) {
        ctx.fillStyle = "#5b21b6";
        ctx.font = "16px sans-serif";
        ctx.fillText("e^{iθ} = cos θ + i sin θ", 300, 210);
        ctx.font = "12px sans-serif";
        ctx.fillText("新しい魔法ではなく、表記のまとめ", 300, 232);
      } else {
        ctx.fillStyle = "#334155";
        ctx.font = "13px sans-serif";
        ctx.fillText("点 = (cos θ, sin θ)", 300, 50);
      }
      ctx.lineWidth = 1;
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  /** TRANSFORM (post-CAP): family map */
  function mountTransformMap(host) {
    const beats = ["級数（今回）", "変換（見取り図）", "離散 DFT", "同じ分解の親戚"];
    const captions = [
      "あなたが通った主経路：周期的な波を sin/cos の和で。",
      "変換：もっと一般の信号への広がり（計算ドリルなし）。",
      "離散 DFT/FFT：配列・画像・音声の実務の近所。",
      "名前は違っても「分解して係数を見る」は共通。",
    ];
    const ui = mountShell(host, "図形証明：級数／変換／離散の地図", beats);
    const state = { beat: 0, t: 0, beatDur: 2.2 };
    const ctx = ui.ctx;
    const W = ui.canvas.width;
    const H = ui.canvas.height;
    const boxes = [
      { title: "級数", sub: "sin/cos の和", x: 70 },
      { title: "変換", sub: "見取り図", x: 250 },
      { title: "離散", sub: "DFT / FFT", x: 430 },
    ];

    function draw() {
      const p = clamp(state.t / (state.beatDur || 2.2), 0, 1);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      const lit =
        state.beat === 0 ? 0 : state.beat === 1 ? 1 : state.beat === 2 ? 2 : -1;

      boxes.forEach(function (b, i) {
        const on = lit === i || state.beat >= 3;
        const main = i === 0;
        const y = 70;
        ctx.fillStyle = on
          ? main
            ? "#dcfce7"
            : "#e0f2fe"
          : "#f1f5f9";
        ctx.strokeStyle = on
          ? main
            ? "#059669"
            : "#0284c7"
          : "#cbd5e1";
        ctx.lineWidth = on ? 3 : 1.5;
        roundRect(ctx, b.x, y, 140, 100, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(b.title, b.x + 36, y + 42);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText(b.sub, b.x + 28, y + 68);
        if (main) {
          ctx.fillStyle = "#059669";
          ctx.font = "11px sans-serif";
          ctx.fillText("← 今回の主経路", b.x + 18, y + 90);
        }
      });

      // arrows
      ctx.strokeStyle = state.beat >= 3 ? "#8b5cf6" : "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(210, 120);
      ctx.lineTo(248, 120);
      ctx.moveTo(390, 120);
      ctx.lineTo(428, 120);
      ctx.stroke();

      ctx.fillStyle = "#5b21b6";
      ctx.font = "13px sans-serif";
      if (state.beat === 0) ctx.fillText("実数経路でここを完走した", 70, 220);
      if (state.beat === 1) ctx.fillText("連続の世界の見取り図（手計算しない）", 70, 220);
      if (state.beat === 2) ctx.fillText("コンピュータの配列に近い", 70, 220);
      if (state.beat >= 3) {
        ctx.fillText("共通：波を部品に分け、係数（分量）を見る", 70, 210);
        ctx.fillText("JPEG の近所は、離散の世界", 70, 232);
      }
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    return wireBeats(ui, state, beats.length, draw, captions);
  }

  const REGISTRY = {
    wave_knobs: mountWaveKnobs,
    rad_arc: mountRadArc,
    super_add: mountSuperAdd,
    circle_height_trace: mountCircleHeight,
    ortho_cancel: mountOrthoCancel,
    ratio_pyth_shadow: mountRatioPythShadow,
    series_corner: mountSeriesCorner,
    coeff_mixer: mountCoeffMixer,
    app_compress_bars: mountAppCompress,
    cap_story_map: mountCapStoryMap,
    euler_pair: mountEulerPair,
    transform_map: mountTransformMap,
  };

  function mountGeometryProof(host, demoId) {
    if (!host) {
      return {
        destroy: function () {},
        forcePlay: function () {},
        go: function () {},
        stop: function () {},
      };
    }
    host.innerHTML = "";
    const fn = REGISTRY[demoId];
    if (!fn) {
      host.innerHTML =
        '<p class="muted">（この式の図形アニメはまだありません）</p>';
      return {
        destroy: function () {
          host.innerHTML = "";
        },
        forcePlay: function () {},
        go: function () {},
        stop: function () {},
      };
    }
    const ctl = fn(host);
    // legacy: some callers may treat return as destroy fn
    if (typeof ctl === "function") {
      return {
        destroy: ctl,
        forcePlay: function () {},
        go: function () {},
        stop: function () {},
      };
    }
    return ctl;
  }

  function hasGeometryDemo(demoId) {
    return !!(demoId && REGISTRY[demoId]);
  }

  FT.geometryProof = {
    mount: mountGeometryProof,
    has: hasGeometryDemo,
    registry: REGISTRY,
  };
})(window.FT = window.FT || {});
