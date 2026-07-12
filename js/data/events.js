/* ============================================================
 * LEXICON ARCANUM — Choice events (map encounters)
 * Outcomes are declarative; the game/sim applies them:
 *  gold, hp, maxHp, healPct, learnRandom (n), relicRandom,
 *  upgradeFree (n), removeFree, dupeCard, cardOffer (bonus),
 *  gamble {stake, winMult, chance}
 * ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.EventData = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const EVENTS = [
    {
      id: 'cursedlex', name: 'The Cursed Lexicon', icon: '📕',
      text: 'A book chained to a lectern, straining toward you. Its pages whisper words you don’t know yet — in your own voice.',
      choices: [
        { label: 'Read it', desc: 'Learn 2 random words · take 8 damage', fx: { learnRandom: 2, hp: -8 } },
        { label: 'Burn it', desc: '+30 aurum in melted chain-gold', fx: { gold: 30 } },
        { label: 'Leave it', desc: 'Some words can wait', fx: {} },
      ],
    },
    {
      id: 'scribe', name: 'The Wandering Scribe', icon: '🧙',
      text: 'A stooped figure with an overloaded satchel. “Relics, fresh relics! Dug from libraries best left unnamed.”',
      choices: [
        { label: 'Pay 45 aurum', desc: 'Receive a random relic', cost: 45, fx: { gold: -45, relicRandom: 1 } },
        { label: 'Rob him', desc: 'A relic — and a curse: −7 max HP', fx: { relicRandom: 1, maxHp: -7 } },
        { label: 'Trade gossip', desc: '+15 aurum for directions', fx: { gold: 15 } },
      ],
    },
    {
      id: 'inkimp', name: 'The Ink Imp’s Wager', icon: '👺',
      text: 'A grinning imp shuffles three inkpots. “Double or nothing, wordsmith. The pot never lies. Usually.”',
      choices: [
        { label: 'Bet 25 aurum', desc: '50%: win 55 · 50%: lose it', fx: { gamble: { stake: 25, win: 55, chance: 0.5 } } },
        { label: 'Bet 60 aurum', desc: '50%: win 135 · 50%: lose it', fx: { gamble: { stake: 60, win: 135, chance: 0.5 } } },
        { label: 'Decline', desc: 'The house always winks', fx: {} },
      ],
    },
    {
      id: 'altar', name: 'The Forgotten Altar', icon: '🗿',
      text: 'An altar to a god of erased names. It accepts one of two currencies: flesh, or time.',
      choices: [
        { label: 'Offer flesh', desc: '−6 max HP · gain a relic', fx: { maxHp: -6, relicRandom: 1 } },
        { label: 'Pray quietly', desc: 'Heal 35% of max HP', fx: { healPct: 0.35 } },
      ],
    },
    {
      id: 'mirrorpool', name: 'The Mirror Pool', icon: '🪞',
      text: 'Still water that shows your deck floating above your reflection. Ripples beckon.',
      choices: [
        { label: 'Reach in', desc: 'Duplicate a card of your choice', fx: { dupeCard: true } },
        { label: 'Stir the water', desc: 'Unbind a card of your choice, free', fx: { removeFree: true } },
        { label: 'Step away', desc: 'Reflections lie', fx: {} },
      ],
    },
    {
      id: 'forgesprite', name: 'The Forge-Sprite', icon: '🧚',
      text: 'A spark with opinions lands on your deck. “Ooh. OOH. Let me fix these. Please. PLEASE.”',
      choices: [
        { label: 'Allow it', desc: 'One random card upgraded, free', fx: { upgradeFree: 1 } },
        { label: 'Pay it 30 aurum', desc: 'TWO random cards upgraded', cost: 30, fx: { gold: -30, upgradeFree: 2 } },
        { label: 'Shoo it away', desc: 'It leaves a tip anyway: +10 aurum', fx: { gold: 10 } },
      ],
    },
    {
      id: 'wordwell', name: 'The Word-Well', icon: '⛲',
      text: 'A well that echoes back not your voice, but vocabulary. A sign reads: FEED ME SHINY.',
      choices: [
        { label: 'Toss 20 aurum', desc: 'Learn a random word', cost: 20, fx: { gold: -20, learnRandom: 1 } },
        { label: 'Drink deep', desc: 'Heal 25% of max HP', fx: { healPct: 0.25 } },
      ],
    },
    {
      id: 'djinn', name: 'The Bound Djinn', icon: '🧞',
      text: 'A djinn stuffed into a dictionary, only its eyes visible between entries for “obligation” and “obliteration”.',
      choices: [
        { label: 'Free it', desc: 'It grants a rare+ card (it chooses)', fx: { cardOffer: 1.0, cardAuto: true } },
        { label: 'Bargain', desc: 'Choose from 3 cards (rarity-boosted)', fx: { cardOffer: 0.5 } },
      ],
    },
    {
      id: 'choir', name: 'The Candle Choir', icon: '🕯️',
      text: 'Thirteen candles singing in a language you almost know. They harmonize on the word for “more”.',
      choices: [
        { label: 'Sing along', desc: 'Heal fully — the song mends', fx: { healPct: 1.0 } },
        { label: 'Take a candle', desc: 'A random relic (the song stops)', fx: { relicRandom: 1 } },
      ],
    },
    {
      id: 'archivistghost', name: 'The Archivist’s Ghost', icon: '👻',
      text: '“I catalogued every word here for four hundred years,” it sighs. “Test me. Or rob my shelves. Everyone does one or the other.”',
      choices: [
        { label: 'Ask for a lesson', desc: 'Learn a random word', fx: { learnRandom: 1 } },
        { label: 'Search the shelves', desc: '+25 aurum · take 5 damage from dust wraiths', fx: { gold: 25, hp: -5 } },
      ],
    },
  ];

  return { EVENTS };
});
