# The Loom-Tongue — a complete grammar (second weaving)

Every spell in WORDLOOM is a word **assembled by rule** from this part list.
There is no word list anywhere in the game — the 1,166-word lexicon (610
visible, 556 hidden) is generated from this grammar, and learning the grammar
is learning the game. The grimoire's **82 public notes** read every visible
word; the hidden grammar (§9) is taught only by elder pages on the road.

## 1. Elements (prefix roots)

Each element owns a 3-letter root, three suffixes (small/medium/large), and a
**connector** that binds its long forms. The element decides *what* a word does.

| element | root | alt (late) | small | medium | large | binder | combat identity |
|---------|------|-----------|-------|--------|-------|--------|-----------------|
| 🔥 Fire     | `IGN` | `CIN` | `-A` | `-US` | `-RIS` | `I` | damage + burning |
| ❄️ Frost    | `GEL` | `NIV` | `-U` | `-AS` | `-RIS` | `A` | damage + chills the foe's next blow |
| 🪨 Earth    | `TER` | `PET` | `-E` | `-RA` | `-RIA` | `E` | damage + stone (block) |
| 🌬️ Air      | `AER` | `AUR` | `-O` | `-IS` | `-IUM` | `TH`* | damage + the wind brings extra tiles |
| ☠️ Venom    | `VEN` | `TOX` | `-U` | `-OX` | `-XIA` | `O` | small bite + heavy poison |
| ⚡ Storm    | `FUL` | `TON` | `-O` | `-UR` | `-MEN` | `G` | wild damage (±40%), can stun |
| 💧 Water    | `AQU` | `UND` | `-A` | `-IS` | `-TUS` | `E` | damage + heals + washes curses away |
| 🌑 Shadow   | `UMB` | `NOC` | `-O` | `-IS` | `-TIS` | `R` | damage + blinds (foe misses 50%) |
| ✨ Light    | `LUM` | `LUX` | `-A` | `-EN` | `-NIS` | `I` | damage + **reveals mystery-word runes** |
| 💚 Vitality | `SAN` | `VIV` | `-A` | `-US` | `-TAS` | `I` | pure healing, cleansing, +max ink |

The **alt root** is the element's *late spelling* — how it is written when it
is wedded second into a blended word (§4).

\* **AER is irregular**: in long forms the R softens and the whole root becomes
`AETH` — the connector lives inside it. `AER+O → AERO`, but `AETH+ORA → AETHORA`.

Storm and Shadow bind with consonants, which produces the two most Latin
accidents in the language: `FUL+G+UR → FULGUR` and `UMB+R+IS → UMBRIS`.

## 2. Centers (shape modifiers)

Centers sit in the heart of woven words. They come in three sizes — **short
(2), standard (3), and grand (4)** — and the same four forms wrap around any
of them, so the same shape exists at several lengths (a short Weave is 6
runes; a grand Weave is 8). Length is power: shorter centers are cheaper to
spell and weaker; grand centers reach the deepest tiers.

| center | size | name | shape |
|--------|------|------|-------|
| `IX`   | short | the Needle  | piercing — ×1.6 against foes below a third of their ink |
| `UM`   | short | the Hush    | quelling — the foe's next trick (anything but a plain blow) is silenced |
| `ORA` | std | the Eye     | amplified — ×1.45 to everything the word does |
| `UMA` | std | the Veil    | warding — also grants stone worth 60% of its power |
| `OVA` | std | the Seed    | blooming — the effect echoes at half strength for 2 turns |
| `EXA` | std | the Scatter | scattering — strikes ALL foes at 70% |
| `ULO` | std | the Chain   | chaining — 40% chance to instantly recast itself, free |
| `AVA` | std | the Hunger  | draining — heals you for half the damage dealt |
| `ULTA` | grand | the Beyond | overreaching — harm beyond the kill spills onto the next foe |
| `ONDA` | grand | the Wave   | cresting — 45% of its harm washes over every other foe |

## 3. The nine forms

Length is power (tier = length − 3). Forms are named, not numbered, because
center size moves their lengths:

| form | assembly | fire example (std center) |
|------|----------|---------------------------|
| **Cantrip**    | `ROOT + small` | `IGNA` (4) |
| **Word**       | `ROOT + medium` | `IGNUS` (5) |
| **Bound Word** | `ROOT + binder + medium` | `IGNIUS` (6) |
| **Weave**      | `LR + CENTER` | `IGNIORA` (7) — short: `IGNIEX` (6), grand: `IGNIULTA` (8) |
| **Mirror**     | `LR + reverse(CENTER) + S` | `IGNIAROS` (8) |
| **Verse**      | `LR + CENTERstem + medium + CENTERvowel` | `IGNIORUSA` (9) |
| **Sovereign**  | `LR + CENTER + large` | `IGNIORARIS` (10) |
| **Union**      | `LR + ET + ALT₂ + medium₁` | `IGNIETUNDUS` (11) — fire *and* water |
| **Grand Union**| `LR + ET + ALT₂ + large₁` | `IGNIETUNDRIS` (12) |

- The **Mirror** reflects its center backwards and seals it with `S`.
  It also wards its speaker (small block rider).
- In the **Verse**, the center's *last vowel migrates to the end of the
  word*, and the medium suffix nests inside — so the Verse literally contains
  its element's Word, and echoes it after casting.
- The **Sovereign** is the full center plus the large suffix.
- The **Unions** wed two elements with the joiner `ET` ("and"): the second
  element appears late, in its ALT spelling, and the suffix stays true to the
  first element. Generic blends cast both elements' effects at ~65%; ten
  **signature pairs** fuse into named magic — Steam (fire+water, scalds),
  Magma, Shatter, Hail, Tempest, Eclipse, Miasma, Bloom, Wildfire, Dawn.

## 4. Euphony: two rules

**The Scribe's Elision** — twin vowels never touch; the second transmutes:

```
A→E   E→A   I→E   O→U   U→O
```

Applied in one left-to-right pass. Consonant doublings stand (see `TERRA`).

**The Easing Vowel** — when a binder's consonant would strike another
consonant (mirrors and verses of `UMBR-`, `FULG-`, `AETH-`), the element's
small vowel eases the joint: `UMB+R+XI+S` is written **UMBROXIS**.

Examples the rule produces:

- `GEL + A + AS` → ~~GELAAS~~ → **GELAES**
- `VEN + O + OX` → ~~VENOOX~~ → **VENOUX**
- `VEN + O + ORA` → ~~VENOORA~~ → **VENOURA**
- `TER + E + OR + RA + A` → ~~TEREORRAA~~ → **TEREORRAE** (the Verse of Earth —
  and an accidental Latin genitive)

## 5. Words the grammar finds on its own

Nothing below was hand-placed; the rules simply produce them:

`TERRA` (earth-Word) · `AQUA` (water-Cantrip) · `LUMEN` (light-Word) ·
`FULGUR` (storm-Bound) · `GELU` (frost-Cantrip) · `SANUS` (life-Word) ·
`UMBRIS` (shadow-Bound) · `AERIS` (air-Word) · `AQUEIS` (water-Bound)

## 6. Full ladders (the Eye, every element)

```
FIRE     IGNA   IGNUS   IGNIUS   IGNIORA   IGNIAROS   IGNIORUSA   IGNIORARIS
FROST    GELU   GELAS   GELAES   GELAORA   GELAEROS   GELAORASA   GELAORARIS
EARTH    TERE   TERRA   TERERA   TEREORA   TEREAROS   TEREORRAE   TEREORARIA
AIR      AERO   AERIS   AETHIS   AETHORA   AETHAROS   AETHORISA   AETHORAIUM
VENOM    VENU   VENOX   VENOUX   VENOURA   VENOAROS   VENOUROXA   VENOURAXIA
STORM    FULO   FULUR   FULGUR   FULGORA   FULGAROS   FULGORURA   FULGORAMEN
WATER    AQUA   AQUIS   AQUEIS   AQUEORA   AQUEAROS   AQUEORISA   AQUEORATUS
SHADOW   UMBO   UMBIS   UMBRIS   UMBRORA   UMBRAROS   UMBRORISA   UMBRORATIS
LIGHT    LUMA   LUMEN   LUMIEN   LUMIORA   LUMIAROS   LUMIORENA   LUMIORANIS
LIFE     SANA   SANUS   SANIUS   SANIORA   SANIAROS   SANIORUSA   SANIORATAS
```

(Substitute any other center for `ORA` in the last four columns — six centers
per element, so each element speaks 27 words: 3 short forms + 4 long forms × 6
centers. 10 elements × 27 = **270 words**.)

## 7. Why this shape

- **Deduction becomes linguistics.** A wordle `hit` on position 1–3 usually
  betrays the root; length betrays the form; the remaining letters betray the
  center. Every note you earn makes every future mystery word easier —
  *knowledge, not memorization, is the meta-progression.*
- **The grimoire records notes, not words.** Solving a mystery word inscribes
  the *parts* it is built from — its root, suffix, binder, center, form rule,
  even the Elision the first time you catch it at work. A word is **readable**
  (castable at full power) once every part it uses is in your notes. The
  entire collection is **64 notes**; together they read all 270 words.
- **The cost curve is the spelling.** Long words need more (and rarer) tiles
  from the loom. `AQU` words always need a `Q`. Nothing else prices magic.
- **Improvisation is literacy.** Any grammatical word can be spoken at half
  power even if you never learned it — mastering the grammar itself has
  mechanical value. Inscription (full power, forever) comes only from solving.

## 8. The hidden grammar (design spoilers)

None of the following appears in any note, chip, guide, or grimoire page.
It is taught only by **elder pages** — rare doors on the road that name a
spelling once and record it nowhere but in the save's secret knowledge.

- **Elder spellings** — every element has a secret third spelling of its
  root, and words woven from it run ×1.35 hotter: `FLA` (fire), `RIM`
  (frost), `SAX` (earth), `VEL` (air), `VIR` (venom), `TEM` (storm), `MAR`
  (water), `TEN` (shadow), `SOL` (light), `ANI` (vitality). FLA+A elides to
  **FLAE**; the whole ladder regenerates under each spelling.
- **The two elements beyond the ten** — `NIH` (Void: true damage that
  ignores natures and erodes max ink; its Word is **NIHIL**) and `CRU`
  (Blood: terrible damage that drains, but each casting costs your own ink;
  its Cantrip is **CRUX**, its Word **CRUOR**). Their letters seep faintly
  into the tile bag, which is why the rare `C` exists at all.

## 9. Validation

`node tools/genwords.js` regenerates the lexicon and asserts: exact
canonical forms, 270 unique words, correct lengths, no twin vowels survive
elision, no triple letters, no 4-consonant pileups. `--dump` prints every word
with its meaning.
