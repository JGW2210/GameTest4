# 📖 Lexicon Arcanum

A roguelike deckbuilder where **every spell is a word**. Battle through five worlds by
playing cards for *energy* and *insight*, then spending insight to guess Latin-esque
mystery words, Wordle-style. Words you guess correctly are **engraved in your grimoire
forever** — across runs — and auto-cast instantly whenever they reappear.

**Play it:** open `index.html` in any modern browser (no build step, no dependencies),
or serve the folder statically (e.g. `npx http-server`). Works on GitHub Pages as-is.
Desktop and portrait/mobile layouts included.

---

## How it plays

- **The tome.** The whole game is viewed through a magic tome — pages flip as you move
  between the map, battles, the forge and your grimoire. Original SVG "illuminated
  bestiary" art for every foe; a fully synthesized WebAudio soundscape (no asset files).
- **Battles.** Each turn you get **3⚡ energy** and draw cards (class-dependent) into a
  hand of up to 8. Cards cost ⚡ and attack, ward, buff, debuff — and most grant
  **💡 insight**. Some encounters field **packs of foes** — click a foe to aim.
- **The mystery word.** Every battle serves a mystery word of your chosen length
  (5–10 runes). Each guess costs 1 insight. Green = right rune, right place;
  yellow = right rune, wrong place; grey = absent.
- **Scry.** Once per turn, freely ask the tome whether a chosen letter is in the word.
- **Casting.** Guess the word → its spell casts. **First-guess casts are ×1.5.**
- **Engraving.** Correct words are learned *permanently*. If a learned word is served
  again — in any future run — it **auto-casts instantly** and a fresh word is served.
  Know *every* word of a length and new words come with one rune revealed.
- **Schools & combos.** Every word belongs to a school (Astral ✦, Aegian ⛨, Ignium 🔥,
  Pestis ☠, Sanguine 🩸, Umbral 🌑, Mentis 🧠, Fulmen ⚡). Casting multiple words of a
  school in one battle triggers escalating combos.
- **Attunement.** Weaving *different word lengths* in one battle grants tiered boons —
  insight, might, and **+max ⚡** — plus bonus aurum. Variety pays.
- **Words of Power.** One secret word per length casts at **×2**. Discover them.
- **Signature spells.** ~40 notable words carry hand-authored identities (★): IGNIS
  burns every foe, UMBRA blinds, MORTIS executes the dying, OMNIPOTENS swells your
  energy reserves…
- **Insight carries over** between turns and battles; energy refreshes each turn and
  its ceiling can be **ramped past 4–5⚡** with attunement, relics, and rare cards for
  endgame builds.

## Word pools

| Length | Count | Character |
|-------:|------:|-----------|
| 5 | 10 | the weakest cantrips |
| 6 | 20 | marginally stronger |
| 7 | 35 | solid battle magic |
| 8 | 35 | empowered twins of the 7-letter spells (×1.5) |
| 9 | 40 | tide-changers (stuns, huge swings) |
| 10 | 40 | ultimate words |

5/6/7 available from the start. **8L**: win a run. **9L**: win on Adept. **10L**: win on Master.

## Classes

| Class | Identity |
|-------|----------|
| ✒️ **The Scribe** | +1 insight/turn, draws 3. Balanced. |
| 🔮 **The Oracle** | +2 insight/turn, draws only 2. |
| ⚔️ **The Warmage** | No free insight, stronger base cards, draws 3. |
| 📜 **The Archivist** | +5 insight/turn, draws 1 (always a Cast Tome), casts learned spells at a discount and ×1.4. Unlocked by winning with all other classes. |

## The run

5 worlds × 6 stages on a **branching map**: battles (some with multi-foe packs),
elites (**guaranteed relic drops**), treasure, whispering shrines, **strange
encounters** (10 choice events — cursed lexicons, ink-imp wagers, bound djinn…), and a
world boss. The **Arcane Forge** is always reachable from the map: upgrade cards (×1.5
effects) or unbind them.

- **128 cards** across common (65%) / uncommon (25%) / rare (8%) / legendary (2%),
  including energy-ramp cards (Leyline Binding, Grand Conduit, Aeon Engine) and 4–5⚡
  endgame bombs (The Omnilex, PENULTIMA). 17 cards are **unlockable** via achievements.
- **24 relics** — passive run artifacts (Coal of the First Word: +1 max ⚡, Glass Eye,
  Storm in a Jar…).
- **Daily Challenge** — a date-seeded run (same class, seed and difficulty for
  everyone that day) with a shareable emoji result.

Four difficulties (Novice → Archmage). Scaling is deliberately steep: **words learned
in dying runs power your future runs.**

## Balance methodology

Tuned by simulation: `tools/simulate.js` plays *complete runs* headlessly on the
**exact engine + data the game ships** (`js/engine.js` is dual-environment), with
novice/adept/veteran cognition models for the word-guessing. Final targets
(150–200 runs/config, v2):

| Scenario | Win rate |
|---|---:|
| Fresh grimoire, first runs (Novice) | ~35–43% for a *perfectly disciplined* sim player — meaningfully lower for humans |
| 5–7L pools mastered (Novice) | ~40% |
| Deep grimoire (140 words, Novice) | 72–85% |
| Deep grimoire, Adept | ~63% |
| Deep grimoire, Master | ~40% |
| Complete 180-word grimoire, Archmage | ~35% (Archivist: ~60%) |

```bash
node tools/validate.js     # word pool integrity
node tools/simulate.js 200 # full balance suite
```

## Project layout

```
index.html          the tome
css/tome.css        parchment, page-flips, cards, tiles, portrait layout
js/engine.js        pure game logic (browser + Node)
js/data/words.js    180 words, schools, signature spells, Words of Power
js/data/cards.js    128-card pool, energy costs, rarities, unlocks
js/data/relics.js   24 passive artifacts
js/data/events.js   10 choice encounters
js/data/classes.js  classes & difficulties
js/data/enemies.js  5 worlds of foes, packs + scaling knobs
js/main.js          screens, battle UI, map, forge, grimoire, daily
js/bestiary.js      SVG illuminated bestiary (33 foes, crests, glyphs)
js/particles.js     canvas FX (sparks, runes, novas, confetti)
js/sfx.js           synthesized WebAudio soundscape
js/save.js          localStorage persistence
tools/              validation & balance simulation
```

Progress (grimoire, unlocks, wins) persists in `localStorage`. Runs are resumable.
