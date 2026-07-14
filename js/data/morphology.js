/* ============================================================
 * WORDLOOM — The generative morphology, second weaving
 *
 * Anatomy of a word:
 *   ROOT (3)      the element     IGN, GEL, TER, AER, VEN...
 *   SUFFIX        the magnitude   small (1) / medium (2) / large (3)
 *   BINDER (1)    joins long forms   IGN+I → IGNI-  (AER is irregular)
 *   CENTER (2–4)  the shape       short, standard, and grand centers
 *   JOINER (2)    blends elements    ET — "and" — weds two roots
 *   ALT ROOT (3)  an element's late-word spelling  (UND, NOC, LUX...)
 *
 * Single-element forms (LR = long root = ROOT+BINDER):
 *   Cantrip   ROOT + small                       IGNA        (4)
 *   Word      ROOT + medium                      IGNUS       (5)
 *   Bound     LR + medium                        IGNIUS      (6)
 *   Weave     LR + CENTER                        IGNIORA     (4+|C|)
 *   Mirror    LR + reverse(CENTER) + S           IGNIAROS    (5+|C|)
 *   Verse     LR + Cstem + medium + Cvowel       IGNIORUSA   (6+|C|)
 *   Sovereign LR + CENTER + large                IGNIORARIS  (7+|C|)
 *
 * Blended forms (element1 keeps its suffix; element2 appears late,
 * in its ALT spelling, wedded by the joiner):
 *   Union       LR1 + ET + ALT2 + medium1        IGNIETUNDUS (11)
 *   Grand Union LR1 + ET + ALT2 + large1         IGNIETUNDRIS (12)
 *
 * The Scribe's Elision (sandhi): twin vowels never touch — the second
 * transmutes: A→E, E→A, I→E, O→U, U→O.
 *
 * HIDDEN GRAMMAR (never shown in notes, chips, or guides):
 *   - each element has a secret third spelling of its root (FLA, RIM,
 *     SAX...) — words woven from it carry ×1.35 strength
 *   - two secret elements exist beyond the ten
 *   - three secret CENTERS (IZ, AZA, ONZA — one per size), a secret
 *     JOINER (AC, the Old Wedding) and a secret FORM (the Selfsame) —
 *     so every kind of word part has an apocryphal counterpart
 *   Secret knowledge is only ever taught by strange events on the road.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Morph = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* ---------------- elements ---------------- */
  const ELEMENTS = [
    { id: 'ign', root: 'IGN', alt: 'CIN', secret: 'FLA', name: 'Fire',     icon: '🔥', small: 'A', medium: 'US', large: 'RIS', conn: 'I',
      identity: 'Damage that keeps burning.' },
    { id: 'gel', root: 'GEL', alt: 'NIV', secret: 'RIM', name: 'Frost',    icon: '❄️', small: 'U', medium: 'AS', large: 'RIS', conn: 'A',
      identity: 'Damage that chills the foe’s next blow.' },
    { id: 'ter', root: 'TER', alt: 'PET', secret: 'SAX', name: 'Earth',    icon: '🪨', small: 'E', medium: 'RA', large: 'RIA', conn: 'E',
      identity: 'Damage that raises stone to ward you.' },
    { id: 'aer', root: 'AER', alt: 'AUR', secret: 'VEL', name: 'Air',      icon: '🌬️', small: 'O', medium: 'IS', large: 'IUM', conn: 'TH', longRoot: 'AETH',
      identity: 'Damage; the wind carries extra letters to your loom.' },
    { id: 'ven', root: 'VEN', alt: 'TOX', secret: 'VIR', name: 'Venom',    icon: '☠️', small: 'U', medium: 'OX', large: 'XIA', conn: 'O',
      identity: 'A small bite, then poison does the work.' },
    { id: 'ful', root: 'FUL', alt: 'TON', secret: 'TEM', name: 'Storm',    icon: '⚡', small: 'O', medium: 'UR', large: 'MEN', conn: 'G',
      identity: 'Wild damage — sometimes it stuns.' },
    { id: 'aqu', root: 'AQU', alt: 'UND', secret: 'MAR', name: 'Water',    icon: '💧', small: 'A', medium: 'IS', large: 'TUS', conn: 'E',
      identity: 'Damage that soothes — heals and washes curses away.' },
    { id: 'umb', root: 'UMB', alt: 'NOC', secret: 'TEN', name: 'Shadow',   icon: '🌑', small: 'O', medium: 'IS', large: 'TIS', conn: 'R',
      identity: 'Damage from the dark; the foe swings blind.' },
    { id: 'lum', root: 'LUM', alt: 'LUX', secret: 'SOL', name: 'Light',    icon: '✨', small: 'A', medium: 'EN', large: 'NIS', conn: 'I',
      identity: 'Modest damage — and it reveals the mystery word’s runes.' },
    { id: 'san', root: 'SAN', alt: 'VIV', secret: 'ANI', name: 'Vitality', icon: '💚', small: 'A', medium: 'US', large: 'TAS', conn: 'I',
      identity: 'No harm at all: it mends you.' },
  ];

  /* The two elements beyond the ten. Their entire grammar is hidden. */
  const SECRET_ELEMENTS = [
    { id: 'nih', root: 'NIH', alt: 'NUL', secret: null, name: 'Void',  icon: '⬛', small: 'A', medium: 'IL', large: 'ORS', conn: 'I',
      identity: 'Erasure — harm that ignores every nature, and gnaws the foe’s utmost vigor.', hiddenEl: true },
    { id: 'cru', root: 'CRU', alt: 'GOR', secret: null, name: 'Blood', icon: '🩸', small: 'X', medium: 'OR', large: 'STA', conn: 'E',
      identity: 'Terrible harm that drinks deep — but every casting costs your own ink.', hiddenEl: true },
  ];

  const ALL_ELEMENTS = ELEMENTS.concat(SECRET_ELEMENTS);
  const EL_BY_ID = {};
  ALL_ELEMENTS.forEach(e => { EL_BY_ID[e.id] = e; });

  /* ---------------- centers: short (2), standard (3), grand (4) ---------------- */
  const CENTERS = [
    // standard — the first weaving
    { id: 'ora', seq: 'ORA',  name: 'the Eye',     icon: '👁', shape: 'Amplified: ×1.45 to everything the word does.' },
    { id: 'uma', seq: 'UMA',  name: 'the Veil',    icon: '🕸', shape: 'Warding: also grants stone equal to 60% of its power.' },
    { id: 'ova', seq: 'OVA',  name: 'the Seed',    icon: '🌱', shape: 'Blooming: its effect echoes at half strength for 2 turns.' },
    { id: 'exa', seq: 'EXA',  name: 'the Scatter', icon: '💥', shape: 'Scattering: strikes ALL foes at 70% strength.' },
    { id: 'ulo', seq: 'ULO',  name: 'the Chain',   icon: '⛓', shape: 'Chaining: 40% chance to instantly recast itself, free.' },
    { id: 'ava', seq: 'AVA',  name: 'the Hunger',  icon: '🩸', shape: 'Draining: heals you for half the damage it deals.' },
    // short — quick needles, cheaper letters, lower tiers
    { id: 'ix',  seq: 'IX',   name: 'the Needle',  icon: '📌', shape: 'Piercing: ×1.6 against foes below a third of their ink.' },
    { id: 'um',  seq: 'UM',   name: 'the Hush',    icon: '🤫', shape: 'Quelling: the foe’s next trick (anything but a plain blow) is silenced.' },
    // grand — long weavings, the deepest tiers
    { id: 'ulta', seq: 'ULTA', name: 'the Beyond',  icon: '🌌', shape: 'Overreaching: harm beyond the kill spills onto the next foe.' },
    { id: 'onda', seq: 'ONDA', name: 'the Wave',    icon: '🌊', shape: 'Cresting: 45% of its harm washes over every other foe.' },
  ];
  /* Secret centers — one per size. Their letter Z appears in no public
   * word; it seeps into the tile bag only as the hidden grammar does. */
  const SECRET_CENTERS = [
    { id: 'iz',   seq: 'IZ',   name: 'the Rift',  icon: '🕳', secretPart: true,
      shape: 'Rending: its harm ignores every nature and ward — it strikes true.' },
    { id: 'aza',  seq: 'AZA',  name: 'the Mask',  icon: '🎭', secretPart: true,
      shape: 'Masking: ×1.25 to everything, and the foe’s next trick dies in its throat.' },
    { id: 'onza', seq: 'ONZA', name: 'the Abyss', icon: '⚫', secretPart: true,
      shape: 'Devouring: ×1.15, and it gnaws away the foe’s utmost vigor.' },
  ];
  const ALL_CENTERS = CENTERS.concat(SECRET_CENTERS);
  const CENTER_BY_ID = {};
  ALL_CENTERS.forEach(c => { CENTER_BY_ID[c.id] = c; });

  /* ---------------- joiners ---------------- */
  const JOINERS = [
    { id: 'et', seq: 'ET', name: 'the Wedding', icon: '💍', note: 'ET — "and". Weds a second element into the word: its ALT spelling appears late, the suffix stays true to the first.' },
  ];
  /* The secret joiner: an elder "and" that weds elements closer. */
  const SECRET_JOINERS = [
    { id: 'ac', seq: 'AC', name: 'the Old Wedding', icon: '🗝', secretPart: true,
      note: 'AC — the elder "and". It weds two elements closer than ET dares: the union runs ×1.2.' },
  ];
  const ALL_JOINERS = JOINERS.concat(SECRET_JOINERS);
  const JOINER_BY_ID = {};
  ALL_JOINERS.forEach(j => { JOINER_BY_ID[j.id] = j; });

  /* ---------------- forms (named, not numbered) ---------------- */
  const FORMS = {
    cantrip:    { name: 'Cantrip',     note: 'ROOT + small suffix. The smallest utterance an element allows.' },
    word:       { name: 'Word',        note: 'ROOT + medium suffix. A word with its shoulders back.' },
    bound:      { name: 'Bound Word',  note: 'ROOT + binder + medium suffix. The binder joins; the word grows.' },
    weave:      { name: 'Weave',       note: 'ROOT + binder + CENTER. A center woven into the heart of the word.' },
    mirror:     { name: 'Mirror',      note: 'ROOT + binder + CENTER reversed, sealed with S. The mirror also wards its speaker.' },
    verse:      { name: 'Verse',       note: 'ROOT + binder + CENTER with its last vowel migrated to the word’s end, the medium suffix nested inside — the Verse echoes its inner Word.' },
    sovereign:  { name: 'Sovereign',   note: 'ROOT + binder + CENTER + large suffix. The whole grammar, spoken at once.' },
    union:      { name: 'Union',       note: 'ROOT + binder + JOINER + a second element’s ALT spelling + the first element’s medium suffix. Two natures, one word.' },
    grandunion: { name: 'Grand Union', note: 'As the Union, but sealed with the large suffix. The mightiest weavings known.' },
  };
  const FORM_IDS = Object.keys(FORMS);

  /* The secret form: an element wedded to ITSELF — its own late spelling
   * follows the long root, no joiner between them, sealed with the medium
   * suffix. Forbidden, and half again as hot. */
  const SECRET_FORMS = {
    selfsame: { name: 'Selfsame', secretPart: true,
      note: 'ROOT + binder + the element’s OWN late spelling + its medium suffix. An element wedded to itself — it runs half again as hot.' },
  };
  const FORM_DEF = Object.assign({}, FORMS, SECRET_FORMS);

  // magnitude by tier; tier = word length − 3 (length IS power)
  const MAG = [0, 5, 8, 12, 16, 21, 27, 34, 42, 52];
  const tierOf = (len) => Math.min(MAG.length - 1, len - 3);

  /* ---------------- assembly ---------------- */
  const VOWELS = 'AEIOU';
  const ELISION = { A: 'E', E: 'A', I: 'E', O: 'U', U: 'O' };
  function sandhi(w) {
    const s = w.split('');
    for (let i = 1; i < s.length; i++) {
      if (s[i] === s[i - 1] && VOWELS.includes(s[i])) s[i] = ELISION[s[i]];
    }
    return s.join('');
  }
  function longRoot(el, spelling) { return el.longRoot && spelling === el.root ? el.longRoot : spelling + el.conn; }
  const rev = (s) => s.split('').reverse().join('');
  // split a center into (stem, migrated vowel): the LAST vowel migrates
  function centerSplit(seq) {
    for (let i = seq.length - 1; i >= 0; i--) {
      if (VOWELS.includes(seq[i])) return { stem: seq.slice(0, i) + seq.slice(i + 1), vowel: seq[i] };
    }
    return { stem: seq, vowel: '' };
  }

  // The Easing Vowel: when a binder's consonant would strike another
  // consonant (UMBR+XI...), the element's small vowel eases the joint.
  function ease(el, LR, piece) {
    if (!VOWELS.includes(LR[LR.length - 1]) && !VOWELS.includes(piece[0])) return LR + el.small + piece;
    return LR + piece;
  }

  // spelling: the root string actually used (primary or secret third spelling)
  // joiner: which "and" weds a blend (ET by default; the secret AC)
  function rawAssemble(el, form, center, el2, spelling, joiner) {
    const R = spelling || el.root;
    const LR = longRoot(el, R);
    const J = (joiner || JOINERS[0]).seq;
    switch (form) {
      case 'cantrip': return R + el.small;
      case 'word': return R + el.medium;
      case 'bound': return LR + el.medium;
      case 'weave': return LR + center.seq;
      case 'mirror': return ease(el, LR, rev(center.seq)) + 'S';
      case 'verse': { const cs = centerSplit(center.seq); return ease(el, LR, cs.stem + el.medium + cs.vowel); }
      case 'sovereign': return LR + center.seq + el.large;
      case 'selfsame': return ease(el, LR, el.alt + el.medium);
      case 'union': return LR + J + el2.alt + el.medium;
      case 'grandunion': return LR + J + el2.alt + el.large;
      default: throw new Error('bad form ' + form);
    }
  }
  // did the Easing Vowel fire for this assembly?
  function wasEased(el, form, center, spelling) {
    if (form !== 'mirror' && form !== 'verse' && form !== 'selfsame') return false;
    const R = spelling || el.root;
    const LR = longRoot(el, R);
    const piece = form === 'mirror' ? rev(center.seq)
      : form === 'selfsame' ? el.alt + el.medium
      : centerSplit(center.seq).stem + el.medium;
    return !VOWELS.includes(LR[LR.length - 1]) && !VOWELS.includes(piece[0]);
  }
  function assemble(el, form, center, el2, spelling, joiner) { return sandhi(rawAssemble(el, form, center, el2, spelling, joiner)); }

  /* ---------------- parts: the grimoire's notes ---------------- */
  function partsOf(el, form, center, el2, isSecretSpelling, elided, eased, joiner) {
    const parts = [];
    if (el.hiddenEl) parts.push('selem:' + el.id);
    else if (isSecretSpelling) parts.push('sroot:' + el.id);
    else parts.push('root:' + el.id);
    parts.push((SECRET_FORMS[form] ? 'sform:' : 'form:') + form);
    if (form === 'cantrip') parts.push(el.hiddenEl ? 'selem:' + el.id : 'suf:' + el.id + ':small');
    if (['word', 'bound', 'verse', 'union', 'selfsame'].includes(form)) parts.push(el.hiddenEl ? 'selem:' + el.id : 'suf:' + el.id + ':medium');
    if (['sovereign', 'grandunion'].includes(form)) parts.push(el.hiddenEl ? 'selem:' + el.id : 'suf:' + el.id + ':large');
    if (!['cantrip', 'word'].includes(form)) parts.push(el.hiddenEl ? 'selem:' + el.id : 'conn:' + el.id);
    if (form === 'selfsame') parts.push(el.hiddenEl ? 'selem:' + el.id : 'alt:' + el.id);
    if (center) parts.push((center.secretPart ? 'scenter:' : 'center:') + center.id);
    if (el2) {
      const j = joiner || JOINERS[0];
      parts.push((j.secretPart ? 'sjoin:' : 'join:') + j.id);
      parts.push(el2.hiddenEl ? 'selem:' + el2.id : 'alt:' + el2.id);
    }
    if (elided) parts.push('rule:elision');
    if (eased) parts.push('rule:easing');
    return Array.from(new Set(parts));
  }
  const canRead = (knowSet, entry) => entry.parts.every(pid => knowSet.has(pid));

  /* ---------------- effects ---------------- */
  function baseFx(el, tier) {
    const m = MAG[tier];
    switch (el.id) {
      case 'ign': return { dmg: m, burn: Math.ceil(m * 0.35), burnTurns: 2 };
      case 'gel': return { dmg: Math.ceil(m * 0.8), chill: 1 };
      case 'ter': return { dmg: Math.ceil(m * 0.65), block: Math.ceil(m * 0.7) };
      case 'aer': return { dmg: Math.ceil(m * 0.8), gust: tier >= 4 ? 2 : 1 };
      case 'ven': return { dmg: Math.ceil(m * 0.3), poison: Math.ceil(m * 0.55) };
      case 'ful': return { dmg: m, wild: 0.4, stunChance: tier >= 3 ? 0.25 : 0 };
      case 'aqu': return { dmg: Math.ceil(m * 0.7), heal: Math.ceil(m * 0.35), cleanse: tier >= 4 ? 1 : 0 };
      case 'umb': return { dmg: Math.ceil(m * 0.85), blind: tier >= 5 ? 2 : 1 };
      case 'lum': return { dmg: Math.ceil(m * 0.6), reveal: tier >= 5 ? 2 : 1 };
      case 'san': return { heal: Math.ceil(m * 1.1), cleanse: tier >= 4 ? 1 : 0, maxHp: tier >= 6 ? 2 : 0 };
      case 'nih': return { dmg: Math.ceil(m * 0.9), trueDmg: true, erode: Math.ceil(m * 0.25) };
      case 'cru': return { dmg: Math.ceil(m * 1.35), drain: 0.5, selfCost: Math.ceil(m * 0.2) };
      default: return { dmg: m };
    }
  }
  const AMP_KEYS = ['dmg', 'burn', 'poison', 'block', 'heal', 'erode'];
  function scaleFx(fx, mult) {
    const out = Object.assign({}, fx);
    for (const k of AMP_KEYS) if (out[k]) out[k] = Math.ceil(out[k] * mult);
    return out;
  }
  function mergeFx(a, b) {
    const out = Object.assign({}, a);
    for (const k of Object.keys(b)) {
      if (typeof b[k] === 'number' && typeof out[k] === 'number') out[k] = out[k] + b[k];
      else if (!(k in out)) out[k] = b[k];
    }
    return out;
  }

  /* Signature blends — ten weddings the loom remembers by name. */
  const SIGNATURES = {
    'aqu+ign': { name: 'Steam',    icon: '♨️', fx: (t) => ({ dmg: Math.ceil(MAG[t] * 1.1), scald: 1 }), note: 'Scalding — the foe’s next blow is halved.' },
    'ign+ter': { name: 'Magma',    icon: '🌋', fx: (t) => ({ dmg: Math.ceil(MAG[t] * 0.7), burn: Math.ceil(MAG[t] * 0.5), burnTurns: 3 }), note: 'A pooling burn that will not die down.' },
    'gel+ign': { name: 'Shatter',  icon: '💠', fx: (t) => ({ dmg: Math.ceil(MAG[t] * 1.5), stunChance: 0.35 }), note: 'Thermal shock — enormous, sometimes stunning.' },
    'ful+gel': { name: 'Hail',     icon: '🌨', fx: (t) => ({ dmg: Math.ceil(MAG[t] * 0.38), hits: 4, chill: 1 }), note: 'Four chilling strikes.' },
    'aqu+ful': { name: 'Tempest',  icon: '🌀', fx: (t) => ({ dmg: Math.ceil(MAG[t] * 0.8), aoe: true, gust: 2 }), note: 'Drowns every foe; the wind restocks your loom.' },
    'lum+umb': { name: 'Eclipse',  icon: '🌘', fx: (t) => ({ dmg: Math.ceil(MAG[t] * 0.9), blind: 2, reveal: 2 }), note: 'Blinds them; illuminates the mystery.' },
    'umb+ven': { name: 'Miasma',   icon: '🌫', fx: (t) => ({ poison: Math.ceil(MAG[t] * 0.6), aoe: true, blind: 1 }), note: 'A creeping cloud that poisons all.' },
    'san+ter': { name: 'Bloom',    icon: '🌸', fx: (t) => ({ block: Math.ceil(MAG[t] * 0.9), heal: Math.ceil(MAG[t] * 0.8) }), note: 'Stone and sap — wall and mending both.' },
    'aer+ign': { name: 'Wildfire', icon: '🔥', fx: (t) => ({ dmg: Math.ceil(MAG[t] * 0.55), aoe: true, burn: Math.ceil(MAG[t] * 0.3), burnTurns: 2 }), note: 'Wind-fed flame takes the whole field.' },
    'lum+san': { name: 'Dawn',     icon: '🌅', fx: (t) => ({ heal: Math.ceil(MAG[t] * 1.2), cleanse: 2, reveal: 2 }), note: 'Everything washed clean and lit.' },
  };
  const sigKey = (a, b) => [a, b].sort().join('+');

  function resolveFx(el, form, center, el2, len, joiner) {
    const tier = tierOf(len);
    let fx;
    if (el2) {
      const sig = SIGNATURES[sigKey(el.id, el2.id)];
      if (sig) { fx = Object.assign({}, sig.fx(tier)); fx.sig = sig.name; }
      else fx = mergeFx(scaleFx(baseFx(el, tier), 0.65), scaleFx(baseFx(el2, tier), 0.65));
      if (joiner && joiner.id === 'ac') fx = scaleFx(fx, 1.2); // the Old Wedding weds closer
    } else {
      fx = baseFx(el, tier);
    }
    if (form === 'selfsame') fx = scaleFx(fx, 1.5); // wedded to itself
    if (center) {
      switch (center.id) {
        case 'ora': fx = scaleFx(fx, 1.45); break;
        case 'uma': fx.block = (fx.block || 0) + Math.ceil(MAG[tier] * 0.6); break;
        case 'ova': fx.bloom = 2; break;
        case 'exa': fx = scaleFx(fx, 0.7); fx.aoe = true; break;
        case 'ulo': fx.chain = 0.4; break;
        case 'ava': fx.drain = 0.5; break;
        case 'ix': fx.execute = 0.35; break;
        case 'um': fx.hush = 1; break;
        case 'ulta': fx.overkill = true; break;
        case 'onda': fx.splash = 0.45; break;
        // the apocryphal centers
        case 'iz': fx.trueDmg = true; break;
        case 'aza': fx = scaleFx(fx, 1.25); fx.hush = (fx.hush || 0) + 1; break;
        case 'onza': fx = scaleFx(fx, 1.15); fx.erode = (fx.erode || 0) + Math.ceil(MAG[tier] * 0.3); break;
      }
    }
    if (form === 'mirror') fx.mirrorBlock = tier * 2;
    if (form === 'verse') fx.versePulse = true;
    return fx;
  }

  function describeFx(fx, el) {
    const b = [];
    if (fx.dmg) b.push(`${fx.dmg}${fx.wild ? '±' + Math.round(fx.wild * 100) + '%' : ''}${fx.trueDmg ? ' true' : ''} dmg${fx.hits ? '×' + fx.hits : ''}${fx.aoe ? ' to ALL' : ''}`);
    if (fx.burn) b.push(`burn ${fx.burn}×${fx.burnTurns || 2}`);
    if (fx.poison) b.push(`poison ${fx.poison}${fx.aoe && !fx.dmg ? ' to ALL' : ''}`);
    if (fx.block) b.push(`🛡 ${fx.block}`);
    if (fx.heal) b.push(`heal ${fx.heal}`);
    if (fx.chill) b.push('chill');
    if (fx.scald) b.push('scald (foe −50%)');
    if (fx.blind) b.push(`blind ×${fx.blind}`);
    if (fx.gust) b.push(`+${fx.gust} tile${fx.gust > 1 ? 's' : ''}`);
    if (fx.reveal) b.push(`reveal ${fx.reveal}`);
    if (fx.cleanse) b.push('cleanse');
    if (fx.maxHp) b.push(`+${fx.maxHp} max ink`);
    if (fx.stunChance) b.push(`${Math.round(fx.stunChance * 100)}% stun`);
    if (fx.drain) b.push('drains');
    if (fx.chain) b.push('40% recast');
    if (fx.bloom) b.push('blooms ×2 turns');
    if (fx.execute) b.push('×1.6 vs the faltering');
    if (fx.hush) b.push('hushes tricks');
    if (fx.overkill) b.push('overkill carries');
    if (fx.splash) b.push('45% splashes all');
    if (fx.erode) b.push(`erodes ${fx.erode} max ink`);
    if (fx.selfCost) b.push(`costs you ${fx.selfCost}`);
    if (fx.mirrorBlock) b.push(`mirror 🛡 ${fx.mirrorBlock}`);
    if (fx.versePulse) b.push(`echoes its ${el.root}-Word`);
    return b.join(' · ');
  }

  /* ---------------- the generated lexicon ---------------- */
  function buildLexicon() {
    const WORDS = {};
    const LIST = [];
    function addWord(el, form, center, el2, spelling, joiner) {
      const isSecretSpelling = !!spelling && spelling === el.secret;
      const raw = rawAssemble(el, form, center, el2, spelling, joiner);
      const word = sandhi(raw);
      if (WORDS[word]) throw new Error('collision: ' + word + ' (' + WORDS[word].name + ')');
      const elided = word !== raw;
      const eased = wasEased(el, form, center, spelling);
      const parts = partsOf(el, form, center, el2, isSecretSpelling, elided, eased, joiner);
      // hidden: any part of the word belongs to the secret grammar
      const hidden = parts.some(pid => /^(sroot|selem|scenter|sjoin|sform):/.test(pid));
      let fx = resolveFx(el, form, center, el2, word.length, joiner);
      if (isSecretSpelling) fx = scaleFx(fx, 1.35); // the elder spellings run hotter
      const sig = el2 ? SIGNATURES[sigKey(el.id, el2.id)] : null;
      const entry = {
        word, len: word.length, tier: tierOf(word.length),
        el: el.id, el2: el2 ? el2.id : null, center: center ? center.id : null,
        joiner: el2 ? (joiner || JOINERS[0]).id : null,
        form, hidden, secretSpelling: isSecretSpelling,
        name: el2
          ? (sig ? `${sig.icon} ${sig.name} ${FORM_DEF[form].name}` : `${el.name}–${el2.name} ${FORM_DEF[form].name}`)
            + (joiner && joiner.secretPart ? ' (Old Wedding)' : '')
          : `${isSecretSpelling ? '✧ Elder ' : ''}${el.name} ${FORM_DEF[form].name}${center ? ' of ' + center.name : ''}`,
        icon: el.icon,
        fx, elided,
        parts,
        desc: describeFx(fx, el),
      };
      WORDS[word] = entry;
      LIST.push(entry);
    }
    for (const el of ALL_ELEMENTS) {
      const spellings = [el.root].concat(el.secret ? [el.secret] : []);
      for (const spelling of spellings) {
        addWord(el, 'cantrip', null, null, spelling);
        addWord(el, 'word', null, null, spelling);
        addWord(el, 'bound', null, null, spelling);
        // every center — public and secret — wears all four woven forms
        for (const c of ALL_CENTERS) {
          for (const form of ['weave', 'mirror', 'verse', 'sovereign']) addWord(el, form, c, null, spelling);
        }
        // the Selfsame: the element wedded to itself (secret form)
        addWord(el, 'selfsame', null, null, spelling);
      }
      // blends: primary spelling only; the second element in its ALT spelling.
      // Both joiners wed every pair: ET openly, AC in secret.
      for (const el2 of ALL_ELEMENTS) {
        if (el2.id === el.id || el.hiddenEl) continue;
        for (const j of ALL_JOINERS) {
          addWord(el, 'union', null, el2, null, j);
          addWord(el, 'grandunion', null, el2, null, j);
        }
      }
    }
    return { WORDS, LIST };
  }
  const LEX = buildLexicon();
  const VISIBLE = LEX.LIST.filter(e => !e.hidden);

  /* letters: weighted by the visible lexicon; the hidden grammar seeps in
   * faintly, so its stranger letters exist as rare tiles */
  function letterWeights() {
    const freq = {};
    for (const e of VISIBLE) for (const ch of e.word) freq[ch] = (freq[ch] || 0) + 1;
    for (const e of LEX.LIST) if (e.hidden) for (const ch of e.word) freq[ch] = (freq[ch] || 0) + 0.12;
    for (const k in freq) freq[k] = Math.round(freq[k] * 100) / 100;
    return freq;
  }
  const LETTER_WEIGHTS = letterWeights();
  const ALPHABET = Object.keys(LETTER_WEIGHTS).sort();

  /* ---------------- the notes catalogue (public knowledge only) ---------------- */
  function buildParts() {
    const PARTS = {};
    const add = (id, icon, title, note, group) => { PARTS[id] = { id, icon, title, note, group }; };
    for (const el of ELEMENTS) {
      add('root:' + el.id, el.icon, `${el.root} — the ${el.name} root`, el.identity, 'roots');
      add('alt:' + el.id, el.icon, `${el.alt} — ${el.name}'s late spelling`, `When ${el.name.toLowerCase()} is wedded second into a word, it is written ${el.alt}.`, 'roots');
      add('suf:' + el.id + ':small', el.icon, `-${el.small} — ${el.name}'s small suffix`, `${el.root}${el.small}: its smallest utterance.`, 'suffixes');
      add('suf:' + el.id + ':medium', el.icon, `-${el.medium} — ${el.name}'s medium suffix`, `${el.root}${el.medium} and every longer form carry it.`, 'suffixes');
      add('suf:' + el.id + ':large', el.icon, `-${el.large} — ${el.name}'s large suffix`, 'Reserved for the Sovereigns and Grand Unions.', 'suffixes');
      add('conn:' + el.id, el.icon, el.longRoot
        ? `${el.root}→${el.longRoot} — ${el.name}'s irregular binder`
        : `${el.conn} — ${el.name}'s binder`,
        el.longRoot
          ? `In long words the R softens: the root itself becomes ${el.longRoot}.`
          : `Long ${el.name.toLowerCase()} words bind with ${el.conn}: ${el.root}${el.conn}-.`, 'binders');
    }
    for (const c of CENTERS) {
      const size = c.seq.length === 2 ? 'short' : c.seq.length === 4 ? 'grand' : '';
      add('center:' + c.id, c.icon, `${c.seq} — ${c.name}${size ? ' (' + size + ')' : ''}`, c.shape, 'centers');
    }
    for (const j of JOINERS) add('join:' + j.id, j.icon, `${j.seq} — ${j.name}`, j.note, 'joiners');
    for (const fid of FORM_IDS) add('form:' + fid, '𝔏', `The ${FORMS[fid].name}`, FORMS[fid].note, 'forms');
    /* the RULES of the tongue — lexical behaviours and the laws of length.
     * Notes flagged `info` describe the whole language rather than any one
     * word, so no word's readability hangs on them. */
    add('rule:elision', '✒️', "The Scribe's Elision", 'Twin vowels never touch — the second transmutes: A→E, E→A, I→E, O→U, U→O. So GEL+A+AS is written GELAES.', 'rules');
    add('rule:easing', '🫧', 'The Easing Vowel', "When a binder's consonant would strike another consonant, the element's small vowel eases the joint: UMBR+XI+S is written UMBROXIS.", 'rules');
    add('rule:length', '📏', 'Length is Power', 'A word’s tier is its length less three: every added rune deepens the magnitude (4 runes stir 5; 12 runes stir 52). Longer words need more — and rarer — tiles; that is the only price magic asks.', 'rules');
    PARTS['rule:length'].info = true;
    add('rule:sizes', '🧿', 'The Three Sizes', 'Centers come short (2 runes), standard (3) and grand (4), and the same woven forms wrap any of them — so a Weave spans 6–8 runes, a Mirror 7–9, a Verse 8–10, a Sovereign 9–11. Cantrips are 4, Words 5, Bound Words 6; Unions run 11 and Grand Unions 12.', 'rules');
    PARTS['rule:sizes'].info = true;
    return PARTS;
  }
  const PARTS = buildParts();
  const PART_IDS = Object.keys(PARTS);

  /* secret knowledge ids (taught only by events; never listed anywhere).
   * Every kind of word part has its apocryphal counterpart here: roots
   * (elder spellings), whole elements, centers, a joiner, and a form. */
  const SECRET_IDS = ELEMENTS.map(e => 'sroot:' + e.id)
    .concat(SECRET_ELEMENTS.map(e => 'selem:' + e.id))
    .concat(SECRET_CENTERS.map(c => 'scenter:' + c.id))
    .concat(SECRET_JOINERS.map(j => 'sjoin:' + j.id))
    .concat(Object.keys(SECRET_FORMS).map(f => 'sform:' + f));
  const SECRET_INFO = {};
  for (const el of ELEMENTS) {
    SECRET_INFO['sroot:' + el.id] = {
      id: 'sroot:' + el.id, icon: el.icon,
      title: `${el.secret} — the elder spelling of ${el.name}`,
      note: `Words woven from ${el.secret} run half again as hot as their ${el.root} kin.`,
    };
  }
  for (const el of SECRET_ELEMENTS) {
    SECRET_INFO['selem:' + el.id] = {
      id: 'selem:' + el.id, icon: el.icon,
      title: `${el.root} — the ${el.name} that is not spoken of`,
      note: el.identity,
    };
  }
  for (const c of SECRET_CENTERS) {
    SECRET_INFO['scenter:' + c.id] = {
      id: 'scenter:' + c.id, icon: c.icon,
      title: `${c.seq} — ${c.name}, a center no note admits`,
      note: c.shape,
    };
  }
  for (const j of SECRET_JOINERS) {
    SECRET_INFO['sjoin:' + j.id] = {
      id: 'sjoin:' + j.id, icon: j.icon,
      title: `${j.seq} — ${j.name}`,
      note: j.note,
    };
  }
  for (const f of Object.keys(SECRET_FORMS)) {
    SECRET_INFO['sform:' + f] = {
      id: 'sform:' + f, icon: '𝔉',
      title: `The ${SECRET_FORMS[f].name} — a form struck from the record`,
      note: SECRET_FORMS[f].note,
    };
  }

  function readableCount(knowSet) {
    let n = 0;
    for (const e of VISIBLE) if (canRead(knowSet, e)) n++;
    return n;
  }

  /* lengths that exist per form (for the mystery length picker) */
  function lengthsForForm(form) {
    const out = new Set();
    for (const e of VISIBLE) if (e.form === form) out.add(e.len);
    return Array.from(out).sort((a, z) => a - z);
  }

  return {
    ELEMENTS, SECRET_ELEMENTS, ALL_ELEMENTS, EL_BY_ID,
    CENTERS, SECRET_CENTERS, ALL_CENTERS, CENTER_BY_ID,
    JOINERS, SECRET_JOINERS, ALL_JOINERS, JOINER_BY_ID,
    FORMS, SECRET_FORMS, FORM_DEF, FORM_IDS, MAG, tierOf,
    SIGNATURES, sigKey,
    sandhi, assemble, rawAssemble, resolveFx, describeFx, longRoot, centerSplit,
    WORDS: LEX.WORDS, LIST: LEX.LIST, VISIBLE,
    PARTS, PART_IDS, SECRET_IDS, SECRET_INFO,
    partsOf, canRead, readableCount, lengthsForForm,
    ALPHABET, LETTER_WEIGHTS,
  };
});
