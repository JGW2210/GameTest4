/* ============================================================
 * WORDLOOM — Foes
 * Enemies here attack the WORD GAME, not just your hp: they devour
 * vowels from your loom, freeze tiles, ink out letters you need for
 * guessing, and scramble everything you saved.
 * Affinities: weakTo ×1.5 · resist ×0.5 (element ids from Morph).
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Foes = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const A = (n, hits) => ({ kind: 'attack', n, hits: hits || 1 });
  const DEVOUR = (n, dmg) => ({ kind: 'devour', n: n || 1, dmg: dmg || 0 });   // eats vowel tiles
  const FREEZE = (n) => ({ kind: 'freeze', n });                               // tiles unusable 1 turn
  const BURNTILE = (n, dmg) => ({ kind: 'burnTile', n: n || 1, dmg: dmg || 0 });// destroys tiles until refill
  const CURSE = () => ({ kind: 'curse' });                                     // inks out a guess letter 1 turn
  const SCRAMBLE = () => ({ kind: 'scramble' });                               // rerolls your whole loom
  const BROOD = (n) => ({ kind: 'brood', str: n });                            // grows stronger

  const FOES = {
    inkgrub:   { name: 'Ink Grub',       icon: '🐛', hp: 18, weakTo: 'ign',
                 gimmick: 'Harmless to your loom — a first lesson.',
                 pattern: [A(4), A(5), BROOD(1)] },
    vowelleech:{ name: 'Vowel Leech',    icon: '🛞', hp: 22, weakTo: 'ful', resist: 'ven',
                 gimmick: 'Devours a vowel from your loom when it strikes.',
                 pattern: [DEVOUR(1, 3), A(5), DEVOUR(1, 4)] },
    rimewraith:{ name: 'Rime Wraith',    icon: '👻', hp: 24, weakTo: 'ign', resist: 'gel',
                 gimmick: 'Freezes tiles — they thaw after a turn.',
                 pattern: [FREEZE(2), A(6), FREEZE(3)] },
    pyreimp:   { name: 'Pyre Imp',       icon: '👹', hp: 20, weakTo: 'aqu', resist: 'ign',
                 gimmick: 'Burns tiles to ash — gone until your loom refills.',
                 pattern: [BURNTILE(1, 3), A(6), BURNTILE(2, 2)] },
    mumbler:   { name: 'The Mumbler',    icon: '🫥', hp: 26, weakTo: 'lum', resist: 'umb',
                 gimmick: 'Inks out a letter — you cannot GUESS with it next turn.',
                 pattern: [CURSE(), A(6), A(5), CURSE()] },
    boneindex: { name: 'Bone Index',     icon: '💀', hp: 32, weakTo: 'san', resist: 'ter',
                 gimmick: 'A dry ledger of the dead. Hits hard, plays fair.',
                 pattern: [A(7), BROOD(1), A(8)] },
    gravemoss: { name: 'Gravemoss',      icon: '🌿', hp: 30, weakTo: 'ign', resist: 'aqu',
                 gimmick: 'Regrows a little each turn.',
                 pattern: [A(5), DEVOUR(1, 3), A(7)], regen: 2 },
    grammarian:{ name: 'The Grammarian', icon: '🧐', hp: 50, elite: true, weakTo: 'ful', resist: 'lum',
                 gimmick: 'Corrects you violently. Curses AND freezes.',
                 pattern: [CURSE(), A(7, 2), FREEZE(3), A(9)] },
    illiterate:{ name: 'THE ILLITERATE', icon: '⬛', hp: 88, boss: true, weakTo: 'lum',
                 gimmick: 'Hates all words. Scrambles your loom, devours vowels, cannot read your grimoire — but wants it destroyed.',
                 pattern: [SCRAMBLE(), A(7), DEVOUR(2, 5), A(6, 2), BROOD(2)] },
  };
  for (const [id, f] of Object.entries(FOES)) f.id = id;

  // node index → candidates (difficulty ramps by position in the run)
  const ENCOUNTERS = [
    ['inkgrub'],
    ['vowelleech', 'rimewraith', 'pyreimp'],
    ['rimewraith', 'pyreimp', 'mumbler', 'gravemoss'],
    ['mumbler', 'boneindex', 'gravemoss'],
    ['grammarian'],                        // elite (may bring a friend)
    ['illiterate'],                        // boss
  ];

  const SCALE = (idx) => 1 + idx * 0.19;   // hp & damage ramp along the run

  return { FOES, ENCOUNTERS, SCALE };
});
