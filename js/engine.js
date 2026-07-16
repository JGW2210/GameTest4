/* ============================================================
 * WORDLOOM — engine, second weaving (pure logic, browser + Node)
 *
 * The grimoire records NOTES (rules and parts), never words. A word
 * is READABLE — castable at full power — once every part it uses is
 * known. Knowledge = public notes ∪ secret knowledge − sealed notes.
 *
 * ACQUIRE: one free guess per turn at a mystery word of a LENGTH YOU
 * CHOOSE (lengths beyond the basic forms are opened by form notes).
 * DEPLOY: spell readable words from the loom. The loom SUGGESTS only
 * words up to your class's chip range (+ Ribbon Index) — longer words
 * must be spelled by hand, from knowledge.
 *
 * Third weaving: THE BREATH (each word spoken in a turn tires the
 * voice −15%, floor ×0.4 — the breath returns at turn's end), UNCUT
 * RUNES (solving mints a blank tile, cap 2, shaped when spoken, spent
 * forever — never for hidden words), and THE SHUTTLE (set one tile
 * aside per turn; it rides across turns and battles until spoken).
 *
 * Fourth weaving: BOBBINS — pre-wound word-parts spoken as blocks.
 *
 * Fifth weaving: the ten ROOTS are day-one knowledge, and every run
 * opens with three root vessels wound. Bobbins are BATTERIES now:
 * speaking one empties it, and it is rewound by feeding it letters
 * from the pile (any pace, across turns and battles). An empty
 * vessel can CAPTURE any part its keeper knows — secrets included —
 * by winding its letters three full times. You own an inventory of
 * vessels; three ride the frame at once, chosen between battles;
 * rewards and road events grant more, and a free shuttle notch can
 * be unspooled into a spare vessel. LIVING SPEECH: a word spelled
 * purely from letters tires the breath half as much as one leaning
 * on a blank or a bobbin. Offered vessels never carry the secret
 * grammar — only its keeper's own hands may wind it.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data/morphology.js'), require('./data/foes.js'),
      require('./data/classes.js'), require('./data/events.js'));
  } else {
    root.Loom = factory(root.Morph, root.Foes, root.Weavers, root.LoomEvents);
  }
})(typeof self !== 'undefined' ? self : this, function (Morph, Foes, Weavers, LoomEvents) {

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

  const SOLVE_MULT = 1.5;
  const IMPROV_MULT = 0.5; // overreach: a word beyond the tier's cap
  // the breath: every word spoken in a turn tires the voice a little —
  // multi-casting is a choice with a cost, not a free sweep. LIVING
  // SPEECH breathes easier: a word spelled purely from letter tiles
  // tires less than one leaning on a blank or a bobbin.
  const FATIGUE_PURE = 0.10;
  const FATIGUE_ASSISTED = 0.20;
  const FATIGUE_FLOOR = 0.4;
  // uncut runes: blank tiles minted by SOLVING, shaped into any letter
  // when spoken, spent forever. Never drawn from the bag.
  const BLANK_CAP = 2;
  // the shuttle: set a tile aside once per turn; it rides with you
  // across turns AND battles until spoken
  const SHUTTLE_BASE = 2;
  // bobbins are VESSELS now — batteries of thread. A wound vessel
  // speaks its part as one block; speaking empties it, and it is
  // rewound by feeding it letters from the pile (any pace, across
  // turns and battles). An empty vessel can instead CAPTURE any part
  // its keeper knows — secrets included — by winding its letters
  // CAPTURE_WINDS full times. You own an inventory; at most
  // BOBBIN_ACTIVE ride the loom's frame, chosen outside battle.
  const BOBBIN_ACTIVE = 3;
  const BOBBIN_INVENTORY = 8;
  const CAPTURE_WINDS = 3;
  const VOWELS = 'AEIOU';
  /* ---------------- the loom-school: four difficulties ----------------
   * Each tier caps the LENGTH of words it has opened (longer words can
   * still be OVERREACHED at improvised power) and scales the foes.
   * Beating a tier unlocks the next. */
  const DIFFICULTIES = [
    { id: 1, name: 'Apprentice', icon: '🕯', cap: 8, scale: 0.8,
      desc: 'Single-element words to 8 runes. A gentler road.' },
    { id: 2, name: 'Journeyman', icon: '🖋', cap: 10, scale: 1.05,
      desc: 'The Sovereigns open — words to 10 runes — and the road presses harder.' },
    { id: 3, name: 'Artisan', icon: '🧵', cap: 12, scale: 1.35,
      desc: 'The weddings open — blended words to 12 runes — and the elder roads appear.' },
    { id: 4, name: 'Loomwright', icon: '🪡', cap: 13, scale: 1.65,
      desc: 'The grand Woven Unions, the cruelest foes, and the deepest secrets of the tongue.' },
  ];
  const DIFF_BY_ID = {};
  DIFFICULTIES.forEach(d => { DIFF_BY_ID[d.id] = d; });
  // the roster: five elements are known from the first stitch. Each run
  // ATTUNES three of the discovered elements; battles offer the rest.
  const STARTER_ELEMENTS = ['ign', 'aqu', 'aer', 'san', 'ter'];
  const RUN_ELEMENTS = 3;

  /* ---------------- the rune pouch: letters come from elements ----------------
   * Each element carries a KIT — the letters of its root, binder and
   * suffixes, frequency-weighted and normalized to one mass. The run's
   * pouch is the attuned kits poured together: a trio speaks in ~9
   * distinct letters. Center letters are NOT in any kit — they are
   * THREADED in one center at a time, as spoils on the road. The
   * wedding spellings (alt — how an element is written when wedded
   * second) are in no kit either: at Artisan+ a battle may award one,
   * opening that element's marriages, pouring its letters in, and
   * winding it onto a vessel. Held secrets SEEP letters in faintly. */
  const KIT_MASS = 100;
  const KIT_ALT_MASS = 30;
  const CENTER_LETTER_MASS = 12; // per distinct letter, when threaded
  const SECRET_SEEP = 3;
  const KITS = (() => {
    const out = {};
    for (const el of Morph.ALL_ELEMENTS) {
      const freq = {};
      const add = (s, w) => { for (const ch of s) freq[ch] = (freq[ch] || 0) + w; };
      add(el.root, 1);
      if (el.longRoot) add(el.longRoot, 0.5);
      add(el.conn, 1); add(el.small, 1); add(el.medium, 1); add(el.large, 1);
      let total = 0;
      for (const k in freq) total += freq[k];
      const core = {};
      for (const k in freq) core[k] = Math.round(freq[k] / total * KIT_MASS * 10) / 10;
      const alt = {};
      for (const ch of el.alt) alt[ch] = (alt[ch] || 0) + KIT_ALT_MASS / el.alt.length;
      out[el.id] = { core, alt };
    }
    return out;
  })();
  function addKit(bag, elId) {
    const kit = KITS[elId];
    if (!kit) return;
    for (const ch in kit.core) bag[ch] = (bag[ch] || 0) + kit.core[ch];
  }
  // the letters a piece of secret knowledge lets seep into the pouch
  function secretLetters(id) {
    const kind = id.split(':')[0], key = id.split(':')[1];
    if (kind === 'sroot') { const el = Morph.EL_BY_ID[key]; return (el && el.secret) || ''; }
    if (kind === 'scenter') { const c = Morph.CENTER_BY_ID[key]; return c ? c.seq : ''; }
    if (kind === 'sjoin') { const j = Morph.JOINER_BY_ID[key]; return j ? j.seq : ''; }
    if (kind === 'selem') {
      const el = Morph.EL_BY_ID[key];
      return el ? el.root + el.alt + el.conn + el.small + el.medium + el.large : '';
    }
    return ''; // forms and rules carry no letters of their own
  }
  function addSecretSeep(bag, id) {
    for (const ch of new Set(secretLetters(id))) bag[ch] = (bag[ch] || 0) + SECRET_SEEP;
  }
  // the distinct letters a set of elements brings (for the prep screen)
  function pouchLetters(elIds) {
    const s = new Set();
    for (const id of elIds) {
      const el = Morph.EL_BY_ID[id];
      if (!el) continue;
      for (const ch of el.root + (el.longRoot || '') + el.conn + el.small + el.medium + el.large) s.add(ch);
    }
    return Array.from(s).sort();
  }
  /* ---------------- knowledge: elements carry their parts whole ---------------- */
  function knowSet(meta, sealed) {
    const s = new Set(meta.parts);
    for (const id of meta.secrets) s.add(id);
    if (sealed) for (const id of sealed) s.delete(id);
    return s;
  }
  // every part an element brings with it, in full — mastery of the rules,
  // not note-by-note archaeology
  function elementPartIds(elId) {
    return ['root:' + elId, 'alt:' + elId, 'conn:' + elId,
      'suf:' + elId + ':small', 'suf:' + elId + ':medium', 'suf:' + elId + ':large']
      .filter(pid => Morph.PARTS[pid]);
  }
  // the universal grammar — centers, joiners, forms, rules — known to all
  const UNIVERSAL_PARTS = Morph.PART_IDS.filter(pid => /^(center|join|form|rule):/.test(pid));
  // materialize meta.parts from the discovered roster (union: merges keep)
  function syncMeta(meta) {
    if (!meta.elements) meta.elements = new Set(STARTER_ELEMENTS);
    if (!meta.diff) meta.diff = 1;
    for (const elId of meta.elements) for (const pid of elementPartIds(elId)) meta.parts.add(pid);
    for (const pid of UNIVERSAL_PARTS) meta.parts.add(pid);
    return meta;
  }
  // what THIS RUN reads: the attuned elements' parts, the universal
  // grammar, and the secret knowledge — less whatever a foe has sealed.
  // The wedding spelling (alt) stays unread until earned on the road.
  function runKnow(run, sealed) {
    const s = new Set(UNIVERSAL_PARTS);
    for (const elId of run.elements) {
      for (const pid of elementPartIds(elId)) {
        if (pid === 'alt:' + elId && !(run.altUnlocked && run.altUnlocked.has(elId))) continue;
        s.add(pid);
      }
    }
    for (const id of run.meta.secrets) s.add(id);
    if (sealed) for (const id of sealed) s.delete(id);
    return s;
  }

  /* ---------------- letter bag & tray ---------------- */
  function drawLetter(rng, bag) {
    let total = 0;
    for (const ch in bag) total += bag[ch];
    let r = rng() * total;
    for (const ch in bag) { r -= bag[ch]; if (r <= 0) return ch; }
    return 'A';
  }
  let tileSeq = 1;
  function drawTile(rng, bag) { return { id: tileSeq++, ch: drawLetter(rng, bag), frozen: 0 }; }
  function makeBlank() { return { id: tileSeq++, ch: '★', blank: true, frozen: 0 }; }
  function refillTray(b) {
    const want = b.traySize - b.tray.length;
    for (let i = 0; i < want; i++) b.tray.push(drawTile(b.rng, b.bag));
    const floor = Math.max(3, Math.round(b.traySize / 3));
    let vowels = b.tray.filter(t => VOWELS.includes(t.ch)).length;
    let guard = 0;
    while (vowels < floor && guard++ < 20) {
      const idx = b.tray.findIndex(t => !VOWELS.includes(t.ch) && !t.frozen && !t.blank);
      if (idx < 0) break;
      b.tray[idx] = drawTile(b.rng, b.bag);
      if (VOWELS.includes(b.tray[idx].ch)) vowels++;
    }
  }

  /* ---------------- battles ---------------- */
  function makeFoe(id, scale) {
    const f = Foes.FOES[id];
    const hp = Math.round(f.hp * scale);
    return {
      id, name: f.name, icon: f.icon, boss: !!f.boss, elite: !!f.elite,
      hp, maxHp: hp, str: 0, dmgScale: scale,
      weakTo: f.weakTo || null, resist: f.resist || null, adaptive: !!f.adaptive,
      gimmick: f.gimmick, regen: f.regen || 0,
      poison: 0, burn: 0, burnTurns: 0, blind: 0, chill: 0, scald: 0, stun: 0, hushed: 0,
      pattern: f.pattern, patternIdx: 0,
    };
  }

  function createBattle(run, foeIds, scale) {
    const b = {
      rng: run.rng, run,
      foes: foeIds.map(fid => typeof fid === 'string' ? makeFoe(fid, scale) : makeFoe(fid.id, scale * (fid.mult || 1))),
      target: 0,
      player: { hp: run.hp, maxHp: run.maxHp, block: 0, blooms: [] },
      traySize: run.traySize, bag: run.bag, tray: [],
      cursedLetter: null,
      mulligans: 1 + (run.perks.mulligans || 0),
      guessesPerTurn: 1,
      tileDiscardUsed: false,
      shuttleUsed: false,
      fatigue: 0,
      blankMinted: false,
      quillUsed: false,
      sealedNotes: new Set(),
      turn: 0, over: false, won: false,
      guessesThisTurn: 0,
      mystery: null,
      log: [], stats: { casts: 0, improvs: 0, solves: 0, notes: [] },
      fxq: [],
    };
    if (!run.shuttle) run.shuttle = [];
    if (!run.bobbins) run.bobbins = [];
    refillTray(b);
    // uncut runes ride between battles: they re-enter the fresh tray,
    // each taking the place of a drawn letter
    for (let i = 0; i < Math.min(run.blanks || 0, BLANK_CAP); i++) {
      if (b.tray.length) b.tray.pop();
      b.tray.push(makeBlank());
    }
    run.blanks = 0;
    const lens = guessableLengths(run);
    serveMystery(b, run.flags.longmystery ? lens[Math.min(lens.length - 1, 1)] : lens[0]);
    run.flags.longmystery = false;
    if (run.flags.revealNext > 0) { revealLetter(b); run.flags.revealNext--; }
    b.turn = 1;
    return b;
  }

  const alive = (b) => b.foes.filter(f => f.hp > 0);
  function targetFoe(b) {
    if (b.foes[b.target] && b.foes[b.target].hp > 0) return b.foes[b.target];
    const a = alive(b);
    if (a.length) b.target = b.foes.indexOf(a[0]);
    return a[0] || b.foes[0];
  }
  function say(b, msg) { b.log.push(msg); }
  // visual-effect events: the UI drains these after each action and
  // plays particles/animations; the engine stays presentation-free.
  function fxEmit(b, ev) { if (b.fxq) b.fxq.push(ev); }
  function drainFx(b) { const q = b.fxq || []; b.fxq = []; return q; }

  /* ---------------- the mystery word & length choice ----------------
   * The mystery is drawn from YOUR NOTES: always a word the run can
   * read, at a length the difficulty has opened. Solving is execution
   * — a ×1.5 cast and an uncut rune — never blind archaeology. */
  const MAX_LEN = 13; // the grand Woven Unions reach 13 runes
  const diffCap = (run) => (DIFF_BY_ID[run.difficulty] || DIFFICULTIES[0]).cap;
  function mysteryPool(run, len, sealed, allowSolved) {
    const know = runKnow(run, sealed);
    return Morph.VISIBLE.filter(e => e.len === len
      && (allowSolved || !run.meta.solved.has(e.word))
      && Morph.canRead(know, e));
  }
  // every length the player may currently REQUEST
  function guessableLengths(run) {
    const cap = diffCap(run);
    const know = runKnow(run);
    const out = new Set();
    for (const e of Morph.VISIBLE) {
      if (e.len <= cap && !out.has(e.len) && Morph.canRead(know, e)) out.add(e.len);
    }
    const lens = Array.from(out).sort((a, z) => a - z);
    return lens.length ? lens : [4];
  }

  function serveMystery(b, len) {
    let pool = mysteryPool(b.run, len, b.sealedNotes, false);
    if (!pool.length) pool = mysteryPool(b.run, len, b.sealedNotes, true);
    if (!pool.length) {
      const know = runKnow(b.run);
      pool = Morph.VISIBLE.filter(e => e.len <= diffCap(b.run) && Morph.canRead(know, e));
    }
    if (!pool.length) pool = Morph.VISIBLE;
    const e = pick(b.rng, pool);
    b.mystery = { answer: e.word, len: e.len, guesses: [], revealed: [] };
    say(b, `📜 A ${e.len}-rune mystery word waits on the loom's margin.`);
  }

  function chooseLength(b, len) {
    if (b.over) return false;
    if (!guessableLengths(b.run).includes(len)) return false;
    serveMystery(b, len);
    return true;
  }

  function judge(guess, answer) {
    const marks = new Array(guess.length).fill('absent');
    const pool = {};
    for (let i = 0; i < answer.length; i++) {
      if (guess[i] === answer[i]) marks[i] = 'hit';
      else pool[answer[i]] = (pool[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < guess.length; i++) {
      if (marks[i] === 'hit') continue;
      if (pool[guess[i]] > 0) { marks[i] = 'near'; pool[guess[i]]--; }
    }
    return marks;
  }

  /* the breath: multiplier for the NEXT word spoken this turn */
  function spokenMult(b) {
    return Math.max(FATIGUE_FLOOR, Math.round((1 - (b.fatigue || 0)) * 100) / 100);
  }

  /* solving leaves an UNCUT RUNE on the loom — a blank tile, shaped
   * into any letter at speaking time and spent forever. The loom yields
   * one per battle: only the FIRST solve leaves its splinter. */
  function mintBlank(b) {
    if (b.blankMinted) return false;
    b.blankMinted = true;
    const held = b.tray.filter(t => t.blank).length + b.run.shuttle.filter(t => t.blank).length;
    if (held >= BLANK_CAP) return false;
    b.tray.push(makeBlank());
    say(b, '★ The solving leaves an <b>uncut rune</b> on your loom — a blank tile, shaped when spoken.');
    fxEmit(b, { type: 'blank' });
    return true;
  }

  function canGuess(b) { return !b.over && !!b.mystery && b.guessesThisTurn < b.guessesPerTurn; }
  function useQuill(b) {
    if (b.quillUsed || !b.run.perks.quill || canGuess(b)) return false;
    b.quillUsed = true;
    b.guessesThisTurn = Math.max(0, b.guessesThisTurn - 1);
    say(b, '🪶 The Quill of Second Thoughts grants another guess.');
    return true;
  }

  function guess(b, raw) {
    if (!canGuess(b)) return { ok: false, reason: 'spent' };
    const g = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
    const m = b.mystery;
    if (g.length !== m.len) return { ok: false, reason: 'length' };
    if (b.cursedLetter && g.includes(b.cursedLetter)) return { ok: false, reason: 'cursed' };
    b.guessesThisTurn++;
    const marks = judge(g, m.answer);
    m.guesses.push({ word: g, marks });
    const correct = g === m.answer;
    if (correct) {
      const word = m.answer;
      b.run.meta.solved.add(word);
      b.stats.solves++;
      say(b, `🌟 <b>${word}</b> — spoken true! The solving is pure craft.`);
      fxEmit(b, { type: 'solved', word });
      const fat = spokenMult(b);
      if (fat < 1) say(b, `🌬 Your breath is short — the solving carries ×${fat} of its force.`);
      castWordFx(b, word, SOLVE_MULT * fat, 'solved');
      b.fatigue += FATIGUE_PURE; // a solve is living speech
      mintBlank(b);
      if (!b.over) serveMystery(b, m.len);
      return { ok: true, correct: true, marks };
    }
    return { ok: true, correct: false, marks };
  }

  function revealLetter(b) {
    const m = b.mystery;
    if (!m) return false;
    const hidden = [];
    for (let i = 0; i < m.answer.length; i++) if (!m.revealed.some(r => r.i === i)) hidden.push(i);
    if (!hidden.length) return false;
    const i = pick(b.rng, hidden);
    m.revealed.push({ i, c: m.answer[i] });
    say(b, `✨ Light falls on the mystery word — rune ${i + 1} is <b>${m.answer[i]}</b>.`);
    return true;
  }

  /* ---------------- spelling from the loom ---------------- */
  // tiles usable for spelling: the unfrozen tray plus everything riding
  // on the shuttle (tray first, so banked tiles are only spent when needed)
  function spellPool(b) {
    return b.tray.filter(t => !t.frozen).concat(b.run.shuttle || []);
  }
  // exact letters first; UNCUT RUNES (blanks) fill whatever is missing —
  // unless noBlanks: the hidden words must be spelled true
  function tilesFor(b, word, opts) {
    const pool = spellPool(b);
    const used = [];
    let missing = 0;
    for (const ch of word) {
      const idx = pool.findIndex(t => t.ch === ch && !t.blank);
      if (idx < 0) { missing++; continue; }
      used.push(pool.splice(idx, 1)[0]);
    }
    if (missing) {
      if (opts && opts.noBlanks) return null;
      for (let i = 0; i < missing; i++) {
        const idx = pool.findIndex(t => t.blank);
        if (idx < 0) return null;
        used.push(pool.splice(idx, 1)[0]);
      }
    }
    return used;
  }
  /* ---------------- bobbins: vessels of pre-wound thread ---------------- */
  // seq null = a blank vessel awaiting a capture
  function makeVessel(seq, icon, wound) {
    return { id: tileSeq++, seq: seq || null, icon: icon || '🪢',
      wound: !!(seq && wound), left: seq && !wound ? seq : '',
      capSeq: null, capIcon: null, winds: 0, active: false };
  }
  const activeVessels = (run) => (run.bobbins || []).filter(v => v.active);
  const availBobbins = (b) => activeVessels(b.run).filter(v => v.wound && v.seq);

  // what a vessel is currently winding toward (its own part, or a capture)
  const windingSeq = (v) => v.capSeq || v.seq;

  /* feed letters from the pile into an unwound ACTIVE vessel. Each tile
   * fills one still-needed letter of the current wind — and an uncut
   * rune ★ may be spent to fill ANY hollow slot (with a tight pouch it
   * is often the only way to wind a center). Rewinding a vessel's own
   * part takes ONE full wind; CAPTURING a new part takes CAPTURE_WINDS. */
  function feedVessel(b, vesselId, ids) {
    if (b.over) return { ok: false, reason: 'over' };
    const v = activeVessels(b.run).find(x => x.id === vesselId);
    if (!v || v.wound || !windingSeq(v)) return { ok: false, reason: 'no-vessel' };
    let fed = 0, blanksFed = 0;
    for (const id of ids || []) {
      const t = b.tray.find(x => x.id === id && !x.frozen)
        || (b.run.shuttle || []).find(x => x.id === id);
      if (!t || !v.left.length) continue;
      let ch = t.ch;
      if (t.blank) { ch = v.left[0]; blanksFed++; }
      else if (!v.left.includes(ch)) continue;
      v.left = v.left.replace(ch, '');
      const ti = b.tray.indexOf(t);
      if (ti >= 0) b.tray.splice(ti, 1); else b.run.shuttle.splice(b.run.shuttle.indexOf(t), 1);
      fed++;
    }
    if (blanksFed) say(b, `★ ${blanksFed > 1 ? blanksFed + ' uncut runes shape themselves' : 'An uncut rune shapes itself'} into the winding — and is spent.`);
    if (!fed) return { ok: false, reason: 'no-fit' };
    let done = false, captured = false;
    if (!v.left.length) {
      if (v.capSeq && ++v.winds < CAPTURE_WINDS) {
        v.left = v.capSeq; // wind it again — the thread must learn the shape
      } else {
        if (v.capSeq) { v.seq = v.capSeq; v.icon = v.capIcon || v.icon; v.capSeq = null; v.capIcon = null; captured = true; }
        v.winds = 0; v.wound = true; done = true;
      }
    }
    const what = windingSeq(v) || v.seq;
    if (captured) say(b, `🪢 <b>${v.seq}</b> is captured — the vessel knows its shape now, wound and ready.`);
    else if (done) say(b, `🪢 The <b>${v.seq}</b> vessel is wound full — ready to speak.`);
    else if (v.capSeq) say(b, `🪢 You wind thread toward <b>${what}</b> — pass ${v.winds + 1} of ${CAPTURE_WINDS}, <b>${v.left.length}</b> letter${v.left.length === 1 ? '' : 's'} to go.`);
    else say(b, `🪢 You wind <b>${fed}</b> letter${fed > 1 ? 's' : ''} onto the ${v.seq} vessel — <b>${v.left.length}</b> to go.`);
    fxEmit(b, { type: 'wind', n: fed });
    return { ok: true, fed, wound: done, captured };
  }

  /* aim an empty vessel at a NEW part (any note you hold, secrets too).
   * Winding it CAPTURE_WINDS full times makes the part its own. */
  function startCapture(run, vesselId, seq, icon) {
    const v = (run.bobbins || []).find(x => x.id === vesselId);
    if (!v || v.wound) return false;
    if (!windableParts(run.meta, run).some(p => p.seq === seq)) return false;
    v.capSeq = seq; v.capIcon = icon || '🪢'; v.winds = 0; v.left = seq;
    return true;
  }

  /* every part in the grimoire a vessel could hold (2+ letters). The
   * secret grammar appears here ONLY for its keeper — it is never
   * offered, listed, or sold. Pass the run to gate the wedding
   * spellings to the ones earned this run. */
  function windableParts(meta, run) {
    const out = [];
    const seen = new Set();
    const add = (seq, icon, title, elder) => {
      if (!seq || seq.length < 2 || seen.has(seq)) return;
      seen.add(seq);
      out.push({ seq, icon, title, elder: !!elder });
    };
    for (const el of Morph.ELEMENTS) {
      if (meta.parts.has('root:' + el.id)) add(el.root, el.icon, `the ${el.name} root`);
      if (meta.secrets.has('sroot:' + el.id)) add(el.secret, el.icon, `the elder ${el.name}`, true);
      if (run ? run.altUnlocked.has(el.id) : meta.parts.has('alt:' + el.id))
        add(el.alt, el.icon, `${el.name}'s wedding spelling`);
      if (meta.parts.has('suf:' + el.id + ':medium') && el.medium.length >= 2) add(el.medium, el.icon, `${el.name}'s medium suffix`);
      if (meta.parts.has('suf:' + el.id + ':large')) add(el.large, el.icon, `${el.name}'s large suffix`);
    }
    for (const el of Morph.SECRET_ELEMENTS) {
      if (meta.secrets.has('selem:' + el.id)) {
        add(el.root, el.icon, `the ${el.name} root`, true);
        add(el.alt, el.icon, `${el.name}'s late spelling`, true);
      }
    }
    for (const c of Morph.CENTERS) if (meta.parts.has('center:' + c.id)) add(c.seq, c.icon, c.name);
    for (const c of Morph.SECRET_CENTERS) if (meta.secrets.has('scenter:' + c.id)) add(c.seq, c.icon, c.name, true);
    if (meta.parts.has('join:et')) add('ET', '💍', 'the Wedding');
    if (meta.secrets.has('sjoin:ac')) add('AC', '🗝', 'the Old Wedding', true);
    return out;
  }

  /* the loadout: at most BOBBIN_ACTIVE vessels ride the frame. The UI
   * locks changes during battle. */
  function setVesselActive(run, vesselId, on) {
    const v = (run.bobbins || []).find(x => x.id === vesselId);
    if (!v) return { ok: false, reason: 'no-vessel' };
    if (on && !v.active && activeVessels(run).length >= BOBBIN_ACTIVE) return { ok: false, reason: 'full' };
    v.active = !!on;
    return { ok: true };
  }

  /* unspool a free shuttle notch into a spare vessel — one-way */
  function unspoolShuttle(run) {
    if (shuttleCap(run) <= 0 || shuttleCap(run) <= run.shuttle.length) return { ok: false, reason: 'no-notch' };
    if ((run.bobbins || []).length >= BOBBIN_INVENTORY) return { ok: false, reason: 'inventory' };
    run.unspooled = (run.unspooled || 0) + 1;
    const v = makeVessel(null, '🪢', false);
    run.bobbins.push(v);
    return { ok: true, vessel: v };
  }

  /* how the loom can pay for a word: letter tiles first (blanks last);
   * only if the letters alone cannot, ONE whole bobbin spoken as a
   * block — two pre-wound blocks tangle the thread */
  function piecesFor(b, word, opts) {
    const letters = tilesFor(b, word, opts);
    if (letters) return { tiles: letters, bobbins: [] };
    for (const bob of availBobbins(b)) {
      let at = word.indexOf(bob.seq);
      while (at >= 0) {
        const tiles = tilesFor(b, word.slice(0, at) + word.slice(at + bob.seq.length), opts);
        if (tiles) return { tiles, bobbins: [bob] };
        at = word.indexOf(bob.seq, at + 1);
      }
    }
    return null;
  }
  const canSpell = (b, word, opts) => !!piecesFor(b, word, opts);

  /* validate an EXPLICIT picking — tray/shuttle tiles and bobbins, in
   * speaking order — against the word. A blank covers any letter; a
   * bobbin must match its block exactly. The player's choice of pieces
   * is honored to the tile: no bobbin is spent uninvited. */
  function piecesFromPicks(b, word, ids) {
    const tiles = [], bobbins = [];
    let pos = 0;
    for (const id of ids) {
      let p = b.tray.find(t => t.id === id && !t.frozen)
        || (b.run.shuttle || []).find(t => t.id === id);
      if (p) {
        if (tiles.includes(p) || pos >= word.length) return null;
        if (!p.blank && p.ch !== word[pos]) return null;
        tiles.push(p); pos += 1; continue;
      }
      p = availBobbins(b).find(x => x.id === id);
      if (!p || bobbins.length) return null; // one bobbin per word
      if (!word.startsWith(p.seq, pos)) return null;
      bobbins.push(p); pos += p.seq.length;
    }
    return pos === word.length ? { tiles, bobbins } : null;
  }

  function chipMax(run) {
    return Math.min(MAX_LEN, run.cls.chipMax + (run.perks.ribbon || 0));
  }

  /* the loom-sense: how long is the longest word the loom could weave
   * from these tiles? Felt only up to the sense's reach (chipMax; the
   * Ribbon Index stretches it). Returns { best, cap, beyond } — beyond
   * is true when something longer than the reach stirs in the tiles.
   * Readable or improvised alike; secret words never register. */
  function loomSense(b) {
    const cap = Math.min(MAX_LEN, chipMax(b.run));
    let best = 0, beyond = false;
    for (const e of VISIBLE_BY_LEN) {
      if (e.len <= cap) {
        if (e.len > best && canSpell(b, e.word)) best = e.len;
      } else {
        if (canSpell(b, e.word)) { beyond = true; break; }
      }
    }
    return { best, cap, beyond };
  }

  // Retained for the balance simulator's autoplayer ONLY: the UI no
  // longer surfaces found words — players spell everything by hand.
  function spellableWords(b) {
    const know = runKnow(b.run, b.sealedNotes);
    const cap = Math.min(chipMax(b.run), diffCap(b.run));
    const out = [];
    for (const e of Morph.VISIBLE) {
      if (e.len > cap) continue;
      if (Morph.canRead(know, e) && canSpell(b, e.word)) out.push(e);
    }
    return out.sort((a, z) => z.len - a.len || (a.word < z.word ? -1 : 1)).slice(0, 12);
  }

  // stale check: can ANY word of the loom-tongue be woven from the current
  // tray — readable or improvised, any length, chip cap ignored? Secret
  // (hidden) words don't count: their absence must stay unremarkable.
  const VISIBLE_BY_LEN = Morph.VISIBLE.slice().sort((a, z) => a.len - z.len);
  function anySpellable(b) {
    for (const e of VISIBLE_BY_LEN) if (canSpell(b, e.word)) return e.word;
    return null;
  }

  /* ---------------- the shuttle: tiles set aside, across turns ---------------- */
  function shuttleCap(run) { return Math.max(0, SHUTTLE_BASE + (run.perks.shuttle || 0) - (run.unspooled || 0)); }
  // once per turn: lift one tray tile onto the shuttle. It rides there —
  // safe from foes, across turns and battles — until spoken or taken back.
  function shuttleTile(b, id) {
    if (b.over || b.shuttleUsed) return { ok: false, reason: b.over ? 'over' : 'used' };
    if (b.run.shuttle.length >= shuttleCap(b.run)) return { ok: false, reason: 'full' };
    const t = b.tray.find(x => x.id === id && !x.frozen);
    if (!t) return { ok: false, reason: 'none' };
    b.tray.splice(b.tray.indexOf(t), 1);
    b.run.shuttle.push(t);
    b.shuttleUsed = true;
    say(b, `🧺 You set <b>${t.blank ? '★' : t.ch}</b> aside on the shuttle — it rides with you until spoken.`);
    return { ok: true };
  }
  // taking a tile back is free (the deposit is what costs the turn's motion)
  function unshuttleTile(b, id) {
    if (b.over) return false;
    const t = b.run.shuttle.find(x => x.id === id);
    if (!t) return false;
    b.run.shuttle.splice(b.run.shuttle.indexOf(t), 1);
    b.tray.push(t);
    return true;
  }

  /* once per turn: cast up to DISCARD_MAX picked tiles back and draw as
   * many fresh — the pressure valve for a loom with no words in it.
   * Uncut runes are precious: the bag refuses them. */
  const DISCARD_MAX = 5;
  function discardTiles(b, ids) {
    if (b.over || b.tileDiscardUsed) return { ok: false, reason: b.over ? 'over' : 'used' };
    const tiles = (ids || []).slice(0, DISCARD_MAX)
      .map(id => b.tray.find(t => t.id === id))
      .filter(t => t && !t.frozen && !t.blank);
    if (!tiles.length) return { ok: false, reason: 'none' };
    for (const t of tiles) b.tray.splice(b.tray.indexOf(t), 1);
    for (let i = 0; i < tiles.length; i++) b.tray.push(drawTile(b.rng, b.bag));
    b.tileDiscardUsed = true;
    say(b, `🗑 You cast ${tiles.length} tile${tiles.length > 1 ? 's' : ''} back into the bag and draw anew.`);
    fxEmit(b, { type: 'discard', n: tiles.length });
    return { ok: true, n: tiles.length };
  }

  function castWord(b, word, picks) {
    if (b.over) return { ok: false, reason: 'over' };
    word = String(word || '').toUpperCase();
    const entry = Morph.WORDS[word];
    if (!entry) return { ok: false, reason: 'not-a-word' };
    // mastery, not archaeology: only readable words — attuned elements,
    // known grammar — may be spoken at all. Words beyond the tier's
    // length cap can still be OVERREACHED, at improvised power.
    const know = runKnow(b.run, b.sealedNotes);
    if (!Morph.canRead(know, entry)) return { ok: false, reason: 'unread' };
    const within = entry.len <= diffCap(b.run);
    // the hidden words must be spelled true — no uncut rune may shape them
    let pieces;
    if (picks && picks.length) {
      pieces = piecesFromPicks(b, word, picks);
      if (!pieces) return { ok: false, reason: 'tiles' };
      if (entry.hidden && pieces.tiles.some(t => t.blank)) return { ok: false, reason: 'true-spelling' };
    } else {
      pieces = piecesFor(b, word, { noBlanks: !!entry.hidden });
      if (!pieces) return { ok: false, reason: entry.hidden && canSpell(b, word) ? 'true-spelling' : 'tiles' };
    }
    const tiles = pieces.tiles;
    const blanksSpent = tiles.filter(t => t.blank).length;
    for (const t of tiles) {
      const ti = b.tray.indexOf(t);
      if (ti >= 0) b.tray.splice(ti, 1);
      else {
        const si = b.run.shuttle.indexOf(t);
        if (si >= 0) b.run.shuttle.splice(si, 1);
      }
    }
    if (blanksSpent) say(b, `★ ${blanksSpent > 1 ? blanksSpent + ' uncut runes shape themselves' : 'An uncut rune shapes itself'} into the word — and is spent.`);
    for (const bob of pieces.bobbins) {
      bob.wound = false;
      bob.left = bob.seq;
      say(b, `🪢 The <b>${bob.seq}</b> vessel unwinds into the word — feed it letters to wind it anew.`);
    }
    const assisted = blanksSpent > 0 || pieces.bobbins.length > 0;
    const fat = spokenMult(b);
    if (within) { b.stats.casts++; castWordFx(b, word, fat, 'cast'); }
    else {
      // OVERREACH: the word is readable but longer than this tier has
      // opened — it can be spoken, at improvised power
      b.stats.improvs++;
      const improv = Math.round((IMPROV_MULT + (b.run.perks.whetstone ? 0.2 : 0)) * fat * 100) / 100;
      say(b, `〰 You overreach — <b>${word}</b> runs longer than your tier has opened (×${improv}).`);
      castWordFx(b, word, improv, 'improvised');
    }
    // living speech breathes easier than assisted speech
    b.fatigue += assisted ? FATIGUE_ASSISTED : FATIGUE_PURE;
    return { ok: true, overreached: !within };
  }

  function elemMult(foe, elId) {
    if (!elId) return 1;
    if (foe.weakTo === elId) return 1.5;
    if (foe.resist === elId) return 0.5;
    return 1;
  }

  function hitFoe(b, foe, dmg, elId, opts) {
    opts = opts || {};
    let mult = opts.trueDmg ? 1 : elemMult(foe, elId);
    if (opts.execute && foe.hp <= foe.maxHp * opts.execute) mult *= 1.6;
    const d = Math.max(0, Math.round(dmg * mult));
    const hpBefore = foe.hp;
    foe.hp -= d;
    const tag = !opts.trueDmg && mult > 1 ? ' — it fears this!' : (!opts.trueDmg && mult < 1 ? ' (resisted)' : '');
    say(b, `⚔ ${foe.icon} ${foe.name} takes <b>${d}</b>${tag}`);
    fxEmit(b, { type: 'foeHit', idx: b.foes.indexOf(foe), amount: d, el: elId,
                rel: !opts.trueDmg && mult > 1 ? 'weak' : (!opts.trueDmg && mult < 1 ? 'resist' : '') });
    if (foe.adaptive && elId && foe.hp > 0) { foe.resist = elId; say(b, `🗿 ${foe.name} calcifies against ${Morph.EL_BY_ID[elId].name.toLowerCase()}.`); }
    if (foe.hp <= 0) {
      foe.hp = 0;
      say(b, `✝ ${foe.name} is unwritten.`);
      fxEmit(b, { type: 'foeDown', idx: b.foes.indexOf(foe) });
      if (b.sealedNotes.size && (foe.boss || foe.elite)) {
        b.sealedNotes.clear();
        say(b, '📖 Your sealed notes breathe open again.');
      }
      // overkill: the Beyond spills past the corpse
      if (opts.overkill) {
        const spill = d - hpBefore;
        const next = alive(b)[0];
        if (spill > 0 && next) {
          say(b, '🌌 The Beyond spills onward.');
          hitFoe(b, next, spill, elId, { trueDmg: true });
        }
      }
    }
    checkEnd(b);
    return d;
  }

  function healPlayer(b, n) {
    const amt = Math.min(n, b.player.maxHp - b.player.hp);
    if (amt > 0) { b.player.hp += amt; say(b, `💚 You mend <b>${amt}</b>.`); fxEmit(b, { type: 'heal', amount: amt }); }
  }

  function castWordFx(b, word, mult, how) {
    const entry = Morph.WORDS[word];
    const el = Morph.EL_BY_ID[entry.el];
    const fx = entry.fx;
    mult *= b.run.cls.power || 1;
    if (how !== 'bloom') {
      say(b, `${el.icon} <b>${word}</b> — ${entry.name}${mult !== 1 ? ` ×${Math.round(mult * 100) / 100}` : ''}`);
      fxEmit(b, { type: 'cast', word, el: entry.el, how });
    }
    if (fx.selfCost && how !== 'bloom') {
      b.player.hp -= fx.selfCost;
      say(b, `🩸 The word drinks <b>${fx.selfCost}</b> of your own ink.`);
      checkEnd(b);
      if (b.over) return;
    }
    applyFx(b, fx, el, mult, entry);
    let chains = 0;
    while (fx.chain && !b.over && chains < 3 && b.rng() < fx.chain) {
      chains++;
      say(b, `⛓ <b>${word}</b> chains itself — again, freely!`);
      applyFx(b, fx, el, mult, entry);
    }
  }

  function applyFx(b, fx, el, mult, entry) {
    const M = (n) => Math.max(0, Math.round(n * mult));
    const tgt = targetFoe(b);
    const victims = fx.aoe ? alive(b) : (tgt && tgt.hp > 0 ? [tgt] : []);
    let dealt = 0;
    for (const f of victims) {
      if (fx.dmg) {
        let base = fx.dmg;
        if (fx.wild) base = base * (1 - fx.wild + b.rng() * fx.wild * 2);
        const hits = fx.hits || 1;
        const per = M(base) / hits;
        for (let h = 0; h < hits && f.hp > 0 && !b.over; h++) {
          dealt += hitFoe(b, f, Math.round(per), el.id, fx);
        }
      }
      if (fx.burn && f.hp > 0) {
        const scaled = Math.round(M(fx.burn) * (fx.trueDmg ? 1 : elemMult(f, el.id)));
        if (scaled > 0) { f.burn += scaled; f.burnTurns = Math.max(f.burnTurns, fx.burnTurns || 2); }
      }
      if (fx.poison && f.hp > 0) {
        const scaled = Math.round(M(fx.poison) * (fx.trueDmg ? 1 : elemMult(f, el.id)));
        if (scaled > 0) f.poison += scaled;
      }
      if (fx.erode && f.hp > 0) {
        f.maxHp = Math.max(5, f.maxHp - M(fx.erode));
        f.hp = Math.min(f.hp, f.maxHp);
        say(b, `⬛ ${f.name}'s utmost vigor is erased (−${M(fx.erode)}).`);
        checkEnd(b);
      }
      if (fx.chill && f.hp > 0) f.chill = Math.max(f.chill, fx.chill);
      if (fx.scald && f.hp > 0) f.scald = Math.max(f.scald, fx.scald);
      if (fx.blind && f.hp > 0) f.blind += fx.blind;
      if (fx.hush && f.hp > 0) { f.hushed += fx.hush; say(b, `🤫 ${f.name}'s tricks are hushed.`); }
      if (fx.stunChance && f.hp > 0 && b.rng() < fx.stunChance) { f.stun += 1; say(b, `💫 ${f.name} reels, stunned!`); }
    }
    if (fx.splash && dealt > 0 && !fx.aoe) {
      for (const other of alive(b)) {
        if (other === targetFoe(b)) continue;
        say(b, '🌊 The wave crests over another.');
        hitFoe(b, other, Math.round(dealt * fx.splash), el.id, { trueDmg: true });
        if (b.over) break;
      }
    }
    if (fx.drain && dealt > 0) healPlayer(b, Math.round(dealt * fx.drain));
    if (fx.block) { b.player.block += M(fx.block); say(b, `🛡 Stone rises: +${M(fx.block)}.`); fxEmit(b, { type: 'block', amount: M(fx.block) }); }
    if (fx.mirrorBlock) b.player.block += fx.mirrorBlock;
    if (fx.heal) healPlayer(b, M(fx.heal));
    if (fx.maxHp) { b.player.maxHp += fx.maxHp; b.player.hp += fx.maxHp; b.run.maxHp = b.player.maxHp; }
    if (fx.cleanse && b.cursedLetter) { b.cursedLetter = null; say(b, '💧 The inked-out letter washes clean.'); }
    if (fx.gust) {
      for (let i = 0; i < fx.gust; i++) if (b.tray.length < b.traySize + 2) b.tray.push(drawTile(b.rng, b.bag));
      say(b, `🌬 The wind carries ${fx.gust} fresh tile${fx.gust > 1 ? 's' : ''} to your loom.`);
    }
    if (fx.reveal) for (let i = 0; i < fx.reveal; i++) revealLetter(b);
    if (fx.bloom && entry && !b._blooming) {
      b.player.blooms.push({ word: entry.word, turns: fx.bloom });
      say(b, `🌱 <b>${entry.word}</b> takes seed — it will bloom again.`);
    }
    if (fx.versePulse && entry && !b._blooming) {
      const inner = Morph.LIST.find(e => e.el === entry.el && e.form === 'word' && !e.hidden && !e.secretSpelling);
      if (inner) { say(b, `🎶 The verse hums its inner word — <b>${inner.word}</b> echoes.`); castWordFx(b, inner.word, mult / (b.run.cls.power || 1), 'bloom'); }
    }
  }

  function mulligan(b) {
    if (b.over || b.mulligans <= 0) return false;
    b.mulligans--;
    b.tray = b.tray.filter(t => t.frozen || t.blank);
    refillTray(b);
    say(b, '♻ You sweep the loom and draw fresh letters.');
    return true;
  }

  /* ---------------- foe turn ---------------- */
  function foeIntent(b, f) { return f.pattern[f.patternIdx % f.pattern.length]; }

  function describeIntent(b, f) {
    const m = foeIntent(b, f);
    const dmg = (n) => {
      let d = Math.round(n * f.dmgScale) + f.str;
      if (f.chill) d = Math.max(1, d - Math.ceil(d * 0.35));
      if (f.scald) d = Math.max(1, Math.ceil(d * 0.5));
      return d;
    };
    switch (m.kind) {
      case 'attack': return { icon: '⚔️', text: m.hits > 1 ? `${dmg(m.n)}×${m.hits}` : `${dmg(m.n)}`, kind: 'attack' };
      case 'devour': return { icon: '👅', text: `eats ${m.n} vowel${m.n > 1 ? 's' : ''}${m.dmg ? ` +${dmg(m.dmg)}` : ''}`, kind: 'devour' };
      case 'freeze': return { icon: '🧊', text: `freezes ${m.n} tiles`, kind: 'freeze' };
      case 'burnTile': return { icon: '🔥', text: `burns ${m.n} tile${m.n > 1 ? 's' : ''}${m.dmg ? ` +${dmg(m.dmg)}` : ''}`, kind: 'burnTile' };
      case 'curse': return { icon: '🚫', text: 'inks out a letter', kind: 'curse' };
      case 'scramble': return { icon: '🌀', text: 'scrambles your loom', kind: 'scramble' };
      case 'brood': return { icon: '💪', text: `+${m.str} strength`, kind: 'brood' };
      case 'stealTile': return { icon: '🫳', text: `steals ${m.n} tile${m.n > 1 ? 's' : ''} & mends${m.dmg ? ` +${dmg(m.dmg)}` : ''}`, kind: 'stealTile' };
      case 'shuffleGuess': return { icon: '🌫', text: `blurs a guess${m.dmg ? ` +${dmg(m.dmg)}` : ''}`, kind: 'shuffleGuess' };
      case 'sap': return { icon: '🫗', text: 'saps a revealed rune', kind: 'sap' };
      case 'sealNote': return { icon: '🔒', text: 'seals a grimoire note', kind: 'sealNote' };
      default: return { icon: '❔', text: '?', kind: '?' };
    }
  }

  function foeAttack(b, f, n, hits) {
    for (let h = 0; h < (hits || 1); h++) {
      if (b.over) return;
      if (f.blind > 0 && b.rng() < 0.5) { say(b, `🌫 ${f.name} strikes only shadow.`); continue; }
      let d = Math.round(n * f.dmgScale) + f.str;
      if (f.chill > 0) d = Math.max(1, d - Math.ceil(d * 0.35));
      if (f.scald > 0) { d = Math.max(1, Math.ceil(d * 0.5)); f.scald--; say(b, '♨️ Scalded, it falters.'); }
      const absorbed = Math.min(b.player.block, d);
      b.player.block -= absorbed;
      const loss = d - absorbed;
      b.player.hp -= loss;
      say(b, loss > 0 ? `💥 ${f.name} hits you for <b>${loss}</b>.` : `🛡 Your stone absorbs ${f.name}'s blow.`);
      fxEmit(b, { type: 'playerHit', loss, idx: b.foes.indexOf(f) });
      checkEnd(b);
    }
  }

  function doFoeMove(b, f, m) {
    switch (m.kind) {
      case 'attack': foeAttack(b, f, m.n, m.hits); break;
      case 'devour': {
        let eaten = 0;
        for (let i = 0; i < m.n; i++) {
          const idx = b.tray.findIndex(t => VOWELS.includes(t.ch));
          if (idx >= 0) { b.tray.splice(idx, 1); eaten++; }
        }
        if (eaten) say(b, `👅 ${f.name} devours ${eaten} vowel${eaten > 1 ? 's' : ''} from your loom!`);
        if (m.dmg) foeAttack(b, f, m.dmg, 1);
        b._trayDebt = (b._trayDebt || 0) + eaten;
        break;
      }
      case 'freeze': {
        const free = b.tray.filter(t => !t.frozen);
        for (let i = 0; i < m.n && free.length; i++) {
          const t = free.splice(Math.floor(b.rng() * free.length), 1)[0];
          t.frozen = 2;
        }
        say(b, `🧊 ${f.name} rimes ${m.n} of your tiles.`);
        break;
      }
      case 'burnTile': {
        let burned = 0;
        for (let i = 0; i < m.n; i++) {
          const free = b.tray.filter(t => !t.frozen);
          if (!free.length) break;
          b.tray.splice(b.tray.indexOf(pick(b.rng, free)), 1);
          burned++;
        }
        if (burned) say(b, `🔥 ${f.name} burns ${burned} tile${burned > 1 ? 's' : ''} to ash.`);
        if (m.dmg) foeAttack(b, f, m.dmg, 1);
        break;
      }
      case 'curse': {
        const common = 'AEIOURSNT';
        b.cursedLetter = common[Math.floor(b.rng() * common.length)];
        say(b, `🚫 ${f.name} inks out <b>${b.cursedLetter}</b> — you cannot guess with it next turn.`);
        break;
      }
      case 'scramble':
        // uncut runes are set in the loom's frame — the scramble spares them
        b.tray = b.tray.filter(t => t.frozen || t.blank);
        refillTray(b);
        say(b, `🌀 ${f.name} scrambles your whole loom!`);
        break;
      case 'brood': f.str += m.str; say(b, `💪 ${f.name} swells with malice (+${m.str}).`); break;
      case 'stealTile': {
        let stolen = 0;
        for (let i = 0; i < m.n && b.tray.length; i++) {
          let idx;
          if (f.id === 'indexwyrm') {
            idx = b.tray.reduce((best, t, ti) => t.ch < b.tray[best].ch ? ti : best, 0);
          } else idx = Math.floor(b.rng() * b.tray.length);
          b.tray.splice(idx, 1);
          stolen++;
        }
        if (stolen) {
          const mend = stolen * Math.round(3 * f.dmgScale);
          f.hp = Math.min(f.maxHp, f.hp + mend);
          say(b, `🫳 ${f.name} steals ${stolen} tile${stolen > 1 ? 's' : ''} and mends <b>${mend}</b>.`);
        }
        if (m.dmg) foeAttack(b, f, m.dmg, 1);
        break;
      }
      case 'shuffleGuess': {
        const rows = b.mystery ? b.mystery.guesses.filter(g => g.marks.some(x => x !== 'blur')) : [];
        if (rows.length) {
          const row = pick(b.rng, rows);
          row.marks = row.marks.map(() => 'blur');
          say(b, `🌫 ${f.name} blurs your guess of <b>${row.word}</b> — its colors are gone.`);
        }
        if (m.dmg) foeAttack(b, f, m.dmg, 1);
        break;
      }
      case 'sap': {
        if (b.mystery && b.mystery.revealed.length) {
          const r = b.mystery.revealed.pop();
          say(b, `🫗 ${f.name} saps the revealed rune <b>${r.c}</b> back into darkness.`);
        } else foeAttack(b, f, 5, 1);
        break;
      }
      case 'sealNote': {
        const candidates = Array.from(b.run.meta.parts).filter(pid => !b.sealedNotes.has(pid));
        if (candidates.length) {
          const pid = pick(b.rng, candidates);
          b.sealedNotes.add(pid);
          say(b, `🔒 ${f.name} seals your note — <b>${Morph.PARTS[pid] ? Morph.PARTS[pid].title : pid}</b> sleeps until this foe is unwritten.`);
        }
        break;
      }
    }
  }

  function endTurn(b) {
    if (b.over) return;
    b.cursedLetter = null;
    b._blooming = true;
    for (const bl of b.player.blooms) {
      say(b, `🌱 <b>${bl.word}</b> blooms.`);
      castWordFx(b, bl.word, 0.5, 'bloom');
      bl.turns--;
    }
    b._blooming = false;
    b.player.blooms = b.player.blooms.filter(x => x.turns > 0);
    if (b.over) return;

    for (const f of b.foes) {
      if (b.over) break;
      if (f.hp <= 0) continue;
      if (f.poison > 0) { f.hp -= f.poison; say(b, `☠ ${f.name} suffers ${f.poison} venom.`); fxEmit(b, { type: 'dot', idx: b.foes.indexOf(f), kind: 'poison', amount: f.poison }); f.poison--; }
      if (f.hp > 0 && f.burn > 0 && f.burnTurns > 0) {
        f.hp -= f.burn; say(b, `🔥 ${f.name} burns for ${f.burn}.`);
        fxEmit(b, { type: 'dot', idx: b.foes.indexOf(f), kind: 'burn', amount: f.burn });
        f.burnTurns--; if (!f.burnTurns) f.burn = 0;
      }
      if (f.hp <= 0) { f.hp = 0; say(b, `✝ ${f.name} is unwritten.`); fxEmit(b, { type: 'foeDown', idx: b.foes.indexOf(f) }); checkEnd(b); continue; }
      if (f.regen && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + f.regen);
      if (f.stun > 0) { f.stun--; say(b, `💫 ${f.name} is stunned — it does nothing.`); }
      else {
        const m = foeIntent(b, f);
        if (f.hushed > 0 && m.kind !== 'attack') {
          f.hushed--;
          f.patternIdx++;
          say(b, `🤫 ${f.name} opens its mouth — and nothing comes out.`);
        } else {
          fxEmit(b, { type: 'foeAct', idx: b.foes.indexOf(f) });
          doFoeMove(b, f, m);
          f.patternIdx++;
        }
      }
      if (f.blind > 0) f.blind--;
      if (f.chill > 0) f.chill--;
    }
    if (b.over) return;
    b.turn++;
    b.player.block = 0;
    b.guessesThisTurn = 0;
    b.tileDiscardUsed = false;
    b.shuttleUsed = false;
    b.fatigue = 0; // the breath returns
    for (const t of b.tray) if (t.frozen) t.frozen--;
    const debt = b._trayDebt || 0;
    b._trayDebt = 0;
    const hold = b.traySize;
    b.traySize -= debt;
    refillTray(b);
    b.traySize = hold;
  }

  function checkEnd(b) {
    if (b.over) return;
    if (!alive(b).length) {
      b.over = true; b.won = true;
      b.run.hp = b.player.hp; b.run.maxHp = b.player.maxHp;
      // unspent uncut runes ride to the next battle's tray
      b.run.blanks = b.tray.filter(t => t.blank).length;
      b.sealedNotes.clear();
      say(b, '🏆 The page is yours.');
      fxEmit(b, { type: 'victory' });
    } else if (b.player.hp <= 0) {
      b.player.hp = 0; b.over = true; b.won = false;
      b.run.hp = 0;
      say(b, '🕯 Your ink runs dry...');
      fxEmit(b, { type: 'defeat' });
    }
  }

  /* ---------------- the run: 3 worlds × 4 stages, branching ---------------- */
  function newRun(seed, meta, clsId, opts) {
    syncMeta(meta);
    opts = opts || {};
    meta.elderDrought = (meta.elderDrought || 0) + 1;
    const rng = makeRng(seed);
    const cls = Weavers.BY_ID[clsId] || Weavers.CLASSES[0];
    const difficulty = Math.min(Math.max(1, opts.difficulty || 1), DIFFICULTIES.length);
    // the run attunes three of the discovered elements
    let chosen = (opts.elements || []).filter(id => meta.elements.has(id)).slice(0, RUN_ELEMENTS);
    if (chosen.length < RUN_ELEMENTS) {
      for (const id of meta.elements) {
        if (chosen.length >= RUN_ELEMENTS) break;
        if (!chosen.includes(id)) chosen.push(id);
      }
    }
    // the pouch: only the attuned elements' letters, plus a faint seep
    // from any held secrets. Centers are threaded in on the road; the
    // wedding spellings are earned at Artisan+.
    const bag = {};
    for (const elId of chosen) addKit(bag, elId);
    for (const id of meta.secrets) addSecretSeep(bag, id);
    const run = {
      rng, meta, seed, cls,
      difficulty,
      elements: new Set(chosen), // attuned this run
      discovered: [],            // elements met for the FIRST time this run
      altUnlocked: new Set(),    // elements whose wedding spelling is earned
      threaded: new Set(),       // centers whose letters are in the pouch
      hp: cls.hp, maxHp: cls.hp,
      traySize: cls.tray,
      bag,
      shuttle: [], // tiles set aside — they ride across turns and battles
      blanks: 0,   // uncut runes awaiting the next battle's tray
      bobbins: [], // vessels of pre-wound thread — the inventory
      unspooled: 0,
      perks: {},
      flags: {},
      worldIdx: 0, stageIdx: 0,
      worlds: buildWorlds(rng, meta, difficulty),
      over: false, victory: false,
      startElements: chosen.slice(),
      startSecrets: meta.secrets.size,
    };
    // the attuned elements' root vessels set out wound and riding
    for (const elId of chosen) {
      const el = Morph.EL_BY_ID[elId];
      const v = makeVessel(el.root, el.icon, true);
      v.active = true;
      run.bobbins.push(v);
    }
    return run;
  }

  // Each world: 4 stages; stages 1–2 offer a CHOICE of two doors.
  // Elder pages are RARE: the hidden grammar should take many runs to
  // gather, so an elder door graces roughly one world in five.
  const ELDER_CHANCE = 0.2;
  // pity: after this many runs without committing an elder page to
  // memory, the next run's first eligible world is guaranteed one
  const ELDER_PITY = 3;
  function buildWorlds(rng, meta, diff) {
    let pitySpent = false;
    return Foes.WORLDS.map((w, wi) => {
      // the elder roads open only at Artisan; the deepest pages only to
      // a Loomwright, and only in the Ruins
      const untaught = (diff || 1) >= 3 ? LoomEvents.SECRET_EVENTS.filter(ev =>
        !meta.secrets.has(ev.teaches) && (!ev.deep || ((diff || 1) >= 4 && wi === 2))) : [];
      const stages = [];
      stages.push([{ type: 'battle' }]);
      const pity = !pitySpent && untaught.length && (meta.elderDrought || 0) >= ELDER_PITY;
      if (pity) pitySpent = true;
      const eventNode = (untaught.length && (pity || rng() < ELDER_CHANCE))
        ? { type: 'elder', event: pick(rng, untaught) }
        : { type: 'event' };
      stages.push(shufflePair(rng, [{ type: 'battle' }, eventNode]));
      stages.push(shufflePair(rng, [{ type: 'camp' }, { type: 'elite' }]));
      stages.push([{ type: 'boss' }]);
      return { def: w, stages };
    });
  }
  function shufflePair(rng, pair) { return rng() < 0.5 ? pair : [pair[1], pair[0]]; }

  function currentStage(run) { return run.worlds[run.worldIdx].stages[run.stageIdx]; }
  function globalStageIdx(run) { return run.worldIdx * 4 + run.stageIdx; }

  function advance(run) {
    run.stageIdx++;
    if (run.stageIdx >= 4) {
      run.worldIdx++;
      run.stageIdx = 0;
      if (run.worldIdx >= run.worlds.length) {
        run.over = true; run.victory = true;
        // beating your highest tier unlocks the next
        const m = run.meta;
        if (run.difficulty >= (m.diff || 1) && (m.diff || 1) < DIFFICULTIES.length) {
          m.diff = Math.min(DIFFICULTIES.length, run.difficulty + 1);
          run.unlockedDiff = m.diff;
        }
        return 'victory';
      }
      run.hp = Math.min(run.maxHp, run.hp + Math.round((run.maxHp - run.hp) * 0.5));
      return 'world';
    }
    return 'stage';
  }

  function battleForNode(run, node) {
    const w = run.worlds[run.worldIdx].def;
    const scale = Foes.SCALE(globalStageIdx(run)) * (DIFF_BY_ID[run.difficulty] || DIFFICULTIES[0]).scale;
    let ids;
    if (node.type === 'boss') ids = [w.boss];
    else if (node.type === 'elite') ids = run.worldIdx === 0
      ? [w.elite]
      : [w.elite, { id: pick(run.rng, w.normals), mult: 0.6 }];
    else {
      ids = [pick(run.rng, w.normals)];
      if (run.worldIdx >= 1 && run.rng() < 0.3) ids.push({ id: pick(run.rng, w.normals), mult: 0.65 });
    }
    return createBattle(run, ids, scale);
  }

  /* ---------------- rewards ---------------- */
  /* offered bobbins come ONLY from PUBLIC notes the grimoire holds —
   * knowledge becomes matter. The secret grammar is never offered:
   * its keeper may CAPTURE it, but no one sells what is written
   * nowhere. */
  function bobbinCandidates(run) {
    const held = new Set((run.bobbins || []).map(x => x.seq).filter(Boolean));
    const out = [];
    for (const el of Morph.ELEMENTS) {
      if (!run.elements.has(el.id)) continue; // only the attuned elements' parts
      if (!held.has(el.root))
        out.push({ seq: el.root, icon: el.icon, label: `${el.root} — the ${el.name} root` });
      if (!held.has(el.alt) && run.altUnlocked.has(el.id))
        out.push({ seq: el.alt, icon: el.icon, label: `${el.alt} — ${el.name}'s wedding spelling, the key to its marriages` });
    }
    for (const c of Morph.CENTERS) {
      if (!held.has(c.seq)) out.push({ seq: c.seq, icon: c.icon, label: `${c.seq} — ${c.name}` });
    }
    return out;
  }
  // grant a vessel (wound with a part, or blank) into the inventory
  function grantVessel(run, seq, icon) {
    if ((run.bobbins || []).length >= BOBBIN_INVENTORY) return null;
    const v = makeVessel(seq, icon, true);
    if (activeVessels(run).length < BOBBIN_ACTIVE) v.active = true;
    run.bobbins.push(v);
    return v;
  }

  /* elements a battle may offer: ATTUNE a discovered-but-dormant one for
   * this run, or DISCOVER a new one — permanent, its full grammar
   * inscribed at once */
  function elementOffers(run) {
    const out = [];
    for (const el of Morph.ELEMENTS) {
      if (run.elements.has(el.id)) continue;
      const discovered = run.meta.elements.has(el.id);
      out.push({ kind: 'element', el: el.id, rare: !discovered,
        title: `${discovered ? 'Attune' : 'Discover'} ${el.name} ${el.icon}`,
        desc: `${el.identity} ${discovered
          ? 'Already in your grimoire — its words open to your loom this run.'
          : 'New to your grimoire: its full grammar inscribes itself, forever, and its words open this run.'}` });
    }
    return out;
  }

  /* a center not yet threaded: its letters can join the pouch */
  function centerOffers(run) {
    return Morph.CENTERS.filter(c => !run.threaded.has(c.id)).map(c => ({
      kind: 'center', center: c.id,
      title: `Thread ${c.seq} — ${c.name}`,
      desc: `${c.icon} ${c.shape} Its letters (${c.seq.split('').join(' ')}) join your pouch.`,
    }));
  }
  /* the wedding spellings, at Artisan and above: one attuned element's
   * second spelling — opening its marriages — with its letters and a
   * wound vessel */
  function altOffers(run) {
    if (diffCap(run) < 11) return [];
    return Array.from(run.elements)
      .filter(id => !run.altUnlocked.has(id) && Morph.EL_BY_ID[id] && !Morph.EL_BY_ID[id].hiddenEl)
      .map(id => {
        const el = Morph.EL_BY_ID[id];
        return { kind: 'altspelling', el: id, rare: true,
          title: `The Wedding Spelling: ${el.alt}`,
          desc: `${el.icon} How ${el.name} is written when wedded second — ${el.alt}. Opens its marriages: its letters join your pouch, and it arrives wound on a vessel.` };
      });
  }

  function rollRewards(run, node) {
    const offers = [];
    const els = elementOffers(run);
    if (els.length) offers.push(els[Math.floor(run.rng() * els.length)]);
    const cens = centerOffers(run);
    if (cens.length) offers.push(cens[Math.floor(run.rng() * cens.length)]);
    const alts = altOffers(run);
    if (alts.length) offers.push(alts[Math.floor(run.rng() * alts.length)]);
    offers.push({ kind: 'mend', title: 'Mend', desc: 'Recover 14 ink.' });
    if (run.traySize < 16) offers.push({ kind: 'loom', title: 'Widen the Loom', desc: '+1 tile in your tray, this run.' });
    const el = Morph.EL_BY_ID[pick(run.rng, Array.from(run.elements))] || pick(run.rng, Morph.ELEMENTS);
    offers.push({ kind: 'infuse', el: el.id, title: `Infuse ${el.name}`, desc: `Season your letter bag toward ${el.root}-words (${el.icon}).` });
    if ((run.perks.ribbon || 0) < 4 && chipMax(run) < MAX_LEN)
      offers.push({ kind: 'ribbon', title: 'Ribbon Index', desc: `Your loom-sense reaches one rune further (now feels words to ${chipMax(run) + 1} runes).` });
    if (!run.perks.quill) offers.push({ kind: 'quill', title: 'Quill of Second Thoughts', desc: 'Once per battle: a second guess in one turn.' });
    if ((run.perks.shuttle || 0) < 4) offers.push({ kind: 'shuttle', title: 'Ivory Shuttle', desc: `Your shuttle holds one more set-aside tile (now ${shuttleCap(run) + 1}).` });
    if ((run.bobbins || []).length < BOBBIN_INVENTORY) {
      const cands = bobbinCandidates(run);
      for (let i = 0; i < 2 && cands.length; i++) {
        const c = cands.splice(Math.floor(run.rng() * cands.length), 1)[0];
        offers.push({ kind: 'bobbin', seq: c.seq, icon: c.icon, title: `A Wound Vessel: ${c.seq}`,
          desc: `${c.icon} ${c.label}. Arrives wound — speak it as one block; feed it letters to wind it anew.` });
      }
      offers.push({ kind: 'vessel', title: 'A Spare Vessel',
        desc: '🪢 An empty bobbin. Aim it at any part you know — secrets included — and wind its letters thrice to capture it.' });
    }
    if (!run.perks.whetstone) offers.push({ kind: 'whetstone', title: 'Whetstone', desc: 'Improvised words carry ×0.7 instead of ×0.5.' });
    offers.push({ kind: 'vial', title: 'Ink Vial', desc: '+6 utmost ink, and mend that much.' });

    const out = [];
    // elites and wardens always hold something rare: a NEW element if
    // any remain, else a wedding spelling, else any element
    if (node.type === 'elite' || node.type === 'boss') {
      const fresh = els.filter(o => o.rare);
      const pool = fresh.length ? fresh : (altOffers(run).length ? altOffers(run) : els);
      const offer = pool.length ? pool[Math.floor(run.rng() * pool.length)] : null;
      if (offer) {
        out.push(offer);
        const i = offers.findIndex(o => o.kind === offer.kind && o.el === offer.el);
        if (i >= 0) offers.splice(i, 1);
      }
    }
    while (out.length < 3 && offers.length) out.push(offers.splice(Math.floor(run.rng() * offers.length), 1)[0]);
    return out;
  }

  function applyReward(run, offer) {
    switch (offer.kind) {
      case 'element': {
        const el = Morph.EL_BY_ID[offer.el];
        run.elements.add(el.id);
        addKit(run.bag, el.id); // its letters join the pouch
        const fresh = !run.meta.elements.has(el.id);
        if (fresh) {
          run.meta.elements.add(el.id);
          syncMeta(run.meta);
          run.discovered.push(el.id);
        }
        return fresh
          ? `${el.icon} ${el.name} enters your grimoire — every part of it, yours forever — and its letters pour into your pouch.`
          : `${el.icon} ${el.name} attunes to your loom — its letters join the pouch for this run.`;
      }
      case 'center': {
        const c = Morph.CENTER_BY_ID[offer.center];
        run.threaded.add(c.id);
        for (const ch of new Set(c.seq)) run.bag[ch] = (run.bag[ch] || 0) + CENTER_LETTER_MASS;
        return `${c.icon} ${c.seq} threads into your pouch — ${c.name}'s letters ride among your runes now.`;
      }
      case 'altspelling': {
        const el = Morph.EL_BY_ID[offer.el];
        run.altUnlocked.add(el.id);
        for (const ch in KITS[el.id].alt) run.bag[ch] = (run.bag[ch] || 0) + KITS[el.id].alt[ch];
        const v = grantVessel(run, el.alt, el.icon);
        return `${el.icon} ${el.alt} — ${el.name}'s wedding spelling, yours this run. Its letters join the pouch${v ? ' and it arrives wound on a vessel' : ''}; its marriages open.`;
      }
      case 'mend': run.hp = Math.min(run.maxHp, run.hp + 14); return 'You mend 14.';
      case 'loom': run.traySize++; return 'Your loom widens.';
      case 'infuse': {
        const el = Morph.EL_BY_ID[offer.el];
        for (const ch of el.root + el.medium + el.large) run.bag[ch] = (run.bag[ch] || 0) + 14;
        return `The bag hums with ${el.name}.`;
      }
      case 'ribbon': run.perks.ribbon = (run.perks.ribbon || 0) + 1; return 'Your sense of the loom unspools further.';
      case 'quill': run.perks.quill = true; return 'The quill hums with hindsight.';
      case 'shuttle': run.perks.shuttle = (run.perks.shuttle || 0) + 1; return 'The shuttle grows a notch — one more tile may ride.';
      case 'bobbin': {
        const v = grantVessel(run, offer.seq, offer.icon);
        return v ? `${offer.seq} joins your vessels${v.active ? ', riding the frame' : ' (the frame is full — swap it in between battles)'}.`
          : 'Your vessel inventory is full.';
      }
      case 'vessel': {
        run.bobbins = run.bobbins || [];
        if (run.bobbins.length >= BOBBIN_INVENTORY) return 'Your vessel inventory is full.';
        const v = makeVessel(null, '🪢', false);
        if (activeVessels(run).length < BOBBIN_ACTIVE) v.active = true;
        run.bobbins.push(v);
        return 'An empty vessel joins your inventory — aim it at a part you know, and wind.';
      }
      case 'whetstone': run.perks.whetstone = true; return 'Your overreaching sharpens.';
      case 'vial': run.maxHp += 6; run.hp = Math.min(run.maxHp, run.hp + 6); return 'Your inkwell deepens.';
    }
  }

  /* ---------------- camps & events ---------------- */
  function campChoices(run) {
    return [
      { kind: 'rest', title: 'Rest', desc: 'Recover 40% of your missing ink.' },
      { kind: 'reflect', title: 'Reflect', desc: 'Puzzle over the margins: your next three mysteries begin with a rune already revealed.' },
    ];
  }
  function applyCamp(run, choice) {
    if (choice.kind === 'rest') {
      const heal = Math.round((run.maxHp - run.hp) * 0.4);
      run.hp += heal;
      return `You rest. +${heal} ink.`;
    }
    run.flags.revealNext = (run.flags.revealNext || 0) + 3;
    return 'You study the margins until the shapes swim — your next three mysteries begin lit.';
  }

  function rollEvent(run) { return pick(run.rng, LoomEvents.EVENTS); }
  function applyEventChoice(run, ev, choice) {
    const fx = choice.fx || {};
    const bits = [];
    if (fx.heal) { run.hp = Math.min(run.maxHp, run.hp + fx.heal); bits.push(`+${fx.heal} ink`); }
    if (fx.hp) { run.hp = Math.max(1, run.hp + fx.hp); bits.push(`${fx.hp} ink`); }
    if (fx.tray) { run.traySize += fx.tray; bits.push('the loom widens'); }
    if (fx.mulligans) { run.perks.mulligans = (run.perks.mulligans || 0) + fx.mulligans; bits.push('+1 sweep per battle'); }
    if (fx.vowelRich) { for (const v of 'AEIOU') run.bag[v] = Math.round(run.bag[v] * 1.5); bits.push('vowels run rich'); }
    if (fx.revealNext) { run.flags.revealNext = (run.flags.revealNext || 0) + fx.revealNext; bits.push(`${fx.revealNext > 1 ? fx.revealNext + ' mysteries' : 'a mystery'} will begin lit`); }
    if (fx.curse === 'longmystery') { run.flags.longmystery = true; bits.push('the next mystery runs long'); }
    if (fx.bobbin) {
      const cands = bobbinCandidates(run);
      if (cands.length) {
        const c = pick(run.rng, cands);
        const v = grantVessel(run, c.seq, c.icon);
        bits.push(v ? `a wound ${c.seq} vessel` : 'the inventory is full — nothing gained');
      } else bits.push('no part is left unwound — nothing gained');
    }
    if (fx.vessel) {
      if ((run.bobbins || []).length < BOBBIN_INVENTORY) {
        const v = makeVessel(null, '🪢', false);
        if (activeVessels(run).length < BOBBIN_ACTIVE) v.active = true;
        run.bobbins.push(v);
        bits.push('an empty vessel');
      } else bits.push('the inventory is full — nothing gained');
    }
    if (fx.shuttleSlot) { run.perks.shuttle = (run.perks.shuttle || 0) + fx.shuttleSlot; bits.push('+1 shuttle notch'); }
    if (fx.element) {
      const els = elementOffers(run).filter(o => run.meta.elements.has(o.el));
      const anyEls = els.length ? els : elementOffers(run);
      if (anyEls.length) {
        const o = pick(run.rng, anyEls);
        bits.push(applyReward(run, o));
      } else bits.push('every element already sings in your loom');
    }
    return bits.join(' · ') || 'Nothing changes, which is its own lesson.';
  }

  // elder events teach hidden grammar; knowledge is permanent and unlisted,
  // and its letters begin to seep into the pouch at once
  function applyElder(run, ev) {
    run.meta.secrets.add(ev.teaches);
    addSecretSeep(run.bag, ev.teaches);
    run.meta.elderDrought = 0;
    return true;
  }

  /* ---------------- the Weaver's Thread: progress as a seed ----------------
   * Encodes the whole grimoire (notes, secrets, solved words, tallies) as a
   * copyable code, so progress can be carried to another device from the
   * title page. Format: version + tallies + grammar fingerprint + three
   * bitmaps over SORTED id lists, run-length packed, base32 (no ambiguous
   * letters), sealed with a checksum. */
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function fnv16(bytes) {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return (h ^ (h >>> 16)) & 0xFFFF;
  }
  const fnv16str = (s) => fnv16(Array.from(s).map(c => c.charCodeAt(0) & 0xFF));
  function b32encode(bytes) {
    let out = '', acc = 0, nbits = 0;
    for (const b of bytes) {
      acc = (acc << 8) | b; nbits += 8;
      while (nbits >= 5) { out += B32[(acc >>> (nbits - 5)) & 31]; nbits -= 5; }
    }
    if (nbits) out += B32[(acc << (5 - nbits)) & 31];
    return out;
  }
  function b32decode(str) {
    const bytes = [];
    let acc = 0, nbits = 0;
    for (const ch of str) {
      const v = B32.indexOf(ch);
      if (v < 0) return null;
      acc = (acc << 5) | v; nbits += 5;
      if (nbits >= 8) { bytes.push((acc >>> (nbits - 8)) & 255); nbits -= 8; }
    }
    return bytes;
  }
  const RLE_MARK = 0xE7;
  function rlePack(bytes) {
    const out = [];
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      let n = 1;
      while (i + n < bytes.length && bytes[i + n] === b && n < 255) n++;
      if (n >= 4 || b === RLE_MARK) { out.push(RLE_MARK, b, n); i += n; }
      else { out.push(b); i++; }
    }
    return out;
  }
  function rleUnpack(bytes) {
    const out = [];
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === RLE_MARK) {
        const b = bytes[i + 1], n = bytes[i + 2];
        if (n == null) return null;
        for (let k = 0; k < n; k++) out.push(b);
        i += 2;
      } else out.push(bytes[i]);
    }
    return out;
  }
  // stable orderings: alphabetical, so the thread survives refactors that
  // only reorder generation
  function threadLists() {
    return {
      parts: Morph.PART_IDS.slice().sort(),
      secrets: Morph.SECRET_IDS.slice().sort(),
      words: Morph.VISIBLE.map(e => e.word).sort(),
    };
  }
  function grammarPrint(L) {
    return fnv16str(L.parts.join(',') + '|' + L.secrets.join(',') + '|' + L.words.length);
  }
  function setToBits(sorted, has) {
    const bytes = new Array(Math.ceil(sorted.length / 8)).fill(0);
    sorted.forEach((id, i) => { if (has(id)) bytes[i >> 3] |= 1 << (i & 7); });
    return bytes;
  }
  function push16(arr, n) { arr.push(n & 255, (n >> 8) & 255); }
  function read16(bytes, i) { return bytes[i] | (bytes[i + 1] << 8); }

  const threadElements = () => Morph.ELEMENTS.map(e => e.id).sort();

  function threadEncode(meta) {
    const L = threadLists();
    const E = threadElements();
    // version 2: the roster and the school tier ride the thread; the
    // notes bitmap is gone (parts derive from elements now)
    const raw = [2,
      meta.runs & 255, (meta.runs >> 8) & 255,
      meta.wins & 255, (meta.wins >> 8) & 255,
      Math.min(255, meta.bestNode || 0), Math.min(255, meta.elderDrought || 0),
      Math.min(255, meta.diff || 1)];
    push16(raw, grammarPrint(L));
    push16(raw, E.length);
    raw.push(...setToBits(E, (id) => meta.elements.has(id)));
    for (const [sorted, has] of [
      [L.secrets, (id) => meta.secrets.has(id)],
      [L.words, (w) => meta.solved.has(w)],
    ]) {
      push16(raw, sorted.length);
      raw.push(...setToBits(sorted, has));
    }
    const enc = rlePack(raw);
    push16(enc, fnv16(enc));
    const code = b32encode(enc);
    return code.replace(/(.{6})/g, '$1-').replace(/-$/, '');
  }

  function threadDecode(str) {
    const clean = String(str || '').toUpperCase()
      .replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V')
      .replace(/[^0-9A-Z]/g, '');
    if (clean.length < 12) return { ok: false, error: 'short' };
    const enc = b32decode(clean);
    if (!enc || enc.length < 4) return { ok: false, error: 'garbled' };
    const sum = read16(enc, enc.length - 2);
    const body = enc.slice(0, enc.length - 2);
    if (fnv16(body) !== sum) return { ok: false, error: 'frayed' };
    const raw = rleUnpack(body);
    if (!raw || (raw[0] !== 1 && raw[0] !== 2) || raw.length < 15) return { ok: false, error: 'garbled' };
    const L = threadLists();
    const version = raw[0];
    const out = {
      ok: true, version,
      runs: read16(raw, 1), wins: read16(raw, 3),
      bestNode: raw[5], elderDrought: raw[6],
      diff: version >= 2 ? Math.min(4, Math.max(1, raw[7])) : 1,
      elements: [], secrets: [], solved: [],
    };
    let i = version >= 2 ? 8 : 7;
    out.warn = read16(raw, i) !== grammarPrint(L);
    i += 2;
    const readSet = (sorted, bucket) => {
      if (i + 2 > raw.length) return false;
      const count = read16(raw, i);
      i += 2;
      const nBytes = Math.ceil(count / 8);
      if (i + nBytes > raw.length) return false;
      const n = Math.min(count, sorted.length); // tolerate grammar growth/shrink
      for (let k = 0; k < n; k++) {
        if (raw[i + (k >> 3)] & (1 << (k & 7))) bucket.push(sorted[k]);
      }
      i += nBytes;
      return true;
    };
    if (version >= 2) {
      if (!readSet(threadElements(), out.elements)) return { ok: false, error: 'garbled' };
    } else {
      // version 1 spun notes, not a roster — its parts are obsolete;
      // skip them and keep its secrets, solved words, and tallies
      if (!readSet(L.parts, [])) return { ok: false, error: 'garbled' };
    }
    if (!readSet(L.secrets, out.secrets)) return { ok: false, error: 'garbled' };
    if (!readSet(L.words, out.solved)) return { ok: false, error: 'garbled' };
    return out;
  }

  /* weave a decoded thread INTO a grimoire — union merge, never a loss */
  function threadMerge(meta, t) {
    let freshEls = 0;
    for (const id of (t.elements || [])) if (!meta.elements.has(id)) { meta.elements.add(id); freshEls++; }
    let freshSecrets = 0;
    for (const id of t.secrets) if (!meta.secrets.has(id)) { meta.secrets.add(id); freshSecrets++; }
    for (const w of t.solved) meta.solved.add(w);
    const diffUp = (t.diff || 1) > (meta.diff || 1);
    if (diffUp) meta.diff = t.diff;
    meta.runs = Math.max(meta.runs, t.runs);
    meta.wins = Math.max(meta.wins, t.wins);
    meta.bestNode = Math.max(meta.bestNode, t.bestNode);
    meta.elderDrought = Math.min(meta.elderDrought || 0, t.elderDrought);
    syncMeta(meta);
    return { elements: freshEls, secrets: freshSecrets, diff: diffUp ? meta.diff : 0 };
  }

  return {
    makeRng, pick,
    SOLVE_MULT, IMPROV_MULT,
    knowSet, runKnow, syncMeta, elementPartIds, chipMax, MAX_LEN,
    DIFFICULTIES, DIFF_BY_ID, diffCap, STARTER_ELEMENTS, RUN_ELEMENTS, elementOffers,
    KITS, addKit, pouchLetters, secretLetters,
    createBattle, newRun, buildWorlds, battleForNode, currentStage, globalStageIdx, advance,
    guess, canGuess, useQuill, judge, serveMystery, chooseLength, guessableLengths, revealLetter,
    castWord, canSpell, tilesFor, spellableWords, mulligan, endTurn,
    anySpellable, discardTiles, DISCARD_MAX, loomSense,
    spokenMult, FATIGUE_PURE, FATIGUE_ASSISTED, FATIGUE_FLOOR,
    shuttleTile, unshuttleTile, shuttleCap, makeBlank, BLANK_CAP,
    piecesFor, bobbinCandidates, availBobbins, activeVessels, makeVessel,
    feedVessel, startCapture, windableParts, setVesselActive, unspoolShuttle,
    grantVessel, windingSeq, BOBBIN_ACTIVE, BOBBIN_INVENTORY, CAPTURE_WINDS,
    targetFoe, alive, describeIntent, foeIntent,
    rollRewards, applyReward, campChoices, applyCamp,
    rollEvent, applyEventChoice, applyElder,
    threadEncode, threadDecode, threadMerge,
    refillTray, drawTile,
    drainFx,
  };
});
