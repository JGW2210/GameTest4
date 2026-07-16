/* WORDLOOM — persistence. The grimoire survives every death.
 * v2: notes + secret knowledge + solved words; migrates v1 saves
 * (numbered form ids become named forms).
 * Fifth weaving: the ten element ROOTS are day-one knowledge — every
 * grimoire holds them, new or old. Discovery lies beyond the roots
 * (and beneath them: the elder spellings stay secret). */
(function () {
  const KEY = 'wordloom-meta-v2';
  const OLD_KEY = 'wordloom-meta-v1';
  const FORM_MIGRATE = {
    'form:4': 'form:cantrip', 'form:5': 'form:word', 'form:6': 'form:bound',
    'form:7': 'form:weave', 'form:8': 'form:mirror', 'form:9': 'form:verse',
    'form:10': 'form:sovereign',
  };

  // the notes every grimoire is born holding: all ten roots, the two
  // starter small suffixes, and the Cantrip form (so IGNA and SANA read)
  function birthright() {
    const parts = window.Morph.ELEMENTS.map(e => 'root:' + e.id);
    return parts.concat(['suf:ign:small', 'suf:san:small', 'form:cantrip']);
  }

  function load() {
    try {
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        const old = localStorage.getItem(OLD_KEY);
        if (old) {
          const d = JSON.parse(old);
          const meta = fresh();
          for (const pid of (d.parts || [])) meta.parts.add(FORM_MIGRATE[pid] || pid);
          for (const w of (d.solved || [])) meta.solved.add(w);
          meta.runs = d.runs || 0; meta.wins = d.wins || 0; meta.bestNode = d.bestNode || 0;
          save(meta);
          return meta;
        }
        return fresh();
      }
      const d = JSON.parse(raw);
      const meta = {
        parts: new Set(d.parts || []),
        secrets: new Set(d.secrets || []),
        solved: new Set(d.solved || []),
        elderDrought: d.elderDrought || 0,
        runs: d.runs || 0,
        wins: d.wins || 0,
        bestNode: d.bestNode || 0,
      };
      for (const pid of birthright()) meta.parts.add(pid); // older saves gain the roots
      return meta;
    } catch (e) { return fresh(); }
  }

  function fresh() {
    return {
      parts: new Set(birthright()),
      secrets: new Set(),
      solved: new Set(['IGNA', 'SANA']),
      elderDrought: 0,
      runs: 0, wins: 0, bestNode: 0,
    };
  }

  function save(meta) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        parts: Array.from(meta.parts),
        secrets: Array.from(meta.secrets),
        solved: Array.from(meta.solved),
        elderDrought: meta.elderDrought || 0,
        runs: meta.runs, wins: meta.wins, bestNode: meta.bestNode,
      }));
    } catch (e) { /* private mode */ }
  }

  function wipe() { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch (e) {} }

  window.LoomSave = { load, save, wipe, fresh };
})();
