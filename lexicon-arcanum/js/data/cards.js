/* ============================================================
 * LEXICON ARCANUM — Card pool (112 cards)
 * Rarity odds on reward rolls: common 65% / uncommon 25% / rare 8% / legendary 2%
 *
 * Effect DSL (engine keys):
 *  dmg, hits            damage (hits = multi-strike)
 *  dmgPerLearned        + damage per word learned in the grimoire
 *  dmgPerInsight        + damage per current insight (not spent)
 *  dmgFromBlock         deal damage equal to current ward
 *  block, blockPerLearned
 *  insight, freeGuess   guess resources (freeGuess = guess w/o insight)
 *  reveal, pruneLetters, revealVowels   word-knowledge effects
 *  draw, heal, maxHp, regen, selfDmg
 *  str                  permanent battle strength (adds to card & spell damage)
 *  wardBonus            all future ward this battle +X
 *  weak, vuln, poison, burn, stun       enemy statuses
 *  cleanse, thorns
 *  echo                 next spell +X% power
 *  twincast             next spell casts twice
 *  insightRune          +X insight at the start of each turn this battle
 *  refundOnCorrect      this battle: correct guesses refund 1 insight
 *  castTome             cast a learned spell (cost: word length - 4 insight), value = power mult
 *  castDiscount         this battle: casting from tomes costs X less
 *  goldGain             immediate aurum
 *  exhaust              card is removed for the rest of the battle after play
 *
 * unlock: null = always in pool. Otherwise:
 *  {kind:'wins', n}          total victories >= n
 *  {kind:'learned', n}       grimoire words learned >= n
 *  {kind:'difficulty', d}    a win on difficulty index >= d
 *  {kind:'power'}            discovered any Word of Power
 *  {kind:'firstGuess', n}    n lifetime first-guess casts
 *  {kind:'classWin', id}     won with the given class
 *  {kind:'world', n}         reached world n in any run
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.CardData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const C = 'common', U = 'uncommon', R = 'rare', L = 'legendary', A = 'aetheria';

  // id, name, rarity, fx, flavor, unlock
  const CARDS = [
    /* ============ COMMON (40) ============ */
    { id: 'bolt', cost: 1,       name: 'Arcane Bolt',      rarity: C, fx: { dmg: 6, insight: 1 },           flavor: 'The first word every scribe learns to throw.' },
    { id: 'ward', cost: 1,       name: 'Vellum Ward',      rarity: C, fx: { block: 6, insight: 1 },         flavor: 'Paper beats stone, if inked correctly.' },
    { id: 'spark', cost: 1,      name: 'Quill Spark',      rarity: C, fx: { dmg: 3, insight: 1, draw: 1 },  flavor: 'A flick of the wrist, a flash of light.' },
    { id: 'focus', cost: 1,      name: 'Focus',            rarity: C, fx: { insight: 2 },                   flavor: 'Stillness sharpens the mind’s edge.' },
    { id: 'brace', cost: 2,      name: 'Iron Margin',      rarity: C, fx: { block: 13 },                     flavor: 'The border of the page holds fast.' },
    { id: 'cinder', cost: 2,     name: 'Cinder Flick',     rarity: C, fx: { elem: 'fire', dmg: 6, burn: 5 },              flavor: 'Some pages are best burned.' },
    { id: 'sap', cost: 1,        name: 'Sapping Gloss',    rarity: C, fx: { dmg: 3, weak: 1, insight: 1 },  flavor: 'A footnote that saps the will.' },
    { id: 'nick', cost: 1,       name: 'Paper Cut',        rarity: C, fx: { dmg: 2, hits: 2, insight: 1 },  flavor: 'Death by a thousand of these, ideally.' },
    { id: 'inkstab', cost: 1,    name: 'Ink Stab',         rarity: C, fx: { dmg: 7 },                       flavor: 'The pen, sharpened.' },
    { id: 'skim', cost: 1,       name: 'Skim',             rarity: C, fx: { draw: 2 },                      flavor: 'Read fast. Regret slowly.' },
    { id: 'jotting', cost: 1,    name: 'Hasty Jotting',    rarity: C, fx: { insight: 1, draw: 1 },          flavor: 'Barely legible. Barely enough.' },
    { id: 'smudge', cost: 1,     name: 'Smudge',           rarity: C, fx: { weak: 2 },                      flavor: 'Blur the foe’s intent.' },
    { id: 'underline', cost: 1,  name: 'Underline',        rarity: C, fx: { vuln: 2 },                      flavor: 'Mark the weakness for later.' },
    { id: 'blot', cost: 1,       name: 'Ink Blot',         rarity: C, fx: { dmg: 5, vuln: 1 },              flavor: 'An ugly stain on their defenses.' },
    { id: 'shieldrune', cost: 1, name: 'Shield Rune',      rarity: C, fx: { block: 5, insight: 1, draw: 1 },flavor: 'A circle, a line, a promise.' },
    { id: 'emberink', cost: 1,   name: 'Ember Ink',        rarity: C, fx: { elem: 'fire', burn: 5 },                      flavor: 'It smolders as it dries.' },
    { id: 'venomink', cost: 1,   name: 'Venom Ink',        rarity: C, fx: { elem: 'venom', poison: 4 },                    flavor: 'Do not lick the quill.' },
    { id: 'guardword', cost: 1,  name: 'Guard Word',       rarity: C, fx: { block: 4, heal: 2 },            flavor: 'A soft word that turns away wrath.' },
    { id: 'salve', cost: 1,      name: 'Salve Script',     rarity: C, fx: { heal: 5 },                      flavor: 'Written on the skin, absorbed by the soul.' },
    { id: 'slash', cost: 2,      name: 'Sigil Slash',      rarity: C, fx: { dmg: 13, selfDmg: 2 },           flavor: 'Carve it fast; the sigil bites back.' },
    { id: 'scribble', cost: 1,   name: 'Frantic Scribble', rarity: C, fx: { insight: 3, selfDmg: 2 },       flavor: 'Insight, at the cost of a nosebleed.' },
    { id: 'margin', cost: 1,     name: 'Margin Note',      rarity: C, fx: { block: 3, insight: 1 },         flavor: 'Small, but it’s always there for you.' },
    { id: 'flick', cost: 1,      name: 'Ash Flick',        rarity: C, fx: { elem: 'fire', dmg: 4, burn: 2, insight: 1 },  flavor: 'Yesterday’s spell still has heat in it.' },
    { id: 'gash', cost: 2,       name: 'Rune Gash',        rarity: C, fx: { dmg: 11, weak: 2 },              flavor: 'Deep enough to teach a lesson.' },
    { id: 'shufflepg', cost: 1,  name: 'Riffle Pages',     rarity: C, fx: { draw: 1, insight: 1, block: 3 },flavor: 'The answer is in here somewhere.' },
    { id: 'pinprick', cost: 1,   name: 'Pin Prick',        rarity: C, fx: { dmg: 1, hits: 4 },              flavor: 'Annoying. Deliberately.' },
    { id: 'wax', cost: 2,        name: 'Wax Seal',         rarity: C, fx: { block: 10, thorns: 2 },          flavor: 'Break it and be burned.' },
    { id: 'hush', cost: 1,       name: 'Hush',             rarity: C, fx: { weak: 1, vuln: 1, insight: 1 }, flavor: 'A librarian’s glare, weaponized.' },
    { id: 'tithe', cost: 0,      name: 'Scribe’s Tithe', rarity: C, fx: { goldGain: 8, insight: 1 },   flavor: 'Knowledge pays its debts.' },
    { id: 'bookbash', cost: 2,   name: 'Book Bash',        rarity: C, fx: { dmg: 15, exhaust: true },       flavor: 'Sometimes the tome IS the weapon.' },
    { id: 'dogear', cost: 1,     name: 'Dog-Ear',          rarity: C, fx: { reveal: 1, exhaust: true },     flavor: 'Mark the page. Never forget.', unlock: null },
    { id: 'glossary', cost: 1,   name: 'Glossary',         rarity: C, fx: { pruneLetters: 3 },              flavor: 'Rule out what it cannot be.' },
    { id: 'chant', cost: 1,      name: 'Low Chant',        rarity: C, fx: { insight: 2, block: 2 },         flavor: 'Hum until the walls agree with you.' },
    { id: 'papershield', cost: 2,name: 'Folio Guard',      rarity: C, fx: { block: 12, draw: 1, exhaust: true }, flavor: 'A thick book stops a thin blade.' },
    { id: 'inkwell', cost: 1,    name: 'Deep Inkwell',     rarity: C, fx: { insight: 2, heal: 2 },          flavor: 'Dip deep, write true.' },
    { id: 'crosshatch', cost: 2, name: 'Crosshatch',       rarity: C, fx: { dmg: 8, block: 6 },             flavor: 'Attack and defense in one stroke.' },
    { id: 'firstdraft', cost: 2, name: 'First Draft',      rarity: C, fx: { elem: 'fire', dmg: 17, selfDmg: 3, exhaust: true }, flavor: 'Powerful. Unrevised. Dangerous.' },
    { id: 'lullaby', cost: 1,    name: 'Vellum Lullaby',   rarity: C, fx: { elem: 'frost', weak: 2, heal: 3 },             flavor: 'Sung to books to keep them shut.' },
    { id: 'errata', cost: 1,     name: 'Errata',           rarity: C, fx: { cleanse: true, insight: 1 },    flavor: 'Correct the record. Correct yourself.' },
    { id: 'gleam', cost: 1,      name: 'Gilded Gleam',     rarity: C, fx: { elem: 'frost', revealVowels: true, exhaust: true }, flavor: 'The vowels catch the light first.' },

    /* ============ UNCOMMON (35) ============ */
    { id: 'glimpse', cost: 1,    name: 'Glimpse',          rarity: U, fx: { reveal: 1 },                    flavor: 'One letter, glimpsed through the veil.' },
    { id: 'study', cost: 1,      name: 'Runic Study',      rarity: U, fx: { insight: 3 },                   flavor: 'Three hours of squinting, condensed.' },
    { id: 'smite', cost: 2,      name: 'Sigil Smite',      rarity: U, fx: { dmg: 11, insight: 1 },          flavor: 'Stamp the foe with your seal.' },
    { id: 'bulwark', cost: 2,    name: 'Codex Bulwark',    rarity: U, fx: { block: 13 },                    flavor: 'Bound in dragonhide for a reason.' },
    { id: 'leech', cost: 2,      name: 'Mind Leech',       rarity: U, fx: { dmg: 9, insight: 2 },           flavor: 'Their thoughts, your margin notes.' },
    { id: 'hexmark', cost: 1,    name: 'Hex Mark',         rarity: U, fx: { weak: 2, vuln: 2 },             flavor: 'A curse in cursive.' },
    { id: 'meditate', cost: 1,   name: 'Meditate',         rarity: U, fx: { insight: 2, heal: 4 },          flavor: 'Breathe in ink, breathe out doubt.' },
    { id: 'lexslam', cost: 2,    name: 'Grimoire Slam',    rarity: U, fx: { dmgPerLearned: 1, dmg: 2 },     flavor: 'Every learned word adds weight.' },
    { id: 'lexshield', cost: 2,  name: 'Binding Cover',    rarity: U, fx: { blockPerLearned: 1, block: 2 }, flavor: 'Armored in accumulated knowledge.' },
    { id: 'mindspike', cost: 1,  name: 'Mind Spike',       rarity: U, fx: { dmgPerInsight: 2 },             flavor: 'Thought, weaponized — and retained.' },
    { id: 'bloodpact', cost: 1,  name: 'Blood Pact',       rarity: U, fx: { insight: 4, selfDmg: 4 },       flavor: 'Ink runs red today.' },
    { id: 'embargo', cost: 2,    name: 'Embargo Seal',     rarity: U, fx: { block: 8, weak: 1, insight: 1 },flavor: 'Nothing gets in. Nothing.' },
    { id: 'quillstorm', cost: 2, name: 'Quill Storm',      rarity: U, fx: { elem: 'storm', dmg: 4, hits: 3 },              flavor: 'A murder of pens.' },
    { id: 'siphon', cost: 2,     name: 'Soul Siphon',      rarity: U, fx: { dmg: 10, heal: 7 },              flavor: 'Borrowed vitality, never returned.' },
    { id: 'acid', cost: 2,       name: 'Acid Etching',     rarity: U, fx: { elem: 'venom', poison: 10 },                    flavor: 'It writes itself deeper each turn.' },
    { id: 'pyre', cost: 2,       name: 'Pyre Glyph',       rarity: U, fx: { elem: 'fire', dmg: 6, burn: 6 },              flavor: 'A word that keeps on burning.' },
    { id: 'vigil', cost: 1,      name: 'Night Vigil',      rarity: U, fx: { insightRune: 1, exhaust: true },flavor: 'The candle never gutters.' },
    { id: 'regrow', cost: 1,     name: 'Regrowth Psalm',   rarity: U, fx: { regen: 3, exhaust: true },      flavor: 'Verse by verse, the wound closes.' },
    { id: 'thornscript', cost: 1,name: 'Thorn Script',     rarity: U, fx: { thorns: 3, block: 5 },          flavor: 'Touch the page. I dare you.' },
    { id: 'muse', cost: 1,       name: 'Bound Muse',       rarity: U, fx: { insight: 2, draw: 2 },          flavor: 'Inspiration, caged and cooperative.' },
    { id: 'sunder', cost: 2,     name: 'Sunder Seal',      rarity: U, fx: { dmg: 9, vuln: 2 },              flavor: 'Crack the shell; the rest follows.' },
    { id: 'chillword', cost: 2,  name: 'Chill Word',       rarity: U, fx: { elem: 'frost', dmg: 8, weak: 2 },              flavor: 'Spoken at absolute zero.' },
    { id: 'vowelrite', cost: 1,  name: 'Vowel Rite',       rarity: U, fx: { revealVowels: true, insight: 1, exhaust: true }, flavor: 'A, E, I, O, U — and sometimes victory.' },
    { id: 'redact', cost: 1,     name: 'Redaction',        rarity: U, fx: { pruneLetters: 5 },              flavor: 'Strike out the impossible.' },
    { id: 'barter', cost: 1,     name: 'Ink Barter',       rarity: U, fx: { goldGain: 18, exhaust: true },  flavor: 'Words are currency, literally.' },
    { id: 'fortify', cost: 1,    name: 'Fortified Binding',rarity: U, fx: { wardBonus: 2, block: 5, exhaust: true }, flavor: 'Reinforce every future page.' },
    { id: 'battlehymn', cost: 1, name: 'Battle Hymn',      rarity: U, fx: { str: 2, insight: 1 },           flavor: 'Sing it like you mean it.' },
    { id: 'inkfangs', cost: 1,   name: 'Ink Fangs',        rarity: U, fx: { elem: 'venom', dmg: 5, poison: 5 },            flavor: 'The bite that keeps biting.' },
    { id: 'palimpsest', cost: 1, name: 'Palimpsest',       rarity: U, fx: { draw: 3, exhaust: true },       flavor: 'Older words hide under new ones.' },
    { id: 'echoquill', cost: 1,  name: 'Echo Quill',       rarity: U, fx: { echo: 50, exhaust: true },      flavor: 'The next word will be spoken twice as loud.' },
    { id: 'freetongue', cost: 1, name: 'Free Tongue',      rarity: U, fx: { freeGuess: 1 },                 flavor: 'One guess, on the house.' },
    { id: 'resochant',  cost: 1, name: 'Harmonic Chant',   rarity: U, fx: { resonance: 15, insight: 1 },    flavor: 'Sing to the engraved runes and they answer.' },
    { id: 'lastword', cost: 2,   name: 'Last Word',        rarity: U, fx: { dmg: 14, exhaust: true },       flavor: 'You always get it. Eventually.' },
    { id: 'guardtome', cost: 2,  name: 'Guardian Folio',   rarity: U, fx: { block: 10, thorns: 2 },         flavor: 'It reads its attackers. Then it bites.' },
    { id: 'scholarraid', cost: 1,name: 'Scholar’s Raid', rarity: U, fx: { dmg: 7, goldGain: 10 },      flavor: 'Loot the mind AND the pockets.',  unlock: { kind: 'wins', n: 1 } },
    { id: 'runedagger', cost: 1, name: 'Runed Dagger',     rarity: U, fx: { dmg: 6, hits: 2, insight: 1 },  flavor: 'Twice inscribed, twice as sharp.', unlock: { kind: 'wins', n: 1 } },

    /* ============ RARE (25) ============ */
    { id: 'revelation', cost: 1, name: 'Revelation',       rarity: R, fx: { reveal: 2, exhaust: true },     flavor: 'Two letters blaze upon the page.' },
    { id: 'casttome', cost: 1,   name: 'Cast Tome',        rarity: R, fx: { castTome: 1 },                  flavor: 'Speak a word you already own.' },
    { id: 'surge', cost: 1,      name: 'Aether Surge',     rarity: R, fx: { insight: 5, exhaust: true },    flavor: 'A tide of raw comprehension.' },
    { id: 'rampart', cost: 2,    name: 'Runic Rampart',    rarity: R, fx: { block: 18, insight: 1 },        flavor: 'A wall with a vocabulary.' },
    { id: 'sundersig', cost: 2,  name: 'Sunder Sigil',     rarity: R, fx: { dmg: 18 },                      flavor: 'One glyph. One crater.' },
    { id: 'echorune', cost: 1,   name: 'Echo Rune',        rarity: R, fx: { echo: 100, exhaust: true },     flavor: 'The mountain answers back, doubled.' },
    { id: 'twinink', cost: 2,    name: 'Twin Ink',         rarity: R, fx: { twincast: true, exhaust: true },flavor: 'Write it once. It happens twice.' },
    { id: 'shieldspike', cost: 1,name: 'Shield Spike',     rarity: R, fx: { dmgFromBlock: true },           flavor: 'The best defense, weaponized.' },
    { id: 'plaguepen', cost: 2,  name: 'Plague Pen',       rarity: R, fx: { elem: 'venom', poison: 6, burn: 6, weak: 1 },  flavor: 'Its ink was never meant for paper.' },
    { id: 'mindfort', cost: 2,   name: 'Mind Fortress',    rarity: R, fx: { block: 12, insightRune: 1, exhaust: true }, flavor: 'Build the walls out of thought itself.' },
    { id: 'refund', cost: 1,     name: 'Scholar’s Rebate', rarity: R, fx: { refundOnCorrect: true, exhaust: true }, flavor: 'Correct answers are free. House rules.' },
    { id: 'bigstudy', cost: 2,   name: 'Deep Lexicon',     rarity: R, fx: { insight: 3, reveal: 1, exhaust: true }, flavor: 'Study until the word studies you.' },
    { id: 'warpage', cost: 2,    name: 'War Page',         rarity: R, fx: { dmg: 10, block: 10 },           flavor: 'Torn from the Codex Belli.' },
    { id: 'vampfolio', cost: 2,  name: 'Vampiric Folio',   rarity: R, fx: { dmg: 12, heal: 8 },             flavor: 'It feeds. You benefit.' },
    { id: 'stormglyph', cost: 2, name: 'Storm Glyph',      rarity: R, fx: { elem: 'storm', dmg: 6, hits: 3, insight: 1 },  flavor: 'Thunder, conjugated three ways.' },
    { id: 'hourglass', cost: 2,  name: 'Inverted Hourglass', rarity: R, fx: { stun: 1, exhaust: true },     flavor: 'Steal a moment. Keep it.' },
    { id: 'goldleaf', cost: 1,   name: 'Gold Leaf',        rarity: R, fx: { goldGain: 35, exhaust: true },  flavor: 'Illumination pays.' },
    { id: 'titanhide', cost: 2,  name: 'Titanhide Binding', rarity: R, fx: { block: 14, wardBonus: 3, exhaust: true }, flavor: 'Skin of something that never yielded.' },
    { id: 'ruinword', cost: 3,   name: 'Word of Ruin',     rarity: R, fx: { dmg: 15, vuln: 2, weak: 1 },    flavor: 'Best whispered. Ideally far away.' },
    { id: 'librarian', cost: 2,  name: 'Call Librarian',   rarity: R, fx: { draw: 2, insight: 2, heal: 3 }, flavor: 'She knows exactly where everything is.' },
    { id: 'runeprison', cost: 2, name: 'Rune Prison',      rarity: R, fx: { stun: 1, dmg: 8, exhaust: true }, flavor: 'Sentenced to a full stop.', unlock: { kind: 'learned', n: 25 } },
    { id: 'powerprobe', cost: 1, name: 'Power Probe',      rarity: R, fx: { reveal: 1, insight: 2, exhaust: true }, flavor: 'Seek the words behind the words.', unlock: { kind: 'power' } },
    { id: 'eldertome', cost: 1,  name: 'Elder Cast Tome',  rarity: R, fx: { castTome: 1, castDiscount: 1 }, flavor: 'It pronounces the hard parts for you.', unlock: { kind: 'learned', n: 40 } },
    { id: 'bossbane', cost: 3,   name: 'Regicide Note',    rarity: R, fx: { dmg: 22, selfDmg: 4, exhaust: true }, flavor: 'Addressed to whoever’s in charge.', unlock: { kind: 'world', n: 3 } },
    { id: 'perfected', cost: 1,  name: 'Perfected Form',   rarity: R, fx: { str: 3, insight: 2, exhaust: true }, flavor: 'Practice made permanent.', unlock: { kind: 'firstGuess', n: 10 } },

    /* ============ LEGENDARY (12) ============ */
    { id: 'omniscience', cost: 2,name: 'Omniscience',      rarity: L, fx: { reveal: 3, insight: 3, exhaust: true }, flavor: 'For one moment, you simply KNOW.' },
    { id: 'mastertome', cost: 2, name: 'Master Tome',      rarity: L, fx: { castTome: 1.5, castDiscount: 2 }, flavor: 'Every word within has tasted victory.' },
    { id: 'eureka', cost: 2,     name: 'Eureka',           rarity: L, fx: { insight: 8, exhaust: true },    flavor: 'The bathwater was never the point.' },
    { id: 'ruinsigil', cost: 3,  name: 'Ruin Sigil',       rarity: L, fx: { dmg: 30, vuln: 2, exhaust: true }, flavor: 'The last page of the last book.' },
    { id: 'aegisverba', cost: 3, name: 'Aegis Verba',      rarity: L, fx: { block: 30, heal: 10, exhaust: true }, flavor: 'The word for “unbreakable,” made literal.' },
    { id: 'archivist', cost: 3,  name: 'The Archive Stirs', rarity: L, fx: { dmgPerLearned: 2, exhaust: true }, flavor: 'Every word you’ve ever learned, all at once.', unlock: { kind: 'learned', n: 60 } },
    { id: 'wordweaver', cost: 2, name: 'Wordweaver’s Loom', rarity: L, fx: { insightRune: 2, exhaust: true }, flavor: 'It spins guesses out of moonlight.', unlock: { kind: 'wins', n: 2 } },
    { id: 'philostone', cost: 1, name: 'Philosopher’s Ink', rarity: L, fx: { maxHp: 6, heal: 6, exhaust: true }, flavor: 'Write yourself a little more alive.' },
    { id: 'grandecho', cost: 2,  name: 'Grand Resonance',  rarity: L, fx: { echo: 100, twincast: true, exhaust: true }, flavor: 'Say it once. The universe handles the rest.', unlock: { kind: 'difficulty', d: 2 } },
    { id: 'timeskip', cost: 2,   name: 'Torn Calendar',    rarity: L, fx: { stun: 1, insight: 4, exhaust: true }, flavor: 'That day simply never happens to them.', unlock: { kind: 'difficulty', d: 1 } },
    { id: 'truesight', cost: 2,  name: 'True Sight',       rarity: L, fx: { reveal: 2, revealVowels: true, exhaust: true }, flavor: 'The word was always right there.', unlock: { kind: 'learned', n: 80 } },
    { id: 'finalword', cost: 3,  name: 'The Final Word',   rarity: L, fx: { dmg: 20, dmgPerInsight: 3, exhaust: true }, flavor: 'Conversation over.', unlock: { kind: 'classWin', id: 'archivist' } },

    { id: 'frostnip',   cost: 1, name: 'Frost Nip',        rarity: C, fx: { elem: 'frost', dmg: 5, weak: 1 },  flavor: 'A cold correction.' },
    { id: 'hailstone',  cost: 2, name: 'Hailstone',        rarity: U, fx: { elem: 'frost', dmg: 9, block: 5 },  flavor: 'The sky throws punctuation.' },
    { id: 'rime',       cost: 1, name: 'Creeping Rime',    rarity: U, fx: { elem: 'frost', dmg: 6, vuln: 1 },   flavor: 'It finds the cracks in everything.' },

    /* ============ ENERGY RAMP & ENDGAME (4⚡+ builds) ============ */
    { id: 'energytap',  cost: 0, name: 'Vein Tap',         rarity: U, fx: { energyNow: 2, selfDmg: 6 },      flavor: 'The ink must come from somewhere.' },
    { id: 'leyline',    cost: 2, name: 'Leyline Binding',  rarity: U, fx: { energyMax: 1, exhaust: true },   flavor: 'Staple your soul to the world’s wiring.' },
    { id: 'conduit',    cost: 3, name: 'Grand Conduit',    rarity: L, fx: { energyMax: 2, insight: 2, exhaust: true }, flavor: 'You are no longer the bottleneck.' },
    { id: 'inkhydra',   cost: 3, name: 'Ink Hydra',        rarity: R, fx: { elem: 'venom', dmg: 6, aoe: true, poison: 4 },  flavor: 'Cut one stroke, two more answer.' },
    { id: 'starfall',   cost: 4, name: 'Starfall Stanza',  rarity: R, fx: { elem: 'storm', dmg: 11, hits: 2, aoe: true, exhaust: true }, flavor: 'The sky, quoted at length.', unlock: { kind: 'world', n: 3 } },
    { id: 'voidquill',  cost: 4, name: 'Void Quill',       rarity: R, fx: { elem: 'storm', dmg: 12, aoe: true, stun: 1, exhaust: true }, flavor: 'It writes in absences.', unlock: { kind: 'power' } },
    { id: 'towerbabel', cost: 4, name: 'Tower of Babel',   rarity: R, fx: { dmgPerAttuned: 9, dmg: 5 },      flavor: 'Every tongue you spoke today, stacked.', unlock: { kind: 'learned', n: 50 } },
    { id: 'omnilex',    cost: 4, name: 'The Omnilex',      rarity: L, fx: { dmg: 22, castRandom: true, exhaust: true }, flavor: 'It reads YOU aloud.', unlock: { kind: 'learned', n: 100 } },
    { id: 'worldpage',  cost: 4, name: 'The World-Page',   rarity: L, fx: { block: 28, heal: 14, insight: 2, exhaust: true }, flavor: 'A map so accurate it protects the territory.', unlock: { kind: 'world', n: 4 } },
    { id: 'grandgrim',  cost: 4, name: 'Grand Grimoire',   rarity: L, fx: { castTome: 2 },                   flavor: 'Your collected works. Loud.', unlock: { kind: 'firstGuess', n: 25 } },
    { id: 'aeonengine', cost: 5, name: 'Aeon Engine',      rarity: L, fx: { insightRune: 2, energyMax: 1, exhaust: true }, flavor: 'Powered by the future’s spare moments.', unlock: { kind: 'wins', n: 4 } },
    { id: 'penultima',  cost: 5, name: 'PENULTIMA',        rarity: L, fx: { dmg: 48, exhaust: true },        flavor: 'The second-to-last word. You do not want the last.', unlock: { kind: 'difficulty', d: 3 } },

    /* ============ AETHERIA (red) — ultimate rarity ============
     * Never rolled before World 3, and only on Adept difficulty or higher.
     * Raw, synergy-free power: a late-run lifeline for ordinary decks. */
    { id: 'aetherbolt',  cost: 2, name: 'Aetheric Lance',    rarity: A, fx: { dmg: 30, insight: 2 },
      flavor: 'A sentence from before language, sharpened.' },
    { id: 'aetherward',  cost: 2, name: 'Aetheric Bulwark',  rarity: A, fx: { block: 24, heal: 8, insight: 1 },
      flavor: 'The margin of a page no quill has touched.' },
    { id: 'aetherstorm', cost: 4, name: 'Aetherstorm',       rarity: A, fx: { elem: 'storm', dmg: 16, aoe: true, stun: 1, exhaust: true },
      flavor: 'The sky forgets whose side it was on.' },
    { id: 'aetherheart', cost: 3, name: 'Heart of Aether',   rarity: A, fx: { maxHp: 12, heal: 12, str: 2, exhaust: true },
      flavor: 'It beats once per age. It just beat.' },
    { id: 'aetherclock', cost: 3, name: 'Clock of Unhours',  rarity: A, fx: { stun: 1, aoe: true, draw: 2, exhaust: true },
      flavor: 'Everyone else is briefly optional.' },
    { id: 'aetherquill', cost: 1, name: 'Quill of the First Scribe', rarity: A, fx: { reveal: 2, insight: 3, freeGuess: 1, exhaust: true },
      flavor: 'It already knows what you meant to write.' },
    { id: 'aetherfont',  cost: 2, name: 'Font of Aether',    rarity: A, fx: { insightRune: 2, heal: 5, exhaust: true },
      flavor: 'Drink. The well minds being empty less than you do.' },
    { id: 'aethercrown', cost: 3, name: 'Crown of the Unwritten', rarity: A, fx: { energyMax: 2, str: 2, exhaust: true },
      flavor: 'Rule the sentence before it is spoken.' },

    /* ============ CLASS / STARTER-ONLY (not in reward pool) ============ */
    { id: 'heavybolt', cost: 1,  name: 'Heavy Bolt',       rarity: C, fx: { dmg: 8, insight: 1 },  starter: true, flavor: 'Warmage standard issue.' },
    { id: 'ironward', cost: 1,   name: 'Iron Ward',        rarity: C, fx: { block: 8, insight: 1 }, starter: true, flavor: 'Warmage standard issue.' },
    { id: 'firebolt',   cost: 1, name: 'Firebolt',   rarity: C, fx: { elem: 'fire',  dmg: 6, insight: 1 }, starter: true, flavor: 'Elementalist primer, chapter one.' },
    { id: 'frostbolt',  cost: 1, name: 'Frostbolt',  rarity: C, fx: { elem: 'frost', dmg: 6, insight: 1 }, starter: true, flavor: 'Chapter two, served cold.' },
    { id: 'venombolt',  cost: 1, name: 'Venombolt',  rarity: C, fx: { elem: 'venom', dmg: 6, insight: 1 }, starter: true, flavor: 'Chapter three. Do not taste.' },
    { id: 'stormbolt',  cost: 1, name: 'Stormbolt',  rarity: C, fx: { elem: 'storm', dmg: 6, insight: 1 }, starter: true, flavor: 'Chapter four, delivered loudly.' },
    { id: 'seerbolt', cost: 1,   name: 'Seer Bolt',        rarity: C, fx: { dmg: 9, insight: 2 },  starter: true, flavor: 'It strikes where the eye already looked.' },
    { id: 'veilward', cost: 1,   name: 'Veil Ward',        rarity: C, fx: { block: 6, insight: 2 }, starter: true, flavor: 'Woven from second sight.' },
  ];

  const RARITY_WEIGHTS = { common: 65, uncommon: 25, rare: 8, legendary: 2, aetheria: 0 };
  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary', 'aetheria'];

  const BY_ID = {};
  CARDS.forEach(c => { BY_ID[c.id] = c; });

  /* Upgrade: numeric magnitudes ×1.5 (durations +1 where sensible) */
  const UPGRADE_SCALE = ['dmg', 'block', 'heal', 'insight', 'poison', 'burn', 'goldGain',
    'dmgPerInsight', 'selfDmgReduce', 'regen', 'thorns', 'maxHp', 'str', 'wardBonus', 'echo', 'resonance'];
  const UPGRADE_BUMP = ['weak', 'vuln', 'draw', 'reveal', 'pruneLetters', 'freeGuess',
    'dmgPerLearned', 'blockPerLearned', 'insightRune', 'castDiscount', 'energyNow', 'dmgPerAttuned'];

  function upgradedFx(fx) {
    const out = Object.assign({}, fx);
    for (const k of UPGRADE_SCALE) if (out[k]) out[k] = Math.round(out[k] * 1.5);
    for (const k of UPGRADE_BUMP) if (out[k]) out[k] = out[k] + 1;
    if (out.selfDmg) out.selfDmg = Math.max(0, out.selfDmg - 2);
    if (out.castTome) out.castTome = Math.round(out.castTome * 1.25 * 100) / 100;
    return out;
  }

  const ELEM_ICON = { fire: '🔥', frost: '❄️', venom: '☠️', storm: '⚡' };
  function describeFx(fx) {
    const b = [];
    const tgt = fx.aoe ? ' to ALL foes' : '';
    if (fx.elem) b.push(ELEM_ICON[fx.elem] + ' ' + fx.elem.charAt(0).toUpperCase() + fx.elem.slice(1));
    if (fx.dmg && fx.hits) b.push(`Deal ${fx.dmg}×${fx.hits} damage${tgt}`);
    else if (fx.dmg) b.push(`Deal ${fx.dmg} damage${tgt}`);
    if (fx.dmgPerAttuned) b.push(`+${fx.dmgPerAttuned} damage per word-length attuned this battle`);
    if (fx.energyNow) b.push(`+${fx.energyNow} ⚡ now`);
    if (fx.energyMax) b.push(`+${fx.energyMax} max ⚡ this battle`);
    if (fx.castRandom) b.push('Cast a random learned spell, free');
    if (fx.dmgPerLearned) b.push(`+${fx.dmgPerLearned} damage per learned word`);
    if (fx.dmgPerInsight) b.push(`Deal ${fx.dmgPerInsight}× your insight as damage`);
    if (fx.dmgFromBlock) b.push('Deal damage equal to your ward');
    if (fx.block) b.push(`Gain ${fx.block} ward`);
    if (fx.blockPerLearned) b.push(`+${fx.blockPerLearned} ward per learned word`);
    if (fx.wardBonus) b.push(`All ward +${fx.wardBonus} this battle`);
    if (fx.insight) b.push(`+${fx.insight} insight`);
    if (fx.insightRune) b.push(`+${fx.insightRune} insight each turn`);
    if (fx.freeGuess) b.push(`+${fx.freeGuess} free guess`);
    if (fx.reveal) b.push(`Reveal ${fx.reveal} letter${fx.reveal > 1 ? 's' : ''}`);
    if (fx.pruneLetters) b.push(`Rule out ${fx.pruneLetters} absent letters`);
    if (fx.revealVowels) b.push('Reveal which vowels the word holds');
    if (fx.refundOnCorrect) b.push('Correct guesses refund 1 insight this battle');
    if (fx.resonance) b.push(`Engraving resonance +${fx.resonance}% this battle`);
    if (fx.castTome) b.push(`Cast a learned spell${fx.castTome > 1 ? ` at ×${fx.castTome}` : ''} (costs word length − 4 insight)`);
    if (fx.castDiscount) b.push(`Tome casts cost ${fx.castDiscount} less`);
    if (fx.draw) b.push(`Draw ${fx.draw}`);
    if (fx.heal) b.push(`Heal ${fx.heal}`);
    if (fx.regen) b.push(`Regenerate ${fx.regen} HP each turn`);
    if (fx.maxHp) b.push(`+${fx.maxHp} max HP this run`);
    if (fx.str) b.push(`+${fx.str} might`);
    if (fx.weak) b.push(`Weaken foe ${fx.weak}`);
    if (fx.vuln) b.push(`Expose foe ${fx.vuln}`);
    if (fx.poison) b.push(`Apply ${fx.poison} venom`);
    if (fx.burn) b.push(`Apply ${fx.burn} burn`);
    if (fx.stun) b.push('Stun the foe');
    if (fx.cleanse) b.push('Cleanse your afflictions');
    if (fx.thorns) b.push(`Thorns ${fx.thorns}`);
    if (fx.echo) b.push(`Next spell +${fx.echo}% power`);
    if (fx.twincast) b.push('Next spell casts twice');
    if (fx.goldGain) b.push(`Gain ${fx.goldGain} aurum`);
    if (fx.selfDmg) b.push(`Take ${fx.selfDmg} damage`);
    let s = b.join('. ');
    if (fx.exhaust) s += '. Exhaust';
    return s + '.';
  }

  function isUnlocked(card, meta) {
    const u = card.unlock;
    if (!u) return true;
    if (!meta) return false;
    switch (u.kind) {
      case 'wins': return (meta.totalWins || 0) >= u.n;
      case 'learned': return (meta.learnedWords || []).length >= u.n;
      case 'difficulty': return (meta.bestDifficultyWin ?? -1) >= u.d;
      case 'power': return (meta.discoveredPower || []).length > 0;
      case 'firstGuess': return (meta.firstGuessCasts || 0) >= u.n;
      case 'classWin': return !!(meta.classWins || {})[u.id];
      case 'world': return (meta.bestWorld || 1) >= u.n;
      default: return false;
    }
  }

  function unlockText(u) {
    switch (u.kind) {
      case 'wins': return `Win ${u.n} run${u.n > 1 ? 's' : ''}`;
      case 'learned': return `Learn ${u.n} words`;
      case 'difficulty': return `Win on ${['Adept', 'Master', 'Archmage'][u.d - 1] || 'a higher'} difficulty`;
      case 'power': return 'Discover a Word of Power';
      case 'firstGuess': return `Cast ${u.n} spells on the first guess`;
      case 'classWin': return 'Win as the Archivist';
      case 'world': return `Reach World ${u.n}`;
      default: return 'Unknown';
    }
  }

  function rewardPool(meta) {
    return CARDS.filter(c => !c.starter && isUnlocked(c, meta));
  }

  function rollRarity(rng, bonus, opts) {
    // bonus shifts weight from common toward better rarities (elite/boss rewards).
    // opts.aetheria enables the red ultimate rarity (World 3+, Adept+ only).
    let w = Object.assign({}, RARITY_WEIGHTS);
    if (bonus) {
      w = { common: Math.max(10, 65 - 30 * bonus), uncommon: 25 + 12 * bonus, rare: 8 + 12 * bonus, legendary: 2 + 6 * bonus, aetheria: 0 };
    }
    if (opts && opts.aetheria) w.aetheria = 7 + 10 * (bonus || 0);
    const total = RARITY_ORDER.reduce((s, r) => s + w[r], 0);
    let roll = rng() * total;
    for (const r of RARITY_ORDER) { roll -= w[r]; if (roll <= 0) return r; }
    return 'common';
  }

  return { CARDS, BY_ID, RARITY_WEIGHTS, RARITY_ORDER, upgradedFx, describeFx, isUnlocked, unlockText, rewardPool, rollRarity };
});
