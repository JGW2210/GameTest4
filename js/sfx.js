/* ============================================================
 * LEXICON ARCANUM — WebAudio soundscape (fully synthesized,
 * zero asset files). Page rustles, quill snaps, tile flips,
 * spell impacts, chimes, stingers.
 * ============================================================ */
(function () {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('lexicon-muted') === '1'; } catch (e) {}

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noiseBuffer(c, seconds) {
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function env(c, node, t0, a, d, peak) {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    node.connect(g); g.connect(c.destination);
    return g;
  }

  function tone(freq, type, a, d, peak, bend) {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * bend), t0 + a + d);
    env(c, o, t0, a || 0.01, d || 0.15, peak || 0.12);
    o.start(t0); o.stop(t0 + (a || 0.01) + (d || 0.15) + 0.05);
  }

  function noise(a, d, peak, filterFreq, q, bendTo) {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, a + d + 0.1);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(filterFreq || 1200, t0);
    if (bendTo) f.frequency.exponentialRampToValueAtTime(bendTo, t0 + a + d);
    f.Q.value = q || 1;
    src.connect(f);
    env(c, f, t0, a, d, peak);
    src.start(t0); src.stop(t0 + a + d + 0.1);
  }

  function chord(freqs, gap, type, d, peak) {
    freqs.forEach((f, i) => setTimeout(() => tone(f, type || 'triangle', 0.01, d || 0.35, peak || 0.09), i * (gap || 70)));
  }

  const SFX = {
    flip() { noise(0.03, 0.28, 0.14, 900, 0.7, 300); },
    card() { noise(0.008, 0.09, 0.16, 2600, 1.4, 900); },
    key() { tone(720 + Math.random() * 120, 'square', 0.004, 0.04, 0.025); },
    tile() { noise(0.006, 0.07, 0.08, 3200, 2); },
    wrong() { chord([196, 155], 90, 'sawtooth', 0.22, 0.05); },
    correct() { chord([523, 659, 784, 1047], 65, 'triangle', 0.4, 0.09); },
    autocast() { chord([392, 523, 659, 784, 1047], 45, 'sine', 0.5, 0.08); },
    power() { chord([262, 330, 392, 523, 659, 784], 70, 'triangle', 0.8, 0.11); },
    spell(school) {
      const base = { ignium: 180, astral: 520, aegian: 320, pestis: 240, sanguine: 200, umbral: 140, mentis: 620, fulmen: 700 }[school] || 400;
      tone(base, 'sawtooth', 0.015, 0.3, 0.09, 0.5);
      noise(0.01, 0.25, 0.1, base * 4, 1.2, base);
    },
    hit() { noise(0.005, 0.16, 0.2, 240, 0.8, 90); tone(90, 'sine', 0.005, 0.12, 0.12, 0.6); },
    block() { tone(420, 'triangle', 0.005, 0.14, 0.1, 0.85); noise(0.005, 0.08, 0.06, 2000, 3); },
    heal() { chord([440, 554, 659], 80, 'sine', 0.4, 0.06); },
    coin() { tone(1320, 'square', 0.004, 0.1, 0.06); setTimeout(() => tone(1760, 'square', 0.004, 0.16, 0.05), 60); },
    scry() { tone(880, 'sine', 0.02, 0.3, 0.07, 1.4); },
    relic() { chord([392, 494, 587, 740], 85, 'triangle', 0.5, 0.09); },
    stinger() { chord([110, 117, 110], 160, 'sawtooth', 0.7, 0.09); },
    victory() { chord([392, 523, 659, 784, 1047, 1319], 110, 'triangle', 0.7, 0.1); },
    defeat() { chord([220, 208, 196, 175], 220, 'sine', 0.9, 0.09); },
    attune() { chord([587, 880], 60, 'sine', 0.3, 0.07); },
    energy() { tone(980, 'triangle', 0.01, 0.12, 0.07, 1.3); },
  };

  window.Sfx = new Proxy(SFX, {
    get(t, k) {
      if (k === 'muted') return muted;
      if (k === 'toggleMute') return () => {
        muted = !muted;
        try { localStorage.setItem('lexicon-muted', muted ? '1' : '0'); } catch (e) {}
        return muted;
      };
      const fn = t[k];
      return typeof fn === 'function' ? fn.bind(t) : () => {};
    },
  });
})();
