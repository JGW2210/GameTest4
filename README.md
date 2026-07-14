# 🪡 WORDLOOM

*A ground-up prototype of the Lexicon Arcanum rebuild: one language, two loops.*

**Play it:** open `index.html` in a browser (no build step), or serve the repo
statically — the prototype is the deployment. The original card-based game,
Lexicon Arcanum, lives on at [`lexicon-arcanum/`](lexicon-arcanum/).

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

You never collect words. You collect the grammar: **64 notes read all 270
words** — learn `GEL`, `-AS`, and the A-binder from one lucky solve and you
can suddenly read a dozen frost words you have never seen.

There is no word list. The entire 270-word lexicon is **generated from a
grammar** — 10 element roots × 3 suffix sizes × 6 center modifiers × 7
length-forms, with a sandhi rule for euphony. Deduction is therefore
*linguistic*: recognizing `IGNI-` on the first guess collapses the search
space. Knowledge, not memorization, is the meta-progression.
See [`MORPHOLOGY.md`](MORPHOLOGY.md) for the complete grammar.

Anything grammatical can also be **improvised** — spoken at half power without
being learned — so understanding the language is itself a weapon.

## The run

An 8-node, ~15-minute spiral: four battles, two camps, an elite, and THE
ILLITERATE — a boss that hates all words. Foes attack the *word game*, not
just your hp: vowel leeches eat your tiles, rime wraiths freeze them, pyre
imps burn them, the Mumbler inks out letters so you can't guess with them,
and the boss scrambles your whole loom. Elemental counterplay via
weakness/resistance (×1.5 / ×0.5) — the Rime Wraith fears `IGN`-words.

Rewards: study a word directly, widen the loom, infuse the letter bag toward
an element, or mend. Camps: rest or reflect (learn a word of a length you've
already solved).

Death loses nothing that matters: **every inscribed word makes the next run
stronger** — and pushes the mystery words longer (L4–5 at first, up to the
L10 Sovereigns for deep grimoires).

## Balance snapshot

`node tools/simulate.js 300` — scripted player on the shipped engine:

| grimoire | win rate | note |
|---|---:|---|
| fresh (5 starter notes) | 3–12% | banks ~20 notes per death — a third of the grammar |
| +12 notes | ~19% | |
| +20 notes | ~41% | the elite is the wall |
| full 64-note grammar | ~75% | |

## Layout

```
index.html            the loom
css/loom.css
js/data/morphology.js the grammar — elements, centers, forms, sandhi, generator
js/data/foes.js       9 foes that attack your letters
js/engine.js          battles, runs, rewards (browser + Node)
js/main.js            UI
js/save.js            the grimoire persists in localStorage
tools/genwords.js     regenerate + validate the lexicon (--dump to read it all)
tools/simulate.js     headless balance runs
MORPHOLOGY.md         the full grammar document
lexicon-arcanum/      the original card-based game, complete and playable
```

Debug: append `?debug=1` and use `window.LoomDebug` (learnAll, learnSome(n),
winBattle, state getters).
