/* ============================================================
 * WORDLOOM — The Weavers (classes)
 * A class sets how much of the lexicon your fingers can reach
 * unaided: chipMax is the longest word the loom will SUGGEST as a
 * quick chip. Anything readable can still be spelled by hand.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Weavers = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const CLASSES = [
    {
      id: 'scrivener', name: 'The Scrivener', icon: '🪶',
      tagline: 'Balanced. The loom suggests words up to 6 runes; the Ribbon Index extends it.',
      desc: 'A careful hand and a patient eye. Nothing missing, nothing wasted.',
      hp: 52, tray: 12, chipMax: 6, power: 1,
      unlock: null,
    },
    {
      id: 'lector', name: 'The Lector', icon: '🔮',
      tagline: 'Fluent. The loom suggests EVERY readable word — but the tray holds only 11 tiles.',
      desc: 'Reads the whole language at a glance. Spells it with cramped, impatient fingers.',
      hp: 46, tray: 11, chipMax: 99, power: 1,
      unlock: { notes: 20 }, unlockText: 'Hold 20 grimoire notes to unlock',
    },
    {
      id: 'cantor', name: 'The Cantor', icon: '⚔️',
      tagline: 'By heart. Suggestions only to 5 runes — but every word lands at +25%.',
      desc: 'Refuses the index. What the Cantor sings, the Cantor has bled for.',
      hp: 56, tray: 13, chipMax: 5, power: 1.25,
      unlock: { wins: 1 }, unlockText: 'Win a run to unlock',
    },
  ];
  const BY_ID = {};
  CLASSES.forEach(c => { BY_ID[c.id] = c; });

  function classUnlocked(cls, meta) {
    if (!cls.unlock) return true;
    if (!meta) return false;
    if (cls.unlock.notes) return meta.parts.size >= cls.unlock.notes;
    if (cls.unlock.wins) return meta.wins >= cls.unlock.wins;
    return false;
  }

  return { CLASSES, BY_ID, classUnlocked };
});
