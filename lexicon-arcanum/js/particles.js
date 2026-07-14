/* ============================================================
 * LEXICON ARCANUM — canvas particle engine
 * Sparks, embers, rune glyphs, slashes, shield shimmer, confetti.
 * ============================================================ */
(function () {
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  function resize() {
    // Render at device-pixel resolution so glyphs and rings stay crisp on HiDPI.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize); resize();

  const parts = [];
  let ambient = null; // {x,y,w,h} ember zone, or a function returning one (tracks layout)

  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function spawn(p) { if (parts.length < 900) parts.push(p); }

  /* ---- public emitters ---- */
  function burst(x, y, opts) {
    opts = opts || {};
    const n = opts.count || 24;
    const colors = opts.colors || ['#ffb347', '#ff6b35', '#ffd700'];
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), sp = rnd(1, opts.speed || 6);
      spawn({
        kind: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(0, 2),
        g: opts.gravity ?? 0.12, life: 1, decay: rnd(0.014, 0.032),
        size: rnd(1.5, opts.size || 4.5), color: colors[Math.floor(Math.random() * colors.length)],
        glow: opts.glow !== false,
      });
    }
  }

  function runes(x, y, word, opts) {
    opts = opts || {};
    const chars = (word || '✦✧☽☾♆').split('');
    chars.forEach((c, i) => {
      spawn({
        kind: 'glyph', ch: c, x: x + (i - chars.length / 2) * 18, y,
        vx: rnd(-0.6, 0.6), vy: rnd(-2.6, -1.4), g: -0.015,
        life: 1, decay: rnd(0.008, 0.014), size: opts.size || 22,
        color: opts.color || '#a887ff', rot: rnd(-0.4, 0.4), vr: rnd(-0.03, 0.03),
      });
    });
  }

  function slash(x, y, opts) {
    opts = opts || {};
    spawn({
      kind: 'slash', x, y, life: 1, decay: 0.06,
      ang: opts.angle ?? rnd(-0.7, -0.3), len: opts.len || 110,
      color: opts.color || '#fff', width: 5,
    });
    burst(x, y, { count: 14, colors: [opts.color || '#fff', '#ffd700'], speed: 5, size: 3 });
  }

  // a drift of motes from one point to another (e.g. unspent energy -> insight)
  function beam(x1, y1, x2, y2, opts) {
    opts = opts || {};
    const n = opts.count || 14;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const jx = rnd(-8, 8), jy = rnd(-8, 8);
      spawn({
        kind: 'dot', x: x1 + (x2 - x1) * t + jx, y: y1 + (y2 - y1) * t + jy,
        vx: (x2 - x1) / 60 + rnd(-0.4, 0.4), vy: (y2 - y1) / 60 + rnd(-0.4, 0.4),
        g: 0, life: 1, decay: rnd(0.02, 0.045),
        color: opts.color || '#c9a227', size: rnd(2, 4),
      });
    }
  }

  function shield(x, y, opts) {
    opts = opts || {};
    spawn({ kind: 'ring', x, y, life: 1, decay: 0.03, r: 12, vr2: 2.6,
            color: opts.color || '#6db6ff', width: 4 });
    burst(x, y, { count: 10, colors: ['#6db6ff', '#bfe0ff'], speed: 3, gravity: -0.02, size: 3 });
  }

  function heal(x, y) {
    for (let i = 0; i < 12; i++) {
      spawn({ kind: 'glyph', ch: '✚', x: x + rnd(-40, 40), y: y + rnd(-10, 30),
        vx: 0, vy: rnd(-1.8, -0.8), g: 0, life: 1, decay: rnd(0.012, 0.022),
        size: rnd(10, 17), color: '#5fbf6d', rot: 0, vr: 0 });
    }
  }

  function confetti() {
    for (let i = 0; i < 130; i++) {
      spawn({
        kind: 'rect', x: rnd(0, W), y: rnd(-60, 0), vx: rnd(-1, 1), vy: rnd(1, 3.6),
        g: 0.05, life: 1, decay: rnd(0.004, 0.009), size: rnd(4, 9),
        color: ['#c9a227', '#7b4fd8', '#3f7d47', '#a2352c', '#e8d9b0'][i % 5],
        rot: rnd(0, TAU), vr: rnd(-0.15, 0.15),
      });
    }
  }

  function powerNova(x, y) {
    spawn({ kind: 'ring', x, y, life: 1, decay: 0.014, r: 10, vr2: 5.5, color: '#ffd700', width: 6 });
    spawn({ kind: 'ring', x, y, life: 1, decay: 0.02, r: 6, vr2: 3.6, color: '#a887ff', width: 4 });
    burst(x, y, { count: 60, colors: ['#ffd700', '#fff3b0', '#a887ff'], speed: 9, size: 5 });
    runes(x, y - 20, '✦POTESTAS✦', { color: '#ffd700', size: 26 });
  }

  function setAmbient(zone) { ambient = zone; }

  /* ---- render loop ---- */
  let lastAmbient = 0;
  function tick(t) {
    ctx.clearRect(0, 0, W, H);
    if (ambient && t - lastAmbient > 260 && parts.length < 500) {
      lastAmbient = t;
      const zone = typeof ambient === 'function' ? ambient() : ambient;
      if (zone) {
        spawn({ kind: 'dot', x: rnd(zone.x, zone.x + zone.w), y: zone.y + zone.h,
          vx: rnd(-0.25, 0.25), vy: rnd(-0.9, -0.4), g: -0.002, life: 1, decay: rnd(0.004, 0.008),
          size: rnd(1.2, 2.6), color: Math.random() < 0.6 ? '#ffb347' : '#a887ff', glow: true });
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      switch (p.kind) {
        case 'dot':
          p.x += p.vx; p.y += p.vy; p.vy += p.g;
          if (p.glow) { ctx.shadowBlur = 8; ctx.shadowColor = p.color; }
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, TAU); ctx.fill();
          ctx.shadowBlur = 0;
          break;
        case 'glyph':
          p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.font = `bold ${p.size}px Georgia, serif`;
          ctx.shadowBlur = 12; ctx.shadowColor = p.color;
          ctx.fillStyle = p.color; ctx.textAlign = 'center';
          ctx.fillText(p.ch, 0, 0); ctx.restore();
          break;
        case 'slash': {
          const prog = 1 - p.life;
          const l = p.len * Math.min(1, prog * 3);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
          ctx.strokeStyle = p.color; ctx.lineCap = 'round';
          ctx.shadowBlur = 16; ctx.shadowColor = p.color;
          ctx.lineWidth = p.width * p.life;
          ctx.beginPath(); ctx.moveTo(-l / 2, 0); ctx.lineTo(l / 2, 0); ctx.stroke();
          ctx.restore();
          break;
        }
        case 'ring':
          p.r += p.vr2;
          ctx.strokeStyle = p.color; ctx.lineWidth = p.width * p.life;
          ctx.shadowBlur = 14; ctx.shadowColor = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke();
          ctx.shadowBlur = 0;
          break;
        case 'rect':
          p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
          break;
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.FX = { burst, runes, slash, shield, heal, confetti, powerNova, beam, setAmbient };
})();
