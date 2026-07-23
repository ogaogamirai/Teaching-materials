/* global FT */
(function () {
  let loadMastery, saveMastery, ensureNode, setNodeState, markCheck, resetAll;
  let nextNode, progressStats, requiredChecksDone, isMastered;
  let renderTeachbackForm, readTeachback, scoreTeachback;
  function mountDemo(name, root, onInteract) { return FT.mountDemo(name, root, onInteract); }
  function unmountDemo() { return FT.unmountDemo(); }
  function bindApi() {
    const M = FT.mastery;
    const R = FT.router;
    const TB = FT.teachback;
    loadMastery = M.loadMastery;
    saveMastery = M.saveMastery;
    ensureNode = M.ensureNode;
    setNodeState = M.setNodeState;
    markCheck = M.markCheck;
    resetAll = M.resetAll;
    nextNode = R.nextNode;
    progressStats = R.progressStats;
    requiredChecksDone = R.requiredChecksDone;
    isMastered = R.isMastered;
    renderTeachbackForm = TB.renderTeachbackForm;
    readTeachback = TB.readTeachback;
    scoreTeachback = TB.scoreTeachback;
  }

const state = {
  graph: null,
  checks: null,
  copy: null,
  mastery: null,
  view: "home",
  nodeId: null,
  step: "learn", // learn | try | example | check | teachback
  checkIndex: 0,
  selectedChoice: null,
};

function $(id) {
  return document.getElementById(id);
}

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const el = $(`view-${name}`);
  if (el) el.classList.add("active");
  state.view = name;
  if (FT.hotspots) FT.hotspots.detach();
  unmountDemo();
}

function setProgress() {
  if (!state.graph) return;
  const { done, total } = progressStats(state.graph, state.mastery);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const bar = $("progress-bar");
  if (bar) bar.style.width = `${pct}%`;
  const lab = $("progress-label");
  if (lab) lab.textContent = `${done}/${total} ノード`;
}

function renderMap() {
  const ul = $("map-list");
  if (!ul || !state.graph) return;
  const { path } = progressStats(state.graph, state.mastery);
  const capDone = isMastered(
    state.mastery,
    "FT-CAP-1",
    state.graph.nodes["FT-CAP-1"].target_level
  );
  // Always list post-CAP optionals so Euler is discoverable; badge shows unlock state.
  const optional = state.graph.optional_after_cap || [];
  const all = path.slice();
  optional.forEach(function (id) {
    if (all.indexOf(id) < 0) all.push(id);
  });
  const cur = nextNode(state.graph, state.mastery);
  ul.innerHTML = "";
  if (optional.length) {
    const note = document.createElement("li");
    note.className = "map-note";
    note.innerHTML = capDone
      ? '<span class="muted">拡張（任意）: 実数経路クリア済み。e^{iθ} へ進めます。</span>'
      : '<span class="muted">拡張（任意）: <strong>回転の言葉 e^{iθ}</strong> などは下にあります。CAP 前でも予習可（推奨は CAP 後）。</span>';
    ul.append(note);
  }
  for (const id of all) {
    const meta = state.graph.nodes[id];
    if (!meta) continue;
    const n = ensureNode(state.mastery, id);
    const mastered = isMastered(state.mastery, id, meta.target_level);
    const isOpt = meta.tier === "optional";
    const li = document.createElement("li");
    if (id === cur) li.classList.add("current");
    if (mastered) li.classList.add("done");
    if (isOpt) li.classList.add("map-optional");
    let badge;
    if (isOpt) {
      badge = mastered ? "optional done" : capDone ? "optional" : "optional 予習可";
    } else if (mastered) {
      badge = "mastered";
    } else if (n.state === "skipped") {
      badge = "skipped";
    } else {
      badge = "learning";
    }
    li.innerHTML =
      "<span>" +
      meta.title +
      '<br><span class="muted" style="font-size:0.75rem">' +
      id +
      (isOpt ? " · CAP後の任意拡張" : "") +
      "</span></span>" +
      '<span class="badge ' +
      (isOpt ? "optional" : badge) +
      '">' +
      badge +
      "</span>";
    li.addEventListener("click", function () {
      openNode(id);
    });
    ul.append(li);
  }
  setProgress();
}

function openNode(id) {
  if (!state.graph.nodes[id]) return;
  state.nodeId = id;
  state.step = "learn";
  state.checkIndex = 0;
  state.selectedChoice = null;
  ensureNode(state.mastery, id);
  if (state.mastery.nodes[id].state === "unknown") {
    setNodeState(state.mastery, id, { state: "learning" });
  }
  showView("node");
  renderNode();
}

function capIsDone() {
  const meta = state.graph && state.graph.nodes["FT-CAP-1"];
  if (!meta) return false;
  return isMastered(state.mastery, "FT-CAP-1", meta.target_level);
}

function nodeSteps(meta) {
  const steps = ["learn", "try", "example", "check"];
  if (meta.teachback) steps.push("teachback");
  return steps;
}

function currentMode() {
  const m = (state.mastery && state.mastery.mode) || "deep";
  if (m === "sprint" || m === "teach" || m === "deep") return m;
  return "deep";
}

function applyModeToDom() {
  const mode = currentMode();
  document.body.classList.remove("mode-sprint", "mode-deep", "mode-teach");
  document.body.classList.add("mode-" + mode);
  const sel = $("mode-live");
  if (sel && sel.value !== mode) sel.value = mode;
  const diag = $("mode-select");
  if (diag && diag.value !== mode) diag.value = mode;
}

function renderLearn(copy) {
  const host = $("learn-host");
  const id = state.nodeId;
  const mode = currentMode();
  const sprint = mode === "sprint";
  const teach = mode === "teach";
  const chapters = FT.router.activeChapters
    ? FT.router.activeChapters(state.graph, state.mastery, id)
    : [];
  const labels = state.copy.chapter_labels || {};
  let head = "";
  if (copy.goal_link && !sprint) {
    head +=
      '<p class="kv"><strong>ゴール接続:</strong> ' + copy.goal_link + "</p>";
  }
  if (chapters.length) {
    head +=
      '<p class="muted">診断により前提章を表示: <strong>' +
      chapters
        .map(function (c) {
          return labels[c] || c;
        })
        .join(" / ") +
      "</strong></p>";
  }
  const lesson = (copy.lesson || copy.reveal || [])
    .map(function (p) {
      return "<p>" + p + "</p>";
    })
    .join("");
  const terms = copy.terms || [];
  const termHtml = terms.length
    ? '<table class="term-table"><tbody>' +
      terms
        .map(function (t) {
          return "<tr><th>" + t.name + "</th><td>" + t.def + "</td></tr>";
        })
        .join("") +
      "</tbody></table>"
    : "";
  const mcs = copy.misconceptions || [];
  const mcHtml = mcs.length
    ? '<p class="kv"><strong>つまずきポイント</strong></p><ul class="mc-list">' +
      mcs
        .map(function (m) {
          return "<li>" + m + "</li>";
        })
        .join("") +
      "</ul>"
    : "";
  const take = copy.takeaway
    ? '<div class="takeaway">ひとこと: ' + copy.takeaway + "</div>"
    : "";
  const mathRoot = state.math || FT.DATA_MATH || null;
  const mathHtml =
    FT.mathRender && mathRoot
      ? FT.mathRender.buildLearnExtra(mathRoot, id, chapters, labels)
      : "";
  const showProof = FT.proofUI && FT.proofUI.hasProof(id);
  const depthBody =
    '<div class="lesson-block"><p class="kv"><strong>本編</strong></p>' +
    lesson +
    "</div>" +
    (termHtml ? '<p class="kv"><strong>ことば</strong></p>' + termHtml : "") +
    mcHtml +
    mathHtml;
  const depthBlock =
    sprint && showProof
      ? '<details class="proof-fold learn-depth"><summary>本編・ことば・数式カード（情報はここに残しています）</summary>' +
        depthBody +
        "</details>"
      : depthBody;
  const whyBlock = copy.why
    ? sprint
      ? '<details class="proof-fold why-box why-fold"><summary><strong>なぜ今これを学ぶか</strong></summary><p>' +
        copy.why +
        "</p></details>"
      : '<div class="why-box"><strong>なぜ今これを学ぶか</strong><br>' +
        copy.why +
        "</div>"
    : "";

  host.innerHTML =
    whyBlock +
    head +
    (showProof ? '<div id="proof-host" class="proof-mount"></div>' : "") +
    depthBlock +
    take;

  if (teach) {
    host.querySelectorAll("details.learn-depth, details.why-fold").forEach(function (d) {
      d.open = true;
    });
  }
  if (showProof) {
    const ph = host.querySelector("#proof-host");
    if (state._proofCtl && state._proofCtl.destroy) state._proofCtl.destroy();
    state._proofCtl = FT.proofUI.mountProof(ph, id, state.mastery, function (scriptId) {
      if (!state.mastery.proofPassed) state.mastery.proofPassed = {};
      state.mastery.proofPassed[scriptId] = true;
      saveMastery(state.mastery);
    });
  }
}

function renderTry(id, meta, copy) {
  const guide = copy.guide || [];
  const gh = $("try-guide");
  gh.innerHTML =
    '<p class="kv"><strong>やること（順に）</strong></p><ol class="guide-list">' +
    guide.map(function (g) { return "<li>" + g + "</li>"; }).join("") +
    "</ol>";
  $("interact-hint").textContent = copy.interact_hint || "";
  $("observe-prompt").textContent = copy.observe_prompt || "";
  const host = $("demo-host");
  if (FT.hotspots) FT.hotspots.detach();
  mountDemo(meta.demo, host, function () {
    state.mastery.interactDone[id] = true;
    saveMastery(state.mastery);
    $("interact-done-flag").textContent = "操作を記録しました（ガイドを一通り試せたら次へ）";
  });
  if (FT.hotspots) FT.hotspots.attach(host, id);
  $("interact-done-flag").textContent = state.mastery.interactDone[id]
    ? "操作を記録しました（ガイドを一通り試せたら次へ）"
    : "ガイドに沿ってスライダやボタンを動かしてください";
}

function renderExample(copy) {
  const host = $("example-host");
  const ex = copy.example || {};
  const body = (ex.body || []).map(function (p) { return "<p>" + p + "</p>"; }).join("");
  host.innerHTML =
    '<h2 class="example-title">' + (ex.title || "例") + "</h2>" +
    '<div class="lesson-block">' + body + "</div>" +
    (copy.takeaway ? '<div class="takeaway">戻る一言: ' + copy.takeaway + "</div>" : "") +
    '<p class="muted" style="margin-top:0.75rem">例でイメージがついたら、確認で定着を確かめます。不安なら「学ぶ」に戻ってOKです。</p>';
}

function renderNode() {
  const id = state.nodeId;
  const meta = state.graph.nodes[id];
  const copy = state.copy.nodes[id] || {};
  applyModeToDom();
  $("node-title").textContent = meta.title;
  $("node-id").textContent = id;
  const blurb = $("process-blurb");
  if (blurb) {
    const mode = currentMode();
    let base = state.copy.process_blurb || "";
    if (mode === "sprint") {
      base =
        "sprint: 一言→式→パズルが先。くわしい説明は折りたたみに残しています。";
    } else if (mode === "teach") {
      base =
        "teach: 説明を厚く展開。人に教える前提で読み、Teach-Back まで。";
    }
    if (meta.tier === "optional") {
      base =
        (capIsDone()
          ? "任意拡張（CAP 後）: "
          : "任意拡張（予習可・推奨は CAP 後）: ") +
        "実数経路の必須ではありません。" +
        (base ? " " + base : "");
    }
    blurb.textContent = base;
  }

  const steps = nodeSteps(meta);
  document.querySelectorAll(".step-tabs .btn").forEach(function (b) {
    const step = b.dataset.step;
    b.classList.toggle("active", step === state.step);
    b.classList.toggle("hidden", steps.indexOf(step) < 0);
  });

  $("node-learn").classList.toggle("hidden", state.step !== "learn");
  $("node-try").classList.toggle("hidden", state.step !== "try");
  $("node-example").classList.toggle("hidden", state.step !== "example");
  $("node-check").classList.toggle("hidden", state.step !== "check");
  $("node-tb").classList.toggle("hidden", state.step !== "teachback");

  if (state.step === "learn") renderLearn(copy);
  if (state.step === "try") renderTry(id, meta, copy);
  if (state.step === "example") renderExample(copy);
  if (state.step === "check") renderCheck();
  if (state.step === "teachback") renderTb();

  updateNodeNav();
}

function updateNodeNav() {
  const id = state.nodeId;
  const meta = state.graph.nodes[id];
  const steps = nodeSteps(meta);
  const idx = steps.indexOf(state.step);
  $("btn-step-prev").disabled = idx <= 0;
  const labels = {
    learn: "次へ：やってみる",
    try: "次へ：例で定着",
    example: "次へ：確認",
    check: meta.teachback ? "次へ：教え返し" : "ノード完了を判定",
    teachback: "ノード完了を判定",
  };
  $("btn-step-next").textContent = labels[state.step] || "次へ";
}

function renderCheck() {
  const id = state.nodeId;
  const list = state.graph.nodes[id].checks || [];
  const host = $("check-host");
  if (!list.length) {
    host.innerHTML = `<p class="muted">このノードに必須チェックはありません。</p>`;
    return;
  }
  if (state.checkIndex >= list.length) state.checkIndex = 0;
  const itemId = list[state.checkIndex];
  const item = state.checks[itemId];
  if (!item) {
    host.innerHTML = `<p>項目 ${itemId} が見つかりません</p>`;
    return;
  }
  state.selectedChoice = null;
  const passed = !!state.mastery.checksPassed[itemId];
  host.innerHTML = `
    <p class="kv">チェック ${state.checkIndex + 1}/${list.length} · <strong>${itemId}</strong>
      ${passed ? '<span class="badge mastered">済み</span>' : ""}</p>
    <p>${item.prompt}</p>
    <div class="stack" id="choices"></div>
    <div id="check-feedback"></div>
    <div class="row" style="margin-top:0.75rem">
      <button type="button" class="btn btn-primary" id="btn-grade" ${passed ? "disabled" : ""}>回答する</button>
      <button type="button" class="btn" id="btn-next-check" ${passed ? "" : "disabled"}>次の問題</button>
    </div>
  `;
  const box = host.querySelector("#choices");
  for (const c of item.choices) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.textContent = c.label;
    b.dataset.id = c.id;
    if (passed && item.correct.includes(c.id)) b.classList.add("correct");
    b.addEventListener("click", () => {
      if (state.mastery.checksPassed[itemId]) return;
      state.selectedChoice = c.id;
      box.querySelectorAll(".choice").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    box.append(b);
  }
  host.querySelector("#btn-grade").addEventListener("click", () => gradeCheck(itemId, item));
  host.querySelector("#btn-next-check").addEventListener("click", () => {
    if (state.checkIndex < list.length - 1) {
      state.checkIndex += 1;
      renderCheck();
    } else if (requiredChecksDone(state.graph, state.mastery, id)) {
      const meta = state.graph.nodes[id];
      goStep(meta.teachback ? "teachback" : "check");
      if (!meta.teachback) tryCompleteNode();
    }
  });
}

function gradeCheck(itemId, item) {
  const fb = $("check-feedback") || document.querySelector("#check-feedback");
  if (!state.selectedChoice) {
    fb.innerHTML = `<div class="feedback bad">選択肢をタップしてください（数式入力は不要です）。</div>`;
    return;
  }
  const pass = item.correct.includes(state.selectedChoice);
  markCheck(state.mastery, itemId, pass);
  const n = ensureNode(state.mastery, state.nodeId);
  if (pass) {
    setNodeState(state.mastery, state.nodeId, {
      fails: 0,
      level: Math.max(n.level || 0, 2),
      state: "learning",
    });
    fb.innerHTML = `<div class="feedback">${item.feedback.correct}</div>`;
    document.querySelectorAll("#choices .choice").forEach((el) => {
      if (item.correct.includes(el.dataset.id)) el.classList.add("correct");
    });
    const btn = document.getElementById("btn-next-check");
    if (btn) btn.disabled = false;
    const g = document.getElementById("btn-grade");
    if (g) g.disabled = true;
  } else {
    const fails = (n.fails || 0) + 1;
    setNodeState(state.mastery, state.nodeId, {
      fails,
      state: fails >= 2 ? "struggling" : "learning",
    });
    const msg =
      (item.feedback.wrong && item.feedback.wrong[state.selectedChoice]) ||
      "もう一度どうぞ。";
    fb.innerHTML = `<div class="feedback bad">${msg}</div>`;
    if (fails >= 2) {
      const rem = state.graph.nodes[state.nodeId].remediation || [];
      rem.forEach(function (r) {
        if (r === "FT-RATIO-1") state.mastery.ratioForced = true;
        if (r === "FT-RAD-1") state.mastery.radForced = true;
      });
      if (state.nodeId === "FT-SERIES-1") state.mastery.sumChapterForced = true;
      if (state.nodeId === "FT-COEFF-1") state.mastery.intChapterForced = true;
      saveMastery(state.mastery);
      if (rem.length) {
        fb.innerHTML += `<p class="muted">つまずきを検知。補修候補: ${rem.join(", ")}（地図から戻れます）</p>`;
      }
    }
  }
  setProgress();
}

function renderTb() {
  const id = state.nodeId;
  const meta = state.graph.nodes[id];
  const host = $("tb-host");
  if (!meta.teachback) {
    host.innerHTML = `<p class="muted">このノードに Teach-Back はありません。「ノード完了」へ。</p>`;
    return;
  }
  const mode = meta.teachback === "full" ? "full" : "short";
  const draft = state.mastery.tb_drafts[id] || {};
  renderTeachbackForm(host, state.copy, id, draft, mode);
  host.querySelector("#tb-submit").addEventListener("click", () => {
    const payload = readTeachback(host);
    state.mastery.tb_drafts[id] = payload;
    saveMastery(state.mastery);
    const result = scoreTeachback(payload, mode);
    const box = host.querySelector("#tb-result");
    box.classList.remove("hidden");
    if (result.pass) {
      const level = mode === "full" ? 3 : Math.max(ensureNode(state.mastery, id).level || 0, 3);
      setNodeState(state.mastery, id, {
        state: "mastered",
        level,
        fails: 0,
      });
      box.innerHTML = `<div class="feedback">合格（スコア目安 ${result.total}）。${
        mode === "full" ? "縦一列完了です！" : "このノードを mastered にしました。"
      }</div>`;
      setProgress();
      if (mode === "full") renderComplete();
    } else {
      box.innerHTML = `<div class="feedback bad">もう少し具体的に（目安合計 ${result.total}${
        mode === "full" ? " / 合格≥8 かつ欄1と3" : ""
      }）。チップも使えます。</div>`;
    }
  });
  host.querySelector("#tb-exemplar").addEventListener("click", () => {
    const ex = state.copy.exemplars[id] || state.copy.exemplars["FT-CAP-1"];
    const box = host.querySelector("#tb-ex");
    box.classList.remove("hidden");
    box.innerHTML = `<h2>模範例（差分学習用）</h2>` +
      Object.entries(ex || {})
        .map(([k, v]) => `<p><strong>${k}</strong>: ${v}</p>`)
        .join("");
  });
}

function goStep(step) {
  const meta = state.graph.nodes[state.nodeId];
  const steps = nodeSteps(meta);
  if (steps.indexOf(step) < 0) {
    if (step === "teachback") { tryCompleteNode(); return; }
    step = steps[0];
  }
  state.step = step;
  renderNode();
}

function nextStep() {
  const id = state.nodeId;
  const meta = state.graph.nodes[id];
  const steps = nodeSteps(meta);
  const idx = steps.indexOf(state.step);
  if (idx < steps.length - 1) {
    if (state.step === "learn") {
      if (!state.mastery.learnDone) state.mastery.learnDone = {};
      state.mastery.learnDone[id] = true;
      saveMastery(state.mastery);
    }
    if (state.step === "try" && !state.mastery.interactDone[id]) {
      // soft gate: encourage but allow with confirm
      if (!confirm("まだ操作が記録されていません。ガイドを試さずに進みますか？")) return;
      state.mastery.interactDone[id] = true;
      saveMastery(state.mastery);
    }
    if (state.step === "example") {
      if (!state.mastery.exampleDone) state.mastery.exampleDone = {};
      state.mastery.exampleDone[id] = true;
      saveMastery(state.mastery);
    }
    if (state.step === "check" && !requiredChecksDone(state.graph, state.mastery, id)) {
      alert("確認をすべて正解してから進んでください。わからなければ「学ぶ」に戻れます。");
      return;
    }
    goStep(steps[idx + 1]);
  } else {
    tryCompleteNode();
  }
}

function tryCompleteNode() {
  const id = state.nodeId;
  const meta = state.graph.nodes[id];
  if (!state.mastery.learnDone) state.mastery.learnDone = {};
  if (!state.mastery.learnDone[id]) {
    if (!confirm("「学ぶ」をまだ終えていないようです。そのまま完了判定しますか？")) {
      goStep("learn");
      return;
    }
    state.mastery.learnDone[id] = true;
  }
  if (!state.mastery.interactDone[id]) {
    state.mastery.interactDone[id] = true;
    saveMastery(state.mastery);
  }
  if (!requiredChecksDone(state.graph, state.mastery, id)) {
    alert("チェックが未完了です。");
    goStep("check");
    return;
  }
  if (meta.teachback === "full" && state.mastery.nodes[id]?.state !== "mastered") {
    alert("Capstone の Teach-Back に合格してください。");
    goStep("teachback");
    return;
  }
  if (meta.teachback === "short") {
    const tb = state.mastery.tb_drafts[id];
    const scored = scoreTeachback(tb || {}, "short");
    if (!scored.pass) {
      alert("短い Teach-Back を記入し、提出して合格してください。");
      goStep("teachback");
      return;
    }
    setNodeState(state.mastery, id, {
      state: "mastered",
      level: meta.target_level,
    });
  } else if (!meta.teachback) {
    setNodeState(state.mastery, id, {
      state: "mastered",
      level: meta.target_level,
    });
  }
  setProgress();
  const n = nextNode(state.graph, state.mastery);
  if (n === "COMPLETE") {
    renderComplete();
    showView("complete");
  } else {
    openNode(n);
  }
}

function renderComplete() {
  const ex = state.copy.exemplars["FT-CAP-1"] || {};
  const draft = state.mastery.tb_drafts["FT-CAP-1"] || {};
  const sheet = [
    "# チートシート（自動）",
    "",
    "1. 画像の変化は波として見られる",
    "2. 波は円（sin/cos）の足し算で近似できる",
    "3. 係数は「似ている度」で決まる",
    "4. 圧縮は係数を選んで捨てること",
    "5. 複素数は便利なまとめ書き（必須ではない）",
    "",
    "## あなたの Teach-Back 下書き",
    draft.r1 || ex.r1 || "",
    draft.r3 || ex.r3 || "",
    draft.r6 || ex.r6 || "",
  ].join("\n");
  $("complete-sheet").textContent = sheet;
  const ext = $("complete-ext");
  if (ext) {
    ext.innerHTML =
      '<p class="kv"><strong>任意の続き</strong></p>' +
      '<div class="row">' +
      '<button type="button" class="btn btn-primary" id="btn-goto-euler">回転の言葉 e^{iθ} へ</button>' +
      '<button type="button" class="btn" id="btn-goto-transform">級数／変換／離散の地図へ</button>' +
      "</div>" +
      '<p class="muted">オイラーの公式は「新しい魔法」ではなく、cos と sin のまとめ書きです。</p>';
    const be = $("btn-goto-euler");
    const bt = $("btn-goto-transform");
    if (be) be.addEventListener("click", function () { openNode("FT-EULER-1"); });
    if (bt) bt.addEventListener("click", function () { openNode("FT-TRANSFORM-1"); });
  }
}

function renderDiagnostic() {
  showView("diag");
}

function runDiagnosticFlow() {
  const conf_trig = $("conf_trig").checked;
  const conf_rad = $("conf_rad").checked;
  const conf_pyth = $("conf_pyth").checked;
  const conf_sum = $("conf_sum").checked;
  const conf_area = $("conf_area").checked;
  const conf_wave = $("conf_wave").checked;
  const conf_image = $("conf_image").checked;
  const conf_series = $("conf_series").checked;
  const mode = $("mode-select").value;
  state.mastery.mode = mode;
  state.mastery.diagnostic = {
    conf_trig: conf_trig,
    conf_rad: conf_rad,
    conf_pyth: conf_pyth,
    conf_sum: conf_sum,
    conf_area: conf_area,
    conf_wave: conf_wave,
    conf_image: conf_image,
    conf_series: conf_series,
  };
  // 申告が yes の項目だけ確認1問（no は無条件で枝を入れる）
  state.diagQueue = ["D-HOOK-01"];
  if (conf_trig) state.diagQueue.push("D-TRIG-01");
  if (conf_rad) state.diagQueue.push("D-RAD-01");
  if (conf_pyth) state.diagQueue.push("D-PYTH-01");
  if (conf_sum) state.diagQueue.push("D-SUM-01");
  if (conf_area) state.diagQueue.push("D-AREA-01");
  if (conf_wave) state.diagQueue.push("D-WAVE-01");
  state.diagPos = 0;
  saveMastery(state.mastery);
  showDiagItem();
}

function showDiagItem() {
  const host = $("diag-item");
  if (state.diagPos >= state.diagQueue.length) {
    finishDiagnostic();
    return;
  }
  const itemId = state.diagQueue[state.diagPos];
  const item = state.checks[itemId];
  state.selectedChoice = null;
  host.innerHTML = `
    <p class="kv">確認 ${state.diagPos + 1}/${state.diagQueue.length} · ${itemId}</p>
    <p>${item.prompt}</p>
    <div class="stack" id="diag-choices"></div>
    <button type="button" class="btn btn-primary" id="diag-grade">回答</button>
    <div id="diag-fb"></div>
  `;
  const box = host.querySelector("#diag-choices");
  item.choices.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.textContent = c.label;
    b.addEventListener("click", () => {
      state.selectedChoice = c.id;
      box.querySelectorAll(".choice").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    box.append(b);
  });
  host.querySelector("#diag-grade").addEventListener("click", () => {
    if (!state.selectedChoice) return;
    const pass = item.correct.includes(state.selectedChoice);
    state.mastery.diagnostic[itemId] = pass ? "pass" : "fail";
    if (itemId === "D-TRIG-01") state.mastery.ratioForced = !pass;
    if (itemId === "D-PYTH-01" && !pass) state.mastery.ratioForced = true;
    if (itemId === "D-RAD-01") state.mastery.radForced = !pass;
    if (itemId === "D-SUM-01") state.mastery.sumChapterForced = !pass;
    if (itemId === "D-AREA-01") state.mastery.intChapterForced = !pass;
    saveMastery(state.mastery);
    const fb = host.querySelector("#diag-fb");
    fb.innerHTML = `<div class="feedback ${pass ? "" : "bad"}">${
      pass ? item.feedback.correct : item.feedback.wrong?.[state.selectedChoice] || "要復習"
    }</div>`;
    setTimeout(() => {
      state.diagPos += 1;
      showDiagItem();
    }, 550);
  });
}

function finishDiagnostic() {
  state.mastery.onboardingDone = true;
  const d = state.mastery.diagnostic;
  // 申告 no → 無条件挿入／章フラグ（確認問題はスキップ）
  if (d.conf_trig === false || d.conf_pyth === false) state.mastery.ratioForced = true;
  if (d.conf_rad === false) state.mastery.radForced = true;
  if (d.conf_sum === false) state.mastery.sumChapterForced = true;
  if (d.conf_area === false) state.mastery.intChapterForced = true;
  saveMastery(state.mastery);
  renderMap();
  showView("map");
  const path = FT.router.buildPath(state.graph, state.mastery);
  const note = $("diag-item");
  if (note) {
    note.innerHTML =
      '<p class="muted">経路に入る前提: ' +
      path.filter(function (id) {
        return id === "FT-RATIO-1" || id === "FT-RAD-1";
      }).join(", ") +
      (path.indexOf("FT-RATIO-1") < 0 && path.indexOf("FT-RAD-1") < 0 ? "（なし）" : "") +
      "</p>";
  }
  const n = nextNode(state.graph, state.mastery);
  if (n !== "COMPLETE") openNode(n);
}

function setMode(mode) {
  if (mode !== "sprint" && mode !== "deep" && mode !== "teach") mode = "deep";
  if (!state.mastery) return;
  state.mastery.mode = mode;
  saveMastery(state.mastery);
  applyModeToDom();
  if (state.view === "node" && state.nodeId) renderNode();
}

function wire() {
  $("btn-start").addEventListener("click", () => {
    if (state.mastery.onboardingDone) {
      renderMap();
      showView("map");
    } else renderDiagnostic();
  });
  $("btn-map").addEventListener("click", () => {
    renderMap();
    showView("map");
  });
  $("btn-reset").addEventListener("click", () => {
    if (confirm("学習履歴を消去しますか？")) {
      state.mastery = resetAll();
      applyModeToDom();
      setProgress();
      showView("home");
    }
  });
  const modeLive = $("mode-live");
  if (modeLive) {
    modeLive.addEventListener("change", function () {
      setMode(modeLive.value);
    });
  }
  const modeDiag = $("mode-select");
  if (modeDiag) {
    modeDiag.addEventListener("change", function () {
      setMode(modeDiag.value);
    });
  }
  $("btn-diag-go").addEventListener("click", runDiagnosticFlow);
  $("btn-step-prev").addEventListener("click", () => {
    const meta = state.graph.nodes[state.nodeId];
    const steps = nodeSteps(meta);
    const idx = steps.indexOf(state.step);
    if (idx > 0) goStep(steps[idx - 1]);
  });
  $("btn-step-next").addEventListener("click", nextStep);
  document.querySelectorAll(".step-tabs .btn").forEach((b) => {
    b.addEventListener("click", () => goStep(b.dataset.step));
  });
  const btnLearn = $("btn-learn-done");
  if (btnLearn) btnLearn.addEventListener("click", () => nextStep());
  const btnEx = $("btn-example-done");
  if (btnEx) btnEx.addEventListener("click", () => nextStep());
  $("btn-continue-learning").addEventListener("click", () => {
    const n = nextNode(state.graph, state.mastery);
    if (n === "COMPLETE") {
      showView("complete");
      renderComplete();
    } else openNode(n);
  });
  const btnEulerMap = $("btn-goto-euler-map");
  if (btnEulerMap) {
    btnEulerMap.addEventListener("click", function () {
      openNode("FT-EULER-1");
    });
  }
}

function bootError(msg) {
  const el = $("boot-error");
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.classList.remove("hidden");
  const t = $("app-title");
  if (t) t.textContent = "起動エラー";
}

function main() {
  try {
    if (!window.FT || !FT.DATA_GRAPH || !FT.DATA_CHECKS || !FT.DATA_COPY || !FT.DATA_MATH || !FT.DATA_HOTSPOTS || !FT.DATA_PROOF || !FT.DATA_READINGS) {
      bootError("埋め込みデータ(FT.DATA_*)が見つかりません。js/data_bundle.js の読込を確認してください。");
      return;
    }
    if (!FT.mastery || !FT.router || !FT.teachback || !FT.mountDemo || !FT.mathRender || !FT.hotspots || !FT.proofUI || !FT.readings) {
      bootError("コアモジュールの読込に失敗しました（readings/proof_ui 含む）。スクリプト順序を確認してください。");
      return;
    }
    bindApi();
    state.graph = FT.DATA_GRAPH;
    state.checks = FT.DATA_CHECKS;
    state.copy = FT.DATA_COPY;
    state.math = FT.DATA_MATH;
    state.mastery = loadMastery();
  } catch (e) {
    console.error(e);
    bootError("起動時エラー: " + (e && e.message ? e.message : e));
    return;
  }
  try {
    $("app-title").textContent = state.copy.app_title;
    $("app-sub").textContent = state.copy.app_sub;
    wire();
    applyModeToDom();
    setProgress();
    if (state.mastery.onboardingDone) {
      renderMap();
    }
    showView("home");
    const ok = $("boot-ok");
    if (ok) {
      ok.textContent = "準備完了 — 「はじめる」を押してください";
      ok.classList.remove("hidden");
    }
  } catch (e) {
    console.error(e);
    bootError("初期化エラー: " + (e && e.message ? e.message : e));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
})();
