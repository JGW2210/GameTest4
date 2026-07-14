/* ============================================================
 * WORDLOOM — Foes & Worlds (second weaving)
 * Three worlds, four stages each, branching paths. Every foe
 * attacks the WORD GAME as much as your ink: devouring vowels,
 * freezing tiles, inking out letters, scrambling the loom —
 * and now: stealing tiles to mend themselves, blurring what you
 * know of the mystery word, sapping revealed runes, and sealing
 * grimoire notes shut.
 * Affinities: weakTo ×1.5 · resist ×0.5 (element ids from Morph).
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Foes = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const A = (n, hits) => ({ kind: 'attack', n, hits: hits || 1 });
  const DEVOUR = (n, dmg) => ({ kind: 'devour', n: n || 1, dmg: dmg || 0 });
  const FREEZE = (n) => ({ kind: 'freeze', n });
  const BURNTILE = (n, dmg) => ({ kind: 'burnTile', n: n || 1, dmg: dmg || 0 });
  const CURSE = () => ({ kind: 'curse' });
  const SCRAMBLE = () => ({ kind: 'scramble' });
  const BROOD = (n) => ({ kind: 'brood', str: n });
  const STEALTILE = (n, dmg) => ({ kind: 'stealTile', n: n || 1, dmg: dmg || 0 }); // eats tiles, mends per tile
  const SHUFFLE = (dmg) => ({ kind: 'shuffleGuess', dmg: dmg || 0 });              // blurs a guess row's marks
  const SAP = (n) => ({ kind: 'sap', n });                                          // steals a revealed rune
  const SEAL = () => ({ kind: 'sealNote' });                                        // seals a grimoire note this battle

  const FOES = {
    /* ---- World 1: The Margins 📜 ---- */
    inkgrub:    { world: 1, name: 'Ink Grub',        icon: '🐛', hp: 18, weakTo: 'ign',
                  gimmick: 'Harmless to your loom — a first lesson.',
                  pattern: [A(4), A(5), BROOD(1)] },
    vowelleech: { world: 1, name: 'Vowel Leech',     icon: '🛞', hp: 22, weakTo: 'ful', resist: 'ven',
                  gimmick: 'Devours a vowel from your loom when it strikes.',
                  pattern: [DEVOUR(1, 3), A(5), DEVOUR(1, 4)] },
    marginmite: { world: 1, name: 'Margin Mite',     icon: '🕷', hp: 16, weakTo: 'umb',
                  gimmick: 'Small and quick — nibbles a tile from your loom to mend itself.',
                  pattern: [STEALTILE(1, 3), A(4), STEALTILE(1, 3)] },
    dogeared:   { world: 1, name: 'The Dog-Eared',   icon: '📄', hp: 24, weakTo: 'aqu', resist: 'ter',
                  gimmick: 'A folded corner of something larger. Hits harder each fold.',
                  pattern: [A(5), BROOD(1), A(6)] },
    rimewraith: { world: 1, name: 'Rime Wraith',     icon: '👻', hp: 24, weakTo: 'ign', resist: 'gel',
                  gimmick: 'Freezes tiles — they thaw after a turn.',
                  pattern: [FREEZE(2), A(6), FREEZE(3)] },
    grammarian: { world: 1, name: 'The Grammarian',  icon: '🧐', hp: 46, elite: true, weakTo: 'ful', resist: 'lum',
                  gimmick: 'Corrects you violently. Curses AND freezes.',
                  pattern: [CURSE(), A(6, 2), FREEZE(3), A(8)] },
    redactor:   { world: 1, name: 'THE REDACTOR',    icon: '🖊️', hp: 64, boss: true, weakTo: 'lum', resist: 'umb',
                  gimmick: 'Warden of the Margins. Inks out letters relentlessly and strikes what remains.',
                  pattern: [CURSE(), A(7), CURSE(), A(5, 2), BROOD(1)] },

    /* ---- World 2: The Inkfen ☠️ ---- */
    fenleech:   { world: 2, name: 'Fen Leech',       icon: '🩸', hp: 30, weakTo: 'ign', resist: 'aqu',
                  gimmick: 'Steals tiles and drinks them — each one mends it.',
                  pattern: [STEALTILE(2, 4), A(7), STEALTILE(1, 5)] },
    mirewisp:   { world: 2, name: 'Mire Wisp',       icon: '💫', hp: 26, weakTo: 'ter', resist: 'ful',
                  gimmick: 'Blurs what you know: a guess row\'s marks go grey.',
                  pattern: [SHUFFLE(4), A(6), SHUFFLE(5)] },
    bogmumbler: { world: 2, name: 'Bog Mumbler',     icon: '🫥', hp: 32, weakTo: 'lum', resist: 'umb',
                  gimmick: 'Inks out a letter — you cannot guess with it next turn.',
                  pattern: [CURSE(), A(7), A(6), CURSE()] },
    sporespine: { world: 2, name: 'Sporespine',      icon: '🍄', hp: 28, weakTo: 'ign', resist: 'ven',
                  gimmick: 'Burns tiles to spores. Regrows a little each turn.',
                  pattern: [BURNTILE(2, 3), A(7), BURNTILE(1, 4)], regen: 2 },
    drownedlex: { world: 2, name: 'Drowned Lexicon', icon: '📘', hp: 34, weakTo: 'ful', resist: 'aqu',
                  gimmick: 'Saps a revealed rune from the mystery word when it acts.',
                  pattern: [SAP(1), A(8), SAP(1), A(6, 2)] },
    mirechorus: { world: 2, name: 'The Mire Chorus', icon: '🎭', hp: 52, elite: true, weakTo: 'lum', resist: 'ven',
                  gimmick: 'Sings in your voice. Devours vowels and blurs your knowledge.',
                  pattern: [DEVOUR(2, 4), SHUFFLE(6), A(8, 2), CURSE()] },
    lexoleech:  { world: 2, name: 'THE LEXOLEECH',   icon: '🐍', hp: 84, boss: true, weakTo: 'ign', resist: 'aqu',
                  gimmick: 'Tyrant of the Inkfen. Seals one of your grimoire notes each cycle — that knowledge sleeps until it dies.',
                  pattern: [SEAL(), A(8), STEALTILE(2, 5), A(6, 2), BROOD(2)] },

    /* ---- World 3: The Scriptorium Ruins 🏛 ---- */
    dustgolem:  { world: 3, name: 'Dust Golem',      icon: '🗿', hp: 40, weakTo: 'aqu', resist: 'ful',
                  gimmick: 'Learns: after any elemental blow, it grows to resist that element.',
                  pattern: [A(8), BROOD(2), A(10)], adaptive: true },
    shelfhaunt: { world: 3, name: 'Shelf-Haunt',     icon: '👤', hp: 36, weakTo: 'lum', resist: 'umb',
                  gimmick: 'Freezes tiles from between the stacks.',
                  pattern: [FREEZE(3), A(9), FREEZE(2), A(7, 2)] },
    candelabra: { world: 3, name: 'Living Candelabra', icon: '🕎', hp: 38, weakTo: 'gel', resist: 'ign',
                  gimmick: 'Burns tiles to wax, two at a time.',
                  pattern: [BURNTILE(2, 4), A(9), BURNTILE(2, 5)] },
    indexwyrm:  { world: 3, name: 'Index Wyrm',      icon: '🪱', hp: 42, weakTo: 'ven', resist: 'ter',
                  gimmick: 'Eats alphabetically — always your earliest-alphabet tiles.',
                  pattern: [DEVOUR(2, 5), A(9), DEVOUR(1, 6), BROOD(1)] },
    boundindex: { world: 3, name: 'The Bound Index', icon: '📚', hp: 60, elite: true, weakTo: 'ign', resist: 'lum',
                  gimmick: 'Knows every word you know. Curses, saps, and scrambles in sequence.',
                  pattern: [CURSE(), SAP(1), A(9, 2), SCRAMBLE(), A(11)] },
    illiterate: { world: 3, name: 'THE ILLITERATE',  icon: '⬛', hp: 110, boss: true, weakTo: 'lum',
                  gimmick: 'Hates all words. Scrambles your loom, devours vowels, seals your notes, and grows crueler.',
                  pattern: [SCRAMBLE(), A(8), DEVOUR(2, 6), A(7, 2), BROOD(2), SEAL()] },
  };
  for (const [id, f] of Object.entries(FOES)) f.id = id;

  /* ---- worlds ---- */
  const WORLDS = [
    { id: 1, name: 'The Margins', icon: '📜',
      flavor: 'Where the commentary lives, and some of it bites.',
      normals: ['inkgrub', 'vowelleech', 'marginmite', 'dogeared', 'rimewraith'],
      elite: 'grammarian', boss: 'redactor' },
    { id: 2, name: 'The Inkfen', icon: '☠️',
      flavor: 'A bog of everything ever blotted out.',
      normals: ['fenleech', 'mirewisp', 'bogmumbler', 'sporespine', 'drownedlex'],
      elite: 'mirechorus', boss: 'lexoleech' },
    { id: 3, name: 'The Scriptorium Ruins', icon: '🏛',
      flavor: 'The library that forgot itself, shelf by shelf.',
      normals: ['dustgolem', 'shelfhaunt', 'candelabra', 'indexwyrm'],
      elite: 'boundindex', boss: 'illiterate' },
  ];

  // difficulty scale by global stage index (0..11 across three worlds)
  const SCALE = (idx) => 1 + idx * 0.09;

  return { FOES, WORLDS, SCALE };
});
