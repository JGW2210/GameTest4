/* WORDLOOM — lexicon generator & validator (second weaving).
 *   node tools/genwords.js           summary + integrity checks
 *   node tools/genwords.js --dump    every visible word with its meaning
 *   node tools/genwords.js --secrets the hidden grammar too (spoilers)
 */
const M = require('../js/data/morphology.js');

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};

/* 1. Canonical forms must survive the second weaving EXACTLY. */
const CANON = {
  IGNA: ['ign', 'cantrip'], IGNUS: ['ign', 'word'], IGNIUS: ['ign', 'bound'],
  IGNIORA: ['ign', 'weave'], IGNIAROS: ['ign', 'mirror'],
  IGNIORUSA: ['ign', 'verse'], IGNIORARIS: ['ign', 'sovereign'],
  GELU: ['gel', 'cantrip'], TERRA: ['ter', 'word'], AQUA: ['aqu', 'cantrip'],
  LUMEN: ['lum', 'word'], FULGUR: ['ful', 'bound'], UMBRIS: ['umb', 'bound'],
  SANUS: ['san', 'word'], AETHORAIUM: ['aer', 'sovereign'],
  GELAES: ['gel', 'bound'], VENOUX: ['ven', 'bound'], VENOURA: ['ven', 'weave'],
  TEREORRAE: ['ter', 'verse'],
};
for (const [word, [el, form]] of Object.entries(CANON)) {
  const e = M.WORDS[word];
  check(`canon ${word}`, !!e && e.el === el && e.form === form && !e.hidden,
    e ? JSON.stringify({ el: e.el, form: e.form, hidden: e.hidden }) : 'missing');
}

/* 2. Blends: joiner + alt root + first element's suffix, correct lengths. */
check('Steam union IGNIETUNDUS', !!M.WORDS['IGNIETUNDUS'] && M.WORDS['IGNIETUNDUS'].fx.sig === 'Steam');
check('unions are 11, grand unions 12',
  M.VISIBLE.filter(e => e.form === 'union').every(e => e.len === 11) &&
  M.VISIBLE.filter(e => e.form === 'grandunion').every(e => e.len === 12));
check('woven unions span 11-13',
  M.VISIBLE.filter(e => e.form === 'weaveunion').length === 900 &&
  M.VISIBLE.filter(e => e.form === 'weaveunion').every(e => e.len >= 11 && e.len <= 13),
  String(M.VISIBLE.filter(e => e.form === 'weaveunion').length));
check('90 visible unions', M.VISIBLE.filter(e => e.form === 'union').length === 90,
  String(M.VISIBLE.filter(e => e.form === 'union').length));
check('10 signature pairs resolve both ways', Object.keys(M.SIGNATURES).length === 10 &&
  M.LIST.filter(e => e.form === 'union' && e.fx.sig).length >= 20);

/* 3. Secrets: hidden from the visible lexicon, present in the full one. */
check('NIHIL exists and is hidden', !!M.WORDS['NIHIL'] && M.WORDS['NIHIL'].hidden && M.WORDS['NIHIL'].el === 'nih');
check('CRUOR exists and is hidden', !!M.WORDS['CRUOR'] && M.WORDS['CRUOR'].hidden && M.WORDS['CRUOR'].el === 'cru');
check('CRUX — the blood cantrip', !!M.WORDS['CRUX'] && M.WORDS['CRUX'].hidden);
for (const el of M.ELEMENTS) {
  const elder = M.LIST.find(e => e.el === el.id && e.secretSpelling && e.form === 'word');
  check(`elder spelling for ${el.root} (${el.secret})`, !!elder && elder.hidden);
  const base = M.WORDS[M.assemble(el, 'word', null, null)];
  check(`elder ${el.secret} runs hotter than ${el.root}`,
    (elder.fx.dmg || elder.fx.heal || 99) > (base.fx.dmg || base.fx.heal || 0));
  check(`elder parts use sroot:${el.id}`, elder.parts.includes('sroot:' + el.id) && !elder.parts.includes('root:' + el.id));
}
check('18 secret ids catalogued', M.SECRET_IDS.length === 18 && M.SECRET_IDS.every(id => M.SECRET_INFO[id]),
  String(M.SECRET_IDS.length));
check('no secret ids leak into public notes', M.SECRET_IDS.every(id => !M.PARTS[id]));

/* 3b. Every KIND of word part has a secret counterpart, and each one weaves. */
check('secret rule: the Undivided Vowel', M.SECRET_IDS.includes('srule:twin'));
const twins = M.LIST.filter(e => e.parts.includes('srule:twin'));
check('every elided visible word has an undivided twin',
  twins.length === M.VISIBLE.filter(e => e.elided).length && twins.every(e => e.hidden),
  twins.length + ' vs ' + M.VISIBLE.filter(e => e.elided).length);
check('twins keep twin vowels standing', twins.every(e => /AA|EE|II|OO|UU/.test(e.word)));
check('secret centers exist', M.SECRET_CENTERS.length === 3 &&
  M.SECRET_CENTERS.every(c => M.SECRET_IDS.includes('scenter:' + c.id)));
check('secret center sizes span short/std/grand',
  new Set(M.SECRET_CENTERS.map(c => c.seq.length)).size === 3);
check('secret joiner AC exists', M.SECRET_JOINERS.length === 1 && M.SECRET_IDS.includes('sjoin:ac'));
check('secret form Selfsame exists', !!M.SECRET_FORMS.selfsame && M.SECRET_IDS.includes('sform:selfsame'));
for (const el of M.ELEMENTS) {
  for (const c of M.SECRET_CENTERS) {
    for (const form of ['weave', 'mirror', 'verse', 'sovereign']) {
      const w = M.LIST.find(e => e.el === el.id && e.center === c.id && e.form === form && !e.secretSpelling);
      check(`secret center ${c.seq} ${form} of ${el.root}`, !!w && w.hidden && w.parts.includes('scenter:' + c.id));
    }
  }
  const self = M.LIST.find(e => e.el === el.id && e.form === 'selfsame' && !e.secretSpelling);
  check(`selfsame of ${el.root}`, !!self && self.hidden && self.parts.includes('sform:selfsame'));
  const ac = M.LIST.filter(e => e.el === el.id && e.joiner === 'ac' && !e.parts.includes('srule:twin'));
  // 11 partners × (union + grand union + 13 woven-union centers) = 165
  check(`AC blends of ${el.root}`, ac.length === 165 && ac.every(e => e.hidden && e.parts.includes('sjoin:ac')),
    String(ac.length));
}

/* 4. Structural integrity across the WHOLE lexicon (hidden included). */
const seen = new Set();
for (const e of M.LIST) {
  check(`unique ${e.word}`, !seen.has(e.word)); seen.add(e.word);
  check(`length honest ${e.word}`, e.word.length === e.len);
  if (!e.parts.includes('srule:twin')) check(`no twin vowels ${e.word}`, !/AA|EE|II|OO|UU/.test(e.word));
  check(`no triples ${e.word}`, !/(.)\1\1/.test(e.word));
  check(`pronounceable ${e.word}`, !/[^AEIOU]{4}/.test(e.word), 'consonant pileup');
  check(`has fx ${e.word}`, e.fx && Object.keys(e.fx).length > 0);
  check(`has parts ${e.word}`, e.parts.length >= 2);
  check(`parts known ${e.word}`, e.parts.every(pid => M.PARTS[pid] || M.SECRET_IDS.includes(pid)), e.parts.join(','));
  if (!e.hidden) check(`visible uses only public notes ${e.word}`, e.parts.every(pid => M.PARTS[pid]));
  if (e.hidden) check(`hidden requires secret knowledge ${e.word}`, e.parts.some(pid => M.SECRET_IDS.includes(pid)));
}

/* 5. The notes economy: 84 public notes read every visible word. */
check('85 public notes', M.PART_IDS.length === 85, String(M.PART_IDS.length));
check('all rules live in the rules group', ['rule:elision', 'rule:easing', 'rule:length', 'rule:sizes']
  .every(pid => M.PARTS[pid] && M.PARTS[pid].group === 'rules'));
const allPublic = new Set(M.PART_IDS);
check('all public notes read all visible words', M.readableCount(allPublic) === M.VISIBLE.length,
  M.readableCount(allPublic) + ' vs ' + M.VISIBLE.length);
const used = new Set();
for (const e of M.VISIBLE) for (const pid of e.parts) used.add(pid);
check('every public note is used by some visible word (info rules exempt)',
  M.PART_IDS.every(pid => used.has(pid) || M.PARTS[pid].info),
  M.PART_IDS.filter(pid => !used.has(pid) && !M.PARTS[pid].info).join(','));
check('info rules stay out of word parts', M.LIST.every(e => !e.parts.includes('rule:length') && !e.parts.includes('rule:sizes')));
const withSecrets = new Set(M.PART_IDS.concat(M.SECRET_IDS));
check('secrets unlock the full lexicon', M.LIST.every(e => M.canRead(withSecrets, e)));

/* 5b. COMBINATION COVERAGE — every part combines at every length it can. */
for (const el of M.ELEMENTS) {
  // every suffix size (ending) of every element is used by visible words
  check(`${el.root} small suffix used`, M.VISIBLE.some(e => e.el === el.id && e.form === 'cantrip'));
  check(`${el.root} medium suffix used`, ['word', 'bound', 'verse', 'union'].every(f => M.VISIBLE.some(e => e.el === el.id && e.form === f)));
  check(`${el.root} large suffix used`, ['sovereign', 'grandunion'].every(f => M.VISIBLE.some(e => e.el === el.id && e.form === f)));
  // every public center wraps every element in all four woven forms
  for (const c of M.CENTERS) {
    for (const form of ['weave', 'mirror', 'verse', 'sovereign']) {
      check(`${el.root}×${c.seq}×${form}`, M.VISIBLE.some(e => e.el === el.id && e.center === c.id && e.form === form));
    }
  }
  // every element weds every other, both ways, at both blend lengths —
  // and every public center weaves into every pairing
  for (const el2 of M.ELEMENTS) {
    if (el2.id === el.id) continue;
    for (const form of ['union', 'grandunion']) {
      check(`${el.root}+${el2.root} ${form}`, M.VISIBLE.some(e => e.el === el.id && e.el2 === el2.id && e.form === form && e.joiner === 'et'));
    }
    for (const c of M.CENTERS) {
      check(`${el.root}+${el2.root} woven ${c.seq}`, M.VISIBLE.some(e =>
        e.el === el.id && e.el2 === el2.id && e.form === 'weaveunion' && e.center === c.id && e.joiner === 'et'));
    }
  }
}
// every length from 4 to 13 runes is guessable somewhere in the visible lexicon
for (let len = 4; len <= 13; len++) {
  check(`length ${len} exists`, M.VISIBLE.some(e => e.len === len));
}

/* 6. Report */
const dumpAll = process.argv.includes('--secrets');
if (process.argv.includes('--dump') || dumpAll) {
  const list = dumpAll ? M.LIST : M.VISIBLE;
  let cur = '';
  for (const e of list) {
    const key = e.el + (e.secretSpelling ? '(elder)' : '') + (e.el2 ? '+blend' : '');
    if (key !== cur) { cur = key; console.log(`\n=== ${M.EL_BY_ID[e.el].icon} ${M.EL_BY_ID[e.el].name}${e.secretSpelling ? ' — ELDER SPELLING' : ''}${e.el2 ? ' — BLENDS' : ''} ===`); }
    console.log(`  ${e.word.padEnd(13)} L${String(e.len).padEnd(2)} ${e.name.padEnd(34)} ${e.desc}`);
  }
  console.log('\nAlphabet:', M.ALPHABET.join(' '));
}

const lens = {};
M.VISIBLE.forEach(e => { lens[e.len] = (lens[e.len] || 0) + 1; });
console.log(fail
  ? `\n${fail} FAILURES`
  : `OK: ${M.LIST.length} words woven (${M.VISIBLE.length} visible, ${M.LIST.length - M.VISIBLE.length} hidden) · ${M.PART_IDS.length} notes · lengths ${JSON.stringify(lens)}`);
process.exit(fail ? 1 : 0);
