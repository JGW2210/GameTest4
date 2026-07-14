/* WORDLOOM — lexicon generator & validator.
 *   node wordloom/tools/genwords.js         summary + integrity checks
 *   node wordloom/tools/genwords.js --dump  every word with its meaning
 */
const M = require('../js/data/morphology.js');

let fail = 0;
const check = (name, cond, extra) => {
  if (!cond) { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};

/* 1. Canonical forms from the design spec must assemble EXACTLY. */
const CANON = {
  // the specified fire ladder
  IGNA: [4, 'ign', null], IGNUS: [5, 'ign', null], IGNIUS: [6, 'ign', null],
  IGNIORA: [7, 'ign', 'ora'], IGNIAROS: [8, 'ign', 'ora'],
  IGNIORUSA: [9, 'ign', 'ora'], IGNIORARIS: [10, 'ign', 'ora'],
  // real-word jewels the grammar should produce
  GELU: [4, 'gel', null], TERRA: [5, 'ter', null], AERO: [4, 'aer', null],
  AERIS: [5, 'aer', null], AETHIS: [6, 'aer', null], AETHORAIUM: [10, 'aer', 'ora'],
  AQUA: [4, 'aqu', null], AQUEIS: [6, 'aqu', null],
  FULGUR: [6, 'ful', null], UMBRIS: [6, 'umb', null],
  LUMEN: [5, 'lum', null], SANUS: [5, 'san', null],
  // the Scribe's Elision at work
  GELAES: [6, 'gel', null],   // GEL+A+AS
  VENOUX: [6, 'ven', null],   // VEN+O+OX
  VENOURA: [7, 'ven', 'ora'], // VEN+O+ORA
  TEREORRAE: [9, 'ter', 'ora'], // TER+E+OR+RA+A → ...RAA → RAE
};
for (const [word, [len, el, center]] of Object.entries(CANON)) {
  const e = M.WORDS[word];
  check(`canon ${word}`, !!e, 'missing from lexicon');
  if (e) check(`canon ${word} identity`, e.len === len && e.el === el && (e.center || null) === center,
    JSON.stringify({ len: e.len, el: e.el, center: e.center }));
}

/* 2. Structural integrity across the whole lexicon. */
const seen = new Set();
for (const e of M.LIST) {
  check(`unique ${e.word}`, !seen.has(e.word)); seen.add(e.word);
  check(`length ${e.word}`, e.word.length === e.len, `${e.word.length} vs ${e.len}`);
  check(`no identical vowel pairs ${e.word}`, !/AA|EE|II|OO|UU/.test(e.word));
  check(`no triple letters ${e.word}`, !/(.)\1\1/.test(e.word));
  check(`pronounceable ${e.word}`, !/[^AEIOU]{4}/.test(e.word), 'consonant pileup');
  check(`has fx ${e.word}`, e.fx && Object.keys(e.fx).length > 0);
}

/* 3. Counts: 10 elements × (3 short + 4 long forms × 6 centers) = 270. */
check('lexicon size 270', M.LIST.length === 270, String(M.LIST.length));
const byLen = {};
M.LIST.forEach(e => { byLen[e.len] = (byLen[e.len] || 0) + 1; });
check('10 words per short length', byLen[4] === 10 && byLen[5] === 10 && byLen[6] === 10, JSON.stringify(byLen));
check('60 words per long length', byLen[7] === 60 && byLen[8] === 60 && byLen[9] === 60 && byLen[10] === 60, JSON.stringify(byLen));

/* 4. Report */
if (process.argv.includes('--dump')) {
  let cur = '';
  for (const e of M.LIST) {
    if (e.el !== cur) { cur = e.el; console.log(`\n=== ${M.EL_BY_ID[e.el].icon} ${M.EL_BY_ID[e.el].name} (${M.EL_BY_ID[e.el].root}) ===`); }
    console.log(`  ${e.word.padEnd(11)} L${e.len} ${e.name.padEnd(30)} ${e.desc}`);
  }
  console.log('\nAlphabet:', M.ALPHABET.join(' '));
  console.log('Letter weights:', JSON.stringify(M.LETTER_WEIGHTS));
}

console.log(fail ? `\n${fail} FAILURES` : `OK: ${M.LIST.length} words generated, all integrity checks passed`);
process.exit(fail ? 1 : 0);
