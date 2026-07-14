# 🪡 WORDLOOM

*A ground-up prototype of the Lexicon Arcanum rebuild: one language, two loops.*

**Play it:** open `index.html` in a browser (no build step), or serve the repo
statically — the prototype is the deployment. The original card-based game,
Lexicon Arcanum, lives on in the repo's history (the `claude/wordloom-prototype`
branch keeps it at `lexicon-arcanum/`).

## The idea

The original game glued a deckbuilder to a word game. WORDLOOM removes the
cards entirely — **words are both the puzzle and the arsenal**:

- **ACQUIRE** — every turn you get one free guess at a **mystery word**
  (wordle feedback: green/gold/grey). Solve it and it casts at ×1.5 — and
  your grimoire gains **notes**: the rules and parts the word is built from
  (its root, suffix, binder, center, form), **inscribed forever, across runs**.
- **DEPLOY** — spell any **readable** word (one whose parts are all in your
  notes) from your **loom of letter tiles**. Tiles are the only cost. Longer
  words need more, rarer letters; that IS the mana curve.

You never collect words. You collect the grammar: **84 notes read all 610
visible words** — learn `GEL`, `-AS`, and the A-binder from one lucky solve
and you can suddenly read a dozen frost words you have never seen. And
solving is not the only teacher: **speaking any true word of the tongue** —
improvising it from your tiles, or offering it as a mystery guess, right or
wrong — inscribes its unknown parts too. Every rule of the language,
including the laws of length, is logged under the grimoire's **rules** area.

There is no word list. The lexicon is **generated from a grammar** — 10
element roots × 3 suffix sizes × 10 centers (short/standard/grand) × 9
forms, including **blended words**: the joiner `ET` weds two elements
(`IGNIETUNDUS` — fire *and* water — is Steam), with the second element in
its late spelling (`UND`, `NOC`, `LUX`...). Two euphony rules keep it all
pronounceable. Deduction is therefore *linguistic*: recognizing `IGNI-` on
the first guess collapses the search space. And the road-books say the
grammar keeps older secrets — spellings and elements that appear in no note,
chip, or guide, taught only by strange pages found off the path.
See [`MORPHOLOGY.md`](MORPHOLOGY.md) for the complete grammar.

Anything grammatical can also be **improvised** — spoken at half power without
being learned — so understanding the language is itself a weapon.

## The run

**Three worlds × four branching stages** (~20 minutes): the Margins 📜, the
Inkfen ☠️, the Scriptorium Ruins 🏛 — each with its own foes, elite, and
warden, ending at THE ILLITERATE. Mid-world stages offer **two doors**
(safe camp vs risky elite; battle vs strange event), and rare **elder
pages** hide on the off-paths, teaching the hidden grammar.

You play a **Weaver**: 🪶 the Scrivener (balanced; the loom-sense feels
words to 6 runes), 🔮 the Lector (sense at ANY length, cramped tray), or
⚔️ the Cantor (sense only to 5 — but every word at +25%). The loom never
names a word — it only **senses the length** of the longest word waiting
in your tray, up to your sense's reach. Every word is spelled by hand,
and the **Ribbon Index** upgrade stretches the sense one rune further.
Once per turn you may also **discard up to 5 tiles** for fresh draws,
and the loom warns you outright when it has gone **stale** (no word
weavable at all).

You **choose the mystery word's length**. Lengths beyond the basic forms
unlock through their form notes — and the deep forms (Mirror, Verse,
Sovereign, the Unions) never drop from ordinary study; only elites, wardens,
and the elder roads hold them. The elder roads themselves are **rare**
(roughly one world in five), and there are now **17 secrets** to find: elder
spellings, the two unspoken elements, three secret centers, a secret joiner,
and a secret form — an apocryphal counterpart for every kind of word part.

18 foes attack the *word game*, not just your ink: vowel leeches and tile
thieves, rime wraiths, wisps that blur your wordle marks, lexicons that sap
revealed runes, adaptive golems that calcify against your favorite element —
and the Lexoleech, which **seals one of your grimoire notes** until it dies.

Rewards: study, mend, widen the loom, infuse the bag, Ribbon Index, Quill of
Second Thoughts (an extra guess, once per battle), Whetstone (better
improvisation), Ink Vial — and deep form notes from elites and wardens.

Death loses nothing that matters: **every note makes the next run
stronger** — and pushes the mystery words longer, up to the 12-rune Grand
Unions.

## Balance snapshot

`node tools/simulate.js 300` — scripted player on the shipped engine.
(Speaking-teaches makes early runs far more generous with notes; the hidden
grammar, now 17 secrets behind rarer elder doors, is the long game.)

| grimoire | win rate | note |
|---|---:|---|
| fresh (5 starter notes) | ~20–25% | banks ~46 notes and ~0.4 secrets per run |
| +16 notes | ~33% | |
| +30 notes, Scrivener | ~30% | the Cantor reaches ~56% here |
| full 84-note grammar | ~62% | ~76% with every secret, as the Cantor |

## Layout

```
index.html            the loom
css/loom.css
js/data/morphology.js the grammar — elements, centers, blends, secrets, generator
js/data/foes.js       18 foes across 3 worlds, all hostile to your letters
js/data/classes.js    the three Weavers
js/data/events.js     road events + the elder pages
js/engine.js          battles, worlds, doors, rewards (browser + Node)
js/main.js            UI
js/save.js            notes + secret knowledge persist in localStorage
tools/genwords.js     regenerate + validate the lexicon (--dump / --secrets)
tools/simulate.js     headless balance runs
MORPHOLOGY.md         the full grammar document
vendor/three.min.js   three.js r147, vendored (WebGL scene & spell FX)
```

Debug: append `?debug=1` and use `window.LoomDebug` (learnAll, learnSome(n),
winBattle, state getters).
