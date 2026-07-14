# The Loom-Tongue — a complete grammar (second weaving)

Every spell in WORDLOOM is a word **assembled by rule** from this part list.
There is no word list anywhere in the game — the 4,788-word lexicon (1,510
visible, 3,278 hidden) is generated from this grammar, and learning the
grammar is learning the game. The grimoire's **85 public notes** read every
visible word; the hidden grammar (§8) is taught only by elder pages on the
road — and **every kind of part has an apocryphal counterpart** there.

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

## 3. The ten forms

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
| **Woven Union**| `LR + ET + ALT₂ + CENTER` | `IGNIETUNDORA` (12) — short: 11, grand: 13 |

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

## 4. The rules of the tongue

The grimoire's **rules** area holds four notes — the two euphony rules below
(the tongue's *lexical behaviours*), plus two laws of length:

- **Length is Power** — a word's tier is its length less three; every added
  rune deepens the magnitude (4 runes stir 5; 12 runes stir 52). Longer words
  need more, rarer tiles — that is the only price magic asks.
- **The Three Sizes** — center sizes move the woven forms' lengths: a Weave
  spans 6–8 runes, a Mirror 7–9, a Verse 8–10, a Sovereign 9–11; Cantrips are
  4, Words 5, Bound Words 6, Unions 11, Grand Unions 12, Woven Unions 11–13 —
  the deepest tier of all (13 runes stir 64).

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

(Substitute any other center for `ORA` in the last four columns — ten public
centers per element, so each element speaks 43 single-element words: 3 short
forms + 4 woven forms × 10 centers. 10 elements × 43 = 430, plus 90 Unions,
90 Grand Unions, and 900 Woven Unions (90 pairs × 10 centers) =
**1,510 visible words**.)

## 7. Why this shape

- **Deduction becomes linguistics.** A wordle `hit` on position 1–3 usually
  betrays the root; length betrays the form; the remaining letters betray the
  center. Every note you earn makes every future mystery word easier —
  *knowledge, not memorization, is the meta-progression.*
- **The grimoire records notes, not words.** Solving a mystery word inscribes
  the *parts* it is built from — its root, suffix, binder, center, form rule,
  even the Elision the first time you catch it at work. And solving is not
  the only teacher: **speaking any true word of the tongue** — improvising it
  from the loom, or offering it as a mystery guess, right or wrong — likewise
  inscribes its unknown parts. A word is **readable** (castable at full
  power) once every part it uses is in your notes. The entire collection is
  **85 notes**; 83 of them are load-bearing and together read all 1,510
  visible words (the two laws of length are pure lore). Speaking never
  teaches the deep form notes (Mirror, Verse, Sovereign, the Unions) —
  those come only from solving, elites, wardens, and the elder roads.
- **The cost curve is the spelling.** Long words need more (and rarer) tiles
  from the loom. `AQU` words always need a `Q`. Nothing else prices magic.
- **Improvisation is literacy.** Any grammatical word can be spoken at half
  power even if you never learned it — mastering the grammar itself has
  mechanical value. Inscription (full power, forever) comes only from solving.

## 8. The hidden grammar (design spoilers)

None of the following appears in any note, chip, guide, or grimoire page.
It is taught only by **elder pages** — rare doors on the road (roughly one
world in five carries one) that name a spelling once and record it nowhere
but in the save's secret knowledge. Every kind of word part has an
apocryphal counterpart — 18 secrets in all. (The road is merciful once:
three runs without committing an elder page guarantees the next run a
door.)

- **Elder spellings** (10) — every element has a secret third spelling of
  its root, and words woven from it run ×1.35 hotter: `FLA` (fire), `RIM`
  (frost), `SAX` (earth), `VEL` (air), `VIR` (venom), `TEM` (storm), `MAR`
  (water), `TEN` (shadow), `SOL` (light), `ANI` (vitality). FLA+A elides to
  **FLAE**; the whole ladder regenerates under each spelling.
- **The two elements beyond the ten** — `NIH` (Void: true damage that
  ignores natures and erodes max ink; its Word is **NIHIL**) and `CRU`
  (Blood: terrible damage that drains, but each casting costs your own ink;
  its Cantrip is **CRUX**, its Word **CRUOR**). Their letters seep faintly
  into the tile bag, which is why the rare `C` exists at all.
- **The three secret centers** (one per size) — `IZ` the Rift (short:
  its harm strikes true, ignoring every nature and ward), `AZA` the Mask
  (standard: ×1.25 and the foe's next trick dies in its throat), `ONZA`
  the Abyss (grand: ×1.15 and it gnaws the foe's utmost vigor). They wear
  all four woven forms on every element — `IGNIZIS`, `UMBRAZAS`,
  `AETHONZISA`... — and their letter `Z` reaches the tile bag only the way
  all hidden letters do: faintly.
- **The secret joiner** — `AC`, the Old Wedding, the elder "and". It weds
  every pair ET can (`IGNIACNIVUS`), and what AC joins runs ×1.2 closer.
- **The secret form** — the **Selfsame**: an element wedded to itself, its
  own late spelling after the long root, sealed with the medium suffix
  (`IGNICINUS`, `UMBRONOCIS`). Struck from the record; ×1.5 hot.
- **The secret rule** — **the Undivided Vowel**: the Scribe's Elision is a
  courtesy, not a law. Every visible word the Elision reshaped has a raw
  twin with its vowels standing (`GELAAS`, `VENOOX`, `TEREORRAA`), and the
  held breath runs ×1.25.

## 9. Validation

`node tools/genwords.js` regenerates the lexicon and asserts: exact
canonical forms, 4,788 unique words, correct lengths, no twin vowels survive
elision (save the Undivided twins, which must keep theirs), no triple
letters, no 4-consonant pileups — plus **combination coverage**: every
element uses all three suffix sizes, every public center wraps every element
in all four woven forms AND every blended pair, every element weds every
other both ways at all three blend forms, every length 4–13 exists, and
every kind of part has a weaving secret counterpart. `--dump` prints every
word with its meaning.
