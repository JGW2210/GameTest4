/* ============================================================
 * WORDLOOM — The generative morphology
 *
 * Every spell in the game is assembled from word-parts by fixed
 * grammatical rules. Nothing here is a word list: the lexicon is
 * GENERATED. Learn the parts and you can read (and eventually
 * improvise) the whole language.
 *
 * Anatomy of a word:
 *   ROOT (3)        the element        IGN, GEL, TER, AER, VEN...
 *   SUFFIX          the magnitude      small (1) / medium (2) / large (3)
 *   CONNECTOR (1)   binds long forms   IGN+I → IGNI-  (AER is irregular)
 *   CENTER (3)      the shape          ORA the Eye, EXA the Scatter...
 *
 * The seven forms, by word length:
 *   L4  Cantrip     ROOT + small                     IGNA
 *   L5  Word        ROOT + medium                    IGNUS
 *   L6  Bound       ROOT + CONN + medium             IGNIUS
 *   L7  Weave       ROOT + CONN + CENTER             IGNIORA
 *   L8  Mirror      ROOT + CONN + reverse(CENTER)+S  IGNIAROS
 *   L9  Verse       ROOT + CONN + CENTERstem
 *                     + medium + CENTERvowel         IGNIORUSA
 *                   (the center's last vowel migrates to the word's end)
 *   L10 Sovereign   ROOT + CONN + CENTER + large     IGNIORARIS
 *
 * The Scribe's Elision (sandhi): when assembly seats two identical
 * vowels side by side, the SECOND transmutes — A→E, E→A, I→E,
 * O→U, U→O. So GEL+A+AS is written GELAES, VEN+O+ORA is VENOURA.
 * Consonant doublings stand (TERRA's RR is proof enough).
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Morph = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* ---------------- elements (prefix roots) ---------------- */
  // Each element: root, suffixes by size, connector letter, and its
  // combat identity. AER is irregular: in long forms the R softens and
  // the root itself becomes AETH (the connector lives inside it).
  const ELEMENTS = [
    { id: 'ign', root: 'IGN', name: 'Fire',     icon: '🔥', small: 'A', medium: 'US', large: 'RIS', conn: 'I',
      hue: '#ff7a3c', identity: 'Damage that keeps burning.' },
    { id: 'gel', root: 'GEL', name: 'Frost',    icon: '❄️', small: 'U', medium: 'AS', large: 'RIS', conn: 'A',
      hue: '#8fd0ff', identity: 'Damage that chills the foe’s next blow.' },
    { id: 'ter', root: 'TER', name: 'Earth',    icon: '🪨', small: 'E', medium: 'RA', large: 'RIA', conn: 'E',
      hue: '#c9a06a', identity: 'Damage that raises stone to ward you.' },
    { id: 'aer', root: 'AER', name: 'Air',      icon: '🌬️', small: 'O', medium: 'IS', large: 'IUM', conn: 'TH', longRoot: 'AETH',
      hue: '#bfe8d8', identity: 'Damage; the wind carries extra letters to your loom.' },
    { id: 'ven', root: 'VEN', name: 'Venom',    icon: '☠️', small: 'U', medium: 'OX', large: 'XIA', conn: 'O',
      hue: '#8fbf5f', identity: 'A small bite, then poison does the work.' },
    { id: 'ful', root: 'FUL', name: 'Storm',    icon: '⚡', small: 'O', medium: 'UR', large: 'MEN', conn: 'G',
      hue: '#ffd75c', identity: 'Wild damage — sometimes it stuns.' },
    { id: 'aqu', root: 'AQU', name: 'Water',    icon: '💧', small: 'A', medium: 'IS', large: 'TUS', conn: 'E',
      hue: '#6db6ff', identity: 'Damage that soothes — heals and washes curses away.' },
    { id: 'umb', root: 'UMB', name: 'Shadow',   icon: '🌑', small: 'O', medium: 'IS', large: 'TIS', conn: 'R',
      hue: '#9a87c9', identity: 'Damage from the dark; the foe swings blind.' },
    { id: 'lum', root: 'LUM', name: 'Light',    icon: '✨', small: 'A', medium: 'EN', large: 'NIS', conn: 'I',
      hue: '#fff3b0', identity: 'Modest damage — and it reveals the mystery word’s runes.' },
    { id: 'san', root: 'SAN', name: 'Vitality', icon: '💚', small: 'A', medium: 'US', large: 'TAS', conn: 'I',
      hue: '#7fbf6d', identity: 'No harm at all: it mends you.' },
  ];
  const EL_BY_ID = {};
  ELEMENTS.forEach(e => { EL_BY_ID[e.id] = e; });

  /* ---------------- centers (shape modifiers) ---------------- */
  // Three letters, vowel–consonant–vowel, so every center can survive
  // the Mirror (reversal) and the Verse (vowel migration).
  const CENTERS = [
    { id: 'ora', seq: 'ORA', name: 'the Eye',     icon: '👁', shape: 'Amplified: ×1.45 to everything the word does.' },
    { id: 'uma', seq: 'UMA', name: 'the Veil',    icon: '🕸', shape: 'Warding: also grants stone equal to 60% of its power.' },
    { id: 'ova', seq: 'OVA', name: 'the Seed',    icon: '🌱', shape: 'Blooming: its effect echoes at half strength for 2 turns.' },
    { id: 'exa', seq: 'EXA', name: 'the Scatter', icon: '💥', shape: 'Scattering: strikes ALL foes at 70% strength.' },
    { id: 'ulo', seq: 'ULO', name: 'the Chain',   icon: '⛓', shape: 'Chaining: 40% chance to instantly recast itself, free.' },
    { id: 'ava', seq: 'AVA', name: 'the Hunger',  icon: '🩸', shape: 'Draining: heals you for half the damage it deals.' },
  ];
  const CENTER_BY_ID = {};
  CENTERS.forEach(c => { CENTER_BY_ID[c.id] = c; });

  /* ---------------- forms ---------------- */
  const FORM_NAMES = {
    4: 'Cantrip', 5: 'Word', 6: 'Bound Word', 7: 'Weave',
    8: 'Mirror', 9: 'Verse', 10: 'Sovereign',
  };
  const TIER_BY_LEN = { 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6, 10: 7 };
  // Base magnitude per tier — the single dial the whole language scales from.
  const MAG = [0, 5, 8, 12, 16, 21, 27, 34];

  /* ---------------- assembly ---------------- */
  const VOWELS = 'AEIOU';
  const ELISION = { A: 'E', E: 'A', I: 'E', O: 'U', U: 'O' };

  // The Scribe's Elision: identical adjacent vowels — the second transmutes.
  // A single left-to-right pass resolves cascades (AAE → AEE → AEA...).
  function sandhi(w) {
    const s = w.split('');
    for (let i = 1; i < s.length; i++) {
      if (s[i] === s[i - 1] && VOWELS.includes(s[i])) s[i] = ELISION[s[i]];
    }
    return s.join('');
  }

  function longRoot(el) { return el.longRoot || (el.root + el.conn); }
  const rev = (s) => s.split('').reverse().join('');

  // Assemble one word (pre-elision). center is null for forms 4–6.
  function rawAssemble(el, len, center) {
    const L = longRoot(el);
    switch (len) {
      case 4: return el.root + el.small;
      case 5: return el.root + el.medium;
      case 6: return L + el.medium;
      case 7: return L + center.seq;
      case 8: return L + rev(center.seq) + 'S';
      case 9: return L + center.seq.slice(0, 2) + el.medium + center.seq[2];
      case 10: return L + center.seq + el.large;
      default: throw new Error('bad form length ' + len);
    }
  }
  function assemble(el, len, center) { return sandhi(rawAssemble(el, len, center)); }

  /* ---------------- parts: what the grimoire actually records ----------------
   * You never inscribe words. You inscribe NOTES — the rules and parts a
   * solved word teaches. A word can be read (cast at full power) once every
   * part it is built from is in your grimoire. 64 notes read all 270 words. */
  const SUFFIX_SIZE_BY_LEN = { 4: 'small', 5: 'medium', 6: 'medium', 9: 'medium', 10: 'large' };
  function partsOf(el, len, center, elided) {
    const parts = ['root:' + el.id, 'form:' + len];
    const sz = SUFFIX_SIZE_BY_LEN[len];
    if (sz) parts.push('suf:' + el.id + ':' + sz);
    if (len >= 6) parts.push('conn:' + el.id);
    if (center) parts.push('center:' + center.id);
    if (elided) parts.push('rule:elision');
    return parts;
  }
  const canRead = (partsSet, entry) => entry.parts.every(pid => partsSet.has(pid));

  /* ---------------- effects ----------------
   * Element decides WHAT the word does; tier (length) decides how hard;
   * center reshapes it; forms 8/9 carry small signature riders.
   * Returns a declarative fx object the engine resolves at cast time. */
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
      default: return { dmg: m };
    }
  }

  const AMP_KEYS = ['dmg', 'burn', 'poison', 'block', 'heal'];
  function scaleFx(fx, mult) {
    const out = Object.assign({}, fx);
    for (const k of AMP_KEYS) if (out[k]) out[k] = Math.ceil(out[k] * mult);
    return out;
  }

  function resolveFx(el, len, center) {
    const tier = TIER_BY_LEN[len];
    let fx = baseFx(el, tier);
    if (center) {
      switch (center.id) {
        case 'ora': fx = scaleFx(fx, 1.45); break;
        case 'uma': fx.block = (fx.block || 0) + Math.ceil(MAG[tier] * 0.6); break;
        case 'ova': fx.bloom = 2; break;      // echo at 50% for 2 turns
        case 'exa': fx = scaleFx(fx, 0.7); fx.aoe = true; break;
        case 'ulo': fx.chain = 0.4; break;    // chance to recast free
        case 'ava': fx.drain = 0.5; break;    // heal for half damage dealt
      }
    }
    if (len === 8) fx.mirrorBlock = tier * 2;       // the Mirror wards its speaker
    if (len === 9) fx.versePulse = true;            // the Verse hums its own L5 word after
    return fx;
  }

  function describeFx(fx, el) {
    const b = [];
    if (fx.dmg) b.push(`${fx.dmg}${fx.wild ? '±' + Math.round(fx.wild * 100) + '%' : ''} dmg${fx.aoe ? ' to ALL' : ''}`);
    if (fx.burn) b.push(`burn ${fx.burn}×${fx.burnTurns || 2}`);
    if (fx.poison) b.push(`poison ${fx.poison}`);
    if (fx.block) b.push(`🛡 ${fx.block}`);
    if (fx.heal) b.push(`heal ${fx.heal}`);
    if (fx.chill) b.push('chill (foe −35% dmg)');
    if (fx.blind) b.push(`blind ×${fx.blind}`);
    if (fx.gust) b.push(`+${fx.gust} tile${fx.gust > 1 ? 's' : ''}`);
    if (fx.reveal) b.push(`reveal ${fx.reveal} rune${fx.reveal > 1 ? 's' : ''}`);
    if (fx.cleanse) b.push('cleanse');
    if (fx.maxHp) b.push(`+${fx.maxHp} max hp`);
    if (fx.stunChance) b.push(`${Math.round(fx.stunChance * 100)}% stun`);
    if (fx.drain) b.push('drains half as healing');
    if (fx.chain) b.push('40% recast');
    if (fx.bloom) b.push('blooms 2 turns');
    if (fx.mirrorBlock) b.push(`mirror 🛡 ${fx.mirrorBlock}`);
    if (fx.versePulse) b.push(`+ echoes its ${el.root}-Word`);
    return b.join(' · ');
  }

  /* ---------------- the generated lexicon ---------------- */
  function buildLexicon() {
    const WORDS = {};
    const LIST = [];
    for (const el of ELEMENTS) {
      for (const len of [4, 5, 6]) {
        addWord(el, len, null);
      }
      for (const len of [7, 8, 9, 10]) {
        for (const c of CENTERS) addWord(el, len, c);
      }
    }
    function addWord(el, len, center) {
      const raw = rawAssemble(el, len, center);
      const word = sandhi(raw);
      if (word.length !== len) throw new Error(`length drift: ${word} wanted ${len}`);
      if (WORDS[word]) throw new Error(`collision: ${word}`);
      const fx = resolveFx(el, len, center);
      const elided = word !== raw;
      const entry = {
        word, len, tier: TIER_BY_LEN[len],
        el: el.id, center: center ? center.id : null,
        form: FORM_NAMES[len],
        name: `${el.name} ${FORM_NAMES[len]}${center ? ' of ' + center.name : ''}`,
        icon: el.icon,
        fx,
        elided,
        parts: partsOf(el, len, center, elided),
        desc: describeFx(fx, el),
      };
      WORDS[word] = entry;
      LIST.push(entry);
    }
    return { WORDS, LIST };
  }

  const LEX = buildLexicon();

  // The living alphabet: only letters the language actually uses exist as
  // tiles, weighted by how often the lexicon needs them ("a pool of common
  // letters" — common as defined by the language itself).
  function letterWeights() {
    const freq = {};
    for (const e of LEX.LIST) for (const ch of e.word) freq[ch] = (freq[ch] || 0) + 1;
    return freq;
  }
  const LETTER_WEIGHTS = letterWeights();
  const ALPHABET = Object.keys(LETTER_WEIGHTS).sort();

  /* The full catalogue of inscribable notes, with grimoire flavor. */
  const FORM_NOTES = {
    4: 'ROOT + small suffix. The smallest utterance an element allows.',
    5: 'ROOT + medium suffix. A word with its shoulders back.',
    6: 'ROOT + binder + medium suffix. The binder joins; the word grows.',
    7: 'ROOT + binder + CENTER. A center woven into the heart of the word.',
    8: 'ROOT + binder + CENTER reversed, sealed with S. The mirror also wards its speaker.',
    9: 'ROOT + binder + CENTER, its last vowel migrated to the word\'s end, the medium suffix nested inside — the Verse echoes its inner Word.',
    10: 'ROOT + binder + CENTER + large suffix. The whole grammar, spoken at once.',
  };
  function buildParts() {
    const PARTS = {};
    const add = (id, icon, title, note, group) => { PARTS[id] = { id, icon, title, note, group }; };
    for (const el of ELEMENTS) {
      add('root:' + el.id, el.icon, `${el.root} — the ${el.name} root`, el.identity, 'roots');
      add('suf:' + el.id + ':small', el.icon, `-${el.small} — ${el.name}'s small suffix`, `${el.root}${el.small}: its smallest utterance.`, 'suffixes');
      add('suf:' + el.id + ':medium', el.icon, `-${el.medium} — ${el.name}'s medium suffix`, `${el.root}${el.medium} and every longer form carry it.`, 'suffixes');
      add('suf:' + el.id + ':large', el.icon, `-${el.large} — ${el.name}'s large suffix`, `Reserved for the ten-rune Sovereigns.`, 'suffixes');
      add('conn:' + el.id, el.icon, el.longRoot
        ? `${el.root}→${el.longRoot} — ${el.name}'s irregular binder`
        : `${el.conn} — ${el.name}'s binder`,
        el.longRoot
          ? `In long words the R softens: the root itself becomes ${el.longRoot}.`
          : `Long ${el.name.toLowerCase()} words bind with ${el.conn}: ${el.root}${el.conn}-.`, 'binders');
    }
    for (const c of CENTERS) add('center:' + c.id, c.icon, `${c.seq} — ${c.name}`, c.shape, 'centers');
    for (const len of [4, 5, 6, 7, 8, 9, 10]) add('form:' + len, '𝔏' + len, `The ${FORM_NAMES[len]} (${len} runes)`, FORM_NOTES[len], 'forms');
    add('rule:elision', '✒️', "The Scribe's Elision", 'Twin vowels never touch — the second transmutes: A→E, E→A, I→E, O→U, U→O. So GEL+A+AS is written GELAES.', 'rules');
    return PARTS;
  }
  const PARTS = buildParts();
  const PART_IDS = Object.keys(PARTS);

  function readableCount(partsSet) {
    let n = 0;
    for (const e of LEX.LIST) if (canRead(partsSet, e)) n++;
    return n;
  }

  return {
    ELEMENTS, EL_BY_ID, CENTERS, CENTER_BY_ID,
    FORM_NAMES, TIER_BY_LEN, MAG,
    sandhi, assemble, rawAssemble, resolveFx, describeFx, longRoot,
    WORDS: LEX.WORDS, LIST: LEX.LIST,
    PARTS, PART_IDS, partsOf, canRead, readableCount,
    ALPHABET, LETTER_WEIGHTS,
  };
});
