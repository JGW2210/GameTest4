/* ============================================================
 * WORDLOOM — Events on the road
 * Ordinary events trade and tempt. SECRET events teach the hidden
 * grammar: elder spellings of the roots, the two elements that are
 * not spoken of, the three secret centers, the old joiner AC, and
 * the Selfsame form. Secret knowledge never appears in notes, chips,
 * or guides — only in the moment it is given.
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.LoomEvents = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* Ordinary events: two choices each, declarative fx. */
  const EVENTS = [
    {
      id: 'inkwell', icon: '🫙', title: 'A Brimming Inkwell',
      text: 'Someone left it uncorked in the margin. It has not dried. It is watching you.',
      choices: [
        { label: 'Drink deep', desc: 'Recover 16 ink — but the first mystery next battle serves one length longer.', fx: { heal: 16, curse: 'longmystery' } },
        { label: 'Bottle it', desc: '+1 sweep in every battle this run.', fx: { mulligans: 1 } },
      ],
    },
    {
      id: 'pedlar', icon: '🎒', title: 'The Letter-Pedlar',
      text: 'A stooped figure with a coat lined in tiles. "Common stock, uncommon prices."',
      choices: [
        { label: 'Buy vowels (pay 8 ink)', desc: 'Your letter bag runs rich with vowels this run.', fx: { hp: -8, vowelRich: 1 } },
        { label: 'Haggle for the loom', desc: '+1 tray tile, but the pedlar takes 5 ink for insolence.', fx: { hp: -5, tray: 1 } },
      ],
    },
    {
      id: 'proofreader', icon: '🧐', title: 'The Blind Proofreader',
      text: '"I cannot see the words anymore," she says, "but I remember how they are MADE."',
      choices: [
        { label: 'Listen', desc: 'She attunes an element to your loom — a new one, if she knows any you do not.', fx: { element: 1 } },
        { label: 'Read to her', desc: 'She weeps. Recover 10 ink; your next two mysteries start with a rune revealed.', fx: { heal: 10, revealNext: 2 } },
      ],
    },
    {
      id: 'turner', icon: '🪢', title: 'The Bobbin-Turner',
      text: 'A lathe of black walnut, and a woman who speaks only in spirals. Her wares click softly against each other.',
      choices: [
        { label: 'Buy a wound vessel (pay 8 ink)', desc: 'A word-part from your notes, pre-wound and ready to speak.', fx: { hp: -8, bobbin: 1 } },
        { label: 'Take a spare vessel', desc: 'An empty bobbin. Aim it at any part you know and wind its letters thrice to capture it.', fx: { vessel: 1 } },
      ],
    },
    {
      id: 'notcher', icon: '🧺', title: 'The Notcher of Frames',
      text: 'He measures your loom\'s frame with a knotted cord, tutting at what he finds.',
      choices: [
        { label: 'Let him carve (pay 6 ink)', desc: '+1 shuttle notch — one more tile may ride with you.', fx: { hp: -6, shuttleSlot: 1 } },
        { label: 'Decline politely', desc: 'Recover 8 ink. He leaves a card you cannot read.', fx: { heal: 8 } },
      ],
    },
    {
      id: 'palimpsest', icon: '📜', title: 'A Scraped Palimpsest',
      text: 'Beneath the visible text, an older hand. Beneath that hand, an older one still.',
      choices: [
        { label: 'Scrape deeper', desc: 'An element stirs beneath the older hand — but it costs 12 ink to breathe the dust.', fx: { hp: -12, element: 1 } },
        { label: 'Leave it be', desc: 'Some pages want to stay buried. Recover 6 ink for your restraint.', fx: { heal: 6 } },
      ],
    },
  ];

  /* Secret events: each teaches one piece of hidden grammar.
   * They surface only on ELDER nodes (off-path forks) and never repeat
   * knowledge already held. The wording NAMES the spelling once —
   * blink and you miss it; it is recorded nowhere. */
  const SECRET_EVENTS = [
    { id: 's_ign', teaches: 'sroot:ign', icon: '🕯', title: 'The Charred Page',
      text: 'A page burned to lace, yet one word survives in the scorch, older than IGN: the fire that was first written <b>FLA</b>. Say it softly. It says itself back.' },
    { id: 's_gel', teaches: 'sroot:gel', icon: '🧊', title: 'Breath on the Glass',
      text: 'Frost ferns crawl across the pane and spell, in a hand nobody living writes, the elder cold: <b>RIM</b>. The ferns melt. Your memory does not.' },
    { id: 's_ter', teaches: 'sroot:ter', icon: '⛰', title: 'The Fossil Sentence',
      text: 'Pressed into the stone itself, letter by letter across an age: <b>SAX</b>. The mountains have always known how to spell themselves.' },
    { id: 's_aer', teaches: 'sroot:aer', icon: '🪁', title: 'What the Kite Heard',
      text: 'A child\'s kite, tangled in the rafters, its tail knotted with prayer-strips. One reads: before AER, the wind signed its name <b>VEL</b>.' },
    { id: 's_ven', teaches: 'sroot:ven', icon: '🐍', title: 'The Apothecary\'s Shame',
      text: 'A ledger of poisons, every entry struck through — except the oldest, underlined thrice: <b>VIR</b>. Some spellings are kept off the shelves for a reason.' },
    { id: 's_ful', teaches: 'sroot:ful', icon: '🌩', title: 'The Split Bell',
      text: 'Lightning found this bell tower twice. On the bell\'s cracked lip, fused in bright metal, the storm left its elder signature: <b>TEM</b>.' },
    { id: 's_aqu', teaches: 'sroot:aqu', icon: '🌊', title: 'The Tide-Drowned Psalter',
      text: 'A hymnal rescued from a flooded crypt. Every water-word has washed away except one, which has instead grown DEEPER into the vellum: <b>MAR</b>.' },
    { id: 's_umb', teaches: 'sroot:umb', icon: '🕳', title: 'The Shadow of a Word',
      text: 'A word was scraped off this wall long ago — but its shadow stayed. Traced at dusk it reads <b>TEN</b>. Do not trace it at midnight.' },
    { id: 's_lum', teaches: 'sroot:lum', icon: '🌞', title: 'The Gilded Initial',
      text: 'An illuminated capital so bright it lights the room. Inside its gold-leaf coils, minute and patient: the light\'s elder name, <b>SOL</b>.' },
    { id: 's_san', teaches: 'sroot:san', icon: '🌿', title: 'The Physician\'s Last Note',
      text: 'His final prescription, written for himself, unfilled: "for what ails all of us — <b>ANI</b>, spoken with intent." He lived to ninety anyway.' },
    { id: 's_iz', teaches: 'scenter:iz', icon: '🕳', title: 'The Torn Stitch',
      text: 'A tapestry with one thread pulled clean through, and the hole it left will not close. Sewn around the wound, tiny as pain: <b>IZ</b> — a center that rends. What it strikes, nothing wards.' },
    { id: 's_aza', teaches: 'scenter:aza', icon: '🎭', title: 'The Second Face',
      text: 'A mummer\'s mask, left face-down. Its inside is another face. Painted where a mouth would press against yours: <b>AZA</b> — the center that masks. The word wears another face, and the foe\'s next trick dies in its throat.' },
    { id: 's_onza', teaches: 'scenter:onza', icon: '⚫', title: 'The Sounding Line', deep: true,
      text: 'A well with no bottom, and a rope with no end, and a knot every fathom spelling the same four runes: <b>ONZA</b> — the grand center that devours. It gnaws at what a foe may ever be again.' },
    { id: 's_ac', teaches: 'sjoin:ac', icon: '🗝', title: 'The Elder Vow', deep: true,
      text: 'Two rings rusted into one on a chapel floor, and beneath them the vow that fused them — not ET, the wedding everyone speaks, but the old word: <b>AC</b>. What AC joins runs closer, and hotter, than ET ever dared.' },
    { id: 's_twin', teaches: 'srule:twin', icon: '👥', title: 'The Held Breath', deep: true,
      text: 'A choirbook, and in it a hymn no choir finished — every doubled vowel left standing, unelided, like a breath held past bearing. GELAAS, it sings, not GELAES. The Scribe\'s Elision is a courtesy, the margin explains, <b>not a law</b>. Words that keep their twin vowels undivided run hotter for the strain.' },
    { id: 's_selfsame', teaches: 'sform:selfsame', icon: '𝔉', title: 'The Mirror Marriage', deep: true,
      text: 'A marriage record with one name written twice, in two different hands. The register calls the form <b>Selfsame</b>: an element wedded to itself — its long root, then its own late spelling, then its medium suffix. IGNICINUS. The church struck it from the record. The grammar did not.' },
    { id: 's_nih', teaches: 'selem:nih', icon: '⬛', title: 'The Unwritten Margin', deep: true,
      text: 'A margin with nothing in it. TRULY nothing — the paper is gone, the light is gone. From inside the absence a grammar teaches itself to you: <b>NIH</b>, the Void root; <b>-A</b>, <b>-IL</b>, <b>-ORS</b> its suffixes; <b>I</b> its binder. NIHIL. You wish you could forget it.' },
    { id: 's_cru', teaches: 'selem:cru', icon: '🩸', title: 'The Red Colophon', deep: true,
      text: 'The scribe signed this book in his own blood, and the signature is still wet after four hundred years. It teaches as it dries anew: <b>CRU</b>, the Blood root; <b>-X</b>, <b>-OR</b>, <b>-STA</b> its suffixes; <b>E</b> its binder. CRUOR. The book considers you signed.' },
  ];

  return { EVENTS, SECRET_EVENTS };
});
