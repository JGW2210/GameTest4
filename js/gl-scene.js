/* ============================================================
 * WORDLOOM — three.js ambient scene (the weaver's study)
 * A WebGL layer behind the page: a candlelit workbench with a
 * living flame, volumetric dust in the light beam, drifting
 * thread-mist tinted by game state, and a starfield ceiling
 * whose constellation is seeded by the current world.
 * Degrades gracefully: without WebGL/three.js (or with reduced
 * motion preferred) the CSS backdrop remains untouched.
 * ============================================================ */
(function () {
  if (!window.THREE) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const COARSE = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  let renderer;
  const canvas = document.createElement('canvas');
  canvas.id = 'gl-bg';
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  document.body.insertBefore(canvas, document.body.firstChild);
  document.body.classList.add('gl-on');

  const DPR = Math.min(COARSE ? 1.25 : 1.75, window.devicePixelRatio || 1);
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 10, 6000);
  camera.position.set(0, 430, 620);
  camera.lookAt(0, 70, -40);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- procedural textures ---------- */
  function canvasTex(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    return new THREE.CanvasTexture(c);
  }
  const woodTex = canvasTex(512, (g, s) => {
    g.fillStyle = '#261a0e'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) { // planks
      const x = (i * 37) % s;
      g.fillStyle = `rgba(${38 + (i * 13) % 20}, ${26 + (i * 7) % 13}, 12, 0.55)`;
      g.fillRect(x, 0, 22 + (i * 11) % 20, s);
    }
    g.globalAlpha = 0.18; // grain streaks
    for (let i = 0; i < 300; i++) {
      g.strokeStyle = Math.random() < 0.5 ? '#160d05' : '#54381d';
      g.lineWidth = rnd(0.4, 1.4);
      const x = rnd(0, s), y = rnd(0, s);
      g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 4, y + rnd(20, 90), x - 4, y + rnd(90, 170), x + rnd(-6, 6), y + rnd(170, 260)); g.stroke();
    }
    g.globalAlpha = 1;
  });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(3, 2);

  const softDot = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });

  const smokeTex = canvasTex(256, (g, s) => {
    for (let i = 0; i < 46; i++) {
      const x = rnd(30, s - 30), y = rnd(30, s - 30), r = rnd(18, 62);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.10)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  });

  /* ---------- the workbench ---------- */
  const deskMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4200, 2600),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.92, metalness: 0.04 })
  );
  deskMesh.rotation.x = -Math.PI / 2;
  scene.add(deskMesh);

  scene.add(new THREE.AmbientLight(0x2a1c10, 1.1));
  const candle = new THREE.PointLight(0xffaa44, 2.4, 2400, 1.6);
  candle.position.set(0, 420, 80);
  scene.add(candle);
  const rim = new THREE.PointLight(0x7b4fd8, 0.5, 2000, 2); // faint arcane rim
  rim.position.set(-700, 220, 200);
  scene.add(rim);

  // soft shadow pooled beneath where the woven page rests
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(430, 40),
    new THREE.MeshBasicMaterial({ map: softDot, color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.5, 1, 1);
  shadow.position.set(0, 1.5, -60);
  scene.add(shadow);

  /* ---------- breathing light cone ---------- */
  const coneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(0xffaa55) }, uOp: { value: 0.05 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform vec3 uColor; uniform float uOp;
      void main(){
        float a = smoothstep(0.0, 0.7, vUv.y) * uOp;      /* brighter near the flame */
        a *= smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(70, 560, 460, 40, 1, true), coneMat);
  cone.position.set(0, 230, 40);
  scene.add(cone);

  /* ---------- volumetric dust in the beam ---------- */
  const DUST_N = COARSE ? 350 : 800;
  const dustPos = new Float32Array(DUST_N * 3);
  const dustVel = new Float32Array(DUST_N * 3);
  const dustPhase = new Float32Array(DUST_N);
  function seedMote(i) {
    const y = rnd(10, 470);
    const r = (90 + (1 - y / 470) * 420) * Math.sqrt(Math.random());
    const a = rnd(0, Math.PI * 2);
    dustPos[i * 3] = Math.cos(a) * r;
    dustPos[i * 3 + 1] = y;
    dustPos[i * 3 + 2] = 40 + Math.sin(a) * r * 0.7;
    dustVel[i * 3] = rnd(-0.06, 0.06);
    dustVel[i * 3 + 1] = rnd(-0.10, -0.02);
    dustVel[i * 3 + 2] = rnd(-0.04, 0.04);
    dustPhase[i] = rnd(0, Math.PI * 2);
  }
  for (let i = 0; i < DUST_N; i++) seedMote(i);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: softDot, color: 0xffd9a0, size: 5.5, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  scene.add(dust);

  /* ---------- thread-mist wisps ---------- */
  const wisps = [];
  for (let i = 0; i < (COARSE ? 3 : 5); i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(rnd(800, 1300), rnd(380, 560)),
      new THREE.MeshBasicMaterial({
        map: smokeTex, transparent: true, opacity: 0.10, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0x8a63d8, side: THREE.DoubleSide,
      })
    );
    m.position.set(rnd(-700, 700), rnd(60, 260), rnd(-260, 220));
    m.rotation.z = rnd(0, Math.PI);
    m.userData = { vx: rnd(0.08, 0.22) * (i % 2 ? 1 : -1), vr: rnd(-0.0005, 0.0005), baseOp: rnd(0.06, 0.13) };
    scene.add(m);
    wisps.push(m);
  }

  /* ---------- starfield & constellation ceiling ---------- */
  const STAR_N = COARSE ? 160 : 330;
  const starPos = new Float32Array(STAR_N * 3);
  for (let i = 0; i < STAR_N; i++) {
    starPos[i * 3] = rnd(-2200, 2200);
    starPos[i * 3 + 1] = rnd(650, 1150);
    starPos[i * 3 + 2] = rnd(-1900, -300);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    map: softDot, color: 0xcdd8ff, size: 7, transparent: true, opacity: 0.35,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(stars);
  const stars2 = new THREE.Points(starGeo.clone(), stars.material.clone());
  stars2.material.size = 11; stars2.material.opacity = 0.14;
  stars2.rotation.y = 0.4;
  scene.add(stars2);

  let constel = null;
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function setWorld(worldId) {
    if (constel) { scene.remove(constel); constel.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    constel = new THREE.Group();
    const rng = mulberry(hashStr(String(worldId || 'margins')));
    const cx = -600 + rng() * 1200, cy = 780 + rng() * 220, cz = -1100;
    const n = 6 + Math.floor(rng() * 4);
    const pts = [];
    for (let i = 0; i < n; i++) {
      pts.push(new THREE.Vector3(cx + (rng() - 0.5) * 640, cy + (rng() - 0.5) * 330, cz + (rng() - 0.5) * 140));
    }
    const bright = new THREE.BufferGeometry().setFromPoints(pts);
    constel.add(new THREE.Points(bright, new THREE.PointsMaterial({
      map: softDot, color: 0xffe9b0, size: 22, transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })));
    const linePts = [];
    for (let i = 0; i < pts.length - 1; i++) { linePts.push(pts[i], pts[i + 1]); }
    const lines = new THREE.BufferGeometry().setFromPoints(linePts);
    constel.add(new THREE.LineSegments(lines, new THREE.LineBasicMaterial({
      color: 0x8a7fd0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false,
    })));
    scene.add(constel);
  }
  setWorld('margins');

  /* ---------- moods ---------- */
  const MOODS = {
    title:   { candle: 0xffaa44, intensity: 2.3, wisp: 0x8a63d8, wispMul: 1.0, cone: 0xffaa55 },
    map:     { candle: 0xffb85c, intensity: 2.5, wisp: 0xc9a227, wispMul: 0.9, cone: 0xffbb66 },
    battle:  { candle: 0xff9a3c, intensity: 2.7, wisp: 0x7b4fd8, wispMul: 1.7, cone: 0xff9a55 },
    victory: { candle: 0xffd27a, intensity: 3.3, wisp: 0xc9a227, wispMul: 1.5, cone: 0xffd280 },
  };
  const cur = { candle: new THREE.Color(0xffaa44), wisp: new THREE.Color(0x8a63d8), intensity: 2.3, wispMul: 1, cone: new THREE.Color(0xffaa55) };
  const target = { candleC: new THREE.Color(MOODS.title.candle), wispC: new THREE.Color(MOODS.title.wisp), coneC: new THREE.Color(MOODS.title.cone), intensity: MOODS.title.intensity, wispMul: MOODS.title.wispMul };
  function setMood(name) {
    const m = MOODS[name] || MOODS.title;
    target.candleC = new THREE.Color(m.candle);
    target.wispC = new THREE.Color(m.wisp);
    target.coneC = new THREE.Color(m.cone);
    target.intensity = m.intensity;
    target.wispMul = m.wispMul;
  }

  /* ---------- pointer parallax ---------- */
  let px = 0, py = 0;
  if (!COARSE) window.addEventListener('pointermove', (e) => {
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- render loop ---------- */
  let flick = 0, running = true, lost = false;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(tick); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; canvas.style.display = 'none'; document.body.classList.remove('gl-on'); }, false);

  let lastT = 0;
  function tick(t) {
    if (!running || lost) return;
    requestAnimationFrame(tick);
    const dt = Math.min(50, t - lastT) / 16.7; lastT = t;

    // candle flicker: smoothed random walk
    flick += (Math.random() - 0.5) * 0.28; flick *= 0.86;
    cur.candle.lerp(target.candleC, 0.03);
    cur.wisp.lerp(target.wispC, 0.03);
    cur.cone.lerp(target.coneC, 0.03);
    cur.intensity += (target.intensity - cur.intensity) * 0.03;
    cur.wispMul += (target.wispMul - cur.wispMul) * 0.03;
    candle.color.copy(cur.candle);
    candle.intensity = cur.intensity * (1 + flick * 0.22) * (0.94 + 0.06 * Math.sin(t / 900));
    coneMat.uniforms.uColor.value.copy(cur.cone);
    coneMat.uniforms.uOp.value = 0.045 * (1 + flick * 0.3) * (0.9 + 0.1 * Math.sin(t / 1300));
    cone.rotation.y = t / 9000;

    // dust drift
    for (let i = 0; i < DUST_N; i++) {
      dustPos[i * 3] += (dustVel[i * 3] + Math.sin(t / 2200 + dustPhase[i]) * 0.03) * dt;
      dustPos[i * 3 + 1] += dustVel[i * 3 + 1] * dt;
      dustPos[i * 3 + 2] += dustVel[i * 3 + 2] * dt;
      if (dustPos[i * 3 + 1] < 4) seedMote(i);
    }
    dustGeo.attributes.position.needsUpdate = true;

    // thread-mist
    wisps.forEach(w => {
      w.position.x += w.userData.vx * dt;
      w.rotation.z += w.userData.vr * dt;
      if (w.position.x > 1000) w.position.x = -1000;
      if (w.position.x < -1000) w.position.x = 1000;
      w.material.color.copy(cur.wisp);
      w.material.opacity = w.userData.baseOp * cur.wispMul * (0.85 + 0.15 * Math.sin(t / 1700 + w.position.x));
    });

    // star twinkle & constellation shimmer
    stars.material.opacity = 0.30 + 0.08 * Math.sin(t / 780);
    stars2.material.opacity = 0.10 + 0.06 * Math.sin(t / 1150 + 2);
    if (constel) constel.children[0].material.opacity = 0.7 + 0.25 * Math.sin(t / 620);

    // pointer parallax
    camera.position.x += ((px * 26) - camera.position.x) * 0.04;
    camera.position.y += ((430 - py * 14) - camera.position.y) * 0.04;
    camera.lookAt(0, 70, -40);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  window.GLBG = { setMood, setWorld };
})();
