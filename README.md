# 📖 Lexicon Arcanum

A roguelike deckbuilder where **every spell is a word**. Battle through five worlds by
playing cards for *insight*, then spending that insight to guess Latin-esque mystery
words, Wordle-style. Words you guess correctly are **engraved in your grimoire forever**
— across runs — and auto-cast instantly whenever they reappear.

**Play it:** open `index.html` in any modern browser (no build step, no dependencies),
or serve the folder statically (e.g. `npx http-server`). Works on GitHub Pages as-is.

---

## How it plays

- **The tome.** The whole game is viewed through a magic tome — pages flip as you move
  between the map, battles, the forge and your grimoire.
- **Battles.** Each turn you draw cards (class-dependent) into a hand of up to 8.
  Cards attack, ward, buff, debuff — and most grant **💡 insight**.
- **The mystery word.** Every battle serves a mystery word of your chosen length
  (5–10 runes). Each guess costs 1 insight. Feedback is Wordle-style: green = right
  rune, right place; yellow = right rune, wrong place; grey = absent.
- **Casting.** Guess the word → its spell casts. **First-guess casts are ×1.5.**
- **Engraving.** Correct words are learned *permanently*. If a learned word is served
  again — in any future run — it **auto-casts instantly** and a fresh word is served.
  If you know *every* word of a length, each new word comes with one rune revealed
  so you can deduce it from your grimoire.
- **Words of Power.** One secret word per length casts at **×2**. Discover them.
- **Insight carries over** between turns (and battles), so hoarding for a big
  tome-cast is a real strategy.

## Word pools

| Length | Count | Character |
|-------:|------:|-----------|
| 5 | 10 | the weakest cantrips |
| 6 | 20 | marginally stronger |
| 7 | 35 | solid battle magic |
| 8 | 35 | empowered twins of the 7-letter spells (×1.5) |
| 9 | 40 | tide-changers (stuns, huge swings) |
| 10 | 40 | ultimate words |

5/6/7 are available from the start. **8L**: win a run. **9L**: win on Adept.
**10L**: win on Master.

## Classes

| Class | Identity |
|-------|----------|
| ✒️ **The Scribe** | +1 insight/turn, draws 3. Balanced. |
| 🔮 **The Oracle** | +2 insight/turn, draws only 2. |
| ⚔️ **The Warmage** | No free insight, stronger base cards, draws 3. |
| 📜 **The Archivist** | +5 insight/turn, draws 1 (always a Cast Tome), casts learned spells at a discount and ×1.4. Unlocked by winning with all other classes. |

## The run

5 worlds × 6 stages on a **branching map** — optional elites (richer spoils), treasure,
whispering shrines (heal / aurum / *runic vision*: learn a random word), and a world
boss. The **Arcane Forge** is always reachable from the map: upgrade cards (×1.5
effects) or unbind them from your deck for aurum won in battle.

**112 cards** across common (65%), uncommon (25%), rare (8%) and legendary (2%)
rarities — including insight engines, letter-revealers, tome-casts, echoes, twincasts,
and cards that scale with your grimoire. A dozen+ cards are **unlockable** through
achievements (wins, words learned, difficulties, Words of Power, first-guess casts…).

Four difficulties (Novice → Archmage) with harder foes and richer aurum.
Scaling is deliberately steep: the intended arc is that **words you learn in dying
runs power your future runs**.

## Balance methodology

Balance was tuned by simulation: `tools/simulate.js` plays *complete runs* headlessly
using the **exact same engine and data files the game ships** (`js/engine.js` is
dual-environment), with heuristic player policies (novice/adept/veteran cognition
models for the word-guessing). Final tuning targets (300 runs/config):

| Scenario | Win rate |
|---|---:|
| Fresh grimoire, first runs (Novice) | 4–8%, ~35 words learned/run |
| 5–7L pools mastered (Novice) | ~25% → first win |
| Deep grimoire (140 words, Novice) | 83–99% |
| Deep grimoire, Adept | ~73% |
| Deep grimoire, Master | ~54% |
| Complete 180-word grimoire, Archmage | ~65% (Archivist: ~30%) |

Reproduce with:

```bash
node tools/validate.js     # word pool integrity (counts, lengths, duplicates)
node tools/simulate.js 300 # full balance suite
```

## Project layout

```
index.html          the tome
css/tome.css        parchment, page-flips, cards, wordle tiles
js/engine.js        pure game logic (browser + Node)
js/data/words.js    180 words, spells, Words of Power
js/data/cards.js    112-card pool, rarities, unlocks
js/data/classes.js  classes & difficulties
js/data/enemies.js  5 worlds of foes + scaling knobs
js/main.js          screens, battle UI, map, forge, grimoire
js/particles.js     canvas FX (sparks, runes, novas, confetti)
js/save.js          localStorage persistence
tools/              validation & balance simulation
```

Progress (grimoire, unlocks, wins) persists in `localStorage`. Runs are resumable.
