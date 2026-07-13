/* ============================================================
 * LEXICON ARCANUM — v3 arcana: the Forbidden Words, page
 * conditions (world mutators), and murmured hints.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.ArcanaData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* ---- The Forbidden Words -------------------------------------
   * Eleven letters. Never served, never listed. One of the five is
   * chosen per run. Four torn fragments must ALL be gathered to know
   * it; the tome permits exactly ONE attempt per run. Failure sews
   * your mouth shut — no guessing, no tomes, no resonance, no spells
   * for the rest of the run. Success is devastation.
   * -------------------------------------------------------------- */
  const FORBIDDEN = [
    { word: 'LOGOSULTIMA', name: 'The Last Argument', icon: '💥',
      fx: { dmg: 120, aoe: true },
      desc: '120 damage to ALL foes', epithet: 'the word that ends debates' },
    { word: 'VOXAETERNUM', name: 'The Eternal Voice', icon: '📣',
      fx: { heal: 999, block: 40, str: 6 },
      desc: 'Heal fully, gain 40 ward and +6 might', epithet: 'the voice that outlives its speaker' },
    { word: 'PRIMOVERBUM', name: 'The First Word', icon: '🌅',
      fx: { energyMax: 3, insight: 10, str: 4 },
      desc: '+3 max ⚡ this battle, +10 insight, +4 might', epithet: 'the word before all words' },
    { word: 'NIHILOMNIUM', name: 'The Great Nothing', icon: '⚫',
      fx: { nihil: 0.85 },
      desc: 'Erase 85% of every foe’s remaining vitality', epithet: 'the word that unwrites' },
    { word: 'FINISOMNIUM', name: 'The End of Dreams', icon: '🌘',
      fx: { dmg: 70, aoe: true, stun: 2 },
      desc: '70 damage to ALL foes and stun them for 2 turns', epithet: 'the word that wakes the sleeper' },
  ];
  // Fragment i reveals these letter positions of the run's forbidden word.
  const FRAGMENT_SLOTS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10]];
  const FRAGMENT_FLAVOR = [
    'A strip of vellum, chewed at the edges. The first strokes are legible…',
    'A corner of burnt paper. The middle of something enormous…',
    'A margin note in a dead hand. More of the shape emerges…',
    'The final scrap. The word is whole now — and it is watching you back.',
  ];

  /* ---- Page Conditions (per-world mutators) ---- */
  const CONDITIONS = [
    { id: 'inkstorm', name: 'Inkstorm', icon: '🌧️',
      desc: 'Every mystery word serves with one rune revealed — but foes have +15% vitality.',
      mod: { wordFreeReveal: 1, foeHp: 1.15 } },
    { id: 'silence', name: 'Dead Silence', icon: '🤐',
      desc: 'Scrying is impossible. Each turn grants a free guess instead.',
      mod: { noScry: true, freeGuessPerTurn: 1 } },
    { id: 'fever', name: 'Feverish Pages', icon: '🥵',
      desc: 'All burn you apply is +3. The paper sweats.',
      mod: { burnBonus: 3 } },
    { id: 'gale', name: 'Turning Gale', icon: '🌬️',
      desc: 'Draw +1 card each turn; your hand holds 2 fewer.',
      mod: { drawBonus: 1, handCap: -2 } },
    { id: 'drought', name: 'Insight Drought', icon: '🏜️',
      desc: 'Insight cap −3; +1 max ⚡. Think less, do more.',
      mod: { insightCap: -3, energyBonus: 1 } },
    { id: 'echoes', name: 'Haunted Echoes', icon: '👻',
      desc: 'Engraving resonance +15%; foes leech deeper.',
      mod: { resonanceBonus: 15, leechBonus: 1 } },
    { id: 'gilded', name: 'Gilded Pages', icon: '💰',
      desc: '+35% aurum from battle; foes strike +10% harder.',
      mod: { goldPct: 35, foeDmg: 1.1 } },
    { id: 'heavyink', name: 'Heavy Ink', icon: '🖋️',
      desc: 'No card costs more than 2⚡ — but max ⚡ −1.',
      mod: { costCap: 2, energyBonus: -1 } },
  ];

  /* ---- Murmurs: riddle-hints toward undiscovered Words of Power ---- */
  const MURMURS = {
    CRUOR: 'Among the five-rune words… seek the one that BLEEDS.',
    VORTEX: 'Six runes that never stop TURNING.',
    ARCANUM: 'The seven-rune secret is the SECRET itself.',
    SPECTRUM: 'Eight runes wearing every COLOR at once.',
    MYSTERIUM: 'Nine runes that name what cannot be NAMED.',
    OMNIPOTENS: 'Ten runes. ALL of them power.',
  };

  return { FORBIDDEN, FRAGMENT_SLOTS, FRAGMENT_FLAVOR, CONDITIONS, MURMURS };
});
