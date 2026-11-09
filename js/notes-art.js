/* ==========================================================
   Gülizar — şişeye özel nota animasyonları
   Her kokunun üst / kalp / dip notası için:
     • kemer içinde kodla çizilmiş bir sahne (F.NOTE_SCENES)
     • bölüm arka planında süzülen parçacıklar (F.BG_KINDS)
   Temaların listesi en altta: F.NOTE_THEMES
   ========================================================== */
(function () {
  'use strict';
  const F = window.FARO = window.FARO || {};
  const A = F.ART;
  const { TAU, rand, clamp, sprite, bokeh, cached, leaf, seeded } = A;

  /* ---------- yardımcılar ---------- */
  function bg(c, W, H, st, c1, c2, glow, gx, gy) {
    c.drawImage(cached(st, 'bg', W, H, (x) => {
      let g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      if (glow) {
        const px = W * (gx == null ? 0.5 : gx), py = H * (gy == null ? 0.45 : gy);
        g = x.createRadialGradient(px, py, 0, px, py, W * 0.85);
        g.addColorStop(0, glow);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
      }
    }), 0, 0);
  }

  // Bir sahne parçasını kendi tuvaline bir kez çizip ortasından yerleştirir
  function stamp(c, st, key, w, h, draw, x, y, rot, sc) {
    const img = cached(st, key, Math.ceil(w), Math.ceil(h), draw);
    c.save();
    c.translate(x, y);
    if (rot) c.rotate(rot);
    if (sc && sc !== 1) c.scale(sc, sc);
    c.drawImage(img, -img.width / 2, -img.height / 2);
    c.restore();
  }

  function petalPath(c, r, w, pointed) {
    c.beginPath();
    c.moveTo(0, 0);
    if (pointed) {
      c.bezierCurveTo(r * 0.35, -w, r * 0.8, -w * 0.55, r, 0);
      c.bezierCurveTo(r * 0.8, w * 0.55, r * 0.35, w, 0, 0);
    } else {
      c.bezierCurveTo(r * 0.25, -w, r * 0.95, -w * 1.05, r, 0);
      c.bezierCurveTo(r * 0.95, w * 1.05, r * 0.25, w, 0, 0);
    }
  }

  /* Çiçek: n yaprak, merkez (organ / nokta). x merkezi (0,0) kabul eder */
  function flower(c, R, o) {
    const n = o.n || 5;
    for (let i = 0; i < n; i++) {
      c.save();
      c.rotate((i / n) * TAU + (o.twist || 0));
      if (o.skew) c.transform(1, 0, o.skew, 1, 0, 0);
      const g = c.createLinearGradient(0, 0, R, 0);
      g.addColorStop(0, o.c0);
      g.addColorStop(0.55, o.c1);
      g.addColorStop(1, o.c2);
      c.fillStyle = g;
      petalPath(c, R, R * (o.w || 0.42), o.pointed);
      c.fill();
      c.strokeStyle = o.vein || 'rgba(0,0,0,0.08)';
      c.lineWidth = Math.max(1, R * 0.02);
      c.beginPath(); c.moveTo(R * 0.12, 0); c.lineTo(R * 0.8, 0); c.stroke();
      c.restore();
    }
    if (o.center === 'stamens') {
      c.strokeStyle = o.fil || '#fff3c0';
      c.lineWidth = Math.max(1, R * 0.018);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + 0.2, r = R * (0.26 + (i % 3) * 0.05);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke();
        c.fillStyle = o.cc || '#f5c542';
        c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, R * 0.035, 0, TAU); c.fill();
      }
      c.fillStyle = '#c9d77a';
      c.beginPath(); c.arc(0, 0, R * 0.08, 0, TAU); c.fill();
    } else if (o.center === 'tube') {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.16);
      g.addColorStop(0, o.cc || '#f3e3a0');
      g.addColorStop(1, 'rgba(243,227,160,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(0, 0, R * 0.16, 0, TAU); c.fill();
    } else if (o.center === 'lip') {
      c.fillStyle = o.cc || '#f2d35a';
      c.beginPath(); c.ellipse(0, R * 0.08, R * 0.2, R * 0.26, 0, 0, TAU); c.fill();
      c.fillStyle = o.cc2 || '#e8a030';
      c.beginPath(); c.ellipse(0, R * 0.04, R * 0.08, R * 0.12, 0, 0, TAU); c.fill();
    }
  }

  function glossyDrop(c, x, y, r, stretch, inner, outer) {
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3 * stretch, 0, x, y, r * 1.25);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, r, r * stretch, 0, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath();
    c.ellipse(x - r * 0.32, y - r * 0.35 * stretch, r * 0.22, r * 0.3, -0.4, 0, TAU);
    c.fill();
  }

  // Basit parçacık üretici: saniyede `rate` adet, en fazla `max`
  function emit(st, key, rate, dt, max, make) {
    const arr = st[key] || (st[key] = []);
    st[key + 'Acc'] = (st[key + 'Acc'] || 0) + rate * dt;
    while (st[key + 'Acc'] >= 1) { st[key + 'Acc'] -= 1; if (arr.length < max) arr.push(make()); }
    return arr;
  }

  function soft(c, rgb, x, y, r, a, core) {
    c.globalAlpha = a;
    c.drawImage(sprite(rgb, core), x - r, y - r, r * 2, r * 2);
  }

  /* Bulanık bulut / misk: sahne içinde yavaşça süzülen yumuşak lekeler */
  function driftClouds(c, W, H, t, st, rgb, n, alpha) {
    if (!st.clouds) {
      const r = seeded(91);
      st.clouds = Array.from({ length: n }, () => ({ x: r() * W, y: (0.15 + r() * 0.7) * H, r: (0.18 + r() * 0.25) * W, v: (r() - 0.5) * 0.04 * W, ph: r() * TAU }));
    }
    c.globalCompositeOperation = 'lighter';
    for (const p of st.clouds) {
      const x = ((p.x + p.v * t) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3;
      soft(c, rgb, x, p.y + Math.sin(t * 0.3 + p.ph) * H * 0.02, p.r, alpha * (0.6 + 0.4 * Math.sin(t * 0.4 + p.ph)), 0.5);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  function amberChunk(x, R, seed) {
    const r = seeded(seed);
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r() * 0.5;
      const rr = R * (0.7 + r() * 0.35);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]);
    }
    x.beginPath();
    pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
    x.closePath();
    const g = x.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.05, 0, 0, R * 1.05);
    g.addColorStop(0, '#ffe7a8');
    g.addColorStop(0.35, '#f5a838');
    g.addColorStop(0.75, '#b5530d');
    g.addColorStop(1, '#4a1a04');
    x.fillStyle = g;
    x.fill();
    x.strokeStyle = 'rgba(255,236,190,0.25)';
    x.lineWidth = Math.max(1, R * 0.03);
    x.stroke();
    // iç yüzeyler
    x.strokeStyle = 'rgba(255,240,200,0.16)';
    const cx = -R * 0.1, cy = -R * 0.05;
    pts.forEach((p) => { x.beginPath(); x.moveTo(cx, cy); x.lineTo(p[0], p[1]); x.stroke(); });
    // hava kabarcıkları
    x.fillStyle = 'rgba(255,250,220,0.55)';
    for (let i = 0; i < 5; i++) { x.beginPath(); x.arc((r() - 0.5) * R, (r() - 0.5) * R * 0.8, R * (0.02 + r() * 0.04), 0, TAU); x.fill(); }
    // parlama
    x.fillStyle = 'rgba(255,255,240,0.45)';
    x.beginPath(); x.ellipse(-R * 0.35, -R * 0.38, R * 0.22, R * 0.09, -0.5, 0, TAU); x.fill();
  }

  /* ==========================================================
     SAHNELER
     ========================================================== */
  const S = {};

  /* Kuru Gül · üst: pembe biber + safran */
  S.pepperSaffron = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#5a1426', '#14040a', 'rgba(255,120,150,0.35)', 0.5, 0.45);
    const cx = W * 0.5, cy = H * 0.5;
    stamp(c, st, 'cluster', W, W, (x) => {
      const r = seeded(7);
      const pts = Array.from({ length: 17 }, () => {
        const a = r() * TAU, d = Math.sqrt(r()) * W * 0.22;
        return { x: W / 2 + Math.cos(a) * d, y: W / 2 + Math.sin(a) * d * 0.85, s: W * (0.045 + r() * 0.03) };
      }).sort((a, b) => a.y - b.y);
      for (const p of pts) {
        const g = x.createRadialGradient(p.x - p.s * 0.35, p.y - p.s * 0.4, p.s * 0.05, p.x, p.y, p.s);
        g.addColorStop(0, '#ffd3dd');
        g.addColorStop(0.35, '#e8607c');
        g.addColorStop(0.8, '#9c1f38');
        g.addColorStop(1, '#3e0612');
        x.fillStyle = g;
        x.beginPath(); x.arc(p.x, p.y, p.s, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(70,0,20,0.35)';
        x.lineWidth = Math.max(1, p.s * 0.08);
        x.beginPath(); x.arc(p.x + p.s * 0.1, p.y + p.s * 0.05, p.s * 0.55, 0.4, 2.2); x.stroke();
      }
    }, cx, cy + Math.sin(t * 0.8) * W * 0.008, Math.sin(t * 0.4) * 0.04);

    // safran iplikleri yukarıdan süzülür
    const th = emit(st, 'threads', 4, dt, 30, () => ({ x: rand(0.05, 0.95) * W, y: -0.05 * H, vy: rand(0.05, 0.11) * H, rot: rand(0, TAU), vr: rand(-1, 1), len: rand(0.06, 0.1) * W, curl: rand(-0.5, 0.5), ph: rand(0, TAU) }));
    c.lineCap = 'round';
    for (let i = th.length - 1; i >= 0; i--) {
      const p = th[i];
      p.y += p.vy * dt; p.rot += p.vr * dt; p.ph += dt;
      if (p.y > H * 1.05) { th.splice(i, 1); continue; }
      c.save();
      c.translate(p.x + Math.sin(p.ph) * W * 0.02, p.y);
      c.rotate(p.rot);
      c.strokeStyle = '#d23218';
      c.lineWidth = Math.max(1, W * 0.007);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(p.len * 0.5, p.curl * p.len, p.len, 0); c.stroke();
      c.fillStyle = '#ffb030';
      c.beginPath(); c.arc(p.len, 0, W * 0.006, 0, TAU); c.fill();
      c.restore();
    }
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const tw = Math.max(0, Math.sin(t * 1.7 + i * 2.1));
      soft(c, '255,210,220', cx + Math.cos(i * 2.4) * W * 0.17, cy + Math.sin(i * 2.4) * W * 0.14, W * 0.03 * tw, 0.8 * tw);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  /* Kuru Gül · dip: paçuli + amber */
  S.patchouliAmber = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#2c1709', '#070402', 'rgba(255,150,60,0.28)', 0.5, 0.7);
    // duman
    const sm = emit(st, 'smoke', 1.6, dt, 14, () => ({ x: rand(0.3, 0.7) * W, y: H * 0.7, life: 0, max: rand(4, 6), r: W * rand(0.12, 0.2), vx: rand(-0.03, 0.03) * W }));
    for (let i = sm.length - 1; i >= 0; i--) {
      const p = sm[i];
      p.life += dt;
      if (p.life > p.max) { sm.splice(i, 1); continue; }
      const f = p.life / p.max;
      soft(c, '120,95,80', p.x + p.vx * p.life + Math.sin(p.life) * W * 0.03, p.y - f * H * 0.6, p.r * (1 + f), 0.16 * Math.sin(f * Math.PI), 0.5);
    }
    c.globalAlpha = 1;
    // paçuli yaprakları
    stamp(c, st, 'leaves', W, H, (x) => {
      const L = W * 0.48;
      leaf(x, W * 0.05, H * 0.82, L, -0.5, '#16240e', '#3a5a20', 'rgba(170,210,120,0.25)');
      leaf(x, W * 0.95, H * 0.86, L * 0.9, Math.PI + 0.45, '#16240e', '#334f1c', 'rgba(170,210,120,0.25)');
      leaf(x, W * 0.2, H * 0.98, L * 0.8, -1.1, '#101c0a', '#2c4818', 'rgba(170,210,120,0.2)');
      leaf(x, W * 0.82, H * 1.0, L * 0.75, Math.PI + 1.2, '#101c0a', '#2c4818', 'rgba(170,210,120,0.2)');
    }, W / 2, H / 2, Math.sin(t * 0.5) * 0.01);
    // amber parçaları
    const chunks = [[0.5, 0.5, 0.2, 3], [0.3, 0.68, 0.13, 11], [0.7, 0.66, 0.15, 23]];
    chunks.forEach(([px, py, rs, sd], i) => {
      const R = W * rs, S2 = R * 2.6;
      const bob = Math.sin(t * 0.7 + i * 2) * W * 0.008;
      c.globalCompositeOperation = 'lighter';
      soft(c, '255,170,60', px * W, py * H + bob, R * 2.2, 0.22 + 0.12 * Math.sin(t * 1.3 + i));
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      stamp(c, st, 'amber' + i, S2, S2, (x) => { x.translate(S2 / 2, S2 / 2); amberChunk(x, R, sd); }, px * W, py * H + bob, Math.sin(t * 0.3 + i) * 0.08);
    });
  };

  /* Narenciye Bahçesi · kalp: neroli + portakal çiçeği */
  S.blossom = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#3a3410', '#0e0c03', 'rgba(255,210,120,0.32)', 0.55, 0.4);
    stamp(c, st, 'branch', W, H, (x) => {
      x.strokeStyle = '#2c3a14';
      x.lineCap = 'round';
      x.lineWidth = W * 0.02;
      x.beginPath(); x.moveTo(-W * 0.05, H * 0.95); x.bezierCurveTo(W * 0.3, H * 0.7, W * 0.35, H * 0.5, W * 0.56, H * 0.38); x.stroke();
      x.lineWidth = W * 0.012;
      x.beginPath(); x.moveTo(W * 0.3, H * 0.62); x.quadraticCurveTo(W * 0.3, H * 0.4, W * 0.32, H * 0.3); x.stroke();
      x.beginPath(); x.moveTo(W * 0.45, H * 0.48); x.quadraticCurveTo(W * 0.62, H * 0.55, W * 0.7, H * 0.62); x.stroke();
      leaf(x, W * 0.22, H * 0.74, W * 0.32, -2.4, '#1e4a14', '#4f8a2a');
      leaf(x, W * 0.4, H * 0.55, W * 0.28, 0.5, '#1e4a14', '#4f8a2a');
      leaf(x, W * 0.5, H * 0.43, W * 0.26, -1.0, '#1e4a14', '#5a9a30');
      // küçük portakal
      const ox = W * 0.24, oy = H * 0.86, orr = W * 0.12;
      const g = x.createRadialGradient(ox - orr * 0.35, oy - orr * 0.4, orr * 0.1, ox, oy, orr);
      g.addColorStop(0, '#ffd27a'); g.addColorStop(0.5, '#f08a1a'); g.addColorStop(1, '#7a3204');
      x.fillStyle = g;
      x.beginPath(); x.arc(ox, oy, orr, 0, TAU); x.fill();
      x.fillStyle = 'rgba(120,50,0,0.25)';
      const r = seeded(5);
      for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(ox + (r() - 0.5) * orr * 1.6, oy + (r() - 0.5) * orr * 1.6, orr * 0.02, 0, TAU); x.fill(); }
    }, W / 2, H / 2);
    const fl = { n: 5, c0: '#fff3d6', c1: '#fffdf6', c2: '#f2e6c6', w: 0.5, center: 'stamens', cc: '#f5c542', fil: '#fff3c0', vein: 'rgba(200,170,110,0.18)' };
    [[0.56, 0.36, 0.2, 0], [0.32, 0.28, 0.14, 1], [0.7, 0.6, 0.12, 2]].forEach(([px, py, rs, i]) => {
      const R = W * rs, S2 = R * 2.4;
      stamp(c, st, 'fl' + i, S2, S2, (x) => { x.translate(S2 / 2, S2 / 2); flower(x, R, fl); },
        px * W, py * H, t * 0.05 * (i % 2 ? -1 : 1) + i, 1 + Math.sin(t * 0.9 + i) * 0.03);
    });
    // düşen beyaz yapraklar
    const pt = emit(st, 'petals', 2.2, dt, 14, () => ({ x: rand(0.1, 0.9) * W, y: H * 0.3, vy: rand(0.06, 0.12) * H, rot: rand(0, TAU), vr: rand(-1.5, 1.5), s: W * rand(0.025, 0.04), ph: rand(0, TAU) }));
    for (let i = pt.length - 1; i >= 0; i--) {
      const p = pt[i];
      p.y += p.vy * dt; p.rot += p.vr * dt; p.ph += dt;
      if (p.y > H * 1.05) { pt.splice(i, 1); continue; }
      c.save();
      c.translate(p.x + Math.sin(p.ph * 1.3) * W * 0.04, p.y);
      c.rotate(p.rot);
      c.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.ph * 1.6)));
      c.fillStyle = 'rgba(255,250,236,0.9)';
      petalPath(c, p.s, p.s * 0.5, false);
      c.fill();
      c.restore();
    }
  };

  /* Narenciye Bahçesi · dip: vetiver + beyaz misk */
  S.vetiverMusk = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#2a2912', '#0a0a04', 'rgba(230,220,170,0.24)', 0.5, 0.35);
    driftClouds(c, W, H, t, st, '255,250,240', 6, 0.16);
    if (!st.blades) {
      const r = seeded(17);
      st.blades = Array.from({ length: 48 }, () => {
        const k = r();
        return { x: (-0.05 + r() * 1.1) * W, h: (0.35 + r() * 0.42) * H, w: (0.006 + r() * 0.012) * W, lean: (r() - 0.5) * 0.5, ph: r() * TAU, k,
          col: 'rgb(' + Math.round(70 + k * 130) + ',' + Math.round(68 + k * 115) + ',' + Math.round(28 + k * 60) + ')' };
      }).sort((a, b) => a.k - b.k);
    }
    for (const b of st.blades) {
      const sway = b.lean + Math.sin(t * 0.9 + b.ph) * 0.07;
      const tx = b.x + sway * b.h, ty = H - b.h;
      c.fillStyle = b.col;
      c.beginPath();
      c.moveTo(b.x - b.w, H);
      c.quadraticCurveTo(b.x + (tx - b.x) * 0.25, H - b.h * 0.55, tx, ty);
      c.quadraticCurveTo(b.x + (tx - b.x) * 0.25 + b.w * 0.6, H - b.h * 0.55, b.x + b.w, H);
      c.fill();
    }
    // tene yakın, temiz misk parıltıları
    const m = emit(st, 'motes', 6, dt, 40, () => ({ x: rand(0, 1) * W, y: H * rand(0.6, 1), vy: -rand(0.02, 0.06) * H, life: 0, max: rand(3, 6), ph: rand(0, TAU) }));
    c.globalCompositeOperation = 'lighter';
    for (let i = m.length - 1; i >= 0; i--) {
      const p = m[i];
      p.life += dt; p.y += p.vy * dt;
      if (p.life > p.max) { m.splice(i, 1); continue; }
      soft(c, '255,252,240', p.x + Math.sin(p.life + p.ph) * W * 0.02, p.y, W * 0.012, 0.7 * Math.sin((p.life / p.max) * Math.PI));
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  /* İncir yaprağı (loblu) */
  function figLeaf(x, R) {
    const g2 = (d, w) => Math.exp(-(d * d) / (2 * w * w));
    x.beginPath();
    for (let i = 0; i <= 160; i++) {
      const th = -Math.PI + (i / 160) * TAU;            // 0 = yukarı
      const f = g2(th, 0.36) + 0.92 * (g2(th - 1.15, 0.3) + g2(th + 1.15, 0.3)) + 0.6 * (g2(th - 2.15, 0.26) + g2(th + 2.15, 0.26));
      const rr = R * (0.28 + 0.72 * Math.min(1, f));
      const px = Math.sin(th) * rr, py = -Math.cos(th) * rr;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath();
    const g = x.createLinearGradient(-R, -R, R, R);
    g.addColorStop(0, '#4fa356');
    g.addColorStop(1, '#174a20');
    x.fillStyle = g;
    x.fill();
    x.strokeStyle = 'rgba(210,255,210,0.35)';
    x.lineCap = 'round';
    [0, 1.15, -1.15, 2.15, -2.15].forEach((a, i) => {
      const L = R * (i === 0 ? 0.92 : i < 3 ? 0.85 : 0.55);
      x.lineWidth = Math.max(1, R * (i < 3 ? 0.022 : 0.015));
      x.beginPath(); x.moveTo(0, R * 0.05); x.quadraticCurveTo(Math.sin(a) * L * 0.5, -Math.cos(a) * L * 0.4, Math.sin(a) * L, -Math.cos(a) * L); x.stroke();
    });
    x.strokeStyle = '#2c5a24';
    x.lineWidth = R * 0.04;
    x.beginPath(); x.moveTo(0, R * 0.05); x.lineTo(0, R * 0.55); x.stroke();
  }

  function waves(c, W, H, t, y0, cols, foam) {
    for (let b = 0; b < cols.length; b++) {
      const yb = H * (y0 + b * 0.055);
      c.fillStyle = cols[b];
      c.beginPath();
      c.moveTo(0, H);
      for (let i = 0; i <= 24; i++) {
        const x = (i / 24) * W;
        c.lineTo(x, yb + Math.sin((i / 24) * TAU * 1.4 + t * (0.8 + b * 0.35) + b * 1.7) * H * 0.012);
      }
      c.lineTo(W, H);
      c.closePath();
      c.fill();
      c.strokeStyle = foam;
      c.lineWidth = Math.max(1, W * 0.004);
      c.beginPath();
      for (let i = 0; i <= 24; i++) {
        const x = (i / 24) * W;
        const y = yb + Math.sin((i / 24) * TAU * 1.4 + t * (0.8 + b * 0.35) + b * 1.7) * H * 0.012;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
  }

  function saltCrystals(c, W, H, dt, t, st, rate) {
    const cr = emit(st, 'salt', rate, dt, 50, () => ({ x: rand(0, 1) * W, y: -H * 0.03, vy: rand(0.03, 0.08) * H, s: W * rand(0.008, 0.016), rot: rand(0, TAU), vr: rand(-1, 1), ph: rand(0, TAU) }));
    for (let i = cr.length - 1; i >= 0; i--) {
      const p = cr[i];
      p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > H * 1.03) { cr.splice(i, 1); continue; }
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      c.fillStyle = 'rgba(200,240,235,0.6)';
      c.fillRect(-p.s / 2, -p.s / 2, p.s / 2, p.s / 2);
      c.restore();
      const tw = Math.pow(Math.max(0, Math.sin(t * 2.2 + p.ph)), 6);
      if (tw > 0.05) {
        c.globalCompositeOperation = 'lighter';
        soft(c, '255,255,255', p.x, p.y, p.s * 3, tw);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      }
    }
  }

  /* Tuz ve İncir · üst: incir yaprağı + deniz tuzu */
  S.figLeafSalt = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#0f4038', '#03130f', 'rgba(140,240,210,0.26)', 0.5, 0.35);
    const R = W * 0.4, S2 = R * 2.3;
    stamp(c, st, 'figleaf', S2, S2, (x) => { x.translate(S2 / 2, S2 / 2); figLeaf(x, R); },
      W * 0.5, H * 0.43, -0.18 + Math.sin(t * 0.6) * 0.05);
    waves(c, W, H, t, 0.8, ['rgba(16,92,82,0.85)', 'rgba(10,66,60,0.9)', 'rgba(5,40,36,0.95)'], 'rgba(220,255,245,0.4)');
    saltCrystals(c, W, H, dt, t, st, 7);
  };

  /* İncir yarısı (kesit) — R: alt yuvarlak kısmın yarıçapı */
  function figPath(R, s, oy) {
    const p = new Path2D();
    const k = R * s, o = oy || 0;
    p.moveTo(0, -1.62 * k + o);
    p.bezierCurveTo(0.22 * k, -1.5 * k + o, 0.98 * k, -0.85 * k + o, 1.0 * k, o);
    p.bezierCurveTo(1.02 * k, 0.62 * k + o, 0.55 * k, 1.0 * k + o, 0, 1.0 * k + o);
    p.bezierCurveTo(-0.55 * k, 1.0 * k + o, -1.02 * k, 0.62 * k + o, -1.0 * k, o);
    p.bezierCurveTo(-0.98 * k, -0.85 * k + o, -0.22 * k, -1.5 * k + o, 0, -1.62 * k + o);
    p.closePath();
    return p;
  }
  function figHalf(x, R) {
    // sap
    x.fillStyle = '#5a3c22';
    x.fillRect(-R * 0.04, -1.78 * R, R * 0.08, R * 0.2);
    // kabuk
    let g = x.createLinearGradient(-R, -R, R, R);
    g.addColorStop(0, '#6d3570');
    g.addColorStop(1, '#260c2a');
    x.fillStyle = g;
    x.fill(figPath(R, 1));
    // beyaz iç kabuk
    x.fillStyle = '#f3e7cf';
    x.fill(figPath(R, 0.9, R * 0.04));
    // et
    const flesh = figPath(R, 0.8, R * 0.08);
    g = x.createRadialGradient(0, R * 0.15, R * 0.05, 0, R * 0.1, R * 1.1);
    g.addColorStop(0, '#ffc1b4');
    g.addColorStop(0.35, '#e24c62');
    g.addColorStop(0.75, '#a8183a');
    g.addColorStop(1, '#6e0c28');
    x.fillStyle = g;
    x.fill(flesh);
    // çekirdek iplikleri
    const r = seeded(31);
    let n = 0;
    for (let i = 0; i < 900 && n < 150; i++) {
      const px = (r() - 0.5) * 1.7 * R, py = -1.3 * R + r() * 2.2 * R;
      if (!x.isPointInPath(flesh, px + x.getTransform().e, py + x.getTransform().f)) continue;
      n++;
      const a = Math.atan2(py - R * 0.1, px);
      x.strokeStyle = 'rgba(255,220,205,0.45)';
      x.lineWidth = Math.max(1, R * 0.01);
      x.beginPath(); x.moveTo(px, py); x.lineTo(px - Math.cos(a) * R * 0.08, py - Math.sin(a) * R * 0.08); x.stroke();
      x.save();
      x.translate(px, py);
      x.rotate(a);
      x.fillStyle = '#f7e3b0';
      x.beginPath(); x.ellipse(0, 0, R * 0.028, R * 0.017, 0, 0, TAU); x.fill();
      x.restore();
    }
    // orta boşluk
    g = x.createRadialGradient(0, R * 0.1, 0, 0, R * 0.1, R * 0.35);
    g.addColorStop(0, 'rgba(255,215,210,0.75)');
    g.addColorStop(1, 'rgba(255,215,210,0)');
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0, R * 0.1, R * 0.2, R * 0.38, 0, 0, TAU); x.fill();
    // kenar parlaması
    x.strokeStyle = 'rgba(255,230,255,0.25)';
    x.lineWidth = R * 0.03;
    x.stroke(figPath(R, 1));
  }

  /* Tuz ve İncir · kalp: incir sütü + yasemin */
  S.figJasmine = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#3d2244', '#0f0712', 'rgba(240,200,255,0.3)', 0.5, 0.42);
    // süt havuzu
    const g = c.createRadialGradient(W * 0.5, H * 0.95, 0, W * 0.5, H * 0.95, W * 0.45);
    g.addColorStop(0, 'rgba(255,250,240,0.32)');
    g.addColorStop(1, 'rgba(255,250,240,0)');
    c.fillStyle = g;
    c.fillRect(0, H * 0.8, W, H * 0.2);

    const R = W * 0.22, cx = W * 0.5, cy = H * 0.52 + Math.sin(t * 0.6) * W * 0.006;
    const rot = Math.sin(t * 0.45) * 0.035;
    const jasR = W * 0.085, JS = jasR * 2.4;
    const jas = { n: 5, c0: '#fff4dc', c1: '#ffffff', c2: '#f3e8ff', w: 0.34, pointed: true, skew: 0.25, center: 'tube', cc: '#f0dc94', vein: 'rgba(190,170,220,0.2)' };
    const orbit = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + t * 0.16;
      orbit.push({ a, x: cx + Math.cos(a) * W * 0.37, y: cy - R * 0.4 + Math.sin(a) * H * 0.2, d: Math.sin(a), i });
    }
    const drawJas = (o) => {
      const sc = 0.62 + 0.4 * (o.d + 1) / 2;
      c.globalAlpha = 0.55 + 0.45 * (o.d + 1) / 2;
      stamp(c, st, 'jas', JS, JS, (x) => { x.translate(JS / 2, JS / 2); flower(x, jasR, jas); }, o.x, o.y, t * 0.3 + o.i, sc);
      c.globalAlpha = 1;
    };
    orbit.filter((o) => o.d < 0).forEach(drawJas);

    // incir
    const FW = R * 2.3, FH = R * 3.1;
    stamp(c, st, 'fig', FW, FH, (x) => { x.translate(FW / 2, FH * 0.62); figHalf(x, R); }, cx, cy, rot);

    // incir sütü: saptan ve alttan damlar
    const stemX = cx + Math.sin(rot) * (FH * 0.62 - FH / 2 + 1.78 * R), stemY = cy - (1.78 * R - (FH * 0.62 - FH / 2));
    const bottomY = cy + R + (FH * 0.62 - FH / 2);
    st.dropT = (st.dropT || 0) - dt;
    if (st.dropT <= 0) {
      st.dropT = rand(0.5, 1.2);
      const fromStem = Math.random() < 0.45;
      st.drops.push({ x: fromStem ? stemX : cx + rand(-0.4, 0.4) * R, y: fromStem ? stemY : bottomY - R * 0.05, vy: 0, r: W * rand(0.012, 0.02), hold: rand(0.4, 0.9), grow: 0 });
    }
    for (let i = st.drops.length - 1; i >= 0; i--) {
      const d = st.drops[i];
      if (d.hold > 0) { d.hold -= dt; d.grow = Math.min(1, d.grow + dt * 2); }
      else { d.vy += H * 1.5 * dt; d.y += d.vy * dt; }
      if (d.y > H * 0.93) {
        st.splash = st.splash || [];
        st.splash.push({ x: d.x, y: H * 0.93, life: 0 });
        st.drops.splice(i, 1);
        continue;
      }
      const stretch = 1 + Math.min(1.8, d.vy / (H * 0.8));
      glossyDrop(c, d.x, d.y + d.r * stretch * 0.6, d.r * (0.4 + 0.6 * d.grow), stretch, 'rgba(255,255,255,0.98)', 'rgba(240,228,214,0.65)');
    }
    if (st.splash) {
      for (let i = st.splash.length - 1; i >= 0; i--) {
        const s = st.splash[i];
        s.life += dt;
        if (s.life > 0.7) { st.splash.splice(i, 1); continue; }
        const f = s.life / 0.7;
        c.strokeStyle = 'rgba(255,250,240,' + (0.6 * (1 - f)) + ')';
        c.lineWidth = Math.max(1, W * 0.004);
        c.beginPath(); c.ellipse(s.x, s.y, W * 0.06 * f, W * 0.015 * f, 0, 0, TAU); c.stroke();
      }
    }

    orbit.filter((o) => o.d >= 0).forEach(drawJas);
    // yasemin tomurcukları
    [[0.16, 0.2, -0.6], [0.86, 0.26, 0.7], [0.12, 0.74, -0.2]].forEach(([px, py, a], i) => {
      c.save();
      c.translate(px * W, py * H);
      c.rotate(a + Math.sin(t * 0.8 + i) * 0.08);
      const bg2 = c.createLinearGradient(0, -W * 0.05, 0, W * 0.03);
      bg2.addColorStop(0, '#e9a3c6');
      bg2.addColorStop(1, '#fff6fb');
      c.fillStyle = bg2;
      c.beginPath(); c.ellipse(0, 0, W * 0.016, W * 0.045, 0, 0, TAU); c.fill();
      c.strokeStyle = '#4c7a3a';
      c.lineWidth = Math.max(1, W * 0.006);
      c.beginPath(); c.moveTo(0, W * 0.04); c.lineTo(0, W * 0.09); c.stroke();
      c.restore();
    });
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) {
      const tw = Math.max(0, Math.sin(t * 1.3 + i * 1.9));
      soft(c, '255,245,255', W * (0.1 + ((i * 0.37) % 0.8)), H * (0.12 + ((i * 0.53) % 0.7)), W * 0.025 * tw, 0.7 * tw);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  /* Tuz ve İncir · dip: beyaz misk + sahil odunu */
  S.driftwoodMusk = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#33403e', '#0b1010', 'rgba(220,240,235,0.24)', 0.5, 0.38);
    driftClouds(c, W, H, t, st, '255,255,250', 7, 0.15);
    waves(c, W, H, t, 0.58, ['rgba(70,110,108,0.55)', 'rgba(50,90,88,0.7)'], 'rgba(235,250,245,0.45)');
    // kum
    stamp(c, st, 'sand', W, H * 0.32, (x) => {
      const g = x.createLinearGradient(0, 0, 0, H * 0.32);
      g.addColorStop(0, '#cbbd9c');
      g.addColorStop(1, '#7c6e50');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(0, H * 0.04); x.quadraticCurveTo(W * 0.5, -H * 0.02, W, H * 0.05); x.lineTo(W, H * 0.32); x.lineTo(0, H * 0.32); x.closePath(); x.fill();
      const r = seeded(13);
      x.fillStyle = 'rgba(90,75,50,0.25)';
      for (let i = 0; i < 160; i++) { x.beginPath(); x.arc(r() * W, H * (0.05 + r() * 0.27), W * 0.003, 0, TAU); x.fill(); }
    }, W / 2, H * 0.84);
    // köpük çizgisi
    c.strokeStyle = 'rgba(255,255,250,' + (0.35 + 0.2 * Math.sin(t * 0.9)) + ')';
    c.lineWidth = Math.max(1, W * 0.005);
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * W, y = H * 0.7 + Math.sin(i * 0.9 + t * 1.1) * H * 0.006 + Math.sin(t * 0.6) * H * 0.01;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    // sahil odunu
    const L = W * 0.86, th = H * 0.075;
    stamp(c, st, 'wood', L * 1.1, th * 3, (x) => {
      x.translate(L * 0.55, th * 1.5);
      const g = x.createLinearGradient(0, -th / 2, 0, th / 2);
      g.addColorStop(0, '#e2dccf');
      g.addColorStop(0.5, '#a39b8e');
      g.addColorStop(1, '#4e4840');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(-L / 2, -th * 0.25);
      x.bezierCurveTo(-L * 0.2, -th * 0.65, L * 0.2, -th * 0.45, L / 2, -th * 0.2);
      x.quadraticCurveTo(L * 0.53, 0, L / 2, th * 0.25);
      x.bezierCurveTo(L * 0.2, th * 0.5, -L * 0.2, th * 0.6, -L / 2, th * 0.3);
      x.quadraticCurveTo(-L * 0.53, 0, -L / 2, -th * 0.25);
      x.fill();
      // dal
      x.beginPath(); x.moveTo(L * 0.1, -th * 0.4); x.lineTo(L * 0.22, -th * 1.3); x.lineTo(L * 0.26, -th * 1.2); x.lineTo(L * 0.18, -th * 0.35); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(70,60,50,0.35)';
      x.lineWidth = Math.max(1, th * 0.04);
      for (let i = -3; i <= 3; i++) {
        x.beginPath();
        x.moveTo(-L * 0.46, i * th * 0.08);
        x.bezierCurveTo(-L * 0.15, i * th * 0.08 - th * 0.12, L * 0.15, i * th * 0.08 + th * 0.1, L * 0.46, i * th * 0.07);
        x.stroke();
      }
      x.fillStyle = 'rgba(60,50,40,0.5)';
      x.beginPath(); x.ellipse(-L * 0.18, 0, th * 0.18, th * 0.1, 0, 0, TAU); x.fill();
    }, W * 0.5, H * 0.79, -0.1);
    saltCrystals(c, W, H, dt, t, st, 2);
  };

  /* Sedir Yolu · üst: kakule + selvi */
  S.cypressCardamom = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#1d3a2c', '#06110b', 'rgba(190,240,200,0.2)', 0.5, 0.3);
    stamp(c, st, 'trees', W, H, (x) => {
      const tree = (px, base, h, w, col) => {
        x.fillStyle = col;
        x.beginPath();
        x.moveTo(px, base - h);
        x.bezierCurveTo(px + w * 0.7, base - h * 0.75, px + w * 0.55, base - h * 0.15, px + w * 0.12, base);
        x.lineTo(px - w * 0.12, base);
        x.bezierCurveTo(px - w * 0.55, base - h * 0.15, px - w * 0.7, base - h * 0.75, px, base - h);
        x.fill();
      };
      [[0.08, 0.5], [0.3, 0.58], [0.55, 0.52], [0.78, 0.6], [0.97, 0.5]].forEach(([px, h]) => tree(px * W, H * 0.98, h * H, W * 0.12, 'rgba(60,110,86,0.55)'));
      [[0.18, 0.72], [0.66, 0.78], [0.9, 0.66]].forEach(([px, h]) => tree(px * W, H * 1.02, h * H, W * 0.16, '#1b3f2e'));
      [[0.04, 0.9], [0.95, 0.86]].forEach(([px, h]) => tree(px * W, H * 1.05, h * H, W * 0.2, '#0d2419'));
    }, W / 2, H / 2);
    driftClouds(c, W, H, t, st, '220,245,230', 5, 0.12);
    // kakule kabukları
    const L = W * 0.17, PW = L * 1.3, PH = L * 0.7;
    const pod = (x) => {
      x.translate(PW / 2, PH / 2);
      const g = x.createLinearGradient(0, -L * 0.22, 0, L * 0.22);
      g.addColorStop(0, '#d2e49a');
      g.addColorStop(0.5, '#8aa64e');
      g.addColorStop(1, '#4a6224');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(-L / 2, 0);
      x.bezierCurveTo(-L * 0.35, -L * 0.24, L * 0.35, -L * 0.24, L / 2, 0);
      x.bezierCurveTo(L * 0.35, L * 0.24, -L * 0.35, L * 0.24, -L / 2, 0);
      x.fill();
      x.strokeStyle = 'rgba(50,70,25,0.5)';
      x.lineWidth = Math.max(1, L * 0.02);
      [-0.09, 0, 0.09].forEach((o) => { x.beginPath(); x.moveTo(-L * 0.44, 0); x.quadraticCurveTo(0, o * L * 1.8, L * 0.44, 0); x.stroke(); });
      x.fillStyle = '#5a6e2c';
      x.beginPath(); x.arc(L * 0.5, 0, L * 0.03, 0, TAU); x.fill();
    };
    [[0.42, 0.46, 0.4], [0.62, 0.38, -0.6], [0.56, 0.6, 1.2], [0.34, 0.64, -1.4], [0.72, 0.54, 0.2]].forEach(([px, py, a], i) => {
      stamp(c, st, 'pod', PW, PH, pod, px * W, py * H + Math.sin(t * 0.8 + i * 1.3) * W * 0.012, a + Math.sin(t * 0.3 + i) * 0.2, 0.85 + (i % 3) * 0.12);
    });
  };

  /* Sedir Yolu · kalp: sedir + tütsü */
  S.cedarIncense = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#33241a', '#0c0806', 'rgba(255,190,130,0.22)', 0.5, 0.6);
    const R = W * 0.36, S2 = R * 2.2;
    stamp(c, st, 'cedar', S2, S2, (x) => {
      x.translate(S2 / 2, S2 / 2);
      const r = seeded(19);
      const ring = (rad, wob, seed) => {
        x.beginPath();
        for (let i = 0; i <= 72; i++) {
          const a = (i / 72) * TAU;
          const k = rad * (1 + wob * Math.sin(a * 3 + seed) + wob * 0.6 * Math.sin(a * 7 + seed * 2));
          i ? x.lineTo(Math.cos(a) * k, Math.sin(a) * k) : x.moveTo(Math.cos(a) * k, Math.sin(a) * k);
        }
        x.closePath();
      };
      ring(R, 0.025, 1); x.fillStyle = '#3a2416'; x.fill();
      ring(R * 0.9, 0.02, 2);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, R * 0.9);
      g.addColorStop(0, '#8a4a28'); g.addColorStop(0.35, '#c88c58'); g.addColorStop(0.8, '#e2b07a'); g.addColorStop(1, '#a8703e');
      x.fillStyle = g; x.fill();
      x.strokeStyle = 'rgba(90,48,22,0.35)';
      x.lineWidth = Math.max(1, R * 0.008);
      for (let k = 1; k <= 16; k++) { ring(R * 0.88 * (k / 16), 0.015, r() * 6); x.stroke(); }
      x.strokeStyle = 'rgba(40,20,10,0.6)';
      x.lineWidth = Math.max(1, R * 0.012);
      [0.6, 2.4, 4.1].forEach((a) => { x.beginPath(); x.moveTo(Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1); x.lineTo(Math.cos(a + 0.05) * R * 0.6, Math.sin(a + 0.05) * R * 0.6); x.stroke(); });
    }, W * 0.5, H * 0.66, t * 0.02);
    // tütsü çubuğu
    const tipX = W * 0.46, tipY = H * 0.3;
    c.lineCap = 'round';
    c.strokeStyle = '#3e2414';
    c.lineWidth = Math.max(2, W * 0.012);
    c.beginPath(); c.moveTo(W * 0.66, H * 0.98); c.lineTo(tipX, tipY); c.stroke();
    c.strokeStyle = '#7a4a28';
    c.lineWidth = Math.max(1, W * 0.006);
    c.beginPath(); c.moveTo(W * 0.66, H * 0.98); c.lineTo(W * 0.6, H * 0.8); c.stroke();
    c.globalCompositeOperation = 'lighter';
    soft(c, '255,120,40', tipX, tipY, W * 0.03 * (0.8 + 0.2 * Math.sin(t * 6)), 0.9);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // duman
    const sm = emit(st, 'smoke', 26, dt, 120, () => ({ y: 0, life: 0, max: rand(3.2, 4.2), ph: rand(0, 0.4) }));
    for (let i = sm.length - 1; i >= 0; i--) {
      const p = sm[i];
      p.life += dt;
      if (p.life > p.max) { sm.splice(i, 1); continue; }
      const f = p.life / p.max;
      const y = tipY - f * H * 0.42;
      const x = tipX + Math.sin(p.life * 2.2 - t * 0.8 + p.ph) * W * 0.06 * f + Math.sin(t * 0.4) * W * 0.03 * f;
      soft(c, '235,225,215', x, y, W * (0.012 + f * 0.07), 0.1 * (1 - f) * Math.min(1, p.life * 4), 0.5);
    }
    c.globalAlpha = 1;
  };

  /* Sedir Yolu · dip: sandal ağacı + misk */
  S.sandalMusk = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#3d2a20', '#110a07', 'rgba(255,200,170,0.24)', 0.5, 0.45);
    driftClouds(c, W, H, t, st, '255,240,228', 7, 0.15);
    // blok
    const BW = W * 0.62, BH = H * 0.16;
    stamp(c, st, 'block', BW, BH, (x) => {
      const g = x.createLinearGradient(0, 0, 0, BH);
      g.addColorStop(0, '#e6b688'); g.addColorStop(1, '#9a6233');
      x.fillStyle = g;
      A.rr(x, 0, 0, BW, BH, BH * 0.12); x.fill();
      x.strokeStyle = 'rgba(110,60,25,0.3)';
      x.lineWidth = Math.max(1, BH * 0.02);
      for (let i = 1; i < 9; i++) { x.beginPath(); x.moveTo(BW * 0.03, BH * i / 9); x.bezierCurveTo(BW * 0.35, BH * i / 9 - BH * 0.06, BW * 0.65, BH * i / 9 + BH * 0.06, BW * 0.97, BH * i / 9); x.stroke(); }
    }, W * 0.5, H * 0.86);
    // talaş kıvrımları
    const CR = W * 0.11, CS = CR * 2.6;
    const curl = (x) => {
      x.translate(CS / 2, CS / 2);
      x.lineCap = 'round';
      const path = () => { x.beginPath(); for (let a = 0; a <= Math.PI * 3.2; a += 0.08) { const r = CR * (0.12 + 0.88 * a / (Math.PI * 3.2)); const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.75; a ? x.lineTo(px, py) : x.moveTo(px, py); } };
      path(); x.strokeStyle = '#b07a4c'; x.lineWidth = CR * 0.22; x.stroke();
      path(); x.strokeStyle = '#ecc195'; x.lineWidth = CR * 0.12; x.stroke();
    };
    [[0.3, 0.38], [0.62, 0.3], [0.72, 0.58], [0.4, 0.62], [0.52, 0.46]].forEach(([px, py], i) => {
      stamp(c, st, 'curl', CS, CS, curl, px * W, py * H + Math.sin(t * 0.7 + i * 1.7) * W * 0.012, t * 0.15 * (i % 2 ? 1 : -1) + i, 0.7 + (i % 3) * 0.18);
    });
  };

  /* Gece Amberi · üst: tarçın + karanfil */
  S.cinnamonClove = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#4a1c0b', '#120502', 'rgba(255,140,60,0.32)', 0.5, 0.45);
    const L = W * 0.72, th = W * 0.085;
    const stick = (x) => {
      x.translate(L * 0.55, th);
      const g = x.createLinearGradient(0, -th / 2, 0, th / 2);
      g.addColorStop(0, '#c27440'); g.addColorStop(0.4, '#8a4520'); g.addColorStop(0.85, '#5a2810'); g.addColorStop(1, '#3a1808');
      x.fillStyle = g;
      A.rr(x, -L / 2, -th / 2, L, th, th * 0.3); x.fill();
      x.strokeStyle = 'rgba(40,15,5,0.35)';
      x.lineWidth = Math.max(1, th * 0.04);
      for (let i = 0; i < 5; i++) { const y = -th * 0.35 + i * th * 0.17; x.beginPath(); x.moveTo(-L * 0.47, y); x.lineTo(L * 0.42, y + th * 0.03); x.stroke(); }
      // kıvrık uç
      x.fillStyle = '#6a3418';
      x.beginPath(); x.ellipse(L / 2 - th * 0.1, 0, th * 0.3, th * 0.5, 0, 0, TAU); x.fill();
      x.strokeStyle = '#d08a52';
      x.lineWidth = Math.max(1, th * 0.05);
      x.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.2) { const r = th * 0.04 * a; const px = L / 2 - th * 0.1 + Math.cos(a) * r * 0.6, py = Math.sin(a) * r; a ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    };
    [[0.5, 0.52, -0.5], [0.48, 0.5, 0.3], [0.52, 0.56, 1.05]].forEach(([px, py, a], i) => {
      stamp(c, st, 'stick', L * 1.1, th * 2, stick, px * W, py * H + Math.sin(t * 0.5 + i) * W * 0.006, a + Math.sin(t * 0.3 + i) * 0.02);
    });
    const C = W * 0.24, CW = C * 0.7, CH = C * 1.25;
    const clove = (x) => {
      x.translate(CW / 2, CH * 0.3);
      // sap: üstte kalın, aşağı doğru incelen
      const sg = x.createLinearGradient(-C * 0.08, 0, C * 0.08, 0);
      sg.addColorStop(0, '#3a1a0a'); sg.addColorStop(0.5, '#7a3e1c'); sg.addColorStop(1, '#3a1a0a');
      x.fillStyle = sg;
      x.beginPath(); x.moveTo(-C * 0.08, C * 0.06); x.lineTo(C * 0.08, C * 0.06); x.lineTo(C * 0.035, C * 0.85); x.quadraticCurveTo(0, C * 0.9, -C * 0.035, C * 0.85); x.closePath(); x.fill();
      // 4 çanak yaprak
      x.fillStyle = '#6a3214';
      for (let i = 0; i < 4; i++) { x.save(); x.rotate(-1.05 + i * 0.7); x.beginPath(); x.moveTo(0, C * 0.08); x.lineTo(-C * 0.07, -C * 0.14); x.lineTo(C * 0.07, -C * 0.14); x.closePath(); x.fill(); x.restore(); }
      // tomurcuk
      const g = x.createRadialGradient(-C * 0.04, -C * 0.08, 0, 0, -C * 0.04, C * 0.12);
      g.addColorStop(0, '#d89060'); g.addColorStop(1, '#5a2a10');
      x.fillStyle = g;
      x.beginPath(); x.arc(0, -C * 0.04, C * 0.1, 0, TAU); x.fill();
    };
    [[0.2, 0.25], [0.8, 0.22], [0.15, 0.62], [0.84, 0.66], [0.32, 0.82], [0.7, 0.84], [0.5, 0.2]].forEach(([px, py], i) => {
      stamp(c, st, 'clove', CW, CH, clove, px * W, py * H + Math.sin(t * 0.9 + i) * W * 0.012, i * 0.9 - 0.4 + Math.sin(t * 0.4 + i) * 0.25, 0.75 + (i % 3) * 0.12);
    });
    // baharat tozu girdabı
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const a = t * 0.4 + i * 0.9, r = W * (0.1 + (i % 7) * 0.05);
      soft(c, '255,150,70', W * 0.5 + Math.cos(a) * r, H * 0.5 + Math.sin(a) * r * 0.7, W * 0.012, 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + i)));
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  /* Gece Amberi · kalp: labdanum + vanilya */
  S.vanillaLabdanum = function (c, W, H, t, dt, st) {
    bg(c, W, H, st, '#3e2a10', '#120b04', 'rgba(255,215,140,0.32)', 0.5, 0.45);
    // vanilya çubukları
    stamp(c, st, 'pods', W, H, (x) => {
      x.lineCap = 'round';
      [[0.08, 0.95, 0.5, 0.62, 0.92, 0.8], [0.0, 0.8, 0.45, 0.9, 0.96, 0.98], [0.15, 1.02, 0.35, 0.72, 0.7, 0.62]].forEach(([x0, y0, cxp, cyp, x1, y1]) => {
        x.strokeStyle = '#2a170b'; x.lineWidth = W * 0.032;
        x.beginPath(); x.moveTo(x0 * W, y0 * H); x.quadraticCurveTo(cxp * W, cyp * H, x1 * W, y1 * H); x.stroke();
        x.strokeStyle = 'rgba(140,90,50,0.55)'; x.lineWidth = W * 0.008;
        x.beginPath(); x.moveTo(x0 * W, y0 * H - W * 0.008); x.quadraticCurveTo(cxp * W, cyp * H - W * 0.01, x1 * W, y1 * H - W * 0.008); x.stroke();
      });
    }, W / 2, H / 2);
    // vanilya çiçekleri
    const vf = { n: 6, c0: '#efe0a0', c1: '#fffbe6', c2: '#f3e7b8', w: 0.36, pointed: true, center: 'lip', cc: '#f2d35a', cc2: '#e8a030', vein: 'rgba(170,140,60,0.2)' };
    [[0.52, 0.47, 0.21, 0], [0.26, 0.66, 0.12, 1]].forEach(([px, py, rs, i]) => {
      const R = W * rs, S2 = R * 2.4;
      stamp(c, st, 'vf' + i, S2, S2, (x) => { x.translate(S2 / 2, S2 / 2); flower(x, R, vf); }, px * W, py * H, 0.3 + Math.sin(t * 0.4 + i) * 0.06, 1 + Math.sin(t * 0.9 + i) * 0.03);
    });
    // labdanum reçinesi: üst kenardan sarkan, uzayıp kopan damlalar
    if (!st.drips) st.drips = [0.18, 0.4, 0.63, 0.84].map((x, i) => ({ x: x * W, len: (0.05 + i * 0.03) * H, max: rand(0.16, 0.3) * H, v: rand(0.02, 0.04) * H }));
    for (const d of st.drips) {
      d.len += d.v * dt;
      if (d.len > d.max) {
        st.drops.push({ x: d.x, y: d.len, vy: 0, r: W * 0.022 });
        d.len = H * 0.04; d.max = rand(0.16, 0.3) * H;
      }
      const w = W * 0.022;
      const g = c.createLinearGradient(d.x - w, 0, d.x + w, 0);
      g.addColorStop(0, '#7a3c08'); g.addColorStop(0.4, '#e09a2a'); g.addColorStop(0.6, '#ffd070'); g.addColorStop(1, '#8a4410');
      c.fillStyle = g;
      // incelen gövde + uçta toplanan damla
      c.beginPath();
      c.moveTo(d.x - w * 1.6, 0);
      c.quadraticCurveTo(d.x - w * 0.45, d.len * 0.35, d.x - w * 0.35, d.len - w * 0.4);
      c.lineTo(d.x + w * 0.35, d.len - w * 0.4);
      c.quadraticCurveTo(d.x + w * 0.45, d.len * 0.35, d.x + w * 1.6, 0);
      c.closePath();
      c.fill();
      glossyDrop(c, d.x, d.len, w * 0.85, 1.1, 'rgba(255,214,120,0.98)', 'rgba(150,70,10,0.9)');
    }
    c.fillStyle = '#8a4a10';
    c.fillRect(0, 0, W, H * 0.012);
    for (let i = st.drops.length - 1; i >= 0; i--) {
      const d = st.drops[i];
      d.vy += H * 1.4 * dt; d.y += d.vy * dt;
      if (d.y > H * 1.05) { st.drops.splice(i, 1); continue; }
      glossyDrop(c, d.x, d.y, d.r, 1 + Math.min(1.2, d.vy / H), 'rgba(255,214,120,0.98)', 'rgba(150,70,10,0.9)');
    }
  };

  /* Gece Amberi · dip: amber + tonka (ateş başında) */
  S.amberTonka = function (c, W, H, t, dt, st) {
    A.drawFire(c, W, H, t, dt, st);
    // amber parçaları kütüklerin önünde
    [[0.2, 0.74, 0.1, 5], [0.8, 0.72, 0.085, 9]].forEach(([px, py, rs, sd], i) => {
      const R = W * rs, S2 = R * 2.6;
      c.globalCompositeOperation = 'lighter';
      soft(c, '255,170,60', px * W, py * H, R * 2, 0.25 + 0.1 * Math.sin(t * 2 + i));
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      stamp(c, st, 'amb' + i, S2, S2, (x) => { x.translate(S2 / 2, S2 / 2); amberChunk(x, R, sd); }, px * W, py * H, i * 0.6);
    });
    // tonka fasulyeleri
    const B = W * 0.11, BS = B * 2.4;
    const bean = (x) => {
      x.translate(BS / 2, BS / 2);
      const g = x.createRadialGradient(-B * 0.3, -B * 0.2, 0, 0, 0, B);
      g.addColorStop(0, '#9a6a48'); g.addColorStop(0.6, '#5a3620'); g.addColorStop(1, '#24130a');
      x.fillStyle = g;
      x.beginPath(); x.ellipse(0, 0, B, B * 0.38, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,220,180,0.35)';
      x.beginPath(); x.ellipse(-B * 0.3, -B * 0.16, B * 0.35, B * 0.06, -0.1, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(40,20,10,0.45)';
      x.lineWidth = Math.max(1, B * 0.03);
      for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(-B * 0.8, i * B * 0.06); x.bezierCurveTo(-B * 0.3, i * B * 0.06 - B * 0.06, B * 0.3, i * B * 0.06 + B * 0.06, B * 0.8, i * B * 0.05); x.stroke(); }
    };
    // ateşin önünde, ışığın vurduğu yerde dört tonka fasulyesi
    [[0.3, 0.84, 0.25], [0.46, 0.87, -0.3], [0.62, 0.85, 0.15], [0.76, 0.83, -0.4]].forEach(([px, py, a]) => {
      c.globalCompositeOperation = 'lighter';
      soft(c, '255,140,60', px * W, py * H - B * 0.3, B * 1.3, 0.18);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      stamp(c, st, 'bean', BS, BS, bean, px * W, py * H, a);
    });
  };

  Object.assign(F.NOTE_SCENES, S);

  /* ==========================================================
     ARKA PLAN PARÇACIK TÜRLERİ (bölüm arka planı)
     make(env, init) → parçacık; draw(env, liste, dt, t, k)
     ========================================================== */
  const wrap = (p, m, W, H) => {
    if (p.x < -m) p.x += W + m * 2;
    if (p.x > W + m) p.x -= W + m * 2;
    if (p.y < -m) p.y += H + m * 2;
    if (p.y > H + m) p.y -= H + m * 2;
  };
  const fcache = {};
  function flowerSprite(o) {
    const key = JSON.stringify(o);
    if (fcache[key]) return fcache[key];
    const s = 64, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const x = cv.getContext('2d');
    x.translate(s / 2, s / 2);
    flower(x, s * 0.42, { n: o.petals || 5, c0: o.c0 || o.fill, c1: o.fill, c2: o.c2 || o.fill, w: o.pointed ? 0.34 : 0.5, pointed: o.pointed, skew: o.pointed ? 0.25 : 0, center: 'tube', cc: o.center });
    return (fcache[key] = cv);
  }

  F.BG_KINDS = {
    bokeh: {
      n: 26,
      make: (e) => ({ x: rand(0, e.W), y: rand(0, e.H), r: rand(10, 60) * e.D, vx: rand(-5, 5) * e.D, vy: rand(-12, 12) * e.D, a: rand(0.05, 0.2), ph: rand(0, TAU) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'lighter';
        const img = bokeh(e.o.rgb);
        for (const p of arr) {
          p.x += p.vx * dt; p.y += p.vy * dt; wrap(p, p.r, e.W, e.H);
          c.globalAlpha = p.a * k * (0.7 + 0.3 * Math.sin(t * 0.7 + p.ph));
          c.drawImage(img, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        }
      }
    },
    dust: {
      n: 60,
      make: (e) => ({ x: rand(0, e.W), y: rand(0, e.H), r: rand(0.6, 2.2) * e.D, vx: rand(-8, 8) * e.D, vy: rand(-10, 10) * e.D, a: rand(0.2, 0.8), ph: rand(0, TAU) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'lighter';
        const img = sprite(e.o.rgb);
        for (const p of arr) {
          p.x += (p.vx + Math.sin(t + p.ph) * 6 * e.D) * dt; p.y += p.vy * dt; wrap(p, 10, e.W, e.H);
          c.globalAlpha = p.a * k * (0.5 + 0.5 * Math.sin(t * 2 + p.ph));
          c.drawImage(img, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
        }
      }
    },
    rain: {
      n: 60,
      make: (e) => ({ x: rand(0, e.W), y: rand(0, e.H), len: rand(18, 90) * e.D, v: rand(240, 620) * e.D, a: rand(0.05, 0.2) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgb(' + e.o.rgb + ')'; c.lineWidth = e.D; c.lineCap = 'round';
        for (const p of arr) {
          p.y += p.v * dt;
          if (p.y - p.len > e.H) { p.y = -rand(0, e.H * 0.3); p.x = Math.random() * e.W; }
          c.globalAlpha = p.a * k;
          c.beginPath(); c.moveTo(p.x, p.y - p.len); c.lineTo(p.x, p.y); c.stroke();
        }
      }
    },
    flowers: {
      n: 16,
      make: (e, init) => ({ x: rand(0, e.W), y: init ? rand(0, e.H) : -30 * e.D, s: rand(7, 15) * e.D, vx: rand(-8, 18) * e.D, vy: rand(14, 36) * e.D, rot: rand(0, TAU), vr: rand(-1, 1), ph: rand(0, TAU), a: rand(0.5, 0.95) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'source-over';
        const img = flowerSprite(e.o);
        for (const p of arr) {
          p.ph += dt; p.x += (p.vx + Math.sin(p.ph * 1.2) * 18 * e.D) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          if (p.y > e.H + 30 * e.D) Object.assign(p, this.make(e, false));
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
          c.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.ph * 1.4)));
          c.globalAlpha = p.a * k;
          c.drawImage(img, -p.s, -p.s, p.s * 2, p.s * 2);
          c.restore();
        }
      }
    },
    embers: {
      n: 70,
      make: (e, init) => ({ x: rand(0, e.W), y: init ? rand(0, e.H) : e.H + rand(0, 40) * e.D, r: rand(0.8, 2.6) * e.D, vx: rand(-10, 10) * e.D, vy: -rand(18, 80) * e.D, ph: rand(0, TAU), a: rand(0.35, 1) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'lighter';
        const img = sprite(e.o.rgb);
        for (const p of arr) {
          p.ph += dt * 3; p.x += (p.vx + Math.sin(p.ph) * 14 * e.D) * dt; p.y += p.vy * dt;
          if (p.y < -20 * e.D) Object.assign(p, this.make(e, false));
          c.globalAlpha = p.a * k * (0.55 + 0.45 * Math.sin(p.ph * 2.3)) * (0.25 + clamp(p.y / e.H, 0, 1) * 0.75);
          const r = p.r * 4;
          c.drawImage(img, p.x - r, p.y - r, r * 2, r * 2);
        }
      }
    },
    smoke: {
      n: 7,
      make: (e) => ({ x: rand(0, e.W), y: rand(0.2, 0.9) * e.H, r: rand(160, 340) * e.D, vx: rand(4, 14) * e.D, a: rand(0.03, 0.07) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'source-over';
        const img = sprite(e.o.rgb, 0.5);
        for (const s of arr) {
          s.x += s.vx * dt; if (s.x - s.r > e.W) s.x = -s.r;
          c.globalAlpha = s.a * k;
          c.drawImage(img, s.x - s.r, s.y - s.r * 0.5, s.r * 2, s.r);
        }
      }
    },
    clouds: {   // misk: temiz, yumuşak beyaz bulutlar
      n: 9,
      make: (e) => ({ x: rand(0, e.W), y: rand(0, e.H), r: rand(90, 240) * e.D, vx: rand(-10, 10) * e.D, vy: rand(-6, -1) * e.D, a: rand(0.04, 0.1), ph: rand(0, TAU) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'lighter';
        const img = sprite(e.o.rgb || '255,250,245', 0.5);
        for (const p of arr) {
          p.x += p.vx * dt; p.y += p.vy * dt; wrap(p, p.r, e.W, e.H);
          c.globalAlpha = p.a * k * (0.6 + 0.4 * Math.sin(t * 0.4 + p.ph));
          c.drawImage(img, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        }
      }
    },
    crystals: {   // deniz tuzu
      n: 40,
      make: (e, init) => ({ x: rand(0, e.W), y: init ? rand(0, e.H) : -10 * e.D, s: rand(1.5, 4) * e.D, vx: rand(-4, 4) * e.D, vy: rand(6, 22) * e.D, rot: rand(0, TAU), vr: rand(-1, 1), ph: rand(0, TAU) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx;
        const glint = sprite('255,255,255');
        for (const p of arr) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          if (p.y > e.H + 10 * e.D) Object.assign(p, this.make(e, false));
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = 0.75 * k;
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
          c.fillStyle = '#ffffff'; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
          c.restore();
          const tw = Math.pow(Math.max(0, Math.sin(t * 2 + p.ph)), 4);
          if (tw > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = tw * k; c.drawImage(glint, p.x - p.s * 3, p.y - p.s * 3, p.s * 6, p.s * 6); }
        }
      }
    },
    grains: {   // baharat taneleri / talaş tozu
      n: 40,
      make: (e, init) => { const sz = e.o.size || [2, 4]; return { x: rand(0, e.W), y: init ? rand(0, e.H) : -10 * e.D, s: rand(sz[0], sz[1]) * e.D, vx: rand(-6, 6) * e.D, vy: rand(10, 30) * e.D, rot: rand(0, TAU), vr: rand(-2, 2) }; },
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'source-over';
        c.fillStyle = e.o.fill;
        for (const p of arr) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          if (p.y > e.H + 10 * e.D) Object.assign(p, this.make(e, false));
          c.globalAlpha = 0.8 * k;
          c.beginPath(); c.ellipse(p.x, p.y, p.s, p.s * 0.7, p.rot, 0, TAU); c.fill();
        }
      }
    },
    threads: {   // safran iplikleri
      n: 22,
      make: (e, init) => ({ x: rand(0, e.W), y: init ? rand(0, e.H) : -20 * e.D, len: rand(10, 22) * e.D, curl: rand(-0.6, 0.6), vx: rand(-6, 6) * e.D, vy: rand(10, 26) * e.D, rot: rand(0, TAU), vr: rand(-1.2, 1.2) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'source-over'; c.lineCap = 'round';
        for (const p of arr) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          if (p.y > e.H + 20 * e.D) Object.assign(p, this.make(e, false));
          c.globalAlpha = 0.85 * k;
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
          c.strokeStyle = '#d23218'; c.lineWidth = 1.6 * e.D;
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(p.len / 2, p.curl * p.len, p.len, 0); c.stroke();
          c.fillStyle = '#ffb030'; c.beginPath(); c.arc(p.len, 0, 1.6 * e.D, 0, TAU); c.fill();
          c.restore();
        }
      }
    },
    leaves: {
      n: 14,
      make: (e, init) => ({ x: rand(0, e.W), y: init ? rand(0, e.H) : -20 * e.D, s: rand(5, 11) * e.D, vx: rand(-10, 16) * e.D, vy: rand(12, 30) * e.D, rot: rand(0, TAU), vr: rand(-1.5, 1.5), ph: rand(0, TAU), c: Math.random() < 0.5 }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'source-over'; c.lineCap = 'round';
        for (const p of arr) {
          p.ph += dt; p.x += (p.vx + Math.sin(p.ph * 1.3) * 14 * e.D) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          if (p.y > e.H + 20 * e.D) Object.assign(p, this.make(e, false));
          c.globalAlpha = 0.8 * k;
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
          if (e.o.thin) {
            c.strokeStyle = p.c ? e.o.c0 : e.o.c1; c.lineWidth = 1.4 * e.D;
            c.beginPath(); c.moveTo(-p.s, 0); c.quadraticCurveTo(0, p.s * 0.2, p.s, 0); c.stroke();
          } else {
            c.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.ph * 1.5)));
            c.fillStyle = p.c ? e.o.c0 : e.o.c1;
            petalPath(c, p.s * 2, p.s * 0.6, true); c.fill();
          }
          c.restore();
        }
      }
    },
    drops: {   // süt / reçine damlaları
      n: 10,
      make: (e, init) => ({ x: rand(0, e.W), y: init ? rand(0, e.H) : -20 * e.D, r: rand(2, 4.5) * e.D, vy: rand(60, 160) * e.D, a: rand(0.35, 0.8) }),
      draw(e, arr, dt, t, k) {
        const c = e.ctx; c.globalCompositeOperation = 'source-over';
        for (const p of arr) {
          p.y += p.vy * dt;
          if (p.y > e.H + 20 * e.D) Object.assign(p, this.make(e, false));
          c.globalAlpha = p.a * k;
          glossyDrop(c, p.x, p.y, p.r, 1.5, 'rgba(' + e.o.rgb + ',1)', 'rgba(' + e.o.rgb + ',0.4)');
        }
      }
    }
  };

  /* ==========================================================
     TEMALAR — sahne + arka plan parçacıkları + bölüm renkleri
     (eski üç sahne: citrus / rose / fire ve 'green' / 'red' / 'dark' arka planları)
     ========================================================== */
  F.NOTE_THEMES = {
    'kg-top':   { scene: 'pepperSaffron',   c1: '#5a1426', c2: '#1a0409', accent: '#ff8aa4',
                  bg: [['bokeh', { rgb: '255,110,140', n: 24 }], ['grains', { fill: '#e8607c', n: 34, size: [2, 4.5] }], ['threads', { n: 20 }], ['dust', { rgb: '255,200,210', n: 50 }]] },
    'kg-heart': { scene: 'rose',            c1: '#6a0d1f', c2: '#22030b', accent: '#ff6f86', bg: [['red']] },
    'kg-base':  { scene: 'patchouliAmber',  c1: '#2c1709', c2: '#090402', accent: '#f0a24a',
                  bg: [['smoke', { rgb: '110,85,70', n: 7 }], ['embers', { rgb: '255,170,70', n: 60 }], ['dust', { rgb: '255,210,150', n: 40 }]] },

    'nb-top':   { scene: 'citrus',          c1: '#16461a', c2: '#071b09', accent: '#b9e26a', bg: [['green']] },
    'nb-heart': { scene: 'blossom',         c1: '#3f3a12', c2: '#110f04', accent: '#ffd27a',
                  bg: [['bokeh', { rgb: '255,220,140', n: 22 }], ['flowers', { n: 16, fill: '#fffaf0', center: '#f5c542' }], ['dust', { rgb: '255,245,200', n: 60 }]] },
    'nb-base':  { scene: 'vetiverMusk',     c1: '#2c2b14', c2: '#0b0b05', accent: '#ddd09a',
                  bg: [['clouds', { n: 9 }], ['leaves', { n: 12, c0: '#6b6a2a', c1: '#b9a860', thin: true }], ['dust', { rgb: '240,235,205', n: 60 }]] },

    'ti-top':   { scene: 'figLeafSalt',     c1: '#0f4038', c2: '#03130f', accent: '#7fe0c4',
                  bg: [['bokeh', { rgb: '120,230,200', n: 24 }], ['crystals', { n: 42 }], ['rain', { rgb: '200,255,240', n: 40 }]] },
    'ti-heart': { scene: 'figJasmine',      c1: '#3d2244', c2: '#0f0712', accent: '#f0dcff',
                  bg: [['bokeh', { rgb: '230,190,255', n: 22 }], ['flowers', { n: 18, fill: '#ffffff', c0: '#fff4dc', c2: '#f3e8ff', center: '#f0dc94', pointed: true }], ['drops', { n: 8, rgb: '255,250,240' }], ['dust', { rgb: '255,245,255', n: 50 }]] },
    'ti-base':  { scene: 'driftwoodMusk',   c1: '#33403e', c2: '#0b1010', accent: '#dfeee8',
                  bg: [['clouds', { n: 10 }], ['crystals', { n: 18 }], ['dust', { rgb: '230,245,240', n: 50 }]] },

    'sy-top':   { scene: 'cypressCardamom', c1: '#1d3a2c', c2: '#06110b', accent: '#b4e0a0',
                  bg: [['clouds', { n: 7, rgb: '210,240,220' }], ['leaves', { n: 18, c0: '#1d4a2c', c1: '#4f8a5a', thin: true }], ['dust', { rgb: '210,255,220', n: 50 }]] },
    'sy-heart': { scene: 'cedarIncense',    c1: '#33241a', c2: '#0c0806', accent: '#e6b98a',
                  bg: [['smoke', { rgb: '150,130,115', n: 8 }], ['dust', { rgb: '255,220,180', n: 60 }]] },
    'sy-base':  { scene: 'sandalMusk',      c1: '#3d2a20', c2: '#110a07', accent: '#f2cfb0',
                  bg: [['clouds', { n: 9, rgb: '255,235,220' }], ['grains', { fill: '#c99060', n: 26, size: [1.2, 3] }], ['dust', { rgb: '255,230,210', n: 50 }]] },

    'ga-top':   { scene: 'cinnamonClove',   c1: '#4a1c0b', c2: '#120502', accent: '#ff9a50',
                  bg: [['grains', { fill: '#8a4520', n: 36, size: [1.5, 4] }], ['embers', { rgb: '255,150,60', n: 45 }], ['dust', { rgb: '255,190,130', n: 50 }]] },
    'ga-heart': { scene: 'vanillaLabdanum', c1: '#3e2a10', c2: '#120b04', accent: '#ffd27a',
                  bg: [['bokeh', { rgb: '255,200,110', n: 24 }], ['drops', { n: 12, rgb: '240,170,60' }], ['dust', { rgb: '255,225,170', n: 50 }]] },
    'ga-base':  { scene: 'amberTonka',      c1: '#120c0a', c2: '#040303', accent: '#ff8a3a', bg: [['dark']] }
  };
})();
