/* ============================================================
 * WORDLOOM — three.js spell-FX layer
 * An orthographic WebGL pass in screen pixels above the page:
 * additive GPU particles with soft glow (a poor weaver's bloom),
 * glowing rune letters, word volleys that lift off the loom and
 * slam into foes, elemental projectiles with trails, shockwave
 * rings, ink swirls & dissolves, screen-edge pulses, and a
 * thread-weave screen transition. On success it upgrades the
 * window.FX API in place; the 2D canvas engine (js/fx.js) is the
 * fallback and is restored on WebGL context loss.
 * ============================================================ */
(function () {
  if (!window.THREE || !window.FX) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const COARSE = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  let renderer;
  const canvas = document.createElement('canvas');
  canvas.id = 'gl-fx';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:39';
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) { return; }
  document.body.appendChild(canvas);

  const DPR = Math.min(COARSE ? 1.5 : 2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  let W = 0, H = 0;
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -500, 500);
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H);
    camera.right = W; camera.bottom = -H;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();
  // screen coords: mesh.position.set(x, -y, z)

  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- textures ---------- */
  function canvasTex(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    return new THREE.CanvasTexture(c);
  }
  const ringTex = canvasTex(128, (g, s) => {
    g.strokeStyle = '#fff'; g.lineWidth = 7;
    g.shadowBlur = 14; g.shadowColor = '#fff';
    g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 16, 0, TAU); g.stroke();
  });
  const streakTex = canvasTex(128, (g, s) => {
    const gr = g.createLinearGradient(0, 0, s, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, s * 0.42, s, s * 0.16);
    g.filter = 'blur(4px)';
    g.fillRect(0, s * 0.34, s, s * 0.32);
  });
  const glowTex = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  const letterCache = {};
  function letterTex(ch) {
    if (letterCache[ch]) return letterCache[ch];
    const t = canvasTex(128, (g, s) => {
      g.font = 'bold 84px Georgia, serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowBlur = 22; g.shadowColor = '#fff';
      g.fillStyle = '#fff';
      g.fillText(ch, s / 2, s / 2 + 4);
      g.shadowBlur = 0;
      g.fillText(ch, s / 2, s / 2 + 4);
    });
    letterCache[ch] = t;
    return t;
  }

  /* ---------- GPU dot pool (one draw call, additive) ---------- */
  const CAP = COARSE ? 1400 : 2600;
  const dots = [];
  const dGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(CAP * 3);
  const dCol = new Float32Array(CAP * 3);
  const dSize = new Float32Array(CAP);
  const dAlpha = new Float32Array(CAP);
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('aColor', new THREE.BufferAttribute(dCol, 3));
  dGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
  dGeo.setAttribute('aAlpha', new THREE.BufferAttribute(dAlpha, 1));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uDpr: { value: DPR } },
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
      varying vec3 vColor; varying float vAlpha; uniform float uDpr;
      void main(){
        vColor = aColor; vAlpha = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uDpr;
      }`,
    fragmentShader: `varying vec3 vColor; varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.06, d) * vAlpha;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor, a);
      }`,
  });
  const dotPoints = new THREE.Points(dGeo, dotMat);
  dotPoints.frustumCulled = false;
  dotPoints.renderOrder = 5;
  scene.add(dotPoints);

  /* confetti pool: rotated rects, normal blending, saturated colors */
  const CCAP = 300;
  const confs = [];
  const cGeo = new THREE.BufferGeometry();
  const cPos = new Float32Array(CCAP * 3);
  const cCol = new Float32Array(CCAP * 3);
  const cSize = new Float32Array(CCAP);
  const cAlpha = new Float32Array(CCAP);
  const cRot = new Float32Array(CCAP);
  cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
  cGeo.setAttribute('aColor', new THREE.BufferAttribute(cCol, 3));
  cGeo.setAttribute('aSize', new THREE.BufferAttribute(cSize, 1));
  cGeo.setAttribute('aAlpha', new THREE.BufferAttribute(cAlpha, 1));
  cGeo.setAttribute('aRot', new THREE.BufferAttribute(cRot, 1));
  const confMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uDpr: { value: DPR } },
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aAlpha; attribute float aRot;
      varying vec3 vColor; varying float vAlpha; varying float vRot; uniform float uDpr;
      void main(){
        vColor = aColor; vAlpha = aAlpha; vRot = aRot;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uDpr;
      }`,
    fragmentShader: `varying vec3 vColor; varying float vAlpha; varying float vRot;
      void main(){
        vec2 p = gl_PointCoord - 0.5;
        float c = cos(vRot), s = sin(vRot);
        vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        if (abs(q.x) > 0.42 || abs(q.y) > 0.26) discard;
        gl_FragColor = vec4(vColor, vAlpha);
      }`,
  });
  const confPoints = new THREE.Points(cGeo, confMat);
  confPoints.frustumCulled = false;
  confPoints.renderOrder = 6;
  scene.add(confPoints);

  const _c = new THREE.Color();
  function spawnDot(x, y, o) {
    if (dots.length >= CAP) return;
    _c.set(o.color || '#ffb347');
    dots.push({
      x, y, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, drag: o.drag || 1,
      life: 1, decay: o.decay || 0.02, size: o.size || 8,
      r: _c.r, g_: _c.g, b: _c.b,
    });
  }

  /* ---------- transient mesh actors ---------- */
  const actors = [];
  function addActor(obj, ttl, update) {
    obj.renderOrder = 8;
    scene.add(obj);
    actors.push({ obj, t0: performance.now(), ttl, update });
  }
  function spriteOf(tex, color, blending) {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false, depthTest: false,
        blending: blending || THREE.AdditiveBlending, color: new THREE.Color(color || '#fff'),
      })
    );
  }

  /* ---------- public emitters ---------- */
  function burst(x, y, opts) {
    opts = opts || {};
    const n = opts.count || 24;
    const colors = opts.colors || ['#ffb347', '#ff6b35', '#ffd700'];
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU), sp = rnd(1, opts.speed || 6);
      spawnDot(x, y, {
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(0, 2),
        g: opts.gravity != null ? opts.gravity : 0.12,
        decay: rnd(0.014, 0.032), size: rnd(4, (opts.size || 4.5) * 2.6),
        color: pick(colors), drag: 0.985,
      });
    }
    if (opts.flash !== false) {
      const f = spriteOf(glowTex, colors[0]);
      f.position.set(x, -y, 2);
      addActor(f, 260, (k) => { const s = 40 + 130 * k; f.scale.set(s, s, 1); f.material.opacity = 0.7 * (1 - k); });
    }
  }

  function ring(x, y, color, r0, r1, ttl, width) {
    const m = spriteOf(ringTex, color);
    m.position.set(x, -y, 3);
    addActor(m, ttl || 500, (k) => {
      const s = (r0 + (r1 - r0) * (1 - Math.pow(1 - k, 3))) * 2;
      m.scale.set(s, s, 1);
      m.material.opacity = (1 - k) * (width || 1);
    });
  }

  function runes(x, y, word, opts) {
    opts = opts || {};
    const chars = (word || '✦✧☽☾').split('');
    const size = opts.size || 26;
    chars.forEach((ch, i) => {
      const m = spriteOf(letterTex(ch), opts.color || '#a887ff');
      const x0 = x + (i - chars.length / 2) * (size * 0.82);
      m.position.set(x0, -y, 4);
      const vy = rnd(1.3, 2.4), vr = rnd(-0.02, 0.02), delay = i * 34;
      addActor(m, 1250 + delay, (k, dt, tt) => {
        if (tt < delay) { m.material.opacity = 0; return; }
        const kk = (tt - delay) / 1250;
        if (kk >= 1) return false;
        m.position.y += vy * dt;
        m.rotation.z += vr * dt;
        const s = size * (1 + kk * 0.45);
        m.scale.set(s, s, 1);
        m.material.opacity = kk < 0.12 ? kk / 0.12 : 1 - (kk - 0.12) / 0.88;
      });
    });
  }

  function slash(x, y, opts) {
    opts = opts || {};
    const m = spriteOf(streakTex, opts.color || '#fff');
    m.position.set(x, -y, 4);
    m.rotation.z = -(opts.angle != null ? opts.angle : rnd(-0.7, -0.3));
    const len = (opts.len || 110) * 1.5;
    addActor(m, 300, (k) => {
      m.scale.set(len * Math.min(1, k * 3.2), 30 * (1 - k * 0.6), 1);
      m.material.opacity = 1 - k * k;
    });
    burst(x, y, { count: 14, colors: [opts.color || '#fff', '#ffd700'], speed: 5, size: 3, flash: false });
  }

  function shield(x, y, opts) {
    opts = opts || {};
    ring(x, y, opts.color || '#6db6ff', 14, 66, 520);
    for (let i = 0; i < 12; i++) {
      const a = rnd(0, TAU);
      spawnDot(x + Math.cos(a) * 40, y + Math.sin(a) * 26, {
        vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 0.8 - 0.6, g: -0.02,
        decay: rnd(0.02, 0.04), size: rnd(5, 10), color: pick(['#6db6ff', '#bfe0ff']),
      });
    }
  }

  function heal(x, y) {
    for (let i = 0; i < 12; i++) {
      const m = spriteOf(letterTex('✚'), '#5fbf6d');
      m.position.set(x + rnd(-46, 46), -(y + rnd(-6, 30)), 3);
      const vy = rnd(0.8, 1.9), sz = rnd(12, 20), d = rnd(0, 260);
      addActor(m, 1100 + d, (k, dt, tt) => {
        if (tt < d) { m.material.opacity = 0; return; }
        const kk = (tt - d) / 1100;
        if (kk >= 1) return false;
        m.position.y += vy * dt;
        m.scale.set(sz, sz, 1);
        m.material.opacity = kk < 0.15 ? kk / 0.15 : 1 - (kk - 0.15) / 0.85;
      });
    }
  }

  function beam(x1, y1, x2, y2, opts) {
    opts = opts || {};
    const n = opts.count || 16;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      spawnDot(x1 + (x2 - x1) * t + rnd(-8, 8), y1 + (y2 - y1) * t + rnd(-8, 8), {
        vx: (x2 - x1) / 60 + rnd(-0.4, 0.4), vy: (y2 - y1) / 60 + rnd(-0.4, 0.4),
        decay: rnd(0.02, 0.045), color: opts.color || '#c9a227', size: rnd(5, 9),
      });
    }
  }

  function confetti() {
    for (let i = 0; i < 170; i++) {
      if (confs.length >= CCAP) break;
      _c.set(['#c9a227', '#7b4fd8', '#3f7d47', '#a2352c', '#e8d9b0'][i % 5]);
      confs.push({
        x: rnd(0, W), y: rnd(-80, 0), vx: rnd(-1, 1), vy: rnd(1.2, 3.8), g: 0.045,
        life: 1, decay: rnd(0.004, 0.009), size: rnd(10, 20),
        r: _c.r, g_: _c.g, b: _c.b, rot: rnd(0, TAU), vr: rnd(-0.12, 0.12), sway: rnd(0.5, 1.6),
      });
    }
  }

  function powerNova(x, y) {
    ring(x, y, '#ffd700', 10, 190, 900);
    ring(x, y, '#a887ff', 6, 120, 650);
    burst(x, y, { count: 70, colors: ['#ffd700', '#fff3b0', '#a887ff'], speed: 9, size: 5 });
    pulse('#c9a227', 0.5);
  }

  function shockwave(x, y, opts) {
    opts = opts || {};
    ring(x, y, opts.color || '#ffd700', 8, opts.r || 150, 550, 1.2);
    ring(x, y, '#fff', 4, (opts.r || 150) * 0.6, 380, 0.7);
  }

  /* elemental projectile: palette = {colors:[...], head:'#hex'} */
  function projectile(x1, y1, x2, y2, palette, onHit) {
    const fx = palette && palette.colors ? palette : { colors: ['#fff', '#ffd700'], head: '#fff' };
    const head = spriteOf(glowTex, fx.head || fx.colors[0]);
    head.position.set(x1, -y1, 6);
    const dur = 330;
    const mx = (x1 + x2) / 2 + rnd(-40, 40), my = Math.min(y1, y2) - rnd(60, 130);
    let fired = false;
    addActor(head, dur, (k) => {
      const u = 1 - k;
      const bx = u * u * x1 + 2 * u * k * mx + k * k * x2;
      const by = u * u * y1 + 2 * u * k * my + k * k * y2;
      head.position.set(bx, -by, 6);
      const s = 26 + 10 * Math.sin(k * 9);
      head.scale.set(s, s, 1);
      head.material.opacity = 0.95;
      for (let i = 0; i < 2; i++) {
        spawnDot(bx + rnd(-4, 4), by + rnd(-4, 4), {
          vx: rnd(-0.6, 0.6), vy: rnd(-0.6, 0.6), decay: rnd(0.03, 0.06),
          size: rnd(5, 11), color: pick(fx.colors),
        });
      }
      if (k >= 1 && !fired) {
        fired = true;
        burst(x2, y2, { count: 26, colors: fx.colors, speed: 6, size: 4 });
        ring(x2, y2, fx.colors[0], 6, 70, 420);
        if (onHit) onHit();
      }
    });
  }

  /* word volley — the signature cast: letters lift off the loom, hover
   * in an arc above the page, then slam one by one into the foe */
  function wordVolley(x1, y1, x2, y2, word, opts) {
    opts = opts || {};
    const color = opts.color || '#a887ff';
    const chars = String(word || '✦').split('');
    const n = chars.length;
    chars.forEach((ch, i) => {
      const m = spriteOf(letterTex(ch), color);
      const sx = x1 + (i - (n - 1) / 2) * 24, sy = y1;
      const hx = x1 + (i - (n - 1) / 2) * 34 + rnd(-6, 6);
      const hy = y1 - 90 - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 34;
      m.position.set(sx, -sy, 7);
      const riseEnd = 340, slamStart = 560 + i * 42, slamDur = 240;
      const total = slamStart + slamDur;
      let boomed = false;
      addActor(m, total + 60, (k, dt, tt) => {
        let px2 = sx, py2 = sy, s = 25, op = 1;
        if (tt < riseEnd) {                                       // lift off the loom
          const kk = tt / riseEnd, e = 1 - Math.pow(1 - kk, 3);
          px2 = sx + (hx - sx) * e; py2 = sy + (hy - sy) * e;
          s = 25 + 13 * e; op = 0.25 + 0.75 * kk;
        } else if (tt < slamStart) {                              // hover & shimmer
          const w2 = (tt - riseEnd) / 240;
          px2 = hx; py2 = hy + Math.sin(w2 * TAU + i) * 4;
          s = 38 + Math.sin(tt / 90 + i * 1.7) * 3;
        } else if (tt < slamStart + slamDur) {                    // slam into the foe
          const kk = (tt - slamStart) / slamDur, e = kk * kk;
          px2 = hx + (x2 - hx) * e; py2 = hy + (y2 - hy) * e;
          s = 38 - 16 * kk;
          if (kk > 0.25 && Math.random() < 0.7) spawnDot(px2, py2, {
            vx: rnd(-0.5, 0.5), vy: rnd(-0.5, 0.5), decay: 0.05, size: rnd(5, 10), color,
          });
        } else {                                                  // impact
          if (!boomed) {
            boomed = true;
            burst(x2 + rnd(-14, 14), y2 + rnd(-10, 10), { count: 9, colors: [color, '#fff'], speed: 4.5, size: 3.4, flash: i === n - 1 });
            if (i === n - 1) ring(x2, y2, color, 8, 84, 460);
          }
          return false;
        }
        m.position.set(px2, -py2, 7);
        m.scale.set(s, s, 1);
        m.material.opacity = op;
      });
    });
  }

  /* ink swirl — a foe materializes from spiralling ink */
  function inkSwirl(x, y) {
    for (let i = 0; i < 26; i++) {
      const a0 = rnd(0, TAU), r0 = rnd(60, 120), d = rnd(0, 200);
      const m = { a: a0, r: r0 };
      const dot = spriteOf(glowTex, pick(['#2e2216', '#493763', '#7b4fd8']));
      dot.material.blending = THREE.NormalBlending;
      dot.position.set(x + Math.cos(a0) * r0, -(y + Math.sin(a0) * r0 * 0.7), 3);
      addActor(dot, 620 + d, (k, dt, tt) => {
        if (tt < d) { dot.material.opacity = 0; return; }
        const kk = (tt - d) / 620;
        if (kk >= 1) return false;
        m.a += 0.14 * dt; m.r = r0 * (1 - kk);
        dot.position.set(x + Math.cos(m.a) * m.r, -(y + Math.sin(m.a) * m.r * 0.7), 3);
        const s = 14 * (1 - kk * 0.5);
        dot.scale.set(s, s, 1);
        dot.material.opacity = 0.75 * Math.min(1, kk * 3) * (1 - kk * 0.4);
      });
    }
    ring(x, y, '#7b4fd8', 70, 10, 620, 0.5);
  }

  /* dissolve — a felled foe scatters into embers and motes */
  function dissolve(x, y, opts) {
    opts = opts || {};
    const colors = opts.colors || ['#8a8578', '#c9a227', '#3a2c1a', '#a887ff'];
    for (let i = 0; i < 42; i++) {
      spawnDot(x + rnd(-40, 40), y + rnd(-44, 40), {
        vx: rnd(-0.5, 0.5), vy: rnd(-1.6, -0.3), g: -0.012, drag: 0.99,
        decay: rnd(0.008, 0.02), size: rnd(4, 12), color: pick(colors),
      });
    }
    ring(x, y, '#c9a227', 30, 90, 700, 0.55);
  }

  /* ---------- screen pulse (vignette flash) ---------- */
  const vig = document.createElement('div');
  vig.id = 'gl-pulse';
  document.body.appendChild(vig);
  function pulse(color, strength) {
    vig.style.boxShadow = `inset 0 0 ${Math.round(120 + 160 * (strength || 0.5))}px ${color || '#a2352c'}`;
    vig.animate([{ opacity: Math.min(1, 0.55 + (strength || 0.5) * 0.5) }, { opacity: 0 }],
      { duration: 480, easing: 'ease-out' });
  }

  /* ---------- thread-weave screen transition ----------
   * Golden threads shoot across the page while the screen re-renders
   * beneath them — WORDLOOM's answer to a page flip. */
  let weaving = false;
  function weaveTransition(renderFn) {
    if (weaving) { renderFn(); return true; }
    const scr = document.getElementById('screen');
    if (!scr) return false;
    const r = scr.getBoundingClientRect();
    if (r.width < 60) return false;
    weaving = true;
    const N = 9;
    for (let i = 0; i < N; i++) {
      const y = r.top + (i + 0.5) * (r.height / N);
      const ltr = i % 2 === 0;
      const m = spriteOf(streakTex, i % 3 === 2 ? '#a887ff' : '#e8c96a');
      m.position.set(ltr ? r.left - 100 : r.right + 100, -y, 9);
      const delay = i * 26, dur = 460;
      addActor(m, dur + delay + 40, (k, dt, tt) => {
        if (tt < delay) { m.material.opacity = 0; return; }
        const kk = Math.min(1, (tt - delay) / dur);
        const e = kk < 0.5 ? 2 * kk * kk : 1 - Math.pow(-2 * kk + 2, 2) / 2;
        const x = ltr ? (r.left - 100) + (r.width + 200) * e : (r.right + 100) - (r.width + 200) * e;
        m.position.set(x, -(y + Math.sin(kk * TAU * 1.5 + i) * 5), 9);
        m.scale.set(240, 14, 1);
        m.material.opacity = Math.sin(kk * Math.PI) * 0.9;
        if (Math.random() < 0.35) spawnDot(x + rnd(-30, 30), y + rnd(-4, 4), {
          vx: rnd(-0.4, 0.4), vy: rnd(-0.3, 0.3), decay: rnd(0.04, 0.08),
          size: rnd(4, 8), color: i % 3 === 2 ? '#a887ff' : '#e8c96a',
        });
        if (kk >= 1) return false;
      });
    }
    setTimeout(() => { try { renderFn(); } catch (err) { console.error(err); } }, 240);
    setTimeout(() => { weaving = false; }, 620);
    return true;
  }

  /* ---------- sim & render loop ---------- */
  let running = true, lost = false;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(tick); });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); lost = true;
    canvas.style.display = 'none';
    Object.assign(window.FX, FX2D);                     // restore the 2D engine
  }, false);

  let lastT = 0;
  function tick(t) {
    if (!running || lost) return;
    requestAnimationFrame(tick);
    const dt = Math.min(50, t - lastT) / 16.7; lastT = t;

    // dots
    let n = 0;
    for (let i = dots.length - 1; i >= 0; i--) {
      const p = dots[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) { dots.splice(i, 1); continue; }
      p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      dPos[n * 3] = p.x; dPos[n * 3 + 1] = -p.y; dPos[n * 3 + 2] = 1;
      dCol[n * 3] = p.r; dCol[n * 3 + 1] = p.g_; dCol[n * 3 + 2] = p.b;
      dSize[n] = p.size * p.life;
      dAlpha[n] = Math.min(1, p.life * 1.6);
      n++;
    }
    dGeo.setDrawRange(0, n);
    dGeo.attributes.position.needsUpdate = true;
    dGeo.attributes.aColor.needsUpdate = true;
    dGeo.attributes.aSize.needsUpdate = true;
    dGeo.attributes.aAlpha.needsUpdate = true;

    // confetti
    let cn = 0;
    for (let i = confs.length - 1; i >= 0; i--) {
      const p = confs[i];
      p.life -= p.decay * dt;
      if (p.life <= 0 || p.y > H + 30) { confs.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += (p.vx + Math.sin(t / 400 + p.rot * 3) * p.sway) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      cPos[cn * 3] = p.x; cPos[cn * 3 + 1] = -p.y; cPos[cn * 3 + 2] = 1;
      cCol[cn * 3] = p.r; cCol[cn * 3 + 1] = p.g_; cCol[cn * 3 + 2] = p.b;
      cSize[cn] = p.size;
      cAlpha[cn] = Math.min(1, p.life * 2.2);
      cRot[cn] = p.rot;
      cn++;
    }
    cGeo.setDrawRange(0, cn);
    cGeo.attributes.position.needsUpdate = true;
    cGeo.attributes.aColor.needsUpdate = true;
    cGeo.attributes.aSize.needsUpdate = true;
    cGeo.attributes.aAlpha.needsUpdate = true;
    cGeo.attributes.aRot.needsUpdate = true;

    // actors
    for (let i = actors.length - 1; i >= 0; i--) {
      const a = actors[i];
      const tt = t - a.t0;
      const k = Math.min(1, tt / a.ttl);
      const alive = a.update(k, dt, tt);
      if (alive === false || k >= 1) {
        scene.remove(a.obj);
        if (a.obj.geometry) a.obj.geometry.dispose();
        if (a.obj.material) a.obj.material.dispose();
        actors.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  /* ---------- upgrade the FX API in place (2D stays as fallback) ---------- */
  const FX2D = Object.assign({}, window.FX);
  Object.assign(window.FX, {
    burst, runes, slash, shield, heal, beam, confetti, powerNova, shockwave,
    // new powers, GL-only:
    projectile, wordVolley, inkSwirl, dissolve, pulse,
  });
  window.GLFX = { weaveTransition };
})();
