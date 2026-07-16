/* WORDLOOM — persistence. The grimoire survives every death.
 * Sixth weaving: the grimoire tracks a roster of discovered ELEMENTS
 * (each carrying its full grammar) and the highest DIFFICULTY unlocked.
 * Five elements are known from the first stitch: fire, water, air,
 * vitality, earth. meta.parts is materialized from the roster by the
 * engine's syncMeta (main.js calls it right after load). */
(function () {
  const KEY = 'wordloom-meta-v3';
  const OLD_KEYS = ['wordloom-meta-v2', 'wordloom-meta-v1'];
  const STARTERS = ['ign', 'aqu', 'aer', 'san', 'ter'];

  function load() {
    try {
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        // older saves: keep their secrets, solved words and tallies;
        // the roster starts at the five, and a past win opens tier 2
        for (const ok of OLD_KEYS) {
          const old = localStorage.getItem(ok);
          if (!old) continue;
          const d = JSON.parse(old);
          const meta = fresh();
          for (const id of (d.secrets || [])) meta.secrets.add(id);
          for (const w of (d.solved || [])) meta.solved.add(w);
          meta.runs = d.runs || 0; meta.wins = d.wins || 0; meta.bestNode = d.bestNode || 0;
          if (meta.wins > 0) meta.diff = 2;
          save(meta);
          return meta;
        }
        return fresh();
      }
      const d = JSON.parse(raw);
      return {
        elements: new Set(d.elements && d.elements.length ? d.elements : STARTERS),
        diff: Math.min(4, Math.max(1, d.diff || 1)),
        parts: new Set(d.parts || []),
        secrets: new Set(d.secrets || []),
        solved: new Set(d.solved || []),
        elderDrought: d.elderDrought || 0,
        runs: d.runs || 0,
        wins: d.wins || 0,
        bestNode: d.bestNode || 0,
      };
    } catch (e) { return fresh(); }
  }

  function fresh() {
    return {
      elements: new Set(STARTERS),
      diff: 1,
      parts: new Set(),
      secrets: new Set(),
      solved: new Set(['IGNA', 'SANA']),
      elderDrought: 0,
      runs: 0, wins: 0, bestNode: 0,
    };
  }

  function save(meta) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        elements: Array.from(meta.elements || STARTERS),
        diff: meta.diff || 1,
        parts: Array.from(meta.parts),
        secrets: Array.from(meta.secrets),
        solved: Array.from(meta.solved),
        elderDrought: meta.elderDrought || 0,
        runs: meta.runs, wins: meta.wins, bestNode: meta.bestNode,
      }));
    } catch (e) { /* private mode */ }
  }

  function wipe() { try { localStorage.removeItem(KEY); for (const k of OLD_KEYS) localStorage.removeItem(k); } catch (e) {} }

  window.LoomSave = { load, save, wipe, fresh };
})();
