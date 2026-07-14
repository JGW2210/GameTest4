# 📖 Lexicon Arcanum

A roguelike deckbuilder where **every spell is a word**. Battle through five worlds by
playing cards for *energy* and *insight*, then spending insight to guess Latin-esque
mystery words, Wordle-style. Words you guess correctly are **engraved in your grimoire
forever** — across runs — and auto-cast instantly whenever they reappear.

**Play it:** open `lexicon-arcanum/index.html` in any modern browser (no build
step, no dependencies), or serve the repo statically and visit
`/lexicon-arcanum/`. Desktop and portrait/mobile layouts included.

> On this branch the repo root serves **WORDLOOM**, the ground-up rebuild
> prototype (see the root `README.md`); this original game lives here,
> complete and playable.

---

## How it plays

- **The tome.** The whole game is viewed through a magic tome — pages flip as you move
  between the map, battles, the forge and your grimoire. Original SVG "illuminated
  bestiary" art for every foe; a fully synthesized WebAudio soundscape (no asset files).
- **Battles.** Each turn you get **3⚡ energy** and draw cards (class-dependent; the
  opening hand draws 2 extra) into a hand of up to 8. Cards cost ⚡ and attack, ward,
  buff, debuff — and most grant **💡 insight**. Some encounters field **packs of
  foes** — click a foe to aim.
- **Every card is a decision.** Unspent ⚡ **crystallizes into 💡** at end of turn, so
  dumping the hand competes with guessing. The night keeps only **5 pages** — end a
  turn with more and you choose what to shed — but cards **held across turns hone
  themselves** (+1 to their primary effect per turn, up to +3). Alternating attack
  and skill cards strikes a **Flow** (+2 to the next card's effect).
- **Elements.** Fire 🔥, Frost ❄️, Venom ☠️, Storm ⚡ — many cards and spells carry
  one, and foes have natures: **weak ×1.5, resistant ×0.5, immune ×0** (immunity
  silences elemental burns and poisons too). The imps of the Cinder Peaks do not
  fear fire. Bring frost.
- **Postures.** Some foes fight back against *how* you play: **Retaliation** 🗡
  counterstrikes every card beyond your 2nd each turn, **Parry** 🤺 negates the first
  attack card each turn (lead with something else), **Ink-Drinker** 🩸 heals whenever
  you play a 0⚡ card.
- **The mystery word.** Every battle serves a mystery word of your chosen length
  (5–10 runes). Guesses cost insight — and **every correct guess raises the cost of
  further guesses by 1 for the rest of that turn** (resets next turn), so chaining
  casts gets expensive fast. Tome-casts, free guesses and resonance bypass the
  surcharge — building around them is what makes or breaks a run.
  Green = right rune, right place; yellow = right rune, wrong place; grey = absent.
- **No deduction is wasted.** An unsolved mystery word — its grid, scries and
  reveals — **follows you to the next battle**. Learned words consistent with the
  feedback appear as **tap-to-guess chips**, so the grimoire does the typing.
- **Streaks.** Correct guesses on consecutive turns chain: +1 💡, then +1 ⚡, then a
  free scry, then spells ×1.15 while the streak holds.
- **Scry.** Once per turn, freely ask the tome whether a chosen letter is in the word —
  right-click / long-press any keyboard letter to scry it instantly.
- **Casting.** Guess the word → its spell casts. **First-guess casts are ×1.5.**
- **Engraving & resonance.** Correct words are learned *permanently* — across runs.
  Learned words stay in the serving pool, and **every guess you make carries a 35%
  chance that a known mystery word fires itself from its engraving** (then a fresh
  word is served). Relics and a card push resonance well past 35%. Know *every* word
  of a length and new words come with free revealed runes (base 1, up to 3 with
  relics, always capped so deduction still matters).
- **Schools & combos.** Every word belongs to a school (Astral ✦, Aegian ⛨, Ignium 🔥,
  Pestis ☠, Sanguine 🩸, Umbral 🌑, Mentis 🧠, Fulmen ⚡). Casting multiple words of a
  school in one battle triggers escalating combos.
- **Attunement.** Weaving *different word lengths* in one battle grants tiered boons —
  insight, might, and **+max ⚡** — plus bonus aurum. Variety pays.
- **Words of Power.** One secret word per length casts at **×2**. Discover them.
- **Signature spells.** ~40 notable words carry hand-authored identities (★): IGNIS
  burns every foe, UMBRA blinds, MORTIS executes the dying, OMNIPOTENS swells your
  energy reserves…
- **Insight carries over between turns** within a battle, but is **capped at 10 and
  resets every battle** — no cross-battle hoarding. Energy refreshes each turn and
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
| 🔔 **The Echoist** | 60% resonance, insight caps at 6. Unlocked by discovering 2 Words of Power. |
| 🗡️ **The Inkblade** | Every spell cast sharpens attack cards +2 this battle. Unlocked by winning with the Warmage. |
| 🜁 **The Elementalist** | Elemental cards & spells ×1.3; starts with all four bolts. Unlocked by winning on Adept. |
| 📜 **The Archivist** | +5 insight/turn, draws 1 (always a Cast Tome), casts learned spells at a discount and ×1.4. Unlocked by winning with all other classes. |

## The run

5 world tiers × 6 stages — and after every boss, **choose between two worlds**: the
storied road or a riskier alternate (the Drowned Orchard, the Glass Desert, the Moth
Court, the Margin Abyss — 28 new foes) with more elites and richer spoils. Every world
turns under a rolled **Page Condition** (Inkstorm, Dead Silence, Heavy Ink…), and each
battle favors a **resonant school** (×1.3). Maps hold battles (some with multi-foe packs),
elites (**guaranteed relic drops**), treasure, whispering shrines, **strange
encounters** (10 choice events — cursed lexicons, ink-imp wagers, bound djinn…), and a
world boss. The **Arcane Forge** is always reachable from the map: upgrade cards (×1.5
effects) or unbind them.

- **144 cards** across common (65%) / uncommon (25%) / rare (8%) / legendary (2%),
  including energy-ramp cards (Leyline Binding, Grand Conduit, Aeon Engine) and 4–5⚡
  endgame bombs (The Omnilex, PENULTIMA). 17 cards are **unlockable** via achievements.
- **AETHERIA** — the red ultimate rarity. Eight raw-power cards (Aetheric Lance,
  Clock of Unhours, Crown of the Unwritten…) that only appear from **World 3 onward
  on Adept difficulty or higher** — and every W3+ boss there offers one. A late-run
  lifeline for decks that never found their synergy.
- **28 relics** in two rarity tiers (rarer tier rolls 3× less often) — Coal of the
  First Word (+1 max ⚡), Resonant Bell / Choir of Echoes (+10/20% resonance),
  Lexicographer's Monocle / Index of All Things (+1/+2 mastered-length reveals)…
- **Prepared Sigils** — slot up to 3 learned words before battle: +20% resonance and
  a revealed rune when served.
- **Word Inscription** — at the forge, permanently bind a learned word onto a card;
  it carries 40% of the spell forever. Your grimoire is crafting material. During a
  battle whose **resonant hour matches the inscribed word's school, the card costs
  1⚡ less** — an inscribed deck bends whole battles around itself.
- **Daily Challenge** — a date-seeded run (same class, seed and difficulty for
  everyone that day) with a shareable emoji result.
- **The Chronicle** — a stats page in the tome: wins, streak records, guess
  distributions per length, spiral depth, forbidden masteries.

## Secrets & endgame

- **Words of Power murmurs** — shrines whisper riddle-hints toward the six ×2 words.
- **THE UNWRITTEN** — cast all 6 Words of Power in one run and a secret 6th world
  tears open behind the final boss, ending in THE UNWRITTEN ONE and the true ending.
- **The Forbidden Word** — one of five 11-letter words is bound to each run. Gather
  all four torn fragments (shrines, treasures) to learn it. You may speak it **once**
  per run: truth is devastation (120 AoE, total erasure, the End of Dreams…); error
  **sews your mouth shut** — no guesses, no tomes, no spells, for the rest of the run.
- **The Endless Spiral** — after victory, descend into World 6+ with compounding
  scaling and chase your deepest chronicle entry.

Four difficulties (Novice → Archmage). Scaling is deliberately steep: **words learned
in dying runs power your future runs.**

## Balance methodology

Tuned by simulation: `tools/simulate.js` plays *complete runs* headlessly on the
**exact engine + data the game ships** (`js/engine.js` is dual-environment), with
novice/adept/veteran cognition models for the word-guessing — and a v4-aware card
policy (elemental targeting, posture counterplay, flow ordering, energy conversion).
Final targets (300 runs/config, v4):

| Scenario | Win rate |
|---|---:|
| Fresh grimoire, first runs (Novice) | ~1% even for a *perfectly disciplined* sim player |
| Deep grimoire (140 words, Novice) | 10–18% generic decks · **~37% tome-synergy (Archivist)** |
| Complete 180-word grimoire (Novice) | ~25% |
| Higher difficulties | Adept/Master/Archmage 1–2% for generic decks (Aetheria cards keep them off zero); synergy builds dominate — Archivist reaches ~25% on Archmage |

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
js/data/cards.js    144-card pool, energy costs, elements, rarities, unlocks
js/data/relics.js   24 passive artifacts
js/data/events.js   10 choice encounters
js/data/classes.js  classes & difficulties
js/data/enemies.js  9 worlds of foes (5 tiers + alternates + secret), natures & postures, scaling
js/data/arcana.js   forbidden words, page conditions, murmurs
js/main.js          screens, battle UI, map, forge, grimoire, daily
js/bestiary.js      SVG illuminated bestiary (33 foes, crests, glyphs)
js/particles.js     canvas FX (sparks, runes, novas, confetti)
js/sfx.js           synthesized WebAudio soundscape
js/save.js          localStorage persistence
tools/              validation & balance simulation
```

Progress (grimoire, unlocks, wins) persists in `localStorage`. Runs are resumable.
