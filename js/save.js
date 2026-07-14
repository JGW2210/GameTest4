/* WORDLOOM — persistence. The grimoire survives every death. */
(function () {
  const KEY = 'wordloom-meta-v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      const d = JSON.parse(raw);
      return {
        parts: new Set(d.parts || []),
        solved: new Set(d.solved || []),
        runs: d.runs || 0,
        wins: d.wins || 0,
        bestNode: d.bestNode || 0,
      };
    } catch (e) { return fresh(); }
  }

  // Every grimoire begins with the first stitches: the notes that read
  // IGNA (a spark) and SANA (a salve).
  function fresh() {
    return {
      parts: new Set(['root:ign', 'suf:ign:small', 'root:san', 'suf:san:small', 'form:4']),
      solved: new Set(['IGNA', 'SANA']),
      runs: 0, wins: 0, bestNode: 0,
    };
  }

  function save(meta) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        parts: Array.from(meta.parts),
        solved: Array.from(meta.solved),
        runs: meta.runs, wins: meta.wins, bestNode: meta.bestNode,
      }));
    } catch (e) { /* private mode */ }
  }

  function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }

  window.LoomSave = { load, save, wipe, fresh };
})();
