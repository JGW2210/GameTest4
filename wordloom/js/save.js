/* WORDLOOM — persistence. The grimoire survives every death. */
(function () {
  const KEY = 'wordloom-meta-v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      const d = JSON.parse(raw);
      return {
        learned: new Set(d.learned || []),
        runs: d.runs || 0,
        wins: d.wins || 0,
        bestNode: d.bestNode || 0,
      };
    } catch (e) { return fresh(); }
  }

  // Every grimoire begins with the first two stitches: a spark and a salve.
  function fresh() { return { learned: new Set(['IGNA', 'SANA']), runs: 0, wins: 0, bestNode: 0 }; }

  function save(meta) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        learned: Array.from(meta.learned),
        runs: meta.runs, wins: meta.wins, bestNode: meta.bestNode,
      }));
    } catch (e) { /* private mode */ }
  }

  function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }

  window.LoomSave = { load, save, wipe, fresh };
})();
