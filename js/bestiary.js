/* ============================================================
 * LEXICON ARCANUM — the illuminated bestiary
 * Hand-drawn-style inline SVG marks for every foe, class crests
 * and map glyphs. Ink on parchment, consistent across platforms.
 * ============================================================ */
(function () {
  const INK = '#2e2216';
  const INK2 = '#5a4326';
  const GOLD = '#b8912f';
  const ARC = '#6a4bb8';
  const RED = '#8c2c22';

  // Medallion wrapper: ring + inner parchment tint
  function medallion(body, tint) {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="${tint || 'rgba(255,250,235,0.5)'}" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="41" fill="none" stroke="${GOLD}" stroke-width="1.4" stroke-dasharray="3 4" opacity="0.85"/>
      <g stroke-linecap="round" stroke-linejoin="round">${body}</g>
    </svg>`;
  }
  const S = (extra) => `fill="none" stroke="${INK}" stroke-width="3" ${extra || ''}`;
  const F = (color) => `fill="${color || INK}" stroke="none"`;

  const FOES = {
    /* ---- World 1: Whispering Woods ---- */
    thornling: medallion(`
      <path d="M50 78 V42" ${S()}/>
      <path d="M50 62 C38 58 34 46 36 38 C46 42 50 50 50 58" ${F('#4a6b34')}/>
      <path d="M50 54 C62 50 66 38 64 30 C54 34 50 42 50 50" ${F('#5a7d3e')}/>
      <path d="M43 70 L36 66 M57 66 L64 61" ${S('stroke-width="2.5"')}/>
      <circle cx="50" cy="34" r="4" ${F('#4a6b34')}/>`),
    inkmoth: medallion(`
      <path d="M50 36 C30 18 16 32 24 46 C32 58 44 52 50 44 Z" ${F('#3a2c4e')}/>
      <path d="M50 36 C70 18 84 32 76 46 C68 58 56 52 50 44 Z" ${F('#493763')}/>
      <path d="M50 34 C34 44 30 60 38 68 C44 72 48 62 50 52 Z" ${F('#493763')}/>
      <path d="M50 34 C66 44 70 60 62 68 C56 72 52 62 50 52 Z" ${F('#3a2c4e')}/>
      <ellipse cx="50" cy="46" rx="4" ry="12" ${F(INK)}/>
      <path d="M46 32 L42 24 M54 32 L58 24" ${S('stroke-width="2"')}/>
      <circle cx="41" cy="38" r="2.5" ${F('#d8c8a2')}/><circle cx="59" cy="38" r="2.5" ${F('#d8c8a2')}/>`),
    mosswolf: medallion(`
      <path d="M28 62 C26 44 38 30 50 30 C62 30 74 44 72 62 L64 56 C62 66 56 70 50 70 C44 70 38 66 36 56 Z" ${F('#4c5840')}/>
      <path d="M34 34 L40 22 L46 32 M66 34 L60 22 L54 32" ${F('#4c5840')}/>
      <circle cx="42" cy="48" r="3.5" ${F('#e8d9b0')}/><circle cx="58" cy="48" r="3.5" ${F('#e8d9b0')}/>
      <path d="M50 56 L46 62 H54 Z" ${F(INK)}/>
      <path d="M30 58 C34 60 36 62 38 66 M70 58 C66 60 64 62 62 66" ${S('stroke-width="2" stroke="#6b7d54"')}/>`),
    sprigwitch: medallion(`
      <path d="M30 44 L70 44 L52 20 Z" ${F('#3f3126')}/>
      <path d="M26 46 H74" ${S('stroke-width="4"')}/>
      <circle cx="50" cy="56" r="12" ${F('#d9c49a')}/>
      <circle cx="45" cy="54" r="2" ${F(INK)}/><circle cx="55" cy="54" r="2" ${F(INK)}/>
      <path d="M44 62 C48 66 52 66 56 62" ${S('stroke-width="2"')}/>
      <path d="M68 46 V78 M68 54 L76 48 M68 62 L76 58" ${S('stroke="#5a7d3e"')}/>`),
    owlsage: medallion(`
      <path d="M32 30 C24 44 26 66 50 74 C74 66 76 44 68 30 L58 38 H42 Z" ${F('#5d4a2f')}/>
      <circle cx="41" cy="48" r="9" ${F('#e8d9b0')}/><circle cx="59" cy="48" r="9" ${F('#e8d9b0')}/>
      <circle cx="41" cy="48" r="4" ${F(INK)}/><circle cx="59" cy="48" r="4" ${F(INK)}/>
      <path d="M50 52 L46 60 H54 Z" ${F(GOLD)}/>
      <path d="M34 30 L28 20 M66 30 L72 20" ${S()}/>
      <path d="M42 66 C46 70 54 70 58 66" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>`),
    briarhulk: medallion(`
      <path d="M30 72 C22 58 26 40 40 34 C48 24 62 26 68 36 C78 44 78 60 70 72 Z" ${F('#41522f')}/>
      <path d="M36 40 L30 32 M50 32 L48 22 M64 38 L70 28 M28 56 L18 52 M74 54 L82 48" ${S('stroke-width="2.5" stroke="#41522f"')}/>
      <circle cx="42" cy="52" r="3" ${F('#ffcf5c')}/><circle cx="60" cy="52" r="3" ${F('#ffcf5c')}/>
      <path d="M40 64 H62" ${S('stroke-width="3" stroke="#2c3a1e"')}/>`),
    grovemaw: medallion(`
      <path d="M24 46 C24 30 40 24 50 24 C60 24 76 30 76 46 C76 54 70 58 66 58 L62 50 L56 58 L50 50 L44 58 L38 50 L34 58 C30 58 24 54 24 46 Z" ${F('#3e5230')}/>
      <path d="M28 62 C34 74 66 74 72 62 C66 66 34 66 28 62 Z" ${F('#3e5230')}/>
      <circle cx="40" cy="38" r="3.5" ${F('#ffcf5c')}/><circle cx="60" cy="38" r="3.5" ${F('#ffcf5c')}/>
      <path d="M20 42 C16 38 16 32 20 28 M80 42 C84 38 84 32 80 28" ${S('stroke="#5a7d3e" stroke-width="2.5"')}/>`, 'rgba(220,235,205,0.45)'),

    /* ---- World 2: Sunken Catacombs ---- */
    drownedscribe: medallion(`
      <path d="M34 74 C30 50 36 32 50 30 C64 32 70 50 66 74 C60 70 40 70 34 74 Z" ${F('#3d4a56')}/>
      <path d="M42 46 C44 42 48 40 50 40 C52 40 56 42 58 46 C56 50 52 52 50 52 C48 52 44 50 42 46 Z" ${F('#1e262e')}/>
      <circle cx="46" cy="46" r="1.8" ${F('#9fd0d8')}/><circle cx="54" cy="46" r="1.8" ${F('#9fd0d8')}/>
      <circle cx="66" cy="30" r="3" ${S('stroke-width="2" stroke="#7fb0ba"')}/>
      <circle cx="72" cy="22" r="2" ${S('stroke-width="1.6" stroke="#7fb0ba"')}/>
      <path d="M40 62 C46 58 54 58 60 62" ${S('stroke-width="2" stroke="#7fb0ba"')}/>`),
    boneabbot: medallion(`
      <path d="M38 34 L50 16 L62 34 Z" ${F('#cbb98a')}/>
      <circle cx="50" cy="48" r="14" ${F('#ded0ac')}/>
      <circle cx="44" cy="46" r="3.5" ${F(INK)}/><circle cx="56" cy="46" r="3.5" ${F(INK)}/>
      <path d="M46 56 H54 M47 56 V60 M50 56 V61 M53 56 V60" ${S('stroke-width="1.8"')}/>
      <path d="M36 70 C42 64 58 64 64 70" ${S('stroke-width="3.5"')}/>
      <path d="M50 22 V28 M47 25 H53" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>`),
    silthag: medallion(`
      <ellipse cx="50" cy="42" rx="16" ry="14" ${F('#4c5566')}/>
      <circle cx="44" cy="40" r="4" ${F('#c8d8e0')}/><circle cx="56" cy="40" r="4" ${F('#c8d8e0')}/>
      <circle cx="44" cy="40" r="1.6" ${F(INK)}/><circle cx="56" cy="40" r="1.6" ${F(INK)}/>
      <path d="M36 52 C32 62 30 70 26 74 M44 54 C42 64 42 72 38 78 M56 54 C58 64 58 72 62 78 M64 52 C68 62 70 70 74 74" ${S('stroke-width="3.4" stroke="#4c5566"')}/>`),
    rustgolem: medallion(`
      <rect x="34" y="30" width="32" height="28" rx="4" ${F('#6e5238')}/>
      <rect x="28" y="58" width="44" height="16" rx="4" ${F('#5d4530')}/>
      <circle cx="43" cy="42" r="3.5" ${F('#ffb347')}/><circle cx="57" cy="42" r="3.5" ${F('#ffb347')}/>
      <path d="M40 30 L38 22 M60 30 L62 22" ${S()}/>
      <path d="M38 50 H62 M46 58 V74 M54 58 V74" ${S('stroke-width="2" stroke="#3d2c1c"')}/>
      <path d="M34 36 L30 40 M66 34 L70 38" ${S('stroke-width="2" stroke="#8a6a3a"')}/>`),
    choirless: medallion(`
      <path d="M30 70 C28 54 32 44 38 42 C44 44 46 54 44 70 Z" ${F('#4a4256')}/>
      <path d="M43 72 C41 52 45 40 50 38 C55 40 59 52 57 72 Z" ${F('#5a5168')}/>
      <path d="M56 70 C54 54 58 44 62 42 C68 44 72 54 70 70 Z" ${F('#4a4256')}/>
      <ellipse cx="38" cy="50" rx="2" ry="3" ${F(INK)}/>
      <ellipse cx="50" cy="46" rx="2" ry="3" ${F(INK)}/>
      <ellipse cx="62" cy="50" rx="2" ry="3" ${F(INK)}/>`),
    reliquary: medallion(`
      <rect x="30" y="40" width="40" height="32" rx="5" ${F('#6e5238')}/>
      <path d="M30 48 H70" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>
      <rect x="44" y="52" width="12" height="12" rx="2" ${F(GOLD)}/>
      <path d="M50 40 V30 M42 40 V34 M58 40 V34" ${S('stroke-width="2.5" stroke="' + ARC + '"')}/>
      <circle cx="50" cy="26" r="3.5" ${F(ARC)}/>
      <path d="M36 76 H64" ${S('stroke-width="3"')}/>`),
    lexovore: medallion(`
      <path d="M24 56 C24 40 38 34 48 38 C60 30 74 36 74 48 C74 58 64 64 54 60 C44 68 28 66 24 56 Z" ${F('#48603c')}/>
      <circle cx="64" cy="46" r="3.5" ${F('#ffcf5c')}/>
      <path d="M70 54 L78 60 L72 62 Z" ${F('#48603c')}/>
      <rect x="34" y="46" width="16" height="12" rx="1.5" ${F('#e8d9b0')}/>
      <path d="M36 50 H48 M36 53 H46" ${S('stroke-width="1.4" stroke="' + INK2 + '"')}/>`),

    /* ---- World 3: Ashen Peaks ---- */
    cinderimp: medallion(`
      <circle cx="50" cy="50" r="16" ${F('#8c3a24')}/>
      <path d="M38 40 L30 26 L44 34 M62 40 L70 26 L56 34" ${F('#8c3a24')}/>
      <circle cx="44" cy="48" r="3.5" ${F('#ffd75c')}/><circle cx="56" cy="48" r="3.5" ${F('#ffd75c')}/>
      <path d="M44 60 C48 56 52 56 56 60" ${S('stroke-width="2.5" stroke="#2c130a"')}/>
      <path d="M50 70 C44 76 42 82 46 86 C48 80 52 80 54 86 C58 82 56 76 50 70 Z" ${F('#e06a2c')}/>`),
    slagbeast: medallion(`
      <path d="M28 62 C26 44 36 32 50 32 C64 32 74 44 72 62 C64 70 36 70 28 62 Z" ${F('#4a3428')}/>
      <path d="M34 58 L24 66 M66 58 L76 66" ${S('stroke-width="4" stroke="#d9c49a"')}/>
      <circle cx="42" cy="48" r="3" ${F('#ff9a3c')}/><circle cx="58" cy="48" r="3" ${F('#ff9a3c')}/>
      <path d="M38 40 C42 36 46 36 48 38 M52 38 C54 36 58 36 62 40" ${S('stroke-width="2" stroke="#e06a2c"')}/>
      <path d="M44 64 C48 60 52 60 56 64" ${S('stroke-width="2.4" stroke="#2c130a"')}/>`),
    ashwidow: medallion(`
      <circle cx="50" cy="52" r="11" ${F('#332720')}/>
      <circle cx="50" cy="38" r="7" ${F('#332720')}/>
      <path d="M42 46 C30 40 24 32 22 26 M40 52 C28 52 20 48 16 44 M42 58 C32 62 24 62 18 60 M58 46 C70 40 76 32 78 26 M60 52 C72 52 80 48 84 44 M58 58 C68 62 76 62 82 60" ${S('stroke-width="2.6" stroke="#332720"')}/>
      <path d="M47 50 L53 58 M53 50 L47 58" ${S('stroke-width="2.4" stroke="#c0503f"')}/>
      <circle cx="47" cy="37" r="1.6" ${F('#ffb347')}/><circle cx="53" cy="37" r="1.6" ${F('#ffb347')}/>`),
    pyrecaller: medallion(`
      <path d="M36 76 C32 56 38 42 50 40 C62 42 68 56 64 76 Z" ${F('#5d3222')}/>
      <circle cx="50" cy="34" r="8" ${F('#d9c49a')}/>
      <path d="M28 48 C26 40 30 34 34 32 C34 38 32 42 34 46 Z" ${F('#e06a2c')}/>
      <path d="M72 48 C74 40 70 34 66 32 C66 38 68 42 66 46 Z" ${F('#e06a2c')}/>
      <path d="M46 33 H48 M52 33 H54" ${S('stroke-width="2"')}/>
      <path d="M44 56 H56 M44 62 H56" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>`),
    magmaTome: medallion(`
      <path d="M28 36 C36 32 46 32 50 36 C54 32 64 32 72 36 V66 C64 62 54 62 50 66 C46 62 36 62 28 66 Z" ${F('#6e2c1c')}/>
      <path d="M50 36 V66" ${S('stroke-width="2" stroke="#3d150c"')}/>
      <path d="M34 44 H46 M34 50 H46 M54 44 H66 M54 50 H66" ${S('stroke-width="1.8" stroke="#ffb347"')}/>
      <path d="M42 30 C40 24 44 18 48 16 C46 22 50 24 50 28 C52 22 56 22 56 18 C60 24 56 30 52 32 Z" ${F('#e06a2c')}/>`),
    obsidianknight: medallion(`
      <path d="M36 30 H64 L60 58 C56 66 44 66 40 58 Z" ${F('#26202c')}/>
      <path d="M36 42 H64" ${S('stroke-width="3" stroke="#4a3f56"')}/>
      <path d="M42 48 H48 M52 48 H58" ${S('stroke-width="3" stroke="#b090e8"')}/>
      <path d="M50 20 V30 M44 24 L50 20 L56 24" ${S('stroke-width="2.5" stroke="' + GOLD + '"')}/>
      <path d="M34 70 C42 64 58 64 66 70" ${S('stroke-width="3.5" stroke="#26202c"')}/>`),
    cinderking: medallion(`
      <path d="M32 44 L36 30 L44 40 L50 26 L56 40 L64 30 L68 44 Z" ${F('#e06a2c')}/>
      <path d="M32 46 H68 V54 C60 60 40 60 32 54 Z" ${F(GOLD)}/>
      <circle cx="50" cy="66" r="10" ${F('#8c3a24')}/>
      <circle cx="46" cy="64" r="2.4" ${F('#ffd75c')}/><circle cx="54" cy="64" r="2.4" ${F('#ffd75c')}/>
      <path d="M46 71 C48 73 52 73 54 71" ${S('stroke-width="2" stroke="#2c130a"')}/>`, 'rgba(245,220,190,0.5)'),

    /* ---- World 4: Void Marches ---- */
    nullwisp: medallion(`
      <path d="M36 66 C30 50 36 34 50 32 C64 34 70 50 64 66 C60 60 56 64 54 70 C52 64 48 64 46 70 C44 64 40 60 36 66 Z" ${F('#5d5470')} opacity="0.85"/>
      <circle cx="44" cy="46" r="3.5" ${F('#cdb4ff')}/><circle cx="56" cy="46" r="3.5" ${F('#cdb4ff')}/>
      <circle cx="30" cy="34" r="2" ${F('#cdb4ff')}/><circle cx="72" cy="40" r="1.6" ${F('#cdb4ff')}/>`),
    unword: medallion(`
      <path d="M38 38 C38 26 62 26 62 38 C62 46 52 46 52 54" ${S('stroke-width="6" stroke="#4a3f66"')}/>
      <circle cx="52" cy="66" r="4.5" ${F('#4a3f66')}/>
      <path d="M28 28 L34 32 M72 26 L66 32 M26 56 L32 54 M74 58 L68 54" ${S('stroke-width="2" stroke="#8a7fb0"')}/>
      <path d="M40 76 H44 M48 78 H52 M56 76 H60" ${S('stroke-width="2" stroke="#8a7fb0"')}/>`),
    hollowedjudge: medallion(`
      <path d="M50 24 V64" ${S('stroke-width="3.5"')}/>
      <path d="M30 34 H70" ${S('stroke-width="3.5"')}/>
      <path d="M30 34 L24 48 H36 Z M70 34 L64 48 H76 Z" ${F('#4a3f56')}/>
      <path d="M24 48 C24 54 36 54 36 48 M64 48 C64 54 76 54 76 48" ${S('stroke-width="2.5"')}/>
      <path d="M42 70 H58 L54 78 H46 Z" ${F('#4a3f56')}/>
      <circle cx="50" cy="20" r="4" ${F('#2a2136')}/>`),
    voidlarva: medallion(`
      <path d="M28 58 C26 48 32 42 40 44 C42 36 52 34 58 40 C68 38 76 46 72 56 C68 64 58 64 54 60 C50 66 40 66 36 62 C32 62 29 61 28 58 Z" ${F('#4e4160')}/>
      <circle cx="62" cy="48" r="3" ${F('#cdb4ff')}/>
      <path d="M32 52 C36 50 38 52 40 54 M44 50 C48 48 50 50 52 52" ${S('stroke-width="2" stroke="#2a2136"')}/>
      <path d="M70 44 L78 38 M72 52 L80 50" ${S('stroke-width="2" stroke="#4e4160"')}/>`),
    silencer: medallion(`
      <path d="M36 70 C32 48 38 34 50 32 C62 34 68 48 64 70 Z" ${F('#3a3346')}/>
      <ellipse cx="50" cy="48" rx="10" ry="12" ${F('#d9cfc0')}/>
      <circle cx="46" cy="44" r="2" ${F(INK)}/><circle cx="54" cy="44" r="2" ${F(INK)}/>
      <path d="M44 56 H56" ${S('stroke-width="3" stroke="#8c2c22"')}/>
      <path d="M42 26 L38 18 M58 26 L62 18" ${S('stroke-width="2" stroke="#3a3346"')}/>`),
    eraser: medallion(`
      <rect x="34" y="30" width="32" height="20" rx="4" transform="rotate(-18 50 40)" ${F('#8a7fb0')}/>
      <path d="M28 62 H72 M32 68 H68 M36 74 H64" ${S('stroke-width="2.5" stroke="' + INK2 + '" stroke-dasharray="6 5"')}/>
      <path d="M44 52 C48 56 56 58 62 56" ${S('stroke-width="6" stroke="rgba(230,220,200,0.9)"')}/>`),
    censor: medallion(`
      <rect x="30" y="34" width="40" height="36" rx="3" ${F('#e2d4ae')}/>
      <path d="M34 42 H66 M34 48 H60 M34 54 H66 M34 60 H56" ${S('stroke-width="2" stroke="' + INK2 + '"')}/>
      <path d="M32 36 L68 68 M68 36 L32 68" ${S('stroke-width="7" stroke="#8c2c22"')}/>
      <circle cx="50" cy="24" r="5" ${F('#8c2c22')}/>`),

    /* ---- World 5: Astral Spire ---- */
    starspawn: medallion(`
      <path d="M50 18 L56 40 L78 42 L60 54 L66 76 L50 62 L34 76 L40 54 L22 42 L44 40 Z" ${F('#c9a227')}/>
      <circle cx="50" cy="48" r="7" ${F('#2a2136')}/>
      <circle cx="50" cy="48" r="3" ${F('#ffd75c')}/>`),
    glyphgeist: medallion(`
      <path d="M40 28 H60 M50 28 V56 M42 42 H58" ${S('stroke-width="5" stroke="' + ARC + '"')}/>
      <path d="M38 62 C42 70 58 70 62 62" ${S('stroke-width="3" stroke="#8a6fd0" stroke-dasharray="4 4"')}/>
      <circle cx="34" cy="34" r="2" ${F('#cdb4ff')}/><circle cx="66" cy="30" r="1.8" ${F('#cdb4ff')}/>
      <circle cx="30" cy="52" r="1.6" ${F('#cdb4ff')}/><circle cx="70" cy="50" r="2.2" ${F('#cdb4ff')}/>`),
    seraphscribe: medallion(`
      <path d="M50 40 C42 28 28 26 20 32 C28 36 34 42 38 50 Z" ${F('#d9cfc0')}/>
      <path d="M50 40 C58 28 72 26 80 32 C72 36 66 42 62 50 Z" ${F('#c8bcaa')}/>
      <path d="M44 70 C42 54 46 44 50 42 C54 44 58 54 56 70 Z" ${F('#7a6a8c')}/>
      <circle cx="50" cy="36" r="6" ${F('#e8dcc4')}/>
      <path d="M40 24 C44 20 56 20 60 24" ${S('stroke-width="2.4" stroke="' + GOLD + '" stroke-dasharray="5 4"')}/>`),
    cometling: medallion(`
      <circle cx="60" cy="40" r="10" ${F('#ffd75c')}/>
      <circle cx="57" cy="37" r="2.4" ${F(INK)}/><circle cx="64" cy="37" r="2.4" ${F(INK)}/>
      <path d="M58 45 C60 47 62 47 64 45" ${S('stroke-width="2"')}/>
      <path d="M52 48 C42 56 32 66 24 78 M56 52 C50 58 44 66 40 74 M48 44 C40 48 32 54 26 60" ${S('stroke-width="3" stroke="#e0a83c"')}/>`),
    constellation: medallion(`
      <circle cx="32" cy="36" r="4" ${F('#ffd75c')}/><circle cx="56" cy="26" r="3" ${F('#ffd75c')}/>
      <circle cx="70" cy="44" r="4.5" ${F('#ffd75c')}/><circle cx="48" cy="52" r="3.5" ${F('#ffd75c')}/>
      <circle cx="34" cy="68" r="3" ${F('#ffd75c')}/><circle cx="64" cy="70" r="4" ${F('#ffd75c')}/>
      <path d="M32 36 L56 26 L70 44 L48 52 L32 36 M48 52 L34 68 M48 52 L64 70" ${S('stroke-width="1.6" stroke="#8a6fd0"')}/>`),
    archlector: medallion(`
      <path d="M38 76 C34 56 38 40 50 38 C62 40 66 56 62 76 Z" ${F('#4a3f66')}/>
      <circle cx="50" cy="32" r="7" ${F('#d9c49a')}/>
      <path d="M30 22 L36 26 M50 16 V22 M70 22 L64 26" ${S('stroke-width="2.4" stroke="' + GOLD + '"')}/>
      <rect x="42" y="52" width="16" height="12" rx="2" ${F('#e2d4ae')}/>
      <path d="M44 56 H56 M44 60 H54" ${S('stroke-width="1.5" stroke="' + INK2 + '"')}/>
      <path d="M66 44 V78 M66 50 L74 44" ${S('stroke-width="2.6" stroke="' + GOLD + '"')}/>`),
    author: medallion(`
      <path d="M64 18 C50 30 40 44 34 62 L30 78 L44 70 C56 58 66 42 72 26 Z" ${F('#2a2136')}/>
      <path d="M34 62 L44 70" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>
      <circle cx="56" cy="38" r="5" ${F('#e8dcc4')}/>
      <circle cx="56" cy="38" r="2.2" ${F('#8c2c22')}/>
      <path d="M26 82 C40 78 60 78 74 82" ${S('stroke-width="2.6" stroke="#8c2c22"')}/>
      <path d="M22 30 L28 34 M78 56 L72 54 M70 70 L64 66" ${S('stroke-width="2" stroke="#8a6fd0"')}/>`, 'rgba(230,220,245,0.5)'),

    /* ---- Tier 2 ALT: Drowned Orchard ---- */
    rotfruit: medallion(`
      <circle cx="50" cy="52" r="17" ${F('#8a4a3a')}/>
      <path d="M42 44 C46 48 54 48 58 44" ${S('stroke-width="2" stroke="#4a2018"')}/>
      <circle cx="44" cy="48" r="2.6" ${F('#d8e86a')}/><circle cx="57" cy="50" r="2.2" ${F('#d8e86a')}/>
      <path d="M50 35 C50 28 54 24 58 22" ${S('stroke-width="3" stroke="#4a6b34"')}/>
      <path d="M40 62 C44 66 48 64 48 60 M56 64 C58 68 62 66 62 62" ${S('stroke-width="2.4" stroke="#5a7d3e"')}/>`),
    willowisp: medallion(`
      <path d="M50 26 C40 36 36 50 40 64 C44 58 48 58 50 62 C52 58 56 58 60 64 C64 50 60 36 50 26 Z" ${F('#9fd0c8')} opacity="0.8"/>
      <circle cx="46" cy="44" r="2.6" ${F('#2a4a44')}/><circle cx="54" cy="44" r="2.6" ${F('#2a4a44')}/>
      <path d="M30 40 C26 44 26 50 30 54 M70 40 C74 44 74 50 70 54" ${S('stroke-width="2" stroke="#9fd0c8"')}/>`),
    bogshade: medallion(`
      <path d="M32 66 C28 46 36 32 50 32 C64 32 72 46 68 66 C62 60 56 64 54 70 C50 62 44 64 40 70 C38 64 34 62 32 66 Z" ${F('#3e5248')} opacity="0.9"/>
      <circle cx="44" cy="46" r="3" ${F('#b8e0a0')}/><circle cx="56" cy="46" r="3" ${F('#b8e0a0')}/>
      <path d="M28 74 C36 70 64 70 72 74" ${S('stroke-width="2.4" stroke="#2a382e"')}/>`),
    orchardkeeper: medallion(`
      <circle cx="50" cy="38" r="9" ${F('#d9c49a')}/>
      <path d="M36 30 H64 L58 22 H42 Z" ${F('#8a6a3a')}/>
      <path d="M38 74 C36 56 42 48 50 48 C58 48 64 56 62 74 Z" ${F('#5d6b42')}/>
      <path d="M66 46 V78 M66 52 L74 46" ${S('stroke-width="2.6" stroke="#6e5238"')}/>
      <path d="M46 37 H48 M52 37 H54" ${S('stroke-width="2"')}/>`),
    cidergolem: medallion(`
      <rect x="34" y="34" width="32" height="34" rx="8" ${F('#7a4a28')}/>
      <path d="M34 44 H66 M34 56 H66" ${S('stroke-width="2.5" stroke="#4a2c14"')}/>
      <circle cx="44" cy="50" r="3" ${F('#ffd75c')}/><circle cx="56" cy="50" r="3" ${F('#ffd75c')}/>
      <path d="M42 28 C44 22 56 22 58 28" ${S('stroke-width="3" stroke="#4a2c14"')}/>
      <path d="M40 72 C44 78 56 78 60 72" ${S('stroke-width="2.5" stroke="#a06a3a" stroke-dasharray="3 3"')}/>`),
    wormqueen: medallion(`
      <path d="M28 62 C28 48 38 46 44 52 C48 42 60 42 64 50 C72 48 76 58 70 64 C64 70 56 66 54 60 C50 68 38 70 34 64 C30 64 28 63 28 62 Z" ${F('#b06a7a')}/>
      <circle cx="60" cy="52" r="3" ${F('#3a1a22')}/>
      <path d="M40 34 L36 24 M50 32 L50 22 M60 34 L64 24" ${S('stroke-width="2.4" stroke="' + GOLD + '"')}/>
      <path d="M42 30 H58" ${S('stroke-width="2.4" stroke="' + GOLD + '"')}/>`),
    grafter: medallion(`
      <path d="M36 24 L58 56 M64 24 L42 56" ${S('stroke-width="5" stroke="#8a8578"')}/>
      <circle cx="36" cy="24" r="4" ${F('#5d4a2f')}/><circle cx="64" cy="24" r="4" ${F('#5d4a2f')}/>
      <path d="M42 56 C36 64 36 72 42 78 M58 56 C64 64 64 72 58 78" ${S('stroke-width="4" stroke="#8a8578"')}/>
      <path d="M46 64 C48 62 52 62 54 64" ${S('stroke-width="2" stroke="#8c2c22"')}/>
      <circle cx="50" cy="42" r="3.5" ${F('#8c2c22')}/>`, 'rgba(235,220,210,0.5)'),

    /* ---- Tier 3 ALT: Glass Desert ---- */
    glasscrab: medallion(`
      <ellipse cx="50" cy="52" rx="18" ry="12" ${F('#bcd8e0')} opacity="0.85"/>
      <path d="M36 44 C30 38 28 32 30 26 M64 44 C70 38 72 32 70 26" ${S('stroke-width="3.4" stroke="#8fb4c0"')}/>
      <circle cx="30" cy="26" r="3.5" ${F('#8fb4c0')}/><circle cx="70" cy="26" r="3.5" ${F('#8fb4c0')}/>
      <circle cx="44" cy="50" r="2.6" ${F('#26404a')}/><circle cx="56" cy="50" r="2.6" ${F('#26404a')}/>
      <path d="M34 62 L28 70 M42 64 L38 74 M58 64 L62 74 M66 62 L72 70" ${S('stroke-width="2.6" stroke="#8fb4c0"')}/>`),
    mirageling: medallion(`
      <path d="M50 26 C60 38 62 52 50 66 C38 52 40 38 50 26 Z" ${F('#cde4ec')} opacity="0.75"/>
      <circle cx="46" cy="44" r="2.4" ${F('#26404a')}/><circle cx="54" cy="44" r="2.4" ${F('#26404a')}/>
      <path d="M30 70 H70 M34 76 H66" ${S('stroke-width="2" stroke="#cde4ec" stroke-dasharray="5 4"')}/>`),
    shardhound: medallion(`
      <path d="M30 60 C28 44 38 34 50 34 C62 34 72 44 70 60 L62 54 C60 64 54 68 50 68 C46 68 40 64 38 54 Z" ${F('#a8c4d0')}/>
      <path d="M36 36 L40 24 L46 34 M64 36 L60 24 L54 34" ${F('#a8c4d0')}/>
      <circle cx="43" cy="49" r="2.8" ${F('#26404a')}/><circle cx="57" cy="49" r="2.8" ${F('#26404a')}/>
      <path d="M46 58 L50 62 L54 58" ${S('stroke-width="2.4" stroke="#26404a"')}/>`),
    dustprophet: medallion(`
      <path d="M38 76 C34 58 40 44 50 42 C60 44 66 58 62 76 Z" ${F('#c0a878')}/>
      <circle cx="50" cy="36" r="8" ${F('#d9c49a')}/>
      <path d="M44 35 H47 M53 35 H56" ${S('stroke-width="2"')}/>
      <path d="M28 30 L34 34 M50 22 V28 M72 30 L66 34" ${S('stroke-width="2" stroke="#e0cf9e" stroke-dasharray="3 3"')}/>
      <path d="M44 56 H56 M44 62 H56" ${S('stroke-width="1.8" stroke="#8a6a3a"')}/>`),
    prismwyrm: medallion(`
      <path d="M26 58 L38 42 L50 58 L62 42 L74 58" ${S('stroke-width="7" stroke="#b8dce8"')}/>
      <path d="M26 58 L38 42 L50 58 L62 42 L74 58" ${S('stroke-width="2.4" stroke="#7ba8c0"')}/>
      <circle cx="74" cy="56" r="4.5" ${F('#26404a')}/>
      <path d="M30 34 L34 30 M48 30 L52 26 M66 32 L70 28" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>`),
    hourtitan: medallion(`
      <path d="M36 26 H64 L50 50 Z M36 74 H64 L50 50 Z" ${F('#d8c8a2')}/>
      <path d="M36 26 H64 M36 74 H64" ${S('stroke-width="4"')}/>
      <path d="M46 66 C48 60 52 60 54 66" ${F('#b09a5e')}/>
      <circle cx="42" cy="36" r="2.2" ${F('#26404a')}/><circle cx="58" cy="36" r="2.2" ${F('#26404a')}/>`),
    vitrifier: medallion(`
      <circle cx="46" cy="44" r="17" ${S('stroke-width="5" stroke="#8fb4c0"')}/>
      <circle cx="46" cy="44" r="17" ${F('#d8ecf2')} opacity="0.4"/>
      <path d="M58 56 L74 74" ${S('stroke-width="7" stroke="#6e5238"')}/>
      <circle cx="46" cy="44" r="5" ${F('#8c2c22')}/>
      <path d="M34 34 L40 38 M52 30 L54 36" ${S('stroke-width="2" stroke="#fff"')}/>`, 'rgba(225,240,245,0.5)'),

    /* ---- Tier 4 ALT: Moth Court ---- */
    courtmoth: medallion(`
      <path d="M50 38 C34 22 20 34 28 48 C34 58 44 54 50 46 Z" ${F('#b0889a')}/>
      <path d="M50 38 C66 22 80 34 72 48 C66 58 56 54 50 46 Z" ${F('#c49aac')}/>
      <ellipse cx="50" cy="50" rx="4" ry="13" ${F('#4a2c3a')}/>
      <path d="M46 34 L42 26 M54 34 L58 26" ${S('stroke-width="2"')}/>
      <circle cx="38" cy="40" r="2.4" ${F('#f4e6c4')}/><circle cx="62" cy="40" r="2.4" ${F('#f4e6c4')}/>
      <path d="M40 66 C44 72 56 72 60 66" ${S('stroke-width="2" stroke="' + GOLD + '" stroke-dasharray="3 3"')}/>`),
    dustcloak: medallion(`
      <path d="M34 74 C30 52 36 36 50 34 C64 36 70 52 66 74 C60 68 56 72 54 78 C50 70 44 72 42 78 C40 72 36 70 34 74 Z" ${F('#6a5a6e')}/>
      <path d="M42 46 C46 42 54 42 58 46" ${S('stroke-width="2.4" stroke="#2a222e"')}/>
      <circle cx="45" cy="52" r="2.4" ${F('#e8d9b0')}/><circle cx="55" cy="52" r="2.4" ${F('#e8d9b0')}/>
      <path d="M30 40 L36 44 M70 40 L64 44" ${S('stroke-width="2" stroke="#9a8aa0" stroke-dasharray="2 3"')}/>`),
    lanternthief: medallion(`
      <rect x="42" y="36" width="16" height="22" rx="4" ${F('#d99a3c')}/>
      <path d="M42 42 H58 M42 52 H58" ${S('stroke-width="1.8" stroke="#8a5a1c"')}/>
      <circle cx="50" cy="47" r="4" ${F('#fff3b0')}/>
      <path d="M50 36 V28 C50 24 56 24 56 28" ${S('stroke-width="2.6" stroke="#8a5a1c"')}/>
      <path d="M34 66 C40 60 44 60 46 64 M66 66 C60 60 56 60 54 64" ${S('stroke-width="3" stroke="#4a3a52"')}/>
      <circle cx="34" cy="68" r="4" ${F('#4a3a52')}/><circle cx="66" cy="68" r="4" ${F('#4a3a52')}/>`),
    silkjudge: medallion(`
      <path d="M38 74 C34 54 40 40 50 38 C60 40 66 54 62 74 Z" ${F('#8a5a72')}/>
      <circle cx="50" cy="32" r="8" ${F('#e8d0dc')}/>
      <path d="M46 31 H48 M52 31 H54" ${S('stroke-width="2"')}/>
      <path d="M40 24 C44 18 56 18 60 24" ${S('stroke-width="3" stroke="#c49aac"')}/>
      <path d="M42 54 C46 50 54 50 58 54 L56 60 C52 56 48 56 44 60 Z" ${F('#c49aac')}/>`),
    velvetduke: medallion(`
      <rect x="38" y="20" width="24" height="14" rx="2" ${F('#3a2a44')}/>
      <path d="M34 34 H66" ${S('stroke-width="3.4" stroke="#3a2a44"')}/>
      <circle cx="50" cy="46" r="9" ${F('#d9c49a')}/>
      <path d="M46 45 H48 M52 45 H54" ${S('stroke-width="1.8"')}/>
      <path d="M38 76 C36 62 42 56 50 56 C58 56 64 62 62 76 Z" ${F('#563a66')}/>
      <path d="M44 62 L50 68 L56 62" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>`),
    cocoonwarden: medallion(`
      <ellipse cx="50" cy="50" rx="15" ry="22" ${F('#c8bc96')}/>
      <path d="M38 38 C46 42 54 42 62 38 M36 50 C46 54 54 54 64 50 M38 62 C46 66 54 66 62 62" ${S('stroke-width="2.4" stroke="#8a7a54"')}/>
      <circle cx="45" cy="44" r="2.2" ${F('#4a3a22')}/><circle cx="55" cy="44" r="2.2" ${F('#4a3a22')}/>`),
    mothqueen: medallion(`
      <path d="M32 28 L36 20 L42 27 L50 18 L58 27 L64 20 L68 28 Z" ${F(GOLD)}/>
      <path d="M50 44 C32 28 16 42 26 56 C34 66 46 60 50 50 Z" ${F('#a06a86')}/>
      <path d="M50 44 C68 28 84 42 74 56 C66 66 54 60 50 50 Z" ${F('#b87a96')}/>
      <ellipse cx="50" cy="54" rx="4.5" ry="14" ${F('#3a2030')}/>
      <circle cx="40" cy="46" r="2.6" ${F('#f4e6c4')}/><circle cx="60" cy="46" r="2.6" ${F('#f4e6c4')}/>`, 'rgba(240,225,235,0.5)'),

    /* ---- Tier 5 ALT: Margin Abyss ---- */
    erratabeast: medallion(`
      <path d="M30 62 C28 44 38 34 50 34 C62 34 72 44 70 62 C64 70 36 70 30 62 Z" ${F('#5a5248')}/>
      <path d="M36 44 L64 60 M64 44 L36 60" ${S('stroke-width="3" stroke="#c0392b"')}/>
      <circle cx="42" cy="48" r="3" ${F('#f4e6c4')}/><circle cx="58" cy="48" r="3" ${F('#f4e6c4')}/>
      <path d="M42 64 H58" ${S('stroke-width="2.4" stroke="#2c2620"')}/>`),
    footnotehorror: medallion(`
      <text x="50" y="56" text-anchor="middle" font-size="40" font-weight="bold" fill="#4a4038" font-family="Georgia">*</text>
      <path d="M34 64 C30 70 28 76 30 80 M44 66 C42 72 42 78 44 82 M56 66 C58 72 58 78 56 82 M66 64 C70 70 72 76 70 80" ${S('stroke-width="2.6" stroke="#4a4038"')}/>
      <circle cx="42" cy="40" r="2.6" ${F('#c0392b')}/><circle cx="58" cy="40" r="2.6" ${F('#c0392b')}/>`),
    blankling: medallion(`
      <rect x="34" y="30" width="32" height="40" rx="4" ${F('#efe8da')}/>
      <rect x="34" y="30" width="32" height="40" rx="4" ${S('stroke-width="2.4" stroke="#b0a890"')}/>
      <circle cx="45" cy="46" r="2.6" ${F('#8a8270')}/><circle cx="55" cy="46" r="2.6" ${F('#8a8270')}/>
      <path d="M44 58 H56" ${S('stroke-width="2" stroke="#b0a890" stroke-dasharray="2 3"')}/>`),
    inkleech: medallion(`
      <path d="M30 60 C28 48 36 44 42 50 C44 40 56 38 60 46 C68 44 74 52 68 60 C60 70 38 70 30 60 Z" ${F('#26202c')}/>
      <circle cx="56" cy="50" r="2.8" ${F('#c0392b')}/>
      <path d="M64 62 C70 66 74 72 74 78" ${S('stroke-width="3.4" stroke="#26202c"')}/>
      <path d="M36 54 C40 52 42 54 44 56" ${S('stroke-width="2" stroke="#4a3f56"')}/>`),
    redactor: medallion(`
      <rect x="30" y="36" width="40" height="30" rx="3" ${F('#e2d4ae')}/>
      <path d="M34 44 H66 M34 52 H66 M34 60 H58" ${S('stroke-width="4.5" stroke="#1c1814"')}/>
      <path d="M58 24 L74 40" ${S('stroke-width="5" stroke="#1c1814"')}/>
      <circle cx="50" cy="76" r="3.4" ${F('#c0392b')}/>`),
    appendixwyrm: medallion(`
      <path d="M24 60 C28 44 40 38 52 44 C64 50 70 44 72 34" ${S('stroke-width="8" stroke="#6a5a48"')}/>
      <path d="M24 60 C30 68 42 70 50 64" ${S('stroke-width="6" stroke="#6a5a48"')}/>
      <circle cx="72" cy="32" r="5" ${F('#6a5a48')}/>
      <circle cx="73" cy="30" r="1.8" ${F('#ffd75c')}/>
      <path d="M34 48 H44 M36 56 H46" ${S('stroke-width="1.6" stroke="#3a3228"')}/>`),
    marginalia: medallion(`
      <text x="50" y="62" text-anchor="middle" font-size="46" fill="#3a2030" font-family="Georgia">❦</text>
      <path d="M26 30 C32 26 38 26 42 30 M58 30 C64 26 70 26 74 30" ${S('stroke-width="2.4" stroke="#8c2c22"')}/>
      <circle cx="34" cy="40" r="2.6" ${F('#8c2c22')}/><circle cx="66" cy="40" r="2.6" ${F('#8c2c22')}/>
      <path d="M30 74 C40 70 60 70 70 74" ${S('stroke-width="2.4" stroke="#3a2030" stroke-dasharray="4 3"')}/>`, 'rgba(240,225,230,0.5)'),

    /* ---- Tier 6: THE UNWRITTEN ---- */
    unletter: medallion(`
      <rect x="36" y="32" width="28" height="36" rx="3" ${S('stroke-width="3" stroke="#8a8270" stroke-dasharray="6 5"')}/>
      <circle cx="46" cy="46" r="2.4" ${F('#8a8270')}/><circle cx="54" cy="46" r="2.4" ${F('#8a8270')}/>
      <path d="M44 58 C48 56 52 56 56 58" ${S('stroke-width="2" stroke="#8a8270"')}/>`),
    nullscribe: medallion(`
      <path d="M38 76 C34 56 40 42 50 40 C60 42 66 56 62 76 Z" ${F('#c8c0b0')} opacity="0.6"/>
      <circle cx="50" cy="34" r="8" ${S('stroke-width="2.6" stroke="#8a8270" stroke-dasharray="4 4"')}/>
      <path d="M64 48 C70 44 74 38 74 32" ${S('stroke-width="2.6" stroke="#8a8270" stroke-dasharray="3 3"')}/>
      <path d="M44 56 H56 M44 62 H52" ${S('stroke-width="1.6" stroke="#a89e8a" stroke-dasharray="2 3"')}/>`),
    unwrittenone: medallion(`
      <rect x="28" y="26" width="44" height="50" rx="5" ${F('#141210')}/>
      <rect x="28" y="26" width="44" height="50" rx="5" ${S('stroke-width="2.6" stroke="#8a6fd0"')}/>
      <circle cx="42" cy="46" r="3.4" ${F('#efe8da')}/><circle cx="58" cy="46" r="3.4" ${F('#efe8da')}/>
      <path d="M40 62 C46 58 54 58 60 62" ${S('stroke-width="2.6" stroke="#efe8da"')}/>
      <path d="M22 20 L28 26 M78 20 L72 26 M22 82 L28 76 M78 82 L72 76" ${S('stroke-width="2.4" stroke="#8a6fd0"')}/>`, 'rgba(210,205,225,0.4)'),
  };

  const CRESTS = {
    echoist: medallion(`
      <path d="M38 54 C38 38 44 30 50 30 C56 30 62 38 62 54 L66 60 H34 Z" ${F('#8a6fd0')}/>
      <circle cx="50" cy="66" r="4" ${F(GOLD)}/>
      <path d="M28 40 C24 46 24 54 28 60 M72 40 C76 46 76 54 72 60" ${S('stroke-width="2.4" stroke="#8a6fd0" stroke-dasharray="4 4"')}/>`),
    inkblade: medallion(`
      <path d="M50 18 L56 30 L54 62 H46 L44 30 Z" ${F('#4a5568')}/>
      <path d="M38 64 H62 M50 64 V78" ${S('stroke-width="4" stroke="#6e5238"')}/>
      <circle cx="50" cy="80" r="3.4" ${F(GOLD)}/>
      <path d="M46 34 C40 40 38 48 40 54 M54 34 C60 40 62 48 60 54" ${S('stroke-width="2" stroke="#26202c"')}/>`),
    scribe: medallion(`
      <path d="M62 22 C50 32 42 44 38 60 L36 70 L46 64 C56 52 62 40 66 28 Z" ${F(INK2)}/>
      <path d="M38 60 L46 64" ${S('stroke-width="2" stroke="' + GOLD + '"')}/>
      <path d="M30 76 H70" ${S('stroke-width="2.6"')}/>`),
    oracle: medallion(`
      <path d="M50 22 L70 50 L50 78 L30 50 Z" ${F('#cbb4f0')}/>
      <circle cx="50" cy="50" r="10" ${F('#f4ecda')}/>
      <circle cx="50" cy="50" r="4.5" ${F(ARC)}/>
      <path d="M50 26 V34 M50 66 V74" ${S('stroke-width="2" stroke="' + ARC + '"')}/>`),
    warmage: medallion(`
      <path d="M32 26 L64 66 L60 72 L28 32 Z" ${F(INK2)}/>
      <path d="M68 26 L36 66 L40 72 L72 32 Z" ${F('#7a5c30')}/>
      <path d="M28 70 L36 62 M72 70 L64 62" ${S('stroke-width="4" stroke="' + RED + '"')}/>
      <circle cx="50" cy="48" r="5" ${F(GOLD)}/>`),
    archivist: medallion(`
      <path d="M26 34 C36 30 46 30 50 34 C54 30 64 30 74 34 V64 C64 60 54 60 50 64 C46 60 36 60 26 64 Z" ${F('#5d4a2f')}/>
      <path d="M50 34 V64" ${S('stroke-width="2" stroke="#3a2c1a"')}/>
      <path d="M50 18 V26 M38 20 L42 27 M62 20 L58 27 M30 26 L36 30 M70 26 L64 30" ${S('stroke-width="2.4" stroke="' + GOLD + '"')}/>
      <path d="M32 42 H44 M32 48 H44 M56 42 H68 M56 48 H68" ${S('stroke-width="1.6" stroke="' + GOLD + '"')}/>`),
  };

  /* Map node glyphs (small, no medallion) */
  const NODE_GLYPHS = {
    battle: `<svg viewBox="0 0 40 40"><path d="M8 32 L28 8 M12 8 L32 32" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M6 26 L14 34 M34 26 L26 34" stroke="${RED}" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
    elite: `<svg viewBox="0 0 40 40"><circle cx="20" cy="17" r="10" fill="${INK}"/><circle cx="16" cy="15" r="2.6" fill="#e8d9b0"/><circle cx="24" cy="15" r="2.6" fill="#e8d9b0"/><path d="M16 22 H24 M17 22 V25 M20 22 V26 M23 22 V25" stroke="#e8d9b0" stroke-width="1.4" fill="none"/><path d="M10 34 C14 29 26 29 30 34" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    treasure: `<svg viewBox="0 0 40 40"><rect x="7" y="14" width="26" height="18" rx="3" fill="#8a6a3a"/><path d="M7 21 H33" stroke="${GOLD}" stroke-width="2.4"/><rect x="17" y="18" width="6" height="7" rx="1.4" fill="${GOLD}"/><path d="M9 14 C11 8 29 8 31 14" stroke="#8a6a3a" stroke-width="4" fill="none"/></svg>`,
    shrine: `<svg viewBox="0 0 40 40"><rect x="16" y="14" width="8" height="16" rx="2" fill="#e2cf9e"/><path d="M20 13 C17 9 19 6 20 4 C21 6 23 9 20 13 Z" fill="#ffb347"/><path d="M10 32 H30" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`,
    event: `<svg viewBox="0 0 40 40"><path d="M12 12 C12 4 28 4 28 12 C28 18 21 18 21 24" stroke="${ARC}" stroke-width="4.2" fill="none" stroke-linecap="round"/><circle cx="21" cy="32" r="3.2" fill="${ARC}"/></svg>`,
    boss: `<svg viewBox="0 0 40 40"><path d="M8 16 L12 8 L18 15 L20 6 L22 15 L28 8 L32 16 Z" fill="${GOLD}"/><path d="M8 18 H32 V24 C26 28 14 28 8 24 Z" fill="#8a6a3a"/><circle cx="14" cy="21" r="1.8" fill="${RED}"/><circle cx="20" cy="21" r="1.8" fill="${ARC}"/><circle cx="26" cy="21" r="1.8" fill="${RED}"/></svg>`,
  };

  window.Bestiary = {
    foe: (id) => FOES[id] || medallion(`<circle cx="50" cy="50" r="18" ${F(INK2)}/>`),
    crest: (id) => CRESTS[id] || CRESTS.scribe,
    nodeGlyph: (type) => NODE_GLYPHS[type] || NODE_GLYPHS.battle,
  };
})();
