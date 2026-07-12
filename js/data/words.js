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
  const TIER_EFFECTS = {
    5: {
      strike: { dmg: 7 }, aegis: { block: 7 }, ember: { dmg: 4, burn: 3 },
      venom: { poison: 4 }, drain: { dmg: 4, heal: 4 }, hex: { weak: 2 }, might: { str: 2 },
    },
    6: {
      strike: { dmg: 9 }, aegis: { block: 9 }, ember: { dmg: 5, burn: 4 },
      venom: { poison: 5 }, drain: { dmg: 5, heal: 5 }, hex: { weak: 2, vuln: 1 }, might: { str: 3 },
    },
    7: {
      strike: { dmg: 16 }, aegis: { block: 15 }, ember: { dmg: 9, burn: 6 },
      venom: { poison: 8 }, drain: { dmg: 8, heal: 8 }, hex: { weak: 2, vuln: 2 },
      might: { str: 4 }, clarity: { insight: 4 },
    },
    9: {
      devastate: { dmg: 34 }, bastion: { block: 26, heal: 8 }, conflagrate: { dmg: 18, burn: 12 },
      plague: { poison: 16, weak: 2 }, siphon: { dmg: 16, heal: 16 }, curse: { weak: 3, vuln: 3 },
      empower: { str: 6, insight: 3 }, shock: { stun: 1, dmg: 10 },
    },
    10: {
      annihilate: { dmg: 55 }, sanctum: { block: 40, heal: 15 }, inferno: { dmg: 30, burn: 18 },
      pestilence: { poison: 25, vuln: 3 }, soulfeast: { dmg: 25, heal: 25 }, doom: { weak: 4, vuln: 4, dmg: 15 },
      ascend: { str: 8, insight: 6 }, oblivion: { stun: 1, dmg: 30 },
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
    if (fx.dmg) bits.push(fx.dmg + ' damage');
    if (fx.block) bits.push(fx.block + ' ward');
    if (fx.heal) bits.push('heal ' + fx.heal);
    if (fx.burn) bits.push(fx.burn + ' burn');
    if (fx.poison) bits.push(fx.poison + ' venom');
    if (fx.weak) bits.push('weaken ' + fx.weak);
    if (fx.vuln) bits.push('expose ' + fx.vuln);
    if (fx.str) bits.push('+' + fx.str + ' might');
    if (fx.insight) bits.push('+' + fx.insight + ' insight');
    if (fx.stun) bits.push('stun');
    return bits.join(', ');
  }

  // Build the full spell table: SPELLS[word] = {word, len, arch, name, icon, fx, power}
  const SPELLS = {};
  for (const lenKey of Object.keys(POOLS)) {
    const len = Number(lenKey);
    POOLS[len].forEach((word, i) => {
      const arch = archetypeFor(len, i);
      const fx = effectFor(len, i);
      SPELLS[word] = {
        word, len, arch,
        name: ARCHETYPES[arch].name + (len === 8 ? ' Empowered' : ''),
        icon: ARCHETYPES[arch].icon,
        fx,
        power: WORDS_OF_POWER[len] === word,
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

  return { POOLS, SPELLS, WORDS_OF_POWER, ARCHETYPES, judgeGuess, describeEffect };
});
