/* global FT */
(function (FT) {
  const KEYWORDS = {
    r1: ["画像", "圧縮", "波", "分解", "jpeg", "JPEG", "成分"],
    r2: ["波", "円", "係数", "振幅", "周波数", "sin", "cos", "成分"],
    r3: ["足", "重ね", "取り", "捨て", "係数", "似"],
    r4: ["係数", "和", "振幅", "周波数", "成分"],
    r5: ["ランダム", "間引", "周波数", "振幅", "誤解", "本当"],
    r6: ["よう", "みたい", "たとえ", "レシピ", "絵の具", "音"],
  };

  function scoreField(text, keys) {
    const t = (text || "").trim();
    if (t.length < 4) return 0;
    const hit = keys.some(function (k) {
      return t.indexOf(k) >= 0;
    });
    if (t.length >= 12 && hit) return 2;
    if (hit || t.length >= 10) return 1;
    return 0;
  }

  function scoreTeachback(payload, mode) {
    const scores = {};
    let total = 0;
    Object.keys(KEYWORDS).forEach(function (k) {
      const s = scoreField(payload[k], KEYWORDS[k]);
      scores[k] = s;
      total += s;
    });
    if (mode === "short") {
      const ok =
        scores.r1 >= 1 &&
        scores.r2 >= 1 &&
        scores.r3 >= 1 &&
        (payload.r1 || "").trim().length >= 4;
      return { pass: ok, total: total, scores: scores, threshold: "short" };
    }
    const pass = total >= 8 && scores.r1 >= 1 && scores.r3 >= 1;
    return { pass: pass, total: total, scores: scores, threshold: 8 };
  }

  function renderTeachbackForm(root, copy, nodeId, draft, mode) {
    const fields = copy.tb_prompts.fields;
    const prompt = mode === "full" ? copy.tb_prompts.full : copy.tb_prompts.short;
    const chips = ["波", "円", "係数", "振幅", "周波数", "足す", "捨てる", "似ている度", "低周波", "高周波"];
    root.innerHTML =
      '<p class="muted">' +
      prompt +
      '</p><div class="chips" id="tb-chips">' +
      chips
        .map(function (c) {
          return '<button type="button" class="chip" data-chip="' + c + '">' + c + "</button>";
        })
        .join("") +
      '</div><div class="stack" style="margin-top:0.6rem">' +
      fields
        .map(function (f) {
          if (mode === "short" && ["r1", "r2", "r3", "r5"].indexOf(f.id) < 0) return "";
          return (
            '<label class="tb-field"><span>' +
            f.label +
            '</span><textarea data-tb="' +
            f.id +
            '" placeholder="短文でOK">' +
            ((draft && draft[f.id]) || "") +
            "</textarea></label>"
          );
        })
        .join("") +
      '</div><div class="row" style="margin-top:0.75rem">' +
      '<button type="button" class="btn btn-primary" id="tb-submit">提出して自己チェック</button>' +
      '<button type="button" class="btn" id="tb-exemplar">模範を見る</button></div>' +
      '<div id="tb-result" class="hidden"></div><div id="tb-ex" class="panel hidden"></div>';

    let focusField = "r1";
    root.querySelectorAll("[data-tb]").forEach(function (el) {
      el.addEventListener("focus", function () {
        focusField = el.getAttribute("data-tb");
      });
    });
    root.querySelector("#tb-chips").addEventListener("click", function (e) {
      const t = e.target.closest("[data-chip]");
      if (!t) return;
      const ta = root.querySelector('[data-tb="' + focusField + '"]');
      if (!ta) return;
      ta.value = (ta.value + (ta.value ? " " : "") + t.getAttribute("data-chip")).trim();
      ta.focus();
    });
  }

  function readTeachback(root) {
    const payload = {};
    root.querySelectorAll("[data-tb]").forEach(function (el) {
      payload[el.getAttribute("data-tb")] = el.value;
    });
    return payload;
  }

  FT.teachback = {
    scoreTeachback: scoreTeachback,
    renderTeachbackForm: renderTeachbackForm,
    readTeachback: readTeachback,
  };
})(window.FT = window.FT || {});
