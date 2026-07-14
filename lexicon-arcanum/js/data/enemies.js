/* ============================================================
 * LEXICON ARCANUM — Foes & worlds (v3)
 * World TIERS 1-5 drive scaling; each tier 2-5 has two VARIANTS
 * (standard + a riskier alternate chosen after the prior boss).
 * Tier 6 is THE UNWRITTEN — a secret world. The endless spiral
 * extends scaling beyond tier 5 formulaically.
 *
 * Move kinds: attack {n,hits}, block {n}, buff {str}, debuff {weak,vuln},
 *             leech {insight, n?}, smolder {burn}, venom {poison}, heal {n}
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.EnemyData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const WORLDS = [
    { id: 'woods',     tier: 1, name: 'The Whispering Woods', icon: '🌲', blurb: 'Where the first words were overheard.' },
    { id: 'catacombs', tier: 2, name: 'The Sunken Catacombs', icon: '🕯️', blurb: 'Libraries drowned, librarians not quite.' },
    { id: 'orchard',   tier: 2, name: 'The Drowned Orchard',  icon: '🍎', blurb: 'The fruit remembers every hand that picked it.', risky: true },
    { id: 'peaks',     tier: 3, name: 'The Ashen Peaks',      icon: '🌋', blurb: 'Every summit is a burnt offering.' },
    { id: 'glass',     tier: 3, name: 'The Glass Desert',     icon: '🏜️', blurb: 'A million mirrors, each holding a grudge.', risky: true },
    { id: 'void',      tier: 4, name: 'The Void Marches',     icon: '🌑', blurb: 'Where unfinished sentences go.' },
    { id: 'mothcourt', tier: 4, name: 'The Moth Court',       icon: '🦋', blurb: 'They dress in stolen letters and call it law.', risky: true },
    { id: 'spire',     tier: 5, name: 'The Astral Spire',     icon: '✨', blurb: 'The last word waits at the top.' },
    { id: 'margin',    tier: 5, name: 'The Margin Abyss',     icon: '🌀', blurb: 'What the tome crossed out still hungers.', risky: true },
    { id: 'unwritten', tier: 6, name: 'THE UNWRITTEN',        icon: '⬜', blurb: 'The page after the last page.', secret: true },
  ];
  const WORLD_BY_ID = {};
  WORLDS.forEach(w => WORLD_BY_ID[w.id] = w);

  function variantsForTier(tier) { return WORLDS.filter(w => w.tier === tier && !w.secret); }

  /* ---- Scaling knobs (tuned by simulation) ---- */
  const SCALING = {
    WORLD_HP:  [1.30, 2.20, 3.25, 4.60, 6.15, 7.80],
    WORLD_DMG: [1.15, 1.70, 2.22, 2.82, 3.45, 4.25],
    SPIRAL_HP: 1.35,   // per tier beyond the table (endless)
    SPIRAL_DMG: 1.22,
    STAGE_HP_PER: 0.09,
    STAGE_DMG_PER: 0.06,
    ELITE_HP: 1.55, ELITE_DMG: 1.25,
    GOLD_BASE: 16, GOLD_PER_WORLD: 7, GOLD_ELITE: 1.8, GOLD_BOSS: 3.0,
    RISKY_GOLD: 1.15, // alternate worlds pay more
  };
  function tierHpMult(tier) {
    const t = SCALING.WORLD_HP;
    return tier <= t.length ? t[tier - 1] : t[t.length - 1] * Math.pow(SCALING.SPIRAL_HP, tier - t.length);
  }
  function tierDmgMult(tier) {
    const t = SCALING.WORLD_DMG;
    return tier <= t.length ? t[tier - 1] : t[t.length - 1] * Math.pow(SCALING.SPIRAL_DMG, tier - t.length);
  }

  const A = (n, hits) => ({ kind: 'attack', n, hits: hits || 1 });
  const B = (n) => ({ kind: 'block', n });
  const BUFF = (str) => ({ kind: 'buff', str });
  const DBF = (weak, vuln) => ({ kind: 'debuff', weak: weak || 0, vuln: vuln || 0 });
  const LEECH = (insight, n) => ({ kind: 'leech', insight, n: n || 0 });
  const SMOLDER = (burn, n) => ({ kind: 'smolder', burn, n: n || 0 });
  const VENOM = (poison, n) => ({ kind: 'venom', poison, n: n || 0 });
  const HEAL = (n) => ({ kind: 'heal', n });

  /* Base stats are TIER-1 NOVICE numbers; scaling multiplies them. */
  const ENEMIES = {
    /* ---------- Tier 1: Whispering Woods ---------- */
    thornling:  { world: 'woods', name: 'Thornling',        icon: '🌿', hp: 26, pattern: [A(6), B(5), A(7)] },
    inkmoth:    { world: 'woods', name: 'Ink Moth',         icon: '🦋', hp: 22, pattern: [A(4, 2), DBF(1, 0), A(6)] },
    mosswolf:   { world: 'woods', name: 'Moss-back Wolf',   icon: '🐺', hp: 30, pattern: [A(8), A(5), B(6)] },
    sprigwitch: { world: 'woods', name: 'Sprig Witch',      icon: '🧙', hp: 28, affinity: { weakTo: 'fire' }, pattern: [VENOM(3, 3), A(6), [A(7), DBF(0, 1)]] },
    owlsage:    { world: 'woods', name: 'Heretic Owl-Sage', icon: '🦉', hp: 34, elite: true, pattern: [LEECH(2, 4), A(8), BUFF(2), A(9)] },
    briarhulk:  { world: 'woods', name: 'Briar Hulk',       icon: '🌳', hp: 42, affinity: { weakTo: 'fire', resist: 'venom' }, posture: 'retaliation', elite: true, pattern: [B(8), A(11), A(6, 2)] },
    grovemaw:   { world: 'woods', name: 'The Grove-Maw',    icon: '🍃', hp: 72, affinity: { weakTo: 'fire', resist: 'venom' }, boss: true,
                  pattern: [A(9), VENOM(4, 4), B(9), A(7, 2), BUFF(2)] },

    /* ---------- Tier 2: Sunken Catacombs ---------- */
    drownedscribe:{ world: 'catacombs', name: 'Drowned Scribe', icon: '🫧', hp: 27, affinity: { weakTo: 'storm', resist: 'fire' }, posture: 'inkdrinker', pattern: [A(7), LEECH(1, 5), A(8)] },
    boneabbot:  { world: 'catacombs', name: 'Bone Abbot',       icon: '💀', hp: 31, pattern: [A(8), B(7), [A(9), DBF(1, 1)]] },
    silthag:    { world: 'catacombs', name: 'Silt Hag',         icon: '🦑', hp: 25, pattern: [VENOM(4, 4), A(6), DBF(2, 0)] },
    rustgolem:  { world: 'catacombs', name: 'Rust Golem',       icon: '🗿', hp: 36, affinity: { weakTo: 'storm', resist: 'fire' }, pattern: [B(9), A(11), A(8)] },
    choirless:  { world: 'catacombs', name: 'The Choirless',    icon: '👥', hp: 40, elite: true, pattern: [A(6, 2), LEECH(2, 5), BUFF(3), A(10)] },
    reliquary:  { world: 'catacombs', name: 'Waking Reliquary', icon: '⚱️', hp: 46, elite: true, pattern: [B(10), A(13), HEAL(6), A(9)] },
    lexovore:   { world: 'catacombs', name: 'The Lexovore',     icon: '🐍', hp: 84, affinity: { resist: 'venom' }, posture: 'inkdrinker', boss: true,
                  pattern: [LEECH(3, 6), A(11), B(10), A(8, 2), DBF(2, 2)] },

    /* ---------- Tier 2 ALT: Drowned Orchard (venom & attrition) ---------- */
    rotfruit:   { world: 'orchard', name: 'Rotfruit Shambler', icon: '🍎', hp: 29, affinity: { weakTo: 'fire', immune: 'venom' }, pattern: [VENOM(4, 4), A(7), VENOM(3, 5)] },
    willowisp:  { world: 'orchard', name: 'Willow Wisp',       icon: '🕸️', hp: 23, pattern: [DBF(1, 1), A(6, 2), LEECH(1, 4)] },
    bogshade:   { world: 'orchard', name: 'Bog Shade',         icon: '🌫️', hp: 27, pattern: [A(8), VENOM(5, 0), A(7)] },
    orchardkeeper:{ world: 'orchard', name: 'The Old Keeper',  icon: '🧑‍🌾', hp: 33, pattern: [B(8), A(10), HEAL(4)] },
    cidergolem: { world: 'orchard', name: 'Cider Golem',       icon: '🛢️', hp: 44, elite: true, pattern: [VENOM(6, 5), B(9), A(12), HEAL(5)] },
    wormqueen:  { world: 'orchard', name: 'Worm Queen',        icon: '🪱', hp: 38, affinity: { weakTo: 'fire', resist: 'venom' }, elite: true, pattern: [VENOM(5, 4), A(7, 2), BUFF(3), VENOM(7, 0)] },
    grafter:    { world: 'orchard', name: 'THE GRAFTER',       icon: '✂️', hp: 88, affinity: { weakTo: 'fire', resist: 'venom' }, boss: true,
                  pattern: [VENOM(5, 5), A(10), HEAL(8), A(7, 2), DBF(2, 1), VENOM(7, 6)] },

    /* ---------- Tier 3: Ashen Peaks ---------- */
    cinderimp:  { world: 'peaks', name: 'Cinder Imp',       icon: '👹', hp: 28, affinity: { weakTo: 'frost', immune: 'fire' }, pattern: [SMOLDER(4, 4), A(9), A(7)] },
    slagbeast:  { world: 'peaks', name: 'Slag Beast',       icon: '🐗', hp: 35, pattern: [A(11), B(8), A(9)] },
    ashwidow:   { world: 'peaks', name: 'Ash Widow',        icon: '🕷️', hp: 29, posture: 'retaliation', pattern: [VENOM(5, 4), SMOLDER(3, 3), A(8)] },
    pyrecaller: { world: 'peaks', name: 'Pyre Caller',      icon: '🔥', hp: 31, affinity: { weakTo: 'frost', resist: 'fire' }, pattern: [BUFF(2), SMOLDER(5, 5), A(10)] },
    magmaTome:  { world: 'peaks', name: 'Magma-Bound Tome', icon: '📕', hp: 44, affinity: { weakTo: 'frost', resist: 'fire' }, elite: true, pattern: [SMOLDER(6, 6), A(12), B(9), A(9, 2)] },
    obsidianknight:{ world: 'peaks', name: 'Obsidian Knight', icon: '♞', hp: 50, posture: 'parry', elite: true, pattern: [B(12), A(14), DBF(1, 1), A(11)] },
    cinderking: { world: 'peaks', name: 'The Cinder King',  icon: '👑', hp: 96, affinity: { weakTo: 'frost', resist: 'fire' }, boss: true,
                  pattern: [SMOLDER(6, 6), A(12), BUFF(3), A(9, 2), B(12)] },

    /* ---------- Tier 3 ALT: Glass Desert (mirrors & armor) ---------- */
    glasscrab:  { world: 'glass', name: 'Glass Crab',       icon: '🦀', hp: 30, affinity: { weakTo: 'storm', resist: 'frost' }, pattern: [B(10), A(10), B(7)] },
    mirageling: { world: 'glass', name: 'Mirageling',       icon: '💧', hp: 24, pattern: [DBF(0, 2), A(9), LEECH(2, 0)] },
    shardhound: { world: 'glass', name: 'Shard Hound',      icon: '🐕', hp: 32, pattern: [A(6, 2), A(11), B(6)] },
    dustprophet:{ world: 'glass', name: 'Dust Prophet',     icon: '🧎', hp: 29, pattern: [BUFF(2), A(9), DBF(2, 0), A(11)] },
    prismwyrm:  { world: 'glass', name: 'Prism Wyrm',       icon: '🐛', hp: 46, affinity: { weakTo: 'storm', resist: 'frost' }, elite: true, pattern: [B(12), A(13), SMOLDER(5, 5), A(10, 2)] },
    hourtitan:  { world: 'glass', name: 'Sandglass Titan',  icon: '⏳', hp: 52, elite: true, pattern: [B(14), A(15), LEECH(3, 6), BUFF(3)] },
    vitrifier:  { world: 'glass', name: 'THE VITRIFIER',    icon: '🔍', hp: 100, affinity: { weakTo: 'storm', resist: 'fire' }, boss: true,
                  pattern: [B(14), A(13), DBF(2, 2), A(9, 2), SMOLDER(6, 6), BUFF(3)] },

    /* ---------- Tier 4: Void Marches ---------- */
    nullwisp:   { world: 'void', name: 'Null Wisp',        icon: '👻', hp: 30, pattern: [LEECH(2, 6), A(10), DBF(1, 1)] },
    unword:     { world: 'void', name: 'The Un-Word',      icon: '❓', hp: 34, pattern: [A(12), DBF(2, 0), A(8, 2)] },
    hollowedjudge:{ world: 'void', name: 'Hollowed Judge', icon: '⚖️', hp: 38, posture: 'parry', pattern: [B(10), A(13), DBF(0, 2)] },
    voidlarva:  { world: 'void', name: 'Void Larva',       icon: '🐛', hp: 32, affinity: { weakTo: 'fire', immune: 'venom' }, pattern: [VENOM(6, 5), HEAL(5), A(11)] },
    silencer:   { world: 'void', name: 'The Silencer',     icon: '🤫', hp: 48, elite: true, pattern: [LEECH(3, 7), A(13), BUFF(3), A(10, 2)] },
    eraser:     { world: 'void', name: 'Eraser of Names',  icon: '🌫️', hp: 54, elite: true, pattern: [A(15), B(12), DBF(2, 2), A(12)] },
    censor:     { world: 'void', name: 'The Grand Censor', icon: '🚫', hp: 110, affinity: { resist: 'venom' }, boss: true,
                  pattern: [LEECH(4, 8), A(13), B(13), DBF(2, 2), A(10, 2), BUFF(3)] },

    /* ---------- Tier 4 ALT: Moth Court (insight theft & swarms) ---------- */
    courtmoth:  { world: 'mothcourt', name: 'Courtier Moth',   icon: '🦋', hp: 28, affinity: { weakTo: 'fire' }, pattern: [LEECH(2, 5), A(9, 2), DBF(1, 0)] },
    dustcloak:  { world: 'mothcourt', name: 'Dustcloak',       icon: '🧥', hp: 33, posture: 'inkdrinker', pattern: [A(11), LEECH(1, 6), B(8)] },
    lanternthief:{ world: 'mothcourt', name: 'Lantern Thief',  icon: '🏮', hp: 30, pattern: [LEECH(3, 0), A(12), A(8)] },
    silkjudge:  { world: 'mothcourt', name: 'Silk Judge',      icon: '🎀', hp: 36, posture: 'parry', pattern: [DBF(2, 1), A(10), B(9), A(12)] },
    velvetduke: { world: 'mothcourt', name: 'The Velvet Duke', icon: '🎩', hp: 50, elite: true, pattern: [LEECH(3, 8), BUFF(3), A(12, 2), B(10)] },
    cocoonwarden:{ world: 'mothcourt', name: 'Cocoon Warden',  icon: '🥚', hp: 56, elite: true, pattern: [B(13), HEAL(7), A(16), DBF(1, 2)] },
    mothqueen:  { world: 'mothcourt', name: 'THE MOTH QUEEN',  icon: '👸', hp: 115, affinity: { weakTo: 'fire', resist: 'venom' }, boss: true,
                  pattern: [LEECH(4, 7), A(11, 2), DBF(2, 2), HEAL(8), A(14), BUFF(3)] },

    /* ---------- Tier 5: Astral Spire ---------- */
    starspawn:  { world: 'spire', name: 'Star-Spawn',       icon: '⭐', hp: 34, pattern: [A(13), SMOLDER(5, 5), B(10)] },
    glyphgeist: { world: 'spire', name: 'Glyph Geist',      icon: '🌀', hp: 36, pattern: [LEECH(2, 7), A(12), DBF(1, 2)] },
    seraphscribe:{ world: 'spire', name: 'Fallen Seraph-Scribe', icon: '🕊️', hp: 40, pattern: [HEAL(6), A(14), B(11)] },
    cometling:  { world: 'spire', name: 'Cometling',        icon: '☄️', hp: 33, affinity: { weakTo: 'frost' }, pattern: [A(9, 2), BUFF(2), A(12)] },
    constellation:{ world: 'spire', name: 'Bound Constellation', icon: '✨', hp: 58, affinity: { resist: 'storm' }, elite: true, pattern: [A(11, 2), B(13), BUFF(4), A(16)] },
    archlector: { world: 'spire', name: 'The Arch-Lector',  icon: '📿', hp: 62, elite: true, pattern: [LEECH(3, 8), A(15), HEAL(8), A(12, 2)] },
    author:     { world: 'spire', name: 'THE AUTHOR',       icon: '🖋️', hp: 130, boss: true,
                  pattern: [A(14), LEECH(4, 9), B(15), A(11, 2), BUFF(4), DBF(2, 2)] },

    /* ---------- Tier 5 ALT: Margin Abyss (erasure & fury) ---------- */
    erratabeast:{ world: 'margin', name: 'Errata Beast',     icon: '📝', hp: 36, posture: 'retaliation', pattern: [A(14), DBF(2, 0), A(10, 2)] },
    footnotehorror:{ world: 'margin', name: 'Footnote Horror', icon: '*️⃣', hp: 31, pattern: [A(8, 3), LEECH(2, 0), B(9)] },
    blankling:  { world: 'margin', name: 'Blankling',        icon: '⬜', hp: 34, pattern: [DBF(1, 2), A(13), LEECH(2, 6)] },
    inkleech:   { world: 'margin', name: 'Ink Leech',        icon: '🩸', hp: 38, affinity: { weakTo: 'fire', immune: 'venom' }, posture: 'inkdrinker', pattern: [VENOM(7, 5), HEAL(6), A(12)] },
    redactor:   { world: 'margin', name: 'The Redactor',     icon: '🖊️', hp: 60, posture: 'retaliation', elite: true, pattern: [LEECH(4, 8), A(16), B(12), DBF(2, 2)] },
    appendixwyrm:{ world: 'margin', name: 'Appendix Wyrm',   icon: '🐉', hp: 64, posture: 'retaliation', elite: true, pattern: [A(12, 2), BUFF(4), A(18), B(11)] },
    marginalia: { world: 'margin', name: 'THE MARGINALIA',   icon: '❦', hp: 138, affinity: { resist: 'venom' }, boss: true,
                  pattern: [A(15), DBF(2, 2), LEECH(4, 8), A(12, 2), B(16), BUFF(4)] },

    /* ---------- Tier 6: THE UNWRITTEN (secret) ---------- */
    unletter:   { world: 'unwritten', name: 'The Unletter',   icon: '◻️', hp: 44, pattern: [A(15), LEECH(3, 8), DBF(2, 1)] },
    nullscribe: { world: 'unwritten', name: 'Null Scribe',    icon: '🕳️', hp: 48, posture: 'inkdrinker', pattern: [B(14), A(17), LEECH(4, 0), A(12, 2)] },
    unwrittenone:{ world: 'unwritten', name: 'THE UNWRITTEN ONE', icon: '⬛', hp: 170, affinity: { resist: 'venom' }, boss: true,
                  pattern: [A(16), LEECH(5, 10), B(18), A(12, 3), BUFF(5), DBF(3, 3)] },
  };

  const BY_WORLD = {};
  for (const [id, e] of Object.entries(ENEMIES)) {
    e.id = id;
    const w = (BY_WORLD[e.world] = BY_WORLD[e.world] || { normals: [], elites: [], boss: null });
    if (e.boss) w.boss = id;
    else if (e.elite) w.elites.push(id);
    else w.normals.push(id);
  }

  function scaledStats(id, tier, stage, difficulty) {
    const e = ENEMIES[id];
    const s = SCALING;
    const hpMult = tierHpMult(tier) * (1 + s.STAGE_HP_PER * (stage - 1)) * difficulty.hpMult * (e.elite ? s.ELITE_HP : 1);
    const dmgMult = tierDmgMult(tier) * (1 + s.STAGE_DMG_PER * (stage - 1)) * difficulty.dmgMult * (e.elite ? s.ELITE_DMG : 1);
    return { hp: Math.round(e.hp * hpMult), dmgMult };
  }

  function goldReward(tier, kind, difficulty, rng, risky) {
    const s = SCALING;
    let g = (s.GOLD_BASE + s.GOLD_PER_WORLD * (tier - 1)) * difficulty.goldMult;
    if (kind === 'elite') g *= s.GOLD_ELITE;
    if (kind === 'boss') g *= s.GOLD_BOSS;
    if (risky) g *= s.RISKY_GOLD;
    return Math.round(g * (0.85 + rng() * 0.3));
  }

  const POSTURES = {
    retaliation: { icon: '🗡️', name: 'Retaliation', desc: 'Strikes back for each card you play beyond your 2nd each turn.' },
    parry:       { icon: '🤺', name: 'Parry', desc: 'Negates the first attack card played against it each turn.' },
    inkdrinker:  { icon: '🍷', name: 'Ink-Drinker', desc: 'Heals whenever you play a card that costs 0⚡.' },
  };

  return { WORLDS, WORLD_BY_ID, variantsForTier, ENEMIES, BY_WORLD, POSTURES, SCALING, tierHpMult, tierDmgMult, scaledStats, goldReward };
});
