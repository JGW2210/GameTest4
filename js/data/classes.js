/* ============================================================
 * LEXICON ARCANUM — Player classes & difficulties
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.ClassData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const CLASSES = [
    {
      id: 'scribe',
      name: 'The Scribe',
      icon: '✒️',
      tagline: 'Balanced. +1 insight each turn, draws 3 cards.',
      desc: 'An apprentice of the Lexicon with a steady hand. Nothing fancy — everything reliable.',
      hp: 62, freeInsight: 1, draw: 3,
      deck: ['bolt', 'bolt', 'bolt', 'bolt', 'ward', 'ward', 'ward', 'ward', 'focus', 'focus'],
      unlock: null,
    },
    {
      id: 'oracle',
      name: 'The Oracle',
      icon: '🔮',
      tagline: 'Visionary. +2 insight each turn, but draws only 2 cards.',
      desc: 'Sees the word before it is written. Trades muscle for foresight.',
      hp: 58, freeInsight: 2, draw: 2,
      deck: ['seerbolt', 'seerbolt', 'seerbolt', 'veilward', 'veilward', 'veilward', 'focus', 'glimpse'],
      unlock: null,
    },
    {
      id: 'warmage',
      name: 'The Warmage',
      icon: '⚔️',
      tagline: 'Brutal. No free insight, but far stronger base cards.',
      desc: 'Believes every argument can be won with sufficient force. Earns every guess.',
      hp: 74, freeInsight: 0, draw: 3,
      deck: ['heavybolt', 'heavybolt', 'heavybolt', 'heavybolt', 'ironward', 'ironward', 'ironward', 'ironward', 'focus', 'focus'],
      unlock: null,
    },
    {
      id: 'archivist',
      name: 'The Archivist',
      icon: '📜',
      tagline: 'Transcendent. +5 insight per turn, draws 1 card: always a Cast Tome.',
      desc: 'No longer casts spells — merely remembers them. For masters of the grimoire only.',
      hp: 56, freeInsight: 5, draw: 1,
      deck: ['casttome', 'casttome', 'casttome', 'casttome', 'casttome', 'casttome'],
      alwaysDrawsCastTome: true,
      castDiscount: 2,
      tomeMult: 1.4,
      unlock: { kind: 'allClassWins', ids: ['scribe', 'oracle', 'warmage'] },
    },
  ];

  const DIFFICULTIES = [
    { id: 0, name: 'Novice',   icon: '🕯️', hpMult: 1.1,  dmgMult: 1.0,  goldMult: 1.0, desc: 'The tome opens gently.', unlock: null },
    { id: 1, name: 'Adept',    icon: '📖', hpMult: 1.38, dmgMult: 1.22, goldMult: 1.35, desc: 'Foes strike harder; aurum flows faster.', unlock: { winsOn: 0 } },
    { id: 2, name: 'Master',   icon: '🔥', hpMult: 1.56, dmgMult: 1.34, goldMult: 1.7, desc: 'The pages resist being turned.', unlock: { winsOn: 1 } },
    { id: 3, name: 'Archmage', icon: '💀', hpMult: 1.95, dmgMult: 1.6,  goldMult: 2.2, desc: 'The tome reads YOU.', unlock: { winsOn: 2 } },
  ];

  /* Word-length unlock gates:
   *  5/6/7 available from the start.
   *  8: any victory.  9: victory on Adept+.  10: victory on Master+. */
  function unlockedLengths(meta) {
    const lens = [5, 6, 7];
    const wins = meta ? (meta.totalWins || 0) : 0;
    const best = meta ? (meta.bestDifficultyWin ?? -1) : -1;
    if (wins >= 1) lens.push(8);
    if (best >= 1) lens.push(9);
    if (best >= 2) lens.push(10);
    return lens;
  }

  function lengthUnlockText(len) {
    if (len === 8) return 'Win a run to unlock';
    if (len === 9) return 'Win on Adept to unlock';
    if (len === 10) return 'Win on Master to unlock';
    return '';
  }

  function classUnlocked(cls, meta) {
    if (!cls.unlock) return true;
    if (!meta) return false;
    if (meta.unlockAllClasses || meta.unlockArchivist) return true; // whispered secrets
    if (cls.unlock.kind === 'allClassWins') {
      return cls.unlock.ids.every(id => (meta.classWins || {})[id]);
    }
    return false;
  }

  function difficultyUnlocked(diff, meta) {
    if (!diff.unlock) return true;
    if (!meta) return false;
    if (meta.unlockAllDifficulties) return true; // whispered secrets
    return (meta.bestDifficultyWin ?? -1) >= diff.unlock.winsOn;
  }

  return { CLASSES, DIFFICULTIES, unlockedLengths, lengthUnlockText, classUnlocked, difficultyUnlocked };
});
