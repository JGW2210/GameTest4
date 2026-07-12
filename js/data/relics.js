/* ============================================================
 * LEXICON ARCANUM — Relics (passive run artifacts)
 * Earned from elites (guaranteed), bosses (pick of 3), events.
 * The engine consults `mod` keys at fixed hook points.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.RelicData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const RELICS = [
    { id: 'coal',       name: 'Coal of the First Word', icon: '🪨', mod: { maxEnergy: 1 },
      desc: '+1 max ⚡.', flavor: 'Still warm from the world’s first sentence.' },
    { id: 'inkwell',    name: 'Bottomless Inkwell',     icon: '🫙', mod: { insightPerTurn: 1 },
      desc: '+1 insight each turn.', flavor: 'It refills from somewhere unspeakable.' },
    { id: 'runestone',  name: 'Chipped Runestone',      icon: '🗿', mod: { spellDmg: 4 },
      desc: 'Spells deal +4 damage.', flavor: 'The chip made it angrier.' },
    { id: 'emberbook',  name: 'Ember Bookmark',         icon: '🔖', mod: { burnBonus: 2 },
      desc: 'Burn you apply +2.', flavor: 'Keeps your place. Loses theirs.' },
    { id: 'serpentring',name: 'Serpent Ring',           icon: '💍', mod: { poisonBonus: 2 },
      desc: 'Venom you apply +2.', flavor: 'It bites the hand that doesn’t feed it.' },
    { id: 'goldthread', name: 'Golden Thread',          icon: '🧵', mod: { aurumPct: 20 },
      desc: '+20% aurum from battle.', flavor: 'Follows the money.' },
    { id: 'clasp',      name: 'Tome Clasp',             icon: '🔒', mod: { tomeDiscount: 1 },
      desc: 'Tome casts cost 1 less insight.', flavor: 'Opens easier for its owner.' },
    { id: 'luckyletter',name: 'Lucky Letter',           icon: '🅰️', mod: { scryPerTurn: 1 },
      desc: '+1 scry each turn.', flavor: 'It always turns up.' },
    { id: 'dictionary', name: 'Dictionary Stub',        icon: '📕', mod: { pruneOnServe: 2 },
      desc: 'New mystery words: 2 absent runes ruled out.', flavor: 'Half the pages, all the spite.' },
    { id: 'glasseye',   name: 'Glass Eye',              icon: '👁️', mod: { revealOnStart: 1 },
      desc: 'Battles begin with 1 rune revealed.', flavor: 'It never blinks. It never lies.' },
    { id: 'wardrum',    name: 'War Drum of Vellum',     icon: '🥁', mod: { strStart: 2 },
      desc: 'Start battles with +2 might.', flavor: 'Stretched from a very persuasive page.' },
    { id: 'paperweight',name: 'Leaden Paperweight',     icon: '⚖️', mod: { blockPerTurn: 3 },
      desc: '+3 ward each turn.', flavor: 'Holds down more than paper.' },
    { id: 'quill',      name: 'Vampire Quill',          icon: '🪶', mod: { healOnCast: 2 },
      desc: 'Heal 2 whenever a spell casts.', flavor: 'It writes in whatever it can find.' },
    { id: 'candle',     name: 'Eternal Candle',         icon: '🕯️', mod: { healAfterBattle: 6 },
      desc: 'Heal 6 after each battle.', flavor: 'Burns down, never out.' },
    { id: 'moths',      name: 'Jar of Library Moths',   icon: '🦋', mod: { drawFirstTurn: 1 },
      desc: 'Draw +1 on your first turn.', flavor: 'They know where the good pages are.' },
    { id: 'hourglass',  name: 'Cracked Hourglass',      icon: '⏳', mod: { firstGuessInsight: 2 },
      desc: 'First-guess casts refund 2 insight.', flavor: 'Time leaks in your favor.' },
    { id: 'echovial',   name: 'Vial of Echoes',         icon: '🧪', mod: { echoFirstSpell: 50 },
      desc: 'Your first spell each battle is +50%.', flavor: 'Uncork. Repeat. Uncork. Repeat.' },
    { id: 'stormjar',   name: 'Storm in a Jar',         icon: '🌩️', mod: { stunEvery: 4 },
      desc: 'Every 4th spell each battle stuns.', flavor: 'Do not shake. Do shake.' },
    { id: 'mirrorshard',name: 'Mirror Shard',           icon: '🪞', mod: { thornsStart: 2 },
      desc: 'Start battles with 2 thorns.', flavor: 'It reflects poorly on everyone.' },
    { id: 'freetongue', name: 'Silvered Tongue',        icon: '👅', mod: { freeGuessPerBattle: 1 },
      desc: '+1 free guess each battle.', flavor: 'Talk your way out of paying.' },
    { id: 'chalice',    name: 'Chalice of Attunement',  icon: '🏆', mod: { attuneBonus: 1 },
      desc: 'Attunement tiers grant +1 extra ⚡.', flavor: 'It drinks variety.' },
    { id: 'bellows',    name: 'Scribe’s Bellows',     icon: '🌬️', mod: { energyOnBoss: 1, maxEnergyVsElite: 1 },
      desc: '+1 max ⚡ against elites and bosses.', flavor: 'Breathe in. Now SHOUT.' },
    { id: 'abacus',     name: 'Bone Abacus',            icon: '🧮', mod: { insightOnKill: 3 },
      desc: '+3 insight when a foe falls.', flavor: 'Every death is countable.' },
    { id: 'lens',       name: 'Scriptorium Lens',       icon: '🔍', mod: { vowelOnServe: true },
      desc: 'New mystery words show their vowels.', flavor: 'The vowels never learned to hide.' },
    { id: 'resobell',   name: 'Resonant Bell',          icon: '🔔', mod: { resonance: 10 },
      desc: '+10% engraving resonance (chance per guess that a known mystery word fires itself).',
      flavor: 'Struck once, it never quite stops.' },
    { id: 'choirecho',  name: 'Choir of Echoes',        icon: '📯', tier: 2, mod: { resonance: 20 },
      desc: '+20% engraving resonance.', flavor: 'Your words, singing back at you in harmony.' },
    { id: 'monocle',    name: 'Lexicographer’s Monocle', icon: '🧐', mod: { masteryReveal: 1 },
      desc: '+1 rune revealed on mystery words of fully-mastered lengths.',
      flavor: 'It has read everything. It is not impressed.' },
    { id: 'indexomni',  name: 'Index of All Things',    icon: '🗂️', tier: 2, mod: { masteryReveal: 2 },
      desc: '+2 runes revealed on mystery words of fully-mastered lengths.',
      flavor: 'See also: everything. See also: EVERYTHING.' },
  ];

  // Rarer relics (tier 2) roll three times less often than tier 1.
  const TIER2 = new Set(['coal', 'inkwell', 'choirecho', 'indexomni', 'stormjar']);
  RELICS.forEach(r => { r.tier = TIER2.has(r.id) ? 2 : 1; });

  const BY_ID = {};
  RELICS.forEach(r => BY_ID[r.id] = r);

  function roll(rng, ownedIds, n) {
    const pool = RELICS.filter(r => !ownedIds.includes(r.id));
    const out = [];
    while (out.length < (n || 1) && pool.length) {
      // tier-weighted sample without replacement (tier 1 = weight 3, tier 2 = 1)
      const weights = pool.map(r => (r.tier === 2 ? 1 : 3));
      const total = weights.reduce((a, z) => a + z, 0);
      let x = rng() * total;
      let idx = 0;
      for (; idx < pool.length - 1; idx++) { x -= weights[idx]; if (x <= 0) break; }
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  // Sum a modifier across owned relics.
  function mod(relicIds, key) {
    let v = 0;
    for (const id of relicIds) {
      const r = BY_ID[id];
      if (r && r.mod[key]) v += (r.mod[key] === true ? 1 : r.mod[key]);
    }
    return v;
  }

  return { RELICS, BY_ID, roll, mod };
});
