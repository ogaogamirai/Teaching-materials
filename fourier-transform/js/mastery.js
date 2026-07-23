/* global FT */
(function (FT) {
  const STORAGE_KEY = "ft_mastery_v1";

  function defaultMastery() {
    return {
      version: 1,
      mode: "deep",
      onboardingDone: false,
      ratioForced: false,
      radForced: false,
      sumChapterForced: false,
      intChapterForced: false,
      nodes: {},
      diagnostic: {},
      checksPassed: {},
      tb_drafts: {},
      interactDone: {},
      learnDone: {},
      exampleDone: {},
      proofPassed: {},
      proofFailStreak: {},
      proofSkipped: {},
      proofGeoForced: {},
    };
  }

  function loadMastery() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultMastery();
      const data = JSON.parse(raw);
      const m = Object.assign(defaultMastery(), data, { nodes: data.nodes || {} });
      if (!m.proofFailStreak) m.proofFailStreak = {};
      if (!m.proofSkipped) m.proofSkipped = {};
      if (!m.proofGeoForced) m.proofGeoForced = {};
      if (!m.proofPassed) m.proofPassed = {};
      return m;
    } catch (e) {
      return defaultMastery();
    }
  }

  function saveMastery(m) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  }

  function ensureNode(m, id) {
    if (!m.nodes[id]) {
      m.nodes[id] = { state: "unknown", level: 0, fails: 0, updated: Date.now() };
    }
    return m.nodes[id];
  }

  function setNodeState(m, id, patch) {
    const n = ensureNode(m, id);
    Object.assign(n, patch, { updated: Date.now() });
    saveMastery(m);
    return n;
  }

  function markCheck(m, itemId, pass) {
    m.checksPassed[itemId] = !!pass;
    saveMastery(m);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    return defaultMastery();
  }

  FT.mastery = {
    defaultMastery,
    loadMastery,
    saveMastery,
    ensureNode,
    setNodeState,
    markCheck,
    resetAll,
  };
})(window.FT = window.FT || {});
