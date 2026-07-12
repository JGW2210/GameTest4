/* ============================================================
 * LEXICON ARCANUM — persistence (localStorage)
 * Meta progress (grimoire, unlocks, wins) survives every run.
 * ============================================================ */
(function () {
  const META_KEY = 'lexicon-arcanum-meta-v1';
  const RUN_KEY = 'lexicon-arcanum-run-v2';

  function defaultMeta() {
    return {
      learnedWords: [],
      discoveredPower: [],
      totalWins: 0,
      winsByDifficulty: {},   // diffId -> count
      bestDifficultyWin: -1,
      classWins: {},          // classId -> count
      firstGuessCasts: 0,
      bestWorld: 1,
      runsPlayed: 0,
      spellsCast: 0,
    };
  }

  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return defaultMeta();
      return Object.assign(defaultMeta(), JSON.parse(raw));
    } catch (e) { return defaultMeta(); }
  }

  function saveMeta(meta) {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* storage full/blocked */ }
  }

  function saveRun(run) {
    try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch (e) {}
  }
  function loadRun() {
    try {
      const raw = localStorage.getItem(RUN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearRun() { try { localStorage.removeItem(RUN_KEY); } catch (e) {} }

  window.SaveSystem = { loadMeta, saveMeta, saveRun, loadRun, clearRun };
})();
