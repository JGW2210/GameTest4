/* ============================================================
 * LEXICON ARCANUM — Word pools & spell definitions
 * Dual-environment module (browser global + Node for simulation)
 * ============================================================
 * Pools:  5L ×10 (weakest)   6L ×20 (marginally stronger)
 *         7L ×35 (strong)    8L ×35 (buffed twins of the 7L spells)
 *         9L ×40 (tide-changers)   10L ×40 (ultimates)
 * One secret WORD OF POWER per length casts at ×2.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.WordData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const POOLS = {
    5: ['IGNIS', 'UMBRA', 'TERRA', 'LUMEN', 'VIRGA', 'CRUOR', 'ANIMA', 'FUROR', 'GELUM', 'SPIRA'],

    6: ['VENTUS', 'FLAMMA', 'FULGUR', 'CALIGO', 'VORTEX', 'TELLUS', 'ASTRUM', 'VULNUS', 'NEBULA', 'GLACIA',
        'CINERA', 'FERRUM', 'VIRTUS', 'MORTIS', 'SOLARA', 'LUNIRA', 'VESPER', 'ORACUL', 'SIGNUM', 'RUNICA'],

    7: ['TENEBRA', 'FULMINA', 'AETERNA', 'IGNITUS', 'UMBROSA', 'VENENUM', 'SANGUIS', 'GLACIUS', 'TONITRU', 'RADIANS',
        'OBSCURA', 'FERVIDA', 'NOCTURN', 'SOLARIS', 'LUNARIS', 'STELLUM', 'VIRIDIS', 'AURATUS', 'VITREUS', 'MALEDIC',
        'BENEDIC', 'ARCANUM', 'MYSTICA', 'SPECTRA', 'VORAGIN', 'CINEREA', 'FLAMMEA', 'GELIDUS', 'TERRENA', 'CAELIUS',
        'FURIOSA', 'SERPENS', 'DRACONI', 'RUNARIS', 'EXORIRI'],

    // 8-letter words are empowered twins of the 7-letter spells (index-paired, ×1.5)
    8: ['TENEBRIS', 'FULMINAR', 'AETERNUM', 'IGNITARE', 'UMBRALIS', 'VENENOSA', 'SANGUINE', 'GLACIALE', 'TONITRUS', 'RADIANTA',
        'OBSCURUM', 'FERVIDUS', 'NOCTURNA', 'SOLARIUM', 'LUNARIUM', 'STELLARE', 'VIRIDIUM', 'AURATIUM', 'VITREOSA', 'MALEDICA',
        'BENEDICA', 'ARCANIUM', 'MYSTICUM', 'SPECTRUM', 'VORAGINE', 'CINEREUM', 'FLAMMEUS', 'GELIDIUM', 'TERRENUM', 'CAELESTA',
        'FURIOSUM', 'SERPENTA', 'DRACONIS', 'RUNARIUM', 'EXORITUR'],

    9: ['TEMPESTAS', 'FULGURANT', 'IGNIFEROS', 'UMBRIFERA', 'SANGUINEA', 'GLACIERUM', 'TONITRUUM', 'RADIANTIS', 'OBSCURITA', 'NOCTIVAGA',
        'SOLIFERUM', 'LUNIFERUM', 'STELLARUM', 'VIRIDIANA', 'AURIFERUM', 'VITRIOLUM', 'MALEFICUS', 'BENEFICUS', 'ARCANORUM', 'MYSTERIUM',
        'SPECTORUM', 'VORAGINIS', 'CINERARIA', 'FLAMMARUM', 'GELIDORUM', 'TERRAMOTA', 'CAELESTIS', 'FURIBUNDA', 'SERPENTIS', 'DRACONIUM',
        'RUNIFEROS', 'EXORCISMA', 'VENTIFERA', 'CRUORIFEX', 'ANIMAVORA', 'LUMINARIS', 'INCENDIUM', 'MALEDICTA', 'BENEDICTA', 'VINDICTUS'],

    10: ['APOCALYPSA', 'TEMPESTATE', 'FULGURATIO', 'CONFLAGRAT', 'UMBRAMORTI', 'SANGUINEUM', 'GLACIALIUM', 'TONITRUANS', 'RADIANTIUM', 'OBSCURATIO',
         'NOCTIVAGUS', 'SOLINVICTA', 'LUNAETERNA', 'STELLIFERA', 'VIRIDANTIS', 'AURIFODINA', 'VITRIOLICA', 'MALEFICIUM', 'BENEFICIUM', 'ARCANOVITA',
         'MYSTAGOGUS', 'SPECTRALIS', 'VORAGINOSA', 'CINERITIUM', 'FLAMMIVOMA', 'GELIDANIMA', 'TERRAMOTUS', 'CAELIFERUM', 'FURIBUNDUS', 'SERPENTIUM',
         'DRACONITAS', 'RUNAETERNA', 'EXORDIALIS', 'TURBINATUS', 'CRUORVORAX', 'ANIMAVORAX', 'LUMINIFERA', 'INCENDIARA', 'VINDICATUS', 'OMNIPOTENS'],
  };

  // The secret Words of Power — one per length, cast at ×2. Never surfaced in UI
  // until the player discovers them by casting.
  const WORDS_OF_POWER = {
    5: 'CRUOR', 6: 'VORTEX', 7: 'ARCANUM', 8: 'SPECTRUM', 9: 'MYSTERIUM', 10: 'OMNIPOTENS',
  };

  /* ---- Spell effect archetypes -------------------------------------
   * Each word maps deterministically (index % cycle) to an archetype
   * with per-tier numbers. 8L twins the 7L cycle at ×1.5.
   * Effect keys understood by the engine:
   *   dmg, block, heal, burn, poison, weak, vuln, str, insight, stun, reveal
   * ----------------------------------------------------------------- */

  const CYCLE_56 = ['strike', 'aegis', 'ember', 'venom', 'drain', 'hex', 'might'];
  const CYCLE_78 = ['strike', 'aegis', 'ember', 'venom', 'drain', 'hex', 'might', 'clarity'];
  const CYCLE_9  = ['devastate', 'bastion', 'conflagrate', 'plague', 'siphon', 'curse', 'empower', 'shock'];
  const CYCLE_10 = ['annihilate', 'sanctum', 'inferno', 'pestilence', 'soulfeast', 'doom', 'ascend', 'oblivion'];

  const ARCHETYPES = {
    // len 5 / 6 — small effects
    strike:  { icon: '⚔', name: 'Strike' },
    aegis:   { icon: '⛨', name: 'Aegis' },
    ember:   { icon: '🔥', name: 'Ember' },
    venom:   { icon: '☠', name: 'Venom' },
    drain:   { icon: '🩸', name: 'Drain' },
    hex:     { icon: '🌀', name: 'Hex' },
    might:   { icon: '💪', name: 'Might' },
    clarity: { icon: '👁', name: 'Clarity' },
    devastate:  { icon: '☄', name: 'Devastation' },
    bastion:    { icon: '🏰', name: 'Bastion' },
    conflagrate:{ icon: '🌋', name: 'Conflagration' },
    plague:     { icon: '🦠', name: 'Plague' },
    siphon:     { icon: '🌙', name: 'Siphon' },
    curse:      { icon: '🕳', name: 'Grand Curse' },
    empower:    { icon: '⭐', name: 'Empowerment' },
    shock:      { icon: '⚡', name: 'Stunning Shock' },
    annihilate: { icon: '💥', name: 'Annihilation' },
    sanctum:    { icon: '🛡', name: 'Sanctum' },
    inferno:    { icon: '🔥', name: 'Inferno' },
    pestilence: { icon: '☣', name: 'Pestilence' },
    soulfeast:  { icon: '💀', name: 'Soulfeast' },
    doom:       { icon: '🌑', name: 'Doom' },
    ascend:     { icon: '🌠', name: 'Ascension' },
    oblivion:   { icon: '🌀', name: 'Oblivion' },
  };

  // Numbers per tier. 8 is derived from 7 at ×1.5 below.
  /* Numbers tuned for the escalating guess-cost economy: each cast in a turn
   * costs more insight than the last, so individual casts hit harder. */
  const TIER_EFFECTS = {
    5: {
      strike: { dmg: 9 }, aegis: { block: 9 }, ember: { dmg: 5, burn: 4 },
      venom: { poison: 5 }, drain: { dmg: 5, heal: 5 }, hex: { weak: 2 }, might: { str: 2 },
    },
    6: {
      strike: { dmg: 11 }, aegis: { block: 11 }, ember: { dmg: 6, burn: 5 },
      venom: { poison: 6 }, drain: { dmg: 6, heal: 6 }, hex: { weak: 2, vuln: 1 }, might: { str: 3 },
    },
    7: {
      strike: { dmg: 20 }, aegis: { block: 19 }, ember: { dmg: 11, burn: 8 },
      venom: { poison: 10 }, drain: { dmg: 10, heal: 10 }, hex: { weak: 2, vuln: 2 },
      might: { str: 5 }, clarity: { insight: 4 },
    },
    9: {
      devastate: { dmg: 42 }, bastion: { block: 32, heal: 10 }, conflagrate: { dmg: 22, burn: 14 },
      plague: { poison: 20, weak: 2 }, siphon: { dmg: 20, heal: 20 }, curse: { weak: 3, vuln: 3 },
      empower: { str: 7, insight: 3 }, shock: { stun: 1, dmg: 14 },
    },
    10: {
      annihilate: { dmg: 68 }, sanctum: { block: 50, heal: 18 }, inferno: { dmg: 36, burn: 22 },
      pestilence: { poison: 30, vuln: 3 }, soulfeast: { dmg: 30, heal: 30 }, doom: { weak: 4, vuln: 4, dmg: 20 },
      ascend: { str: 9, insight: 6 }, oblivion: { stun: 1, dmg: 38 },
    },
  };

  function scaleEffect(fx, mult) {
    const out = {};
    for (const k of Object.keys(fx)) {
      // Durations/turn-counts stay fixed; magnitudes scale.
      if (k === 'weak' || k === 'vuln' || k === 'stun') out[k] = fx[k];
      else out[k] = Math.round(fx[k] * mult);
    }
    return out;
  }

  function archetypeFor(len, index) {
    if (len === 5 || len === 6) return CYCLE_56[index % CYCLE_56.length];
    if (len === 7 || len === 8) return CYCLE_78[index % CYCLE_78.length];
    if (len === 9) return CYCLE_9[index % CYCLE_9.length];
    return CYCLE_10[index % CYCLE_10.length];
  }

  function effectFor(len, index) {
    const arch = archetypeFor(len, index);
    if (len === 8) return scaleEffect(TIER_EFFECTS[7][arch], 1.5);
    return Object.assign({}, TIER_EFFECTS[len][arch]);
  }

  function describeEffect(fx) {
    const bits = [];
    if (fx.dmg) bits.push(fx.dmg + (fx.aoe ? ' damage to ALL' : ' damage') + (fx.hits ? '×' + fx.hits : ''));
    if (fx.execute) bits.push('+' + fx.execute + ' vs foes below ¼ health');
    if (fx.block) bits.push(fx.block + ' ward');
    if (fx.heal) bits.push('heal ' + fx.heal);
    if (fx.burn) bits.push(fx.burn + (fx.aoe ? ' burn to ALL' : ' burn'));
    if (fx.poison) bits.push(fx.poison + (fx.aoe ? ' venom to ALL' : ' venom'));
    if (fx.weak) bits.push('weaken ' + fx.weak);
    if (fx.vuln) bits.push('expose ' + fx.vuln);
    if (fx.blind) bits.push('blind ' + fx.blind);
    if (fx.str) bits.push('+' + fx.str + ' might');
    if (fx.thorns) bits.push('+' + fx.thorns + ' thorns');
    if (fx.insight) bits.push('+' + fx.insight + ' insight');
    if (fx.energyNow) bits.push('+' + fx.energyNow + ' ⚡ now');
    if (fx.energyMax) bits.push('+' + fx.energyMax + ' max ⚡ this battle');
    if (fx.freeGuess) bits.push('+' + fx.freeGuess + ' free guess');
    if (fx.scryFree) bits.push('+' + fx.scryFree + ' scry');
    if (fx.reveal) bits.push('reveal ' + fx.reveal + ' rune' + (fx.reveal > 1 ? 's' : ''));
    if (fx.draw) bits.push('draw ' + fx.draw);
    if (fx.stun) bits.push('stun');
    return bits.join(', ');
  }

  /* ---- Spell schools (archetype → school) — casting multiple words of a
   * school in one battle triggers escalating combos (engine-side). ---- */
  const SCHOOL_OF_ARCH = {
    strike: 'astral', devastate: 'astral', annihilate: 'astral',
    aegis: 'aegian', bastion: 'aegian', sanctum: 'aegian',
    ember: 'ignium', conflagrate: 'ignium', inferno: 'ignium',
    venom: 'pestis', plague: 'pestis', pestilence: 'pestis',
    drain: 'sanguine', siphon: 'sanguine', soulfeast: 'sanguine',
    hex: 'umbral', curse: 'umbral', doom: 'umbral',
    might: 'mentis', clarity: 'mentis', empower: 'mentis', ascend: 'mentis',
    shock: 'fulmen', oblivion: 'fulmen',
  };
  const SCHOOLS = {
    astral:   { name: 'Astral',   icon: '✦', combo: 'Momentum: each later Astral word this battle strikes +25% harder (max +100%)' },
    aegian:   { name: 'Aegian',   icon: '⛨', combo: 'Harmony: each later Aegian word also grants 2 thorns and heals 3' },
    ignium:   { name: 'Ignium',   icon: '🔥', combo: 'Kindling: each later Ignium word adds +3 burn' },
    pestis:   { name: 'Pestis',   icon: '☠', combo: 'Bloom: each later Pestis word adds +3 venom' },
    sanguine: { name: 'Sanguine', icon: '🩸', combo: 'Feast: each later Sanguine word heals +4 more' },
    umbral:   { name: 'Umbral',   icon: '🌑', combo: 'Grip: each later Umbral word afflicts 1 turn longer' },
    mentis:   { name: 'Mentis',   icon: '🧠', combo: 'Overmind: each later Mentis word grants +1 insight' },
    fulmen:   { name: 'Fulmen',   icon: '⚡', combo: 'Static: every 2nd Fulmen word this battle also stuns' },
  };

  /* ---- Signature spells: hand-authored identities for notable words.
   * Merged over the archetype effect (numbers replace, flags add). ---- */
  const SIGNATURES = {
    // 5L
    IGNIS:  { fx: { burn: 5, aoe: true },                       note: 'its flame leaps to every foe' },
    UMBRA:  { fx: { dmg: 5, blind: 1 },                          note: 'shadows swallow the foe’s aim' },
    TERRA:  { fx: { block: 9, thorns: 2 },                       note: 'the earth answers violence in kind' },
    LUMEN:  { fx: { reveal: 1 },                                 note: 'light spills across the mystery word' },
    VIRGA:  { fx: { dmg: 4, hits: 3 },                           note: 'the rod strikes thrice' },
    ANIMA:  { fx: { heal: 6, energyNow: 1 },                     note: 'the soul remembers its strength' },
    FUROR:  { fx: { dmg: 6, energyNow: 1 },                      note: 'fury is its own fuel' },
    GELUM:  { fx: { block: 6, weak: 1 },                         note: 'frost numbs the attacker' },
    SPIRA:  { fx: { insight: 1, draw: 1 },                       note: 'the spiral turns inward' },
    // 6L
    VORTEX: { fx: { dmg: 9, aoe: true },                         note: 'nothing escapes the pull' },
    RUNICA: { fx: { scryFree: 1, insight: 2 },                   note: 'runes read runes' },
    MORTIS: { fx: { dmg: 10, execute: 10 },                       note: 'death favors the dying' },
    SOLARA: { fx: { burn: 6, aoe: true },                        note: 'a small sun, briefly' },
    LUNIRA: { fx: { heal: 8, insight: 2 },                       note: 'moonlight soothes and shows' },
    VESPER: { fx: { dmg: 8, blind: 1 },                          note: 'dusk falls over their eyes' },
    SIGNUM: { fx: { vuln: 2, reveal: 1 },                        note: 'the mark shows what is hidden' },
    FERRUM: { fx: { block: 10, str: 1 },                          note: 'iron in the arm, iron in the will' },
    // 7L
    ARCANUM:{ fx: { insight: 3, scryFree: 1 },                   note: 'the secret behind all secrets' },
    TONITRU:{ fx: { dmg: 12, stun: 0, aoe: true },               note: 'thunder speaks to the whole room' },
    SANGUIS:{ fx: { dmg: 11, heal: 11 },                            note: 'blood calls to blood' },
    SERPENS:{ fx: { poison: 11, blind: 1 },                        note: 'venom in the eye' },
    DRACONI:{ fx: { dmg: 15, burn: 6 },                           note: 'dragonfire lingers' },
    EXORIRI:{ fx: { heal: 10, energyMax: 1 },                      note: 'to rise is to grow' },
    MALEDIC:{ fx: { weak: 2, vuln: 2, dmg: 6 },                   note: 'the curse completes itself' },
    BENEDIC:{ fx: { heal: 9, block: 9, insight: 1 },              note: 'a blessing, thrice-folded' },
    // 8L
    SPECTRUM:{ fx: { dmg: 8, aoe: true, insight: 2 },             note: 'every color of ruin at once' },
    DRACONIS:{ fx: { dmg: 22, burn: 10 },                          note: 'the elder wyrm answers' },
    TONITRUS:{ fx: { dmg: 19, aoe: true },                        note: 'the storm made plural' },
    EXORITUR:{ fx: { heal: 15, energyMax: 1, insight: 2 },        note: 'what rises, rises higher' },
    SANGUINE:{ fx: { dmg: 16, heal: 16 },                         note: 'the red tithe, doubled' },
    // 9L
    TEMPESTAS:{ fx: { dmg: 25, aoe: true },                       note: 'the tempest spares no one' },
    MYSTERIUM:{ fx: { freeGuess: 2, insight: 3 },                 note: 'mystery rewards the curious' },
    VINDICTUS:{ fx: { dmg: 18, execute: 20 },                     note: 'vengeance finishes what it starts' },
    ANIMAVORA:{ fx: { dmg: 20, heal: 20, aoe: true },             note: 'it feeds on every soul present' },
    INCENDIUM:{ fx: { burn: 18, aoe: true },                      note: 'the library fire, remembered' },
    LUMINARIS:{ fx: { reveal: 2, insight: 3, heal: 8 },           note: 'all is illuminated' },
    CRUORIFEX:{ fx: { dmg: 30, selfDmg: 5 },                      note: 'paid for in your own blood' },
    // 10L
    APOCALYPSA:{ fx: { dmg: 50, aoe: true },                      note: 'the last page of every story' },
    OMNIPOTENS:{ fx: { dmg: 38, energyMax: 1, energyNow: 2 },     note: 'for a moment, boundless' },
    LUNAETERNA:{ fx: { heal: 25, block: 31, insight: 4 },         note: 'the moon that never sets' },
    TERRAMOTUS:{ fx: { dmg: 31, aoe: true, stun: 1 },             note: 'the world shrugs' },
    STELLIFERA:{ fx: { dmg: 15, hits: 3, aoe: false, insight: 3 },note: 'she carries the stars' },
    MYSTAGOGUS:{ fx: { freeGuess: 3, scryFree: 2, insight: 3 },   note: 'the initiator of initiates' },
  };

  /* ---- Elements: fire / frost / venom / storm ----
   * Latin roots decide first; school archetype is the fallback. Foes carry
   * affinities (weakTo x1.5, resist x0.5, immune x0). ---- */
  const ELEMENTS = {
    fire:  { name: 'Fire',  icon: '🔥' },
    frost: { name: 'Frost', icon: '❄️' },
    venom: { name: 'Venom', icon: '☠️' },
    storm: { name: 'Storm', icon: '⚡' },
  };
  function elementForWord(word, school) {
    if (/GLAC|GEL|NIV|FRIG/.test(word)) return 'frost';
    if (/IGN|FLAMM|CINER|INCEND|PYR|CONFLAGR/.test(word)) return 'fire';
    if (/VENEN|SERP|VIRID|TOX|VORAX/.test(word)) return 'venom';
    if (/FULG|TONITR|FULMIN|TURB|TEMPEST|VENT/.test(word)) return 'storm';
    const bySchool = { ignium: 'fire', pestis: 'venom', fulmen: 'storm' };
    return bySchool[school] || null;
  }

  // Build the full spell table: SPELLS[word] = {word, len, arch, school, name, icon, fx, power, sig, elem}
  const SPELLS = {};
  for (const lenKey of Object.keys(POOLS)) {
    const len = Number(lenKey);
    POOLS[len].forEach((word, i) => {
      const arch = archetypeFor(len, i);
      let fx = effectFor(len, i);
      const sig = SIGNATURES[word];
      if (sig) fx = Object.assign({}, fx, sig.fx);
      SPELLS[word] = {
        word, len, arch,
        school: SCHOOL_OF_ARCH[arch],
        name: (sig ? '★ ' : '') + ARCHETYPES[arch].name + (len === 8 && !sig ? ' Empowered' : ''),
        icon: ARCHETYPES[arch].icon,
        fx,
        power: WORDS_OF_POWER[len] === word,
        elem: elementForWord(word, SCHOOL_OF_ARCH[arch]),
        sig: !!sig,
        note: sig ? sig.note : null,
        desc: describeEffect(fx),
      };
    });
  }

  /* ---- Wordle-style feedback (handles duplicate letters correctly) ---- */
  function judgeGuess(guess, answer) {
    guess = guess.toUpperCase(); answer = answer.toUpperCase();
    const n = answer.length;
    const res = new Array(n).fill('absent');
    const remaining = {};
    for (let i = 0; i < n; i++) {
      if (guess[i] === answer[i]) res[i] = 'correct';
      else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < n; i++) {
      if (res[i] === 'correct') continue;
      const c = guess[i];
      if (remaining[c] > 0) { res[i] = 'present'; remaining[c]--; }
    }
    return res;
  }

  return { POOLS, SPELLS, WORDS_OF_POWER, ARCHETYPES, SCHOOLS, SCHOOL_OF_ARCH, SIGNATURES, ELEMENTS, elementForWord, judgeGuess, describeEffect };
});
