/* Validates word pools: exact counts, exact lengths, no duplicates,
 * A-Z only, words of power exist in their pools, spell table complete. */
const { POOLS, SPELLS, WORDS_OF_POWER } = require('../js/data/words.js');

const EXPECTED = { 5: 10, 6: 20, 7: 35, 8: 35, 9: 40, 10: 40 };
let ok = true;
const seen = new Set();

for (const [lenKey, count] of Object.entries(EXPECTED)) {
  const len = Number(lenKey);
  const pool = POOLS[len] || [];
  if (pool.length !== count) { ok = false; console.error(`len ${len}: expected ${count} words, got ${pool.length}`); }
  for (const w of pool) {
    if (w.length !== len) { ok = false; console.error(`len ${len}: "${w}" has length ${w.length}`); }
    if (!/^[A-Z]+$/.test(w)) { ok = false; console.error(`len ${len}: "${w}" has non A-Z chars`); }
    if (seen.has(w)) { ok = false; console.error(`duplicate word: "${w}"`); }
    seen.add(w);
    if (!SPELLS[w]) { ok = false; console.error(`no spell defined for "${w}"`); }
  }
  const pow = WORDS_OF_POWER[len];
  if (!pool.includes(pow)) { ok = false; console.error(`word of power "${pow}" not in ${len}L pool`); }
}

console.log(ok ? `OK: ${seen.size} words validated` : 'VALIDATION FAILED');
process.exit(ok ? 0 : 1);
