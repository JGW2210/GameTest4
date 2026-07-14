# The Loom-Tongue — a complete grammar

Every spell in WORDLOOM is a word **assembled by rule** from this part list.
There is no word list anywhere in the game — the 270-word lexicon is generated
from this grammar, and learning the grammar is learning the game.

## 1. Elements (prefix roots)

Each element owns a 3-letter root, three suffixes (small/medium/large), and a
**connector** that binds its long forms. The element decides *what* a word does.

| element | root | small | medium | large | connector | combat identity |
|---------|------|-------|--------|-------|-----------|-----------------|
| 🔥 Fire     | `IGN` | `-A` | `-US` | `-RIS` | `I` | damage + burning |
| ❄️ Frost    | `GEL` | `-U` | `-AS` | `-RIS` | `A` | damage + chills the foe's next blow (−35%) |
| 🪨 Earth    | `TER` | `-E` | `-RA` | `-RIA` | `E` | damage + stone (block) |
| 🌬️ Air      | `AER` | `-O` | `-IS` | `-IUM` | `TH`* | damage + the wind brings extra tiles |
| ☠️ Venom    | `VEN` | `-U` | `-OX` | `-XIA` | `O` | small bite + heavy poison |
| ⚡ Storm    | `FUL` | `-O` | `-UR` | `-MEN` | `G` | wild damage (±40%), can stun |
| 💧 Water    | `AQU` | `-A` | `-IS` | `-TUS` | `E` | damage + heals + washes curses away |
| 🌑 Shadow   | `UMB` | `-O` | `-IS` | `-TIS` | `R` | damage + blinds (foe misses 50%) |
| ✨ Light    | `LUM` | `-A` | `-EN` | `-NIS` | `I` | damage + **reveals mystery-word runes** |
| 💚 Vitality | `SAN` | `-A` | `-US` | `-TAS` | `I` | pure healing, cleansing, +max hp |

\* **AER is irregular**: in long forms the R softens and the whole root becomes
`AETH` — the connector lives inside it. `AER+O → AERO`, but `AETH+ORA → AETHORA`.

Storm and Shadow bind with consonants, which produces the two most Latin
accidents in the language: `FUL+G+UR → FULGUR` and `UMB+R+IS → UMBRIS`.

## 2. Centers (shape modifiers)

Centers sit in the heart of long words (7+ letters). They are always
**vowel–consonant–vowel** so they can survive mirroring and vowel migration.
The center decides the *shape* of the magic.

| center | name | shape |
|--------|------|-------|
| `ORA` | the Eye     | amplified — ×1.45 to everything the word does |
| `UMA` | the Veil    | warding — also grants stone worth 60% of its power |
| `OVA` | the Seed    | blooming — the effect echoes at half strength for 2 turns |
| `EXA` | the Scatter | scattering — strikes ALL foes at 70% |
| `ULO` | the Chain   | chaining — 40% chance to instantly recast itself, free |
| `AVA` | the Hunger  | draining — heals you for half the damage dealt |

## 3. The seven forms

Length is power. The suffix *is* the magnitude tier, and the assembly rule
changes at every length:

| len | form | assembly | fire example |
|-----|------|----------|--------------|
| 4  | **Cantrip**    | `ROOT + small` | `IGNA` |
| 5  | **Word**       | `ROOT + medium` | `IGNUS` |
| 6  | **Bound Word** | `ROOT + conn + medium` | `IGNIUS` |
| 7  | **Weave**      | `ROOT + conn + CENTER` | `IGNIORA` |
| 8  | **Mirror**     | `ROOT + conn + reverse(CENTER) + S` | `IGNIAROS` |
| 9  | **Verse**      | `ROOT + conn + CENTERstem + medium + CENTERvowel` | `IGNIORUSA` |
| 10 | **Sovereign**  | `ROOT + conn + CENTER + large` | `IGNIORARIS` |

- The **Mirror** (8) reflects its center backwards and seals it with `S`.
  It also wards its speaker (small block rider).
- In the **Verse** (9), the center's final vowel *migrates to the end of the
  word*, and the medium suffix nests inside — so the Verse literally contains
  its element's Word, and echoes it after casting.
- The **Sovereign** (10) is the full center plus the large suffix: the biggest
  numbers in the language.

## 4. The Scribe's Elision (sandhi)

When assembly seats two **identical vowels** side by side, the second
transmutes:

```
A→E   E→A   I→E   O→U   U→O
```

Applied in one left-to-right pass. Consonant doublings stand (see `TERRA`).

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

## 8. Validation

`node tools/genwords.js` regenerates the lexicon and asserts: exact
canonical forms, 270 unique words, correct lengths, no twin vowels survive
elision, no triple letters, no 4-consonant pileups. `--dump` prints every word
with its meaning.
