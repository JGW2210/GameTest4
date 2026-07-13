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
   * Every word maps to an archetype BY MEANING — fire words burn, ice
   * words ward, storm words strike — with per-tier numbers. 8L words
   * twin their index-paired 7L spell at ×1.5.
   * Effect keys understood by the engine:
   *   dmg, block, heal, burn, poison, weak, vuln, str, insight, stun, reveal
   * Insight-granting archetypes (clarity/empower/ascend) exist only at
   * 7+ letters: insight is scarce, and short cantrips never grant it.
   * ----------------------------------------------------------------- */

  const WORD_ARCH = {
    // 5L
    IGNIS: 'ember', UMBRA: 'hex', TERRA: 'aegis', LUMEN: 'radiance', VIRGA: 'strike',
    CRUOR: 'drain', ANIMA: 'drain', FUROR: 'might', GELUM: 'frost', SPIRA: 'gale',
    // 6L
    VENTUS: 'gale', FLAMMA: 'ember', FULGUR: 'bolt', CALIGO: 'hex', VORTEX: 'gale',
    TELLUS: 'aegis', ASTRUM: 'strike', VULNUS: 'strike', NEBULA: 'hex', GLACIA: 'frost',
    CINERA: 'ember', FERRUM: 'aegis', VIRTUS: 'might', MORTIS: 'hex', SOLARA: 'ember',
    LUNIRA: 'radiance', VESPER: 'hex', ORACUL: 'radiance', SIGNUM: 'hex', RUNICA: 'radiance',
    // 7L (each 8L word inherits its index-paired 7L archetype)
    TENEBRA: 'hex', FULMINA: 'bolt', AETERNA: 'aegis', IGNITUS: 'ember', UMBROSA: 'hex',
    VENENUM: 'venom', SANGUIS: 'drain', GLACIUS: 'frost', TONITRU: 'bolt', RADIANS: 'radiance',
    OBSCURA: 'hex', FERVIDA: 'ember', NOCTURN: 'hex', SOLARIS: 'radiance', LUNARIS: 'radiance',
    STELLUM: 'strike', VIRIDIS: 'venom', AURATUS: 'might', VITREUS: 'frost', MALEDIC: 'hex',
    BENEDIC: 'aegis', ARCANUM: 'clarity', MYSTICA: 'clarity', SPECTRA: 'hex', VORAGIN: 'gale',
    CINEREA: 'ember', FLAMMEA: 'ember', GELIDUS: 'frost', TERRENA: 'aegis', CAELIUS: 'gale',
    FURIOSA: 'might', SERPENS: 'venom', DRACONI: 'ember', RUNARIS: 'clarity', EXORIRI: 'might',
    // 9L
    TEMPESTAS: 'maelstrom', FULGURANT: 'shock', IGNIFEROS: 'conflagrate', UMBRIFERA: 'curse',
    SANGUINEA: 'siphon', GLACIERUM: 'glacier', TONITRUUM: 'shock', RADIANTIS: 'aurora',
    OBSCURITA: 'curse', NOCTIVAGA: 'curse', SOLIFERUM: 'aurora', LUNIFERUM: 'aurora',
    STELLARUM: 'devastate', VIRIDIANA: 'plague', AURIFERUM: 'empower', VITRIOLUM: 'plague',
    MALEFICUS: 'curse', BENEFICUS: 'bastion', ARCANORUM: 'empower', MYSTERIUM: 'empower',
    SPECTORUM: 'siphon', VORAGINIS: 'maelstrom', CINERARIA: 'conflagrate', FLAMMARUM: 'conflagrate',
    GELIDORUM: 'glacier', TERRAMOTA: 'devastate', CAELESTIS: 'aurora', FURIBUNDA: 'devastate',
    SERPENTIS: 'plague', DRACONIUM: 'conflagrate', RUNIFEROS: 'empower', EXORCISMA: 'curse',
    VENTIFERA: 'maelstrom', CRUORIFEX: 'siphon', ANIMAVORA: 'siphon', LUMINARIS: 'aurora',
    INCENDIUM: 'conflagrate', MALEDICTA: 'curse', BENEDICTA: 'bastion', VINDICTUS: 'devastate',
    // 10L
    APOCALYPSA: 'annihilate', TEMPESTATE: 'tempest', FULGURATIO: 'oblivion', CONFLAGRAT: 'inferno',
    UMBRAMORTI: 'doom', SANGUINEUM: 'soulfeast', GLACIALIUM: 'avalanche', TONITRUANS: 'oblivion',
    RADIANTIUM: 'zenith', OBSCURATIO: 'doom', NOCTIVAGUS: 'doom', SOLINVICTA: 'zenith',
    LUNAETERNA: 'zenith', STELLIFERA: 'annihilate', VIRIDANTIS: 'pestilence', AURIFODINA: 'ascend',
    VITRIOLICA: 'pestilence', MALEFICIUM: 'doom', BENEFICIUM: 'sanctum', ARCANOVITA: 'ascend',
    MYSTAGOGUS: 'ascend', SPECTRALIS: 'soulfeast', VORAGINOSA: 'tempest', CINERITIUM: 'inferno',
    FLAMMIVOMA: 'inferno', GELIDANIMA: 'avalanche', TERRAMOTUS: 'annihilate', CAELIFERUM: 'tempest',
    FURIBUNDUS: 'annihilate', SERPENTIUM: 'pestilence', DRACONITAS: 'inferno', RUNAETERNA: 'ascend',
    EXORDIALIS: 'sanctum', TURBINATUS: 'tempest', CRUORVORAX: 'soulfeast', ANIMAVORAX: 'soulfeast',
    LUMINIFERA: 'zenith', INCENDIARA: 'inferno', VINDICATUS: 'annihilate', OMNIPOTENS: 'annihilate',
  };

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
    bolt:    { icon: '⚡', name: 'Bolt' },
    gale:    { icon: '💨', name: 'Gale' },
    frost:   { icon: '❄', name: 'Frost' },
    radiance:{ icon: '🌟', name: 'Radiance' },
    devastate:  { icon: '☄', name: 'Devastation' },
    bastion:    { icon: '🏰', name: 'Bastion' },
    conflagrate:{ icon: '🌋', name: 'Conflagration' },
    plague:     { icon: '🦠', name: 'Plague' },
    siphon:     { icon: '🌙', name: 'Siphon' },
    curse:      { icon: '🕳', name: 'Grand Curse' },
    empower:    { icon: '⭐', name: 'Empowerment' },
    shock:      { icon: '⚡', name: 'Stunning Shock' },
    maelstrom:  { icon: '🌪', name: 'Maelstrom' },
    glacier:    { icon: '🧊', name: 'Glacier' },
    aurora:     { icon: '🌄', name: 'Aurora' },
    annihilate: { icon: '💥', name: 'Annihilation' },
    sanctum:    { icon: '🛡', name: 'Sanctum' },
    inferno:    { icon: '🔥', name: 'Inferno' },
    pestilence: { icon: '☣', name: 'Pestilence' },
    soulfeast:  { icon: '💀', name: 'Soulfeast' },
    doom:       { icon: '🌑', name: 'Doom' },
    ascend:     { icon: '🌠', name: 'Ascension' },
    oblivion:   { icon: '⚡', name: 'Fulmination' },
    tempest:    { icon: '🌩', name: 'Tempest' },
    avalanche:  { icon: '🏔', name: 'Avalanche' },
    zenith:     { icon: '🌞', name: 'Zenith' },
  };

  // Numbers per tier. 8 is derived from 7 at ×1.5 below.
  // Buffed across the board to offset insight no longer flowing from spells.
  const TIER_EFFECTS = {
    5: {
      strike: { dmg: 9 }, aegis: { block: 9 }, ember: { dmg: 5, burn: 4 },
      venom: { poison: 6 }, drain: { dmg: 5, heal: 5 }, hex: { weak: 2, dmg: 3 }, might: { str: 2, block: 3 },
      bolt: { dmg: 7, vuln: 1 }, gale: { dmg: 5, aoe: true }, frost: { block: 7, weak: 1 },
      radiance: { heal: 5, scryFree: 1 },
    },
    6: {
      strike: { dmg: 12 }, aegis: { block: 11 }, ember: { dmg: 7, burn: 5 },
      venom: { poison: 7 }, drain: { dmg: 7, heal: 6 }, hex: { weak: 2, vuln: 1, dmg: 4 }, might: { str: 3, block: 4 },
      bolt: { dmg: 9, vuln: 1 }, gale: { dmg: 7, aoe: true }, frost: { block: 9, weak: 1 },
      radiance: { heal: 6, scryFree: 1 },
    },
    7: {
      strike: { dmg: 20 }, aegis: { block: 18 }, ember: { dmg: 11, burn: 8 },
      venom: { poison: 11 }, drain: { dmg: 10, heal: 10 }, hex: { weak: 2, vuln: 2, dmg: 6 },
      might: { str: 4, block: 6 }, clarity: { insight: 2, scryFree: 1 },
      bolt: { dmg: 14, vuln: 2 }, gale: { dmg: 10, aoe: true }, frost: { block: 13, weak: 2 },
      radiance: { heal: 8, block: 7, scryFree: 1 },
    },
    9: {
      devastate: { dmg: 38 }, bastion: { block: 28, heal: 10 }, conflagrate: { dmg: 20, burn: 13 },
      plague: { poison: 18, weak: 2 }, siphon: { dmg: 18, heal: 18 }, curse: { weak: 3, vuln: 3, dmg: 8 },
      empower: { str: 7, insight: 2 }, shock: { stun: 1, dmg: 14 },
      maelstrom: { dmg: 17, aoe: true }, glacier: { block: 24, weak: 2, aoe: true },
      aurora: { heal: 14, block: 10, scryFree: 2 },
    },
    10: {
      annihilate: { dmg: 60 }, sanctum: { block: 45, heal: 18 }, inferno: { dmg: 32, burn: 20 },
      pestilence: { poison: 28, vuln: 3 }, soulfeast: { dmg: 28, heal: 28 }, doom: { weak: 4, vuln: 4, dmg: 20 },
      ascend: { str: 9, insight: 3 }, oblivion: { stun: 1, dmg: 36 },
      tempest: { dmg: 26, aoe: true }, avalanche: { block: 34, weak: 3, aoe: true },
      zenith: { heal: 20, block: 16, scryFree: 2 },
    },
  };

  // Keys that never scale with tier/power multipliers: durations, flags,
  // and discrete resources (a ×1.5 twin shouldn't mint extra scries/draws).
  const FIXED_KEYS = ['weak', 'vuln', 'stun', 'blind', 'hits', 'aoe',
    'scryFree', 'reveal', 'draw', 'freeGuess', 'energyNow', 'energyMax'];

  function scaleEffect(fx, mult) {
    const out = {};
    for (const k of Object.keys(fx)) {
      if (FIXED_KEYS.includes(k)) out[k] = fx[k];
      else out[k] = Math.round(fx[k] * mult);
    }
    return out;
  }

  function archetypeFor(len, index) {
    // 8L words are empowered twins: they mirror their index-paired 7L spell.
    if (len === 8) return WORD_ARCH[POOLS[7][index]];
    return WORD_ARCH[POOLS[len][index]];
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
    if (fx.selfDmg) bits.push('take ' + fx.selfDmg);
    return bits.join(', ');
  }

  /* ---- Spell schools (archetype → school) — casting multiple words of a
   * school in one battle triggers escalating combos (engine-side). ---- */
  const SCHOOL_OF_ARCH = {
    strike: 'astral', devastate: 'astral', annihilate: 'astral',
    aegis: 'aegian', bastion: 'aegian', sanctum: 'aegian',
    frost: 'aegian', glacier: 'aegian', avalanche: 'aegian',
    ember: 'ignium', conflagrate: 'ignium', inferno: 'ignium',
    venom: 'pestis', plague: 'pestis', pestilence: 'pestis',
    drain: 'sanguine', siphon: 'sanguine', soulfeast: 'sanguine',
    hex: 'umbral', curse: 'umbral', doom: 'umbral',
    might: 'mentis', clarity: 'mentis', empower: 'mentis', ascend: 'mentis',
    radiance: 'mentis', aurora: 'mentis', zenith: 'mentis',
    bolt: 'fulmen', gale: 'fulmen', maelstrom: 'fulmen', tempest: 'fulmen',
    shock: 'fulmen', oblivion: 'fulmen',
  };
  const SCHOOLS = {
    astral:   { name: 'Astral',   icon: '✦', combo: 'Momentum: each later Astral word this battle strikes +25% harder (max +100%)' },
    aegian:   { name: 'Aegian',   icon: '⛨', combo: 'Harmony: each later Aegian word also grants 2 thorns and heals 3' },
    ignium:   { name: 'Ignium',   icon: '🔥', combo: 'Kindling: each later Ignium word adds +3 burn' },
    pestis:   { name: 'Pestis',   icon: '☠', combo: 'Bloom: each later Pestis word adds +3 venom' },
    sanguine: { name: 'Sanguine', icon: '🩸', combo: 'Feast: each later Sanguine word heals +4 more' },
    umbral:   { name: 'Umbral',   icon: '🌑', combo: 'Grip: each later Umbral word afflicts 1 turn longer' },
    mentis:   { name: 'Mentis',   icon: '🧠', combo: 'Overmind: each later Mentis word grants a free scry' },
    fulmen:   { name: 'Fulmen',   icon: '⚡', combo: 'Static: every 2nd Fulmen word this battle also stuns' },
  };

  /* ---- Signature spells: hand-authored identities for notable words.
   * Merged over the archetype effect (numbers replace, flags add). ---- */
  const SIGNATURES = {
    // 5L — no insight below 7 letters, ever.
    IGNIS:  { fx: { burn: 5, aoe: true },                        note: 'its flame leaps to every foe' },
    UMBRA:  { fx: { dmg: 4, blind: 1 },                          note: 'shadows swallow the foe’s aim' },
    TERRA:  { fx: { thorns: 2 },                                 note: 'the earth answers violence in kind' },
    LUMEN:  { fx: { scryFree: 2 },                               note: 'light pools where the truth hides' },
    VIRGA:  { fx: { dmg: 3, hits: 3 },                           note: 'the rod strikes thrice' },
    ANIMA:  { fx: { heal: 5, energyNow: 1 },                     note: 'the soul remembers its strength' },
    FUROR:  { fx: { dmg: 5, energyNow: 1 },                      note: 'fury is its own fuel' },
    SPIRA:  { fx: { draw: 1 },                                   note: 'the spiral turns inward' },
    // 6L
    VORTEX: { fx: { dmg: 8 },                                    note: 'nothing escapes the pull' },
    NEBULA: { fx: { blind: 1 },                                  note: 'the fog swallows every aim' },
    RUNICA: { fx: { scryFree: 2 },                               note: 'runes read runes' },
    MORTIS: { fx: { dmg: 8, execute: 10 },                       note: 'death favors the dying' },
    SOLARA: { fx: { burn: 6, aoe: true },                        note: 'a small sun, briefly' },
    LUNIRA: { fx: { heal: 8 },                                   note: 'moonlight soothes and shows' },
    VESPER: { fx: { dmg: 6, blind: 1 },                          note: 'dusk falls over their eyes' },
    ORACUL: { fx: { scryFree: 2, reveal: 1 },                    note: 'ask, and be answered' },
    SIGNUM: { fx: { vuln: 2, scryFree: 1 },                      note: 'the mark shows what is hidden' },
    FERRUM: { fx: { str: 1 },                                    note: 'iron in the arm, iron in the will' },
    // 7L
    ARCANUM:{ fx: { scryFree: 2 },                               note: 'the secret behind all secrets' },
    TONITRU:{ fx: { dmg: 10, aoe: true },                        note: 'thunder speaks to the whole room' },
    SANGUIS:{ fx: { dmg: 10, heal: 10 },                         note: 'blood calls to blood' },
    SERPENS:{ fx: { blind: 1 },                                  note: 'venom in the eye' },
    DRACONI:{ fx: { dmg: 13 },                                   note: 'dragonfire lingers' },
    EXORIRI:{ fx: { heal: 8, energyMax: 1 },                     note: 'to rise is to grow' },
    MALEDIC:{ fx: { dmg: 9 },                                    note: 'the curse completes itself' },
    BENEDIC:{ fx: { heal: 9 },                                   note: 'a blessing, twice-folded' },
    SOLARIS:{ fx: { burn: 6 },                                   note: 'daylight, sharpened to a point' },
    // 8L
    SPECTRUM:{ fx: { dmg: 8, aoe: true, insight: 1 },            note: 'every color of ruin at once' },
    DRACONIS:{ fx: { dmg: 19 },                                  note: 'the elder wyrm answers' },
    TONITRUS:{ fx: { dmg: 16, aoe: true },                       note: 'the storm made plural' },
    EXORITUR:{ fx: { heal: 14, energyMax: 1, insight: 1 },       note: 'what rises, rises higher' },
    SANGUINE:{ fx: { dmg: 16, heal: 16 },                        note: 'the red tithe, doubled' },
    // 9L
    TEMPESTAS:{ fx: { dmg: 22 },                                 note: 'the tempest spares no one' },
    MYSTERIUM:{ fx: { freeGuess: 2, insight: 1 },                note: 'mystery rewards the curious' },
    VINDICTUS:{ fx: { dmg: 22, execute: 20 },                    note: 'vengeance finishes what it starts' },
    ANIMAVORA:{ fx: { dmg: 14, heal: 14, aoe: true },            note: 'it feeds on every soul present' },
    INCENDIUM:{ fx: { dmg: 10, burn: 16, aoe: true },            note: 'the library fire, remembered' },
    LUMINARIS:{ fx: { reveal: 2, insight: 2 },                   note: 'all is illuminated' },
    CRUORIFEX:{ fx: { dmg: 28, heal: 0, selfDmg: 5 },            note: 'paid for in your own blood' },
    // 10L
    APOCALYPSA:{ fx: { dmg: 42, aoe: true },                     note: 'the last page of every story' },
    OMNIPOTENS:{ fx: { dmg: 32, energyMax: 1, energyNow: 2 },    note: 'for a moment, boundless' },
    LUNAETERNA:{ fx: { heal: 24, block: 28, insight: 2 },        note: 'the moon that never sets' },
    SOLINVICTA:{ fx: { burn: 14, aoe: true },                    note: 'the sun that will not yield' },
    TERRAMOTUS:{ fx: { dmg: 28, aoe: true, stun: 1 },            note: 'the world shrugs' },
    STELLIFERA:{ fx: { dmg: 14, hits: 3 },                       note: 'she carries the stars' },
    MYSTAGOGUS:{ fx: { str: 4, insight: 1, freeGuess: 3, scryFree: 2 }, note: 'the initiator of initiates' },
  };

  // Build the full spell table: SPELLS[word] = {word, len, arch, school, name, icon, fx, power, sig}
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

  return { POOLS, SPELLS, WORDS_OF_POWER, ARCHETYPES, SCHOOLS, SCHOOL_OF_ARCH, SIGNATURES, judgeGuess, describeEffect };
});
