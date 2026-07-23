/* global FT */
(function (FT) {
  function flagOn(mastery, key) {
    const d = mastery.diagnostic || {};
    if (key === "ratioForced") return !!mastery.ratioForced;
    if (key === "radForced") return !!mastery.radForced;
    if (key === "sumChapterForced") return !!mastery.sumChapterForced;
    if (key === "intChapterForced") return !!mastery.intChapterForced;
    if (key === "conf_trig_false") return d.conf_trig === false;
    if (key === "conf_rad_false") return d.conf_rad === false;
    if (key === "conf_sum_false") return d.conf_sum === false;
    if (key === "conf_area_false") return d.conf_area === false;
    if (key === "conf_pyth_false") return d.conf_pyth === false;
    if (key === "D-TRIG-01_fail") return d["D-TRIG-01"] === "fail";
    if (key === "D-RAD-01_fail") return d["D-RAD-01"] === "fail";
    if (key === "D-SUM-01_fail") return d["D-SUM-01"] === "fail";
    if (key === "D-AREA-01_fail") return d["D-AREA-01"] === "fail";
    if (key === "D-PYTH-01_fail") return d["D-PYTH-01"] === "fail";
    return false;
  }

  function ruleMatches(mastery, whenList) {
    if (!whenList || !whenList.length) return false;
    for (let i = 0; i < whenList.length; i++) {
      if (flagOn(mastery, whenList[i])) return true;
    }
    return false;
  }

  function insertBefore(path, nodeId, beforeId) {
    if (path.indexOf(nodeId) >= 0) return;
    const i = path.indexOf(beforeId);
    if (i < 0) path.push(nodeId);
    else path.splice(i, 0, nodeId);
  }

  function buildPath(graph, mastery) {
    const path = graph.core_path.slice();
    const rules = graph.insert_rules || {};

    // RATIO before CIRCLE
    const ratioRule = rules["FT-RATIO-1"];
    if (ratioRule && ruleMatches(mastery, ratioRule.when)) {
      insertBefore(path, "FT-RATIO-1", ratioRule.before || "FT-CIRCLE-1");
    } else if (
      mastery.ratioForced ||
      (mastery.diagnostic && mastery.diagnostic.conf_trig === false) ||
      (mastery.diagnostic && mastery.diagnostic["D-TRIG-01"] === "fail")
    ) {
      insertBefore(path, "FT-RATIO-1", "FT-CIRCLE-1");
    }

    // RAD before CIRCLE, after RATIO if present (plan B)
    const radRule = rules["FT-RAD-1"];
    const needRad =
      (radRule && ruleMatches(mastery, radRule.when)) ||
      mastery.radForced ||
      (mastery.diagnostic && mastery.diagnostic.conf_rad === false) ||
      (mastery.diagnostic && mastery.diagnostic["D-RAD-01"] === "fail");
    if (needRad) {
      if (path.indexOf("FT-RAD-1") < 0) {
        const after = radRule && radRule.after_if_present;
        if (after && path.indexOf(after) >= 0) {
          const j = path.indexOf(after);
          path.splice(j + 1, 0, "FT-RAD-1");
        } else {
          insertBefore(path, "FT-RAD-1", (radRule && radRule.before) || "FT-CIRCLE-1");
        }
      }
    }

    return path;
  }

  /** Which embedded chapters should be emphasized for this learner */
  function activeChapters(graph, mastery, nodeId) {
    const flags = graph.chapter_flags || {};
    const out = [];
    Object.keys(flags).forEach(function (name) {
      const f = flags[name];
      if (f.host === nodeId && ruleMatches(mastery, f.when)) out.push(name);
    });
    // host node always lists its chapter ids from node meta when forced via name map
    const meta = graph.nodes[nodeId];
    if (meta && meta.chapters) {
      meta.chapters.forEach(function (ch) {
        if (ch === "sum" && ruleMatches(mastery, (flags.sum_chapter && flags.sum_chapter.when) || [])) {
          if (out.indexOf("sum_chapter") < 0) out.push("sum_chapter");
        }
        if (ch === "int" && ruleMatches(mastery, (flags.int_chapter && flags.int_chapter.when) || [])) {
          if (out.indexOf("int_chapter") < 0) out.push("int_chapter");
        }
        if (ch === "pyth" && ruleMatches(mastery, (flags.pyth_chapter && flags.pyth_chapter.when) || [])) {
          if (out.indexOf("pyth_chapter") < 0) out.push("pyth_chapter");
        }
      });
    }
    return out;
  }

  function isMastered(mastery, id, targetLevel) {
    const n = mastery.nodes[id];
    if (!n) return false;
    if (n.state === "mastered") return true;
    if (n.state === "skipped" && (n.level || 0) >= (targetLevel || 1)) return true;
    return (n.level || 0) >= (targetLevel || 3) && n.state !== "struggling";
  }

  function nextNode(graph, mastery) {
    const path = buildPath(graph, mastery);
    for (let i = 0; i < path.length; i++) {
      const id = path[i];
      const meta = graph.nodes[id];
      if (!meta) continue;
      if (!isMastered(mastery, id, meta.target_level)) return id;
    }
    return "COMPLETE";
  }

  function progressStats(graph, mastery) {
    const path = buildPath(graph, mastery);
    let done = 0;
    for (let i = 0; i < path.length; i++) {
      const id = path[i];
      if (isMastered(mastery, id, graph.nodes[id].target_level)) done += 1;
    }
    return { done: done, total: path.length, path: path };
  }

  function requiredChecksDone(graph, mastery, nodeId) {
    const checks = graph.nodes[nodeId].checks || [];
    return checks.every(function (c) {
      return mastery.checksPassed[c];
    });
  }

  FT.router = {
    buildPath: buildPath,
    isMastered: isMastered,
    nextNode: nextNode,
    progressStats: progressStats,
    requiredChecksDone: requiredChecksDone,
    activeChapters: activeChapters,
    ruleMatches: ruleMatches,
  };
})(window.FT = window.FT || {});
