/* ==========================================================
   Gülizar — canvas sanatları
   Nota arka planları, kemer içindeki görseller (narenciye, gül,
   ateş), deniz feneri ve imleç izi. Hepsi kodla çiziliyor.
   ========================================================== */
(function () {
  'use strict';
  const F = window.FARO = window.FARO || {};
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function fit(canvas, maxDpr) {
    const r = canvas.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    const w = Math.max(1, Math.round(r.width * d));
    const h = Math.max(1, Math.round(r.height * d));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w, h, d };
  }
  F.fitCanvas = fit;

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  F.hexToRgb = hexToRgb;
  F.mixHex = function (a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    const m = (i) => Math.round(A[i] + (B[i] - A[i]) * t);
    return 'rgb(' + m(0) + ',' + m(1) + ',' + m(2) + ')';
  };

  /* Yumuşak parçacık sprite'ları (önbellekli) */
  const cache = {};
  function sprite(rgb, core) {
    const key = 's' + rgb + (core || '');
    if (cache[key]) return cache[key];
    const s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(' + rgb + ',1)');
    g.addColorStop(core || 0.22, 'rgba(' + rgb + ',0.55)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return (cache[key] = c);
  }
  function bokeh(rgb) {
    const key = 'b' + rgb;
    if (cache[key]) return cache[key];
    const s = 128, c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(' + rgb + ',0.35)');
    g.addColorStop(0.72, 'rgba(' + rgb + ',0.5)');
    g.addColorStop(0.86, 'rgba(' + rgb + ',0.7)');
    g.addColorStop(0.94, 'rgba(' + rgb + ',0.25)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return (cache[key] = c);
  }
  F.sprite = sprite;

  function rr(x, px, py, w, h, r) {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  /* ==========================================================
     NOTA ARKA PLANI — 0: yağmur/bokeh (yeşil) 1: gül yaprakları (kırmızı) 2: kor (siyah)
     ========================================================== */
  const RAIN_A = [0.06, 0.11, 0.17, 0.24];
  const RAIN_W = [0.6, 0.85, 1.1, 1.4];

  F.NotesBG = function (canvas) {
    const ctx = canvas.getContext('2d');
    let W = 1, H = 1, D = 1;
    let rain = [], bokG = [], dust = [], bokR = [], petals = [], embers = [], smoke = [];

    const newPetal = (init) => ({
      x: Math.random() * W, y: init ? Math.random() * H : -40 * D,
      s: rand(7, 17) * D, vx: rand(-8, 22) * D, vy: rand(16, 44) * D,
      rot: rand(0, TAU), vr: rand(-1.1, 1.1), ph: rand(0, TAU), a: rand(0.35, 0.75)
    });
    const newEmber = (init) => ({
      x: Math.random() * W, y: init ? Math.random() * H : H + rand(0, 40) * D,
      r: rand(0.8, 2.6) * D, vx: rand(-10, 10) * D, vy: -rand(18, 80) * D,
      ph: rand(0, TAU), a: rand(0.35, 1)
    });

    function seed() {
      const area = clamp((W * H) / (D * D) / (1440 * 900), 0.35, 1.6);
      const n = (k) => Math.round(k * area);
      rain = Array.from({ length: n(110) }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, len: rand(18, 110) * D, v: rand(240, 720) * D, b: i % 4 }));
      bokG = Array.from({ length: n(28) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: rand(8, 54) * D, vx: rand(-6, 6) * D, vy: rand(3, 18) * D, a: rand(0.05, 0.22), ph: rand(0, TAU) }));
      dust = Array.from({ length: n(90) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: rand(0.6, 2.2) * D, vx: rand(-8, 8) * D, vy: rand(-6, 12) * D, a: rand(0.2, 0.8), ph: rand(0, TAU) }));
      bokR = Array.from({ length: n(32) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: rand(10, 70) * D, vx: rand(-5, 5) * D, vy: rand(-14, -3) * D, a: rand(0.05, 0.2), ph: rand(0, TAU) }));
      petals = Array.from({ length: n(16) }, () => newPetal(true));
      embers = Array.from({ length: n(130) }, () => newEmber(true));
      smoke = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: rand(0.2, 0.9) * H, r: rand(160, 340) * D, vx: rand(4, 14) * D, a: rand(0.03, 0.07) }));
    }

    function wrap(p, m) {
      if (p.x < -m) p.x += W + m * 2;
      if (p.x > W + m) p.x -= W + m * 2;
      if (p.y < -m) p.y += H + m * 2;
      if (p.y > H + m) p.y -= H + m * 2;
    }

    function green(dt, t, k) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgb(190,240,150)';
      // yağmur çizgileri 4 saydamlık grubunda tek seferde çiziliyor (110 ayrı çizim yerine 4)
      for (let b = 0; b < 4; b++) {
        ctx.globalAlpha = RAIN_A[b] * k;
        ctx.lineWidth = RAIN_W[b] * D;
        ctx.beginPath();
        for (const p of rain) {
          if (p.b !== b) continue;
          p.y += p.v * dt;
          if (p.y - p.len > H) { p.y = -rand(0, H * 0.3); p.x = Math.random() * W; }
          ctx.moveTo(p.x, p.y - p.len);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      const bs = bokeh('170,225,110');
      for (const b of bokG) {
        b.x += b.vx * dt; b.y += b.vy * dt; wrap(b, b.r);
        ctx.globalAlpha = b.a * k * (0.7 + 0.3 * Math.sin(t * 0.8 + b.ph));
        ctx.drawImage(bs, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      const ds = sprite('225,255,170');
      for (const p of dust) {
        p.x += (p.vx + Math.sin(t + p.ph) * 6 * D) * dt; p.y += p.vy * dt; wrap(p, 10);
        ctx.globalAlpha = p.a * k * (0.5 + 0.5 * Math.sin(t * 2 + p.ph));
        ctx.drawImage(ds, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
      }
      ctx.globalAlpha = 1;
    }

    function red(dt, t, k) {
      ctx.globalCompositeOperation = 'lighter';
      const bs = bokeh('255,90,120');
      for (const b of bokR) {
        b.x += b.vx * dt; b.y += b.vy * dt; wrap(b, b.r);
        ctx.globalAlpha = b.a * k * (0.7 + 0.3 * Math.sin(t * 0.7 + b.ph));
        ctx.drawImage(bs, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      const ds = sprite('255,190,200');
      for (const p of dust) {
        p.x += (p.vx + Math.sin(t + p.ph) * 6 * D) * dt; p.y -= p.vy * 0.5 * dt; wrap(p, 10);
        ctx.globalAlpha = p.a * k * 0.6 * (0.5 + 0.5 * Math.sin(t * 1.6 + p.ph));
        ctx.drawImage(ds, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const p of petals) {
        p.ph += dt;
        p.x += (p.vx + Math.sin(p.ph * 1.3) * 22 * D) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 40 * D) Object.assign(p, newPetal(false));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.ph * 1.6)));
        ctx.globalAlpha = p.a * k;
        ctx.fillStyle = '#8c0e22';
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.bezierCurveTo(p.s * 0.95, -p.s * 0.6, p.s * 0.75, p.s * 0.85, 0, p.s);
        ctx.bezierCurveTo(-p.s * 0.75, p.s * 0.85, -p.s * 0.95, -p.s * 0.6, 0, -p.s);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,130,150,0.35)';
        ctx.lineWidth = D;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    function dark(dt, t, k) {
      ctx.globalCompositeOperation = 'source-over';
      const ss = sprite('70,55,48', 0.5);
      for (const s of smoke) {
        s.x += s.vx * dt;
        if (s.x - s.r > W) s.x = -s.r;
        ctx.globalAlpha = s.a * k;
        ctx.drawImage(ss, s.x - s.r, s.y - s.r * 0.5, s.r * 2, s.r);
      }
      ctx.globalCompositeOperation = 'lighter';
      const es = sprite('255,140,50');
      for (const p of embers) {
        p.ph += dt * 3;
        p.x += (p.vx + Math.sin(p.ph) * 14 * D) * dt;
        p.y += p.vy * dt;
        if (p.y < -20 * D) Object.assign(p, newEmber(false));
        const fl = 0.55 + 0.45 * Math.sin(p.ph * 2.3);
        const life = clamp(p.y / H, 0, 1);
        ctx.globalAlpha = p.a * k * fl * (0.25 + life * 0.75);
        const r = p.r * 4;
        ctx.drawImage(es, p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    }

    /* Şişeye özel temalar: her tema kendi parçacık türlerini (notes-art.js → F.BG_KINDS) kullanır.
       Eski üç arka plan da 'green' / 'red' / 'dark' adıyla tema olarak kullanılabilir. */
    const LEGACY = { green, red, dark };
    let pools = {};
    function themeBg(theme, slot, dt, t, k) {
      for (let j = 0; j < theme.bg.length; j++) {
        const spec = theme.bg[j];
        if (LEGACY[spec[0]]) { LEGACY[spec[0]](dt, t, k); continue; }
        const kind = F.BG_KINDS && F.BG_KINDS[spec[0]];
        if (!kind) continue;
        const key = theme.id + ':' + j;
        const env = { ctx, W, H, D, o: spec[1] || {} };
        if (!pools[key]) {
          const area = clamp((W * H) / (D * D) / (1440 * 900), 0.35, 1.6);
          const n = Math.round((env.o.n || kind.n) * area);
          pools[key] = Array.from({ length: n }, () => kind.make(env, true));
        }
        ctx.globalAlpha = 1;
        kind.draw(env, pools[key], dt, t, k);
      }
    }

    // arka plan parçacıkları yumuşak olduğu için 1x çözünürlük yeterli
    this.resize = function () { const f = fit(canvas, 1); W = f.w; H = f.h; D = f.d; seed(); pools = {}; };
    this.render = function (dt, t, w, themes) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        if (w[i] <= 0.01) continue;
        if (themes) themeBg(themes[i], i, dt, t, w[i]);
        else [green, red, dark][i](dt, t, w[i]);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    };
  };

  /* ==========================================================
     KEMER İÇİ SANAT — narenciye / gül / ateş
     ========================================================== */
  // Sabit tohumlu rastgele: dilimdeki meyve keseleri her karede aynı kalsın
  function seeded(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  const vrand = seeded(42);
  const VESICLES = Array.from({ length: 160 }, () => ({
    seg: Math.floor(vrand() * 11), f: 0.22 + vrand() * 0.7, da: vrand() * 0.8 - 0.4,
    len: 0.05 + vrand() * 0.08, w: 0.012 + vrand() * 0.016, a: 0.2 + vrand() * 0.35
  }));

  function slice(c, x, y, R, rot, light) {
    const n = 11;
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    // kabuk
    let g = c.createRadialGradient(-R * 0.25, -R * 0.25, R * 0.2, 0, 0, R);
    g.addColorStop(0, '#c4e255');
    g.addColorStop(0.8, '#62a01d');
    g.addColorStop(1, '#2c5a0c');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    // ak kısım
    c.fillStyle = '#f2f5d6';
    c.beginPath(); c.arc(0, 0, R * 0.91, 0, TAU); c.fill();
    // dilimler
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, mid = (a0 + a1) / 2;
      g = c.createRadialGradient(0, 0, R * 0.08, 0, 0, R * 0.86);
      g.addColorStop(0, '#f8f6b0');
      g.addColorStop(0.55, '#dbe95e');
      g.addColorStop(1, '#a7cc31');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(Math.cos(mid) * R * 0.1, Math.sin(mid) * R * 0.1);
      c.arc(0, 0, R * 0.85, a0 + 0.045, a1 - 0.045);
      c.closePath();
      c.fill();
    }
    // meyve keseleri
    c.fillStyle = 'rgba(255,255,225,1)';
    for (const v of VESICLES) {
      const a = ((v.seg + 0.5 + v.da) / n) * TAU;
      const r = v.f * R * 0.82;
      c.save();
      c.translate(Math.cos(a) * r, Math.sin(a) * r);
      c.rotate(a);
      c.globalAlpha = v.a;
      c.beginPath();
      c.ellipse(0, 0, v.len * R, v.w * R, 0, 0, TAU);
      c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
    c.fillStyle = '#f6f8de';
    c.beginPath(); c.arc(0, 0, R * 0.07, 0, TAU); c.fill();
    // parlama
    c.globalCompositeOperation = 'lighter';
    g = c.createRadialGradient(-R * 0.35, -R * 0.4, 0, -R * 0.35, -R * 0.4, R * 0.7);
    g.addColorStop(0, 'rgba(255,255,230,' + (0.28 * light) + ')');
    g.addColorStop(1, 'rgba(255,255,230,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    c.globalCompositeOperation = 'source-over';
    if (light < 1) {
      c.fillStyle = 'rgba(5,20,5,' + (1 - light) + ')';
      c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    }
    c.restore();
  }

  function leaf(c, x, y, L, rot, col0, col1, vein) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    const g = c.createLinearGradient(0, -L * 0.2, L, L * 0.2);
    g.addColorStop(0, col0 || '#17460f');
    g.addColorStop(1, col1 || '#4f8f22');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(L * 0.3, -L * 0.3, L * 0.75, -L * 0.22, L, 0);
    c.bezierCurveTo(L * 0.75, L * 0.22, L * 0.3, L * 0.3, 0, 0);
    c.fill();
    c.strokeStyle = vein || 'rgba(200,240,150,0.35)';
    c.lineWidth = Math.max(1, L * 0.008);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -L * 0.02, L, 0); c.stroke();
    for (let i = 1; i < 6; i++) {
      const px = (L * i) / 6.5, s = 1 - i / 7;
      c.beginPath(); c.moveTo(px, 0); c.quadraticCurveTo(px + L * 0.06, -L * 0.08 * s, px + L * 0.12, -L * 0.14 * s); c.stroke();
      c.beginPath(); c.moveTo(px, 0); c.quadraticCurveTo(px + L * 0.06, L * 0.08 * s, px + L * 0.12, L * 0.14 * s); c.stroke();
    }
    c.restore();
  }

  /* Sabit parçaları bir kez çizip saklar (boyut değişince yeniden çizilir) */
  function cached(st, key, w, h, draw) {
    st.cache = st.cache || {};
    const old = st.cache[key];
    if (old && old.width === w && old.height === h) return old;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d'));
    st.cache[key] = cv;
    return cv;
  }

  function drawCitrus(c, W, H, t, dt, st) {
    c.drawImage(cached(st, 'bg', W, H, (x) => {
      let g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#173a10');
      g.addColorStop(1, '#061407');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      g = x.createRadialGradient(W * 0.55, H * 0.42, 0, W * 0.55, H * 0.42, W * 0.75);
      g.addColorStop(0, 'rgba(190,230,90,0.38)');
      g.addColorStop(1, 'rgba(190,230,90,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
    }), 0, 0);

    const LW = Math.ceil(W * 0.52), LH = Math.ceil(W * 0.34);
    const leafImg = cached(st, 'leaf', LW, LH, (x) => leaf(x, 2, LH / 2, W * 0.5, 0));
    c.save();
    c.translate(W * 0.12, H * 0.27);
    c.rotate(-0.55 + Math.sin(t * 0.7) * 0.06);
    c.drawImage(leafImg, -2, -LH / 2);
    c.restore();

    const R2 = W * 0.25, S2 = Math.ceil(R2 * 2 + 4);
    const backImg = cached(st, 'back', S2, S2, (x) => slice(x, S2 / 2, S2 / 2, R2, 0, 0.7));
    c.save();
    c.translate(W * 0.33, H * 0.72);
    c.scale(1, 0.6);
    c.rotate(-t * 0.08);
    c.drawImage(backImg, -S2 / 2, -S2 / 2);
    c.restore();

    const R = W * 0.33, cx = W * 0.57, cy = H * 0.45 + Math.sin(t * 0.9) * W * 0.008;
    const S = Math.ceil(R * 2 + 4);
    const sliceImg = cached(st, 'slice', S, S, (x) => slice(x, S / 2, S / 2, R, 0, 1));
    c.save();
    c.translate(cx, cy);
    c.rotate(t * 0.1);
    c.drawImage(sliceImg, -S / 2, -S / 2);
    c.restore();
    let g;

    // damlalar
    st.dropT = (st.dropT || 0) - dt;
    if (st.dropT <= 0) {
      st.dropT = rand(0.35, 0.9);
      const a = rand(0.3, 0.9) * Math.PI;
      st.drops.push({ x: cx + Math.cos(a) * R * 0.92, y: cy + Math.sin(a) * R * 0.92, vy: 0, r: rand(0.012, 0.022) * W, hold: rand(0.2, 0.7) });
    }
    for (let i = st.drops.length - 1; i >= 0; i--) {
      const d = st.drops[i];
      if (d.hold > 0) d.hold -= dt; else { d.vy += H * 1.6 * dt; d.y += d.vy * dt; }
      if (d.y > H + 20) { st.drops.splice(i, 1); continue; }
      const stretch = 1 + Math.min(2, d.vy / (H * 0.8));
      g = c.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r * 1.2);
      g.addColorStop(0, 'rgba(255,255,230,0.95)');
      g.addColorStop(0.5, 'rgba(210,235,120,0.55)');
      g.addColorStop(1, 'rgba(160,200,60,0.1)');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(d.x, d.y, d.r, d.r * stretch, 0, 0, TAU);
      c.fill();
    }
  }

  function petal(c, a, r, w, depth) {
    c.save();
    c.rotate(a);
    const g = c.createLinearGradient(0, 0, r * 1.02, 0);
    g.addColorStop(0, '#22020a');
    g.addColorStop(0.42, F.mixHex('#6e0a1c', '#9c1229', depth));
    g.addColorStop(0.86, F.mixHex('#b81a32', '#de3a52', depth));
    g.addColorStop(1, '#f07a88');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(r * 0.35, -w, r * 0.92, -w * 0.92, r, -w * 0.16);
    c.quadraticCurveTo(r * 1.05, 0, r, w * 0.16);
    c.bezierCurveTo(r * 0.92, w * 0.92, r * 0.35, w, 0, 0);
    c.fill();
    c.strokeStyle = 'rgba(255,160,175,0.3)';
    c.lineWidth = Math.max(1, r * 0.014);
    c.beginPath();
    c.moveTo(r * 0.78, -w * 0.78);
    c.bezierCurveTo(r * 0.97, -w * 0.5, r * 1.04, 0, r * 0.97, w * 0.32);
    c.stroke();
    c.restore();
  }

  function drawRose(c, W, H, t, dt, st) {
    c.drawImage(cached(st, 'bg', W, H, (x) => {
      const g = x.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, H * 0.75);
      g.addColorStop(0, '#5a0a1c');
      g.addColorStop(1, '#14020a');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
    }), 0, 0);

    const cx = W * 0.5, cy = H * 0.46;
    const R0 = W * 0.44;
    const R = R0 * (1 + Math.sin(t * 0.5) * 0.015);
    c.save();
    c.translate(cx, cy);
    c.rotate(t * 0.03);
    c.scale(R / R0, R / R0);
    const L = 8;
    for (let l = 0; l < L; l++) {
      // her yaprak katmanı (gölgesiyle birlikte) bir kez çizilir, sonra döndürülerek kullanılır
      const r = R0 * (0.18 + 0.82 * (1 - l / L));
      const S = Math.ceil(r * 2.4 + 4);
      const img = cached(st, 'layer' + l, S, S, (x) => {
        x.translate(S / 2, S / 2);
        if (l > 0) {
          const g = x.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.18);
          g.addColorStop(0, 'rgba(10,0,3,0.55)');
          g.addColorStop(1, 'rgba(10,0,3,0)');
          x.fillStyle = g;
          x.beginPath(); x.arc(0, 0, r * 1.18, 0, TAU); x.fill();
        }
        const n = l < 3 ? 5 : 4;
        for (let j = 0; j < n; j++) petal(x, (j / n) * TAU, r, r * (0.62 + 0.06 * Math.sin(l * 1.7 + j)), l / L);
      });
      c.save();
      c.rotate(l * 0.95 + t * 0.05 * (l % 2 ? 1 : -1));
      c.drawImage(img, -S / 2, -S / 2);
      c.restore();
    }
    // merkez spiral
    c.strokeStyle = 'rgba(30,0,8,0.8)';
    c.lineWidth = Math.max(1, W * 0.006);
    c.beginPath();
    for (let a = 0; a < TAU * 2.2; a += 0.15) {
      const rr2 = R0 * 0.012 * a;
      const px = Math.cos(a + t * 0.2) * rr2, py = Math.sin(a + t * 0.2) * rr2;
      a === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
    }
    c.stroke();
    c.restore();

    // çiy parıltıları
    c.globalCompositeOperation = 'lighter';
    const s = sprite('255,210,220');
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4 + 0.5, rr2 = R * (0.3 + (i % 3) * 0.2);
      const tw = Math.max(0, Math.sin(t * 1.5 + i * 1.7));
      const sz = W * 0.035 * tw;
      c.globalAlpha = 0.8 * tw;
      c.drawImage(s, cx + Math.cos(a) * rr2 - sz / 2, cy + Math.sin(a) * rr2 - sz / 2, sz, sz);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  function drawFire(c, W, H, t, dt, st) {
    c.fillStyle = '#060303';
    c.fillRect(0, 0, W, H);
    const fl = 0.85 + Math.sin(t * 7) * 0.08 + Math.sin(t * 13.3) * 0.05;
    let g = c.createRadialGradient(W * 0.5, H * 0.84, 0, W * 0.5, H * 0.84, W * 0.95);
    g.addColorStop(0, 'rgba(255,110,30,' + 0.42 * fl + ')');
    g.addColorStop(1, 'rgba(255,110,30,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // kütükler
    const logs = [[W * 0.4, -0.22, W * 0.66], [W * 0.62, 0.26, W * 0.6]];
    for (const [x, rot, len] of logs) {
      c.save();
      c.translate(x, H * 0.84);
      c.rotate(rot);
      const th = H * 0.072;
      g = c.createLinearGradient(0, -th / 2, 0, th / 2);
      g.addColorStop(0, '#3e1f10');
      g.addColorStop(0.5, '#1d0d06');
      g.addColorStop(1, '#090403');
      c.fillStyle = g;
      rr(c, -len / 2, -th / 2, len, th, th / 2);
      c.fill();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,' + (130 + Math.sin(t * 6 + x) * 40 | 0) + ',40,' + (0.5 + 0.3 * Math.sin(t * 4 + x)) + ')';
      c.lineWidth = Math.max(1, W * 0.007);
      c.beginPath();
      for (let i = 0; i <= 14; i++) {
        const px = -len / 2 + th * 0.4 + (i / 14) * (len - th * 0.8);
        const py = -th * 0.15 + (i % 2 ? 1 : -1) * th * 0.12;
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
      }
      c.stroke();
      c.globalCompositeOperation = 'source-over';
      c.restore();
    }

    // alevler
    const spawn = 140 * dt;
    st.acc = (st.acc || 0) + spawn;
    while (st.acc >= 1 && st.flames.length < 280) {
      st.acc -= 1;
      const off = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      st.flames.push({ x: W * 0.5 + off * W * 0.3, y: H * 0.8, vx: rand(-12, 12) * (W / 300), vy: -rand(0.32, 0.58) * H, life: 0, max: rand(0.5, 1.15), s: rand(0.05, 0.11) * W, seed: rand(0, TAU) });
    }
    c.globalCompositeOperation = 'lighter';
    const cols = [sprite('255,244,205'), sprite('255,175,60'), sprite('255,92,24'), sprite('150,28,8')];
    for (let i = st.flames.length - 1; i >= 0; i--) {
      const p = st.flames[i];
      p.life += dt;
      const f = p.life / p.max;
      if (f >= 1) { st.flames.splice(i, 1); continue; }
      p.x += (p.vx + Math.sin(t * 6 + p.seed) * W * 0.05) * dt;
      p.y += p.vy * dt;
      const sz = p.s * (1 - f * 0.65);
      const spr = f < 0.22 ? cols[0] : f < 0.5 ? cols[1] : f < 0.78 ? cols[2] : cols[3];
      c.globalAlpha = (f < 0.12 ? f / 0.12 : 1 - f) * 0.7;
      c.drawImage(spr, p.x - sz, p.y - sz * 1.7, sz * 2, sz * 3.4);
    }
    // kıvılcımlar
    st.sparkT = (st.sparkT || 0) - dt;
    if (st.sparkT <= 0) { st.sparkT = rand(0.05, 0.22); st.sparks.push({ x: W * 0.5 + rand(-0.25, 0.25) * W, y: H * 0.78, vx: rand(-30, 30) * (W / 300), vy: -rand(0.25, 0.7) * H, life: 0, max: rand(1.2, 2.8), ph: rand(0, TAU) }); }
    const sp = sprite('255,210,130', 0.4);
    for (let i = st.sparks.length - 1; i >= 0; i--) {
      const p = st.sparks[i];
      p.life += dt;
      if (p.life > p.max) { st.sparks.splice(i, 1); continue; }
      p.ph += dt * 5;
      p.x += (p.vx + Math.sin(p.ph) * W * 0.06) * dt;
      p.y += p.vy * dt;
      p.vy *= 1 - 0.4 * dt;
      const k = 1 - p.life / p.max;
      const sz = W * 0.012 * (0.6 + 0.4 * Math.sin(p.ph * 3));
      c.globalAlpha = k;
      c.drawImage(sp, p.x - sz, p.y - sz, sz * 2, sz * 2);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  /* Sahne kayıt defteri: notes-art.js buraya yenilerini ekler */
  F.NOTE_SCENES = Object.assign(F.NOTE_SCENES || {}, { citrus: drawCitrus, rose: drawRose, fire: drawFire });
  // notes-art.js'in kullandığı ortak yardımcılar
  F.ART = { TAU, rand, clamp, fit, sprite, bokeh, rr, seeded, cached, leaf, slice, petal, drawCitrus, drawRose, drawFire };

  F.ArchArt = function (canvas) {
    const ctx = canvas.getContext('2d');
    const layer = document.createElement('canvas');
    const lctx = layer.getContext('2d');
    let W = 1, H = 1;
    const states = {};   // tema kimliğine göre (damlalar, alevler, önbellek…)
    const stateOf = (th) => states[th.id] || (states[th.id] = { drops: [], flames: [], sparks: [], parts: [] });
    const DEFAULT = [{ id: 'citrus', scene: 'citrus' }, { id: 'rose', scene: 'rose' }, { id: 'fire', scene: 'fire' }];

    this.resize = function () { const f = fit(canvas, 1.5); W = f.w; H = f.h; layer.width = W; layer.height = H; };
    this.render = function (dt, t, w, themes) {
      themes = themes || DEFAULT;
      const order = [0, 1, 2].filter((i) => w[i] > 0.002).sort((a, b) => w[b] - w[a]);
      if (!order.length) return;
      const draw = (c, i) => {
        const th = themes[i];
        const fn = F.NOTE_SCENES[th.scene] || drawRose;
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        fn(c, W, H, t, dt, stateOf(th), th);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      };
      draw(ctx, order[0]);
      if (order[1] !== undefined) {
        draw(lctx, order[1]);
        ctx.globalAlpha = w[order[1]];
        ctx.drawImage(layer, 0, 0);
        ctx.globalAlpha = 1;
      }
    };
  };

  /* ==========================================================
     GÜL BAHÇESİ (Atölye) — "Gülizar: gül yanaklı"
     Ay ışığında, uzak bir gül bahçesinin önünde kızıl-pembe
     ışıkla nefes alır gibi parlayan tek bir gül. Rüzgârda düşen
     yaprakları suya değip halka halka yayılır.
     (Deniz fenerinin gece / yıldız / su yansıması tarzı korundu.)
     ========================================================== */
  F.Lighthouse = function (canvas) {
    const ctx = canvas.getContext('2d');
    let W = 1, H = 1, D = 1, stars = [];
    const fall = [], ripples = [];
    let fallT = 0;
    // seçili kokunun rengine göre: hale / derin ton / su yansıması
    let cGlow = '255,170,190', cDeep = '255,90,120', cWater = '255,190,205';
    const toRGB = (s) => s.replace(/rgb\(|\)/g, '');
    this.setColor = function (hex) {
      cGlow = toRGB(F.mixHex(hex, '#ffffff', 0.4));
      cDeep = toRGB(F.mixHex(hex, '#ffffff', 0.0));
      cWater = toRGB(F.mixHex(hex, '#ffffff', 0.55));
    };

    const st = {};

    this.resize = function () {
      const f = fit(canvas, 1.5); W = f.w; H = f.h; D = f.d;
      stars = Array.from({ length: 110 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.6, r: rand(0.3, 1.3) * D, ph: rand(0, TAU), s: rand(0.5, 2.2) }));
      fall.length = 0; ripples.length = 0;
    };

    // sapın eğrisi (kübik bezier)
    function stemPt(lx, ly, R, k) {
      const p0 = [lx + W * 0.05, H * 1.02], p1 = [lx + W * 0.08, H * 0.8], p2 = [lx - W * 0.04, ly + R * 2.2], p3 = [lx, ly + R * 0.55];
      const m = 1 - k;
      return [
        m * m * m * p0[0] + 3 * m * m * k * p1[0] + 3 * m * k * k * p2[0] + k * k * k * p3[0],
        m * m * m * p0[1] + 3 * m * m * k * p1[1] + 3 * m * k * k * p2[1] + k * k * k * p3[1]
      ];
    }

    // uzak gül bahçesi, sap, dikenler, yapraklar: hareketsiz, bir kez çizilir
    function drawFore(x, hz, lx, ly, R) {
      const r = seeded(77);
      // ufukta gül çitleri
      x.fillStyle = '#05060a';
      x.beginPath();
      x.moveTo(0, hz + H * 0.03);
      x.lineTo(0, hz - H * 0.01);
      for (let px = 0; px < W; px += W * 0.045) {
        const bump = H * (0.015 + r() * 0.035);
        x.quadraticCurveTo(px + W * 0.022, hz - bump * 1.4, px + W * 0.045, hz - H * 0.005 - r() * H * 0.012);
      }
      x.lineTo(W, hz + H * 0.03);
      x.closePath();
      x.fill();
      // çitlerdeki küçük gül silüetleri
      for (let i = 0; i < 18; i++) {
        const bx = r() * W, by = hz - H * (0.018 + r() * 0.035), br = W * (0.005 + r() * 0.005);
        x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill();
      }
      // sap
      x.strokeStyle = '#0a0c0f';
      x.lineCap = 'round';
      x.lineWidth = W * 0.011;
      const p0 = stemPt(lx, ly, R, 0);
      x.beginPath();
      x.moveTo(p0[0], p0[1]);
      for (let k = 0.02; k <= 1.0001; k += 0.02) { const p = stemPt(lx, ly, R, k); x.lineTo(p[0], p[1]); }
      x.stroke();
      // ay ışığının vurduğu ince kenar
      x.strokeStyle = 'rgba(255,190,205,0.18)';
      x.lineWidth = D;
      x.beginPath();
      for (let k = 0.05; k <= 0.95; k += 0.02) { const p = stemPt(lx, ly, R, k); k < 0.06 ? x.moveTo(p[0] + W * 0.005, p[1]) : x.lineTo(p[0] + W * 0.005, p[1]); }
      x.stroke();
      // dikenler
      x.fillStyle = '#0a0c0f';
      [0.18, 0.32, 0.47, 0.63, 0.78].forEach((k, i) => {
        const p = stemPt(lx, ly, R, k), s = i % 2 ? 1 : -1;
        x.beginPath();
        x.moveTo(p[0] - W * 0.004, p[1] - H * 0.006);
        x.lineTo(p[0] + s * W * 0.022, p[1] - H * 0.014);
        x.lineTo(p[0] + W * 0.004, p[1] + H * 0.004);
        x.closePath();
        x.fill();
      });
      // yapraklar (koyu, kenarı pembe ışık almış)
      let p = stemPt(lx, ly, R, 0.52);
      leaf(x, p[0], p[1], W * 0.17, -0.45, '#07090b', '#151c18', 'rgba(255,170,190,0.22)');
      p = stemPt(lx, ly, R, 0.36);
      leaf(x, p[0], p[1], W * 0.15, Math.PI + 0.55, '#07090b', '#151c18', 'rgba(255,170,190,0.18)');
      p = stemPt(lx, ly, R, 0.72);
      leaf(x, p[0], p[1], W * 0.1, Math.PI + 0.2, '#07090b', '#131915', 'rgba(255,170,190,0.16)');
      // çanak yapraklar (çiçeğin altında)
      x.fillStyle = '#0c120e';
      for (let i = 0; i < 5; i++) {
        const a = Math.PI / 2 + (i - 2) * 0.55;
        x.beginPath();
        x.moveTo(lx, ly + R * 0.5);
        x.quadraticCurveTo(lx + Math.cos(a) * R * 0.5 - W * 0.01, ly + R * 0.5 + Math.sin(a) * R * 0.25, lx + Math.cos(a) * R * 0.75, ly + R * 0.5 + Math.sin(a) * R * 0.45);
        x.quadraticCurveTo(lx + Math.cos(a) * R * 0.4 + W * 0.01, ly + R * 0.5 + Math.sin(a) * R * 0.2, lx, ly + R * 0.5);
        x.fill();
      }
    }

    // açmış gül: katman katman yaprak (önden hafif yukarıdan bakış)
    function drawBloom(x, S, R) {
      x.translate(S / 2, S / 2);
      x.scale(1, 0.84);
      const L = 9;
      for (let l = 0; l < L; l++) {
        const r = R * (0.16 + 0.84 * (1 - l / L));
        if (l > 0) {
          const g = x.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.15);
          g.addColorStop(0, 'rgba(10,0,3,0.5)');
          g.addColorStop(1, 'rgba(10,0,3,0)');
          x.fillStyle = g;
          x.beginPath(); x.arc(0, 0, r * 1.15, 0, TAU); x.fill();
        }
        const n = l < 3 ? 5 : 4;
        for (let j = 0; j < n; j++) petal(x, (j / n) * TAU + l * 0.95, r, r * (0.62 + 0.06 * Math.sin(l * 1.7 + j)), l / L);
      }
      x.strokeStyle = 'rgba(30,0,8,0.8)';
      x.lineWidth = Math.max(1, R * 0.025);
      x.beginPath();
      for (let a = 0; a < TAU * 2.2; a += 0.15) {
        const rr2 = R * 0.012 * a * 1.6;
        a === 0 ? x.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2) : x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
      }
      x.stroke();
    }

    function fallingPetal(c, p) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.ph * 1.6)));
      c.fillStyle = '#a3142c';
      c.beginPath();
      c.moveTo(0, -p.s);
      c.bezierCurveTo(p.s * 0.95, -p.s * 0.6, p.s * 0.75, p.s * 0.85, 0, p.s);
      c.bezierCurveTo(-p.s * 0.75, p.s * 0.85, -p.s * 0.95, -p.s * 0.6, 0, -p.s);
      c.fill();
      c.strokeStyle = 'rgba(255,150,170,0.45)';
      c.lineWidth = D;
      c.stroke();
      c.restore();
    }

    const SEA_STEP = 0.085, SEA_ROWS = 34;

    this.render = function (dt, t) {
      const hz = H * 0.7;
      const lx = W * 0.6, ly = H * 0.33;
      const R = W * 0.16;
      // "gül yanaklı": gülün ışığı yavaşça nefes alıp verir
      const flare = 0.5 + 0.5 * Math.sin(t * 0.9);
      let g;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(cached(st, 'sky', W, H, (x) => {
        let gg = x.createLinearGradient(0, 0, 0, hz);
        gg.addColorStop(0, '#03050a');
        gg.addColorStop(0.65, '#0d1020');
        gg.addColorStop(1, '#261a26');
        x.fillStyle = gg;
        x.fillRect(0, 0, W, hz + 1);
        gg = x.createLinearGradient(0, hz, 0, H);
        gg.addColorStop(0, '#120f1c');
        gg.addColorStop(1, '#020305');
        x.fillStyle = gg;
        x.fillRect(0, hz, W, H - hz);
      }), 0, 0);

      // yıldızlar
      const ss = sprite('230,235,255', 0.35);
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t * s.s + s.ph));
        const r = s.r * 3;
        ctx.drawImage(ss, s.x - r, s.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // hilal ay
      const mx = W * 0.22, my = H * 0.15, mr = W * 0.05;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35;
      ctx.drawImage(sprite('200,205,235', 0.3), mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(cached(st, 'moon', Math.ceil(mr * 2.4), Math.ceil(mr * 2.4), (x) => {
        const c0 = mr * 1.2;
        x.fillStyle = '#f2ecdf';
        x.beginPath(); x.arc(c0, c0, mr, 0, TAU); x.fill();
        x.globalCompositeOperation = 'destination-out';
        x.beginPath(); x.arc(c0 + mr * 0.42, c0 - mr * 0.18, mr * 0.9, 0, TAU); x.fill();
      }), mx - mr * 1.2, my - mr * 1.2);

      // gülden yayılan yumuşak ışık huzmeleri (yavaşça döner)
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) {
        const a = t * 0.05 + (i / 10) * TAU;
        const len = W * (0.45 + 0.15 * Math.sin(i * 2.3));
        const spread = 0.05 + 0.02 * Math.sin(i * 1.7);
        const ex = lx + Math.cos(a) * len, ey = ly + Math.sin(a) * len;
        g = ctx.createLinearGradient(lx, ly, ex, ey);
        g.addColorStop(0, 'rgba(' + cGlow + ',' + (0.06 + flare * 0.06) + ')');
        g.addColorStop(1, 'rgba(' + cGlow + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + Math.cos(a - spread) * len, ly + Math.sin(a - spread) * len);
        ctx.lineTo(lx + Math.cos(a + spread) * len, ly + Math.sin(a + spread) * len);
        ctx.closePath();
        ctx.fill();
      }

      // sudaki pembe yansıma — çizgiler saydamlık/kalınlık gruplarına toplanıp grup başına tek seferde çiziliyor
      const beamX = mx;   // ayın da sudaki izi
      const buckets = {};
      for (let i = 0; i < SEA_ROWS; i++) {
        const f = i / SEA_ROWS;
        const y = hz + Math.pow(f, 1.6) * (H - hz) + 2 * D;
        const segs = 9 + Math.round(i * 1.3);
        const len = W * (0.01 + f * 0.04);
        const wk = f < 0.5 ? 0 : 1;
        for (let s = 0; s < segs; s++) {
          const x = ((s + 0.5) / segs) * W + Math.sin(t * 0.8 + i * 1.7 + s) * W * 0.02;
          const near = Math.exp(-Math.pow((x - lx) / (W * 0.08 + f * W * 0.12), 2));
          const nearBeam = Math.exp(-Math.pow((x - beamX) / (W * 0.08), 2)) * 0.5;
          const shimmer = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 2.3 + s * 4.1);
          const lvl = Math.round(((0.03 + near * (0.35 + flare * 0.4) + nearBeam * 0.15) * shimmer) / SEA_STEP);
          if (lvl < 1) continue;
          const key = wk * 100 + lvl;
          const p = buckets[key] || (buckets[key] = new Path2D());
          p.moveTo(x - len, y);
          p.lineTo(x + len, y);
        }
      }
      ctx.strokeStyle = 'rgb(' + cWater + ')';
      for (const key in buckets) {
        ctx.globalAlpha = Math.min(1, (key % 100) * SEA_STEP);
        ctx.lineWidth = Math.max(1, D * (key >= 100 ? 1.6 : 0.9));
        ctx.stroke(buckets[key]);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // suya düşen yaprakların halkaları
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.life += dt;
        if (rp.life > 1.6) { ripples.splice(i, 1); continue; }
        const f = rp.life / 1.6;
        ctx.strokeStyle = 'rgba(' + cWater + ',' + (0.45 * (1 - f)) + ')';
        ctx.lineWidth = D;
        ctx.beginPath(); ctx.ellipse(rp.x, rp.y, W * 0.07 * f, H * 0.008 * f + D, 0, 0, TAU); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';

      ctx.drawImage(cached(st, 'fore', W, H, (x) => drawFore(x, hz, lx, ly, R)), 0, 0);

      // gülün arkasındaki kızıl-pembe hale
      ctx.globalCompositeOperation = 'lighter';
      const fr = W * (0.2 + flare * 0.12);
      g = ctx.createRadialGradient(lx, ly, 0, lx, ly, fr);
      g.addColorStop(0, 'rgba(' + cGlow + ',' + (0.35 + flare * 0.25) + ')');
      g.addColorStop(0.4, 'rgba(' + cDeep + ',' + (0.12 + flare * 0.12) + ')');
      g.addColorStop(1, 'rgba(' + cDeep + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(lx - fr, ly - fr, fr * 2, fr * 2);
      ctx.globalCompositeOperation = 'source-over';

      // gül (rüzgârda hafifçe salınır)
      const S = Math.ceil(R * 2.5);
      const bloom = cached(st, 'bloom', S, S, (x) => drawBloom(x, S, R));
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(Math.sin(t * 0.5) * 0.04);
      ctx.drawImage(bloom, -S / 2, -S / 2);
      ctx.restore();

      // yaprakların kenarındaki ışık (yanak pembesi)
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25 + flare * 0.3;
      ctx.drawImage(sprite(cGlow, 0.3), lx - R * 0.9, ly - R * 0.9, R * 1.8, R * 1.8);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // rüzgârda kopup suya düşen yapraklar
      fallT -= dt;
      if (fallT <= 0 && fall.length < 8) {
        fallT = rand(0.9, 2.2);
        fall.push({ x: lx + rand(-0.5, 0.5) * R, y: ly + rand(-0.2, 0.3) * R, vx: -rand(0.03, 0.08) * W, vy: rand(0.02, 0.05) * H, rot: rand(0, TAU), vr: rand(-1.5, 1.5), ph: rand(0, TAU), s: W * rand(0.012, 0.02), land: hz + rand(0.02, 0.2) * (H - hz) });
      }
      for (let i = fall.length - 1; i >= 0; i--) {
        const p = fall[i];
        p.ph += dt; p.vy += H * 0.015 * dt;
        p.x += (p.vx + Math.sin(p.ph * 1.4) * W * 0.03) * dt;
        p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.y >= p.land || p.x < -W * 0.1) {
          if (p.y >= p.land) ripples.push({ x: p.x, y: p.land, life: 0 });
          fall.splice(i, 1);
          continue;
        }
        fallingPetal(ctx, p);
      }

      // sis
      const fs = sprite('170,150,190', 0.5);
      for (let i = 0; i < 5; i++) {
        const x = ((t * 12 * D + i * W * 0.31) % (W * 1.6)) - W * 0.3;
        ctx.globalAlpha = 0.05;
        ctx.drawImage(fs, x - W * 0.3, hz - H * 0.08 + i * 4 * D, W * 0.6, H * 0.14);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };
  };

  /* ==========================================================
     İMLEÇ İZİ + SPREY BUĞUSU (ekranın üstünde)
     ========================================================== */
  F.CursorFX = function (canvas, opts) {
    const ctx = canvas.getContext('2d');
    let W = 1, H = 1, D = 1;
    const pts = [], sparks = [], mist = [];
    let rgb = '255,226,190';
    let accentHex = '#e7a04a';
    let dirty = true;
    const enabled = !(opts && opts.reduced) && window.matchMedia('(pointer: fine)').matches;

    // tam ekran, her şeyin üstünde duran katman: 1x çözünürlük yeterli ve birleştirme maliyeti düşük
    this.resize = function () { const f = fit(canvas, 1); W = f.w; H = f.h; D = f.d; dirty = true; };
    this.setColor = function (hex) {
      const c = hexToRgb(hex);
      accentHex = hex;
      rgb = Math.round(c[0] * 0.45 + 255 * 0.55) + ',' + Math.round(c[1] * 0.45 + 255 * 0.55) + ',' + Math.round(c[2] * 0.45 + 255 * 0.55);
    };

    /* İmleç izi: kıvılcım yerine gül yaprakları.
       Renk, sayfanın o anki vurgu renginden türetilir (bölüm / şişe değiştikçe yapraklar da renk değiştirir). */
    const petalCache = {};
    function petalSprite(hex) {
      if (petalCache[hex]) return petalCache[hex];
      const s = 64, c = document.createElement('canvas');
      c.width = c.height = s;
      const x = c.getContext('2d');
      x.translate(s / 2, s / 2);
      const r = s * 0.42;
      const g = x.createLinearGradient(0, r, 0, -r);
      g.addColorStop(0, F.mixHex(hex, '#000000', 0.45));   // dip: koyu
      g.addColorStop(0.45, F.mixHex(hex, '#000000', 0.08));
      g.addColorStop(1, F.mixHex(hex, '#ffffff', 0.42));   // uç: açık
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(0, r);
      x.bezierCurveTo(r * 0.95, r * 0.55, r * 0.95, -r * 0.75, r * 0.15, -r * 0.95);
      x.quadraticCurveTo(0, -r * 0.82, -r * 0.15, -r * 0.95);   // uçtaki hafif çentik
      x.bezierCurveTo(-r * 0.95, -r * 0.75, -r * 0.95, r * 0.55, 0, r);
      x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.35)';
      x.lineWidth = 1;
      x.stroke();
      x.strokeStyle = 'rgba(0,0,0,0.15)';
      x.beginPath(); x.moveTo(0, r * 0.85); x.quadraticCurveTo(r * 0.08, 0, 0, -r * 0.6); x.stroke();
      return (petalCache[hex] = c);
    }

    if (enabled) {
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        const x = e.clientX * D, y = e.clientY * D;
        const last = pts[pts.length - 1];
        pts.push({ x, y, t: performance.now() });
        const sp = last ? Math.hypot(x - last.x, y - last.y) : 0;
        const n = Math.min(2, Math.floor(sp / (28 * D)) + (Math.random() < 0.22 ? 1 : 0));
        for (let i = 0; i < n; i++) {
          sparks.push({
            x: x + rand(-6, 6) * D, y: y + rand(-6, 6) * D,
            vx: rand(-30, 30) * D + (last ? (x - last.x) * 0.6 : 0), vy: rand(-40, 0) * D,
            life: 0, max: rand(1.3, 2.3), s: rand(10, 16) * D,
            rot: rand(0, TAU), vr: rand(-3, 3), ph: rand(0, TAU), hex: accentHex
          });
        }
        if (sparks.length > 90) sparks.splice(0, sparks.length - 90);
      }, { passive: true });
    }

    /* Sprey: iki katman.
       - drops: ağızdan hızla fırlayan ince damlacıklar (çizgi izi bırakır, yerçekimiyle düşer)
       - clouds: yavaşlayıp genişleyen, havada asılı kalan parfüm sisi
       Ağızda da her basışta kısa bir parlama oluyor. */
    const drops = [];
    let flash = 0, fx0 = 0, fy0 = 0, dropAcc = 0, cloudAcc = 0;
    // sahne karardığında sprey (sis, damla, parlama) onunla birlikte sönsün
    let sprayAlpha = 1;
    this.setSprayAlpha = function (a) { sprayAlpha = a; };
    // sprey eskisi gibi parlak ve ışıltılı; yalnızca beyaz yerine şişenin palet renginin açık tonu
    let mistRGB = '255,247,238', dropRGB = '255,244,228', flashRGB = '255,240,215';
    this.setSprayColor = function (hex) {
      const t = (s) => s.replace(/rgb\(|\)/g, '');
      mistRGB = t(F.mixHex(hex, '#ffffff', 0.62));
      dropRGB = t(F.mixHex(hex, '#ffffff', 0.5));
      flashRGB = t(F.mixHex(hex, '#ffffff', 0.6));
    };
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const sizeK = () => clamp(H / D / 850, 0.6, 1.35);   // ekran boyuna göre ölçek
    const vScale = () => D * sizeK();

    // Sis bulutu düşük çözünürlüklü ayrı bir katmanda çiziliyor (zaten bulanık);
    // tam çözünürlükte yüzlerce büyük sprite GPU'yu boğuyordu.
    const MS = 0.3;
    const mistCanvas = document.createElement('canvas');
    const mctx = mistCanvas.getContext('2d');
    let mistDirty = false;

    this.spray = function (x, y, dirX, dirY, amount, dt) {
      if (amount <= 0) return;
      const S = vScale();
      const k = sizeK();
      const base = Math.atan2(dirY, dirX);
      const px = x * D, py = y * D;
      fx0 = px; fy0 = py;
      flash = Math.min(1.4, flash + amount * dt * 9);

      // bulut parçacıkları CSS piksel cinsinden tutulur
      cloudAcc += amount * 115 * dt;
      while (cloudAcc >= 1) {
        cloudAcc -= 1;
        if (mist.length >= 520) continue;
        const ang = base + gauss() * 0.45;
        const sp = rand(300, 980) * k;
        mist.push({
          x: x + Math.cos(ang) * 4 * k, y: y + Math.sin(ang) * 4 * k,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          life: 0, max: rand(2, 4.2), r0: rand(3, 7) * k, r1: rand(80, 220) * k,
          a: rand(0.08, 0.17), seed: rand(0, TAU)
        });
      }

      dropAcc += amount * 230 * dt;
      while (dropAcc >= 1) {
        dropAcc -= 1;
        if (drops.length >= 420) continue;
        const ang = base + gauss() * 0.2;
        const sp = rand(750, 1750) * S;
        drops.push({
          x: px, y: py, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          life: 0, max: rand(0.35, 0.95), w: rand(0.6, 1.6) * D, a: rand(0.45, 1)
        });
      }
    };

    this.render = function (dt) {
      const now = performance.now();
      while (pts.length && now - pts[0].t > 380) pts.shift();
      const active = pts.length > 1 || sparks.length || mist.length || drops.length || flash > 0.01;
      if (!active && !dirty) return;
      ctx.clearRect(0, 0, W, H);
      dirty = !!active;
      const S = vScale();
      const k = sizeK();

      // sis bulutu (normal karışım: üst üste binince yoğun, beyaz bir duman oluşur)
      if (mist.length || mistDirty) {
        const mw = Math.max(1, Math.ceil((W / D) * MS)), mh = Math.max(1, Math.ceil((H / D) * MS));
        if (mistCanvas.width !== mw || mistCanvas.height !== mh) { mistCanvas.width = mw; mistCanvas.height = mh; }
        mctx.clearRect(0, 0, mw, mh);
        const ms = sprite(mistRGB, 0.12);
        for (let i = mist.length - 1; i >= 0; i--) {
          const m = mist[i];
          m.life += dt;
          const f = m.life / m.max;
          if (f >= 1) { mist.splice(i, 1); continue; }
          const drag = Math.exp(-2.3 * dt);
          m.vx = m.vx * drag + Math.sin(m.life * 2.2 + m.seed) * 16 * k * dt;
          m.vy = m.vy * drag + (Math.cos(m.life * 1.7 + m.seed * 1.3) * 30 - 14) * k * dt;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          const r = (m.r0 + (m.r1 - m.r0) * Math.pow(f, 0.45)) * MS;
          mctx.globalAlpha = m.a * Math.pow(1 - f, 1.3) * Math.min(1, f * 14);
          mctx.drawImage(ms, m.x * MS - r, m.y * MS - r, r * 2, r * 2);
        }
        mctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = sprayAlpha;
        ctx.drawImage(mistCanvas, 0, 0, W, H);
        mistDirty = mist.length > 0;
      }

      // damlacıklar (ışık gibi parlayan eski karışım)
      ctx.globalCompositeOperation = 'lighter';
      if (drops.length) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgb(' + dropRGB + ')';
        const g = 300 * S;
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.life += dt;
          const f = d.life / d.max;
          if (f >= 1) { drops.splice(i, 1); continue; }
          const drag = Math.exp(-1.7 * dt);
          d.vx *= drag;
          d.vy = d.vy * drag + g * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          ctx.globalAlpha = d.a * (1 - f) * (1 - f) * sprayAlpha;
          ctx.lineWidth = d.w;
          ctx.beginPath();
          ctx.moveTo(d.x - d.vx * 0.016, d.y - d.vy * 0.016);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
      }

      // ağızdaki parlama
      ctx.globalCompositeOperation = 'lighter';
      if (flash > 0.01) {
        const fs = sprite(flashRGB, 0.3);
        const r = (18 + flash * 30) * S;
        ctx.globalAlpha = Math.min(1, flash) * 0.85 * sprayAlpha;
        ctx.drawImage(fs, fx0 - r * 0.6, fy0 - r, r * 2, r * 2);
        flash *= Math.exp(-7 * dt);
      }

      // iz
      if (pts.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          const k = 1 - (now - b.t) / 380;
          if (k <= 0) continue;
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.32 * k * k).toFixed(3) + ')';
          ctx.lineWidth = (0.8 + 5 * k * k) * D;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // gül yaprakları: havada takla atarak, sağa sola salınıp yavaşça düşer
      ctx.globalCompositeOperation = 'source-over';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        const f = s.life / s.max;
        if (f >= 1) { sparks.splice(i, 1); continue; }
        s.ph += dt * 3;
        s.vx = s.vx * Math.exp(-1.8 * dt) + Math.sin(s.ph * 0.8) * 26 * D * dt;
        s.vy = s.vy * Math.exp(-1.5 * dt) + 38 * D * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.rot += s.vr * dt;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.scale(1, 0.3 + 0.7 * Math.abs(Math.sin(s.ph)));   // dönerken incelip kalınlaşır
        ctx.globalAlpha = Math.min(1, s.life * 8) * Math.pow(1 - f, 1.4) * 0.92;
        ctx.drawImage(petalSprite(s.hex), -s.s, -s.s, s.s * 2, s.s * 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };
  };

  /* ==========================================================
     WebGL yoksa yedek şişe (SVG)
     ========================================================== */
  F.bottleSVG = function (p) {
    const id = p.id + Math.random().toString(36).slice(2, 7);
    return '<svg class="card__svg" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="g' + id + '" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="' + p.cardGlow + '"/><stop offset="1" stop-color="' + p.cardBg + '"/></radialGradient>' +
      '<linearGradient id="l' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + p.liquid + '"/><stop offset=".5" stop-color="' + p.liquid + '" stop-opacity=".78"/><stop offset="1" stop-color="' + p.liquid + '"/></linearGradient>' +
      '<linearGradient id="p' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4efe8"/><stop offset="1" stop-color="#b9b1a6"/></linearGradient>' +
      '</defs>' +
      '<rect width="400" height="520" fill="url(#g' + id + ')"/>' +
      '<rect y="372" width="400" height="148" fill="#000" opacity=".3"/>' +
      '<rect x="80" y="380" width="240" height="26" fill="url(#p' + id + ')"/>' +
      '<ellipse cx="200" cy="406" rx="120" ry="20" fill="#b9b1a6"/>' +
      '<ellipse cx="200" cy="380" rx="120" ry="20" fill="#f6f2ec"/>' +
      // gül biçimli gövde + yaprak kıvrımları
      '<path d="M174 382 C146 382 112 352 110 302 C108 252 136 214 172 204 L228 204 C264 214 292 252 290 302 C288 352 254 382 226 382 Z" fill="url(#l' + id + ')" stroke="rgba(255,255,255,.35)"/>' +
      '<path d="M150 372 C122 330 128 262 172 222 M250 372 C278 330 272 262 228 222 M200 382 C176 340 178 286 200 250 C222 286 224 340 200 382" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1.5"/>' +
      '<rect x="150" y="238" width="100" height="108" rx="8" fill="rgba(255,255,255,.06)" stroke="rgba(255,235,210,.25)"/>' +
      '<text x="200" y="280" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="32" fill="#d9b26a">G</text>' +
      '<text x="200" y="310" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-size="14" fill="#f4e9da">' + p.name + '</text>' +
      '<text x="200" y="332" text-anchor="middle" font-family="Inter, sans-serif" font-size="6" letter-spacing="1.5" fill="#f4e9da" opacity=".7">EAU DE PARFUM</text>' +
      '<rect x="178" y="190" width="44" height="14" rx="3" fill="#c9a258"/>' +
      // açmış gül biçimli kapak: dışa açılan yapraklar + ortada sarmal kalp
      '<g fill="' + p.accent + '" stroke="rgba(255,255,255,.22)" stroke-width="1">' +
      '<path d="M200 190 C176 192 146 182 140 166 C156 160 182 168 200 186 Z"/>' +
      '<path d="M200 190 C224 192 254 182 260 166 C244 160 218 168 200 186 Z"/>' +
      '<path d="M200 188 C180 182 160 160 164 142 C180 144 196 162 202 184 Z"/>' +
      '<path d="M200 188 C220 182 240 160 236 142 C220 144 204 162 198 184 Z"/>' +
      '<path d="M200 186 C186 176 180 152 190 136 C204 146 208 166 204 184 Z"/>' +
      '<path d="M200 186 C214 176 220 152 210 136 C196 146 192 166 196 184 Z"/>' +
      '<path d="M200 182 C188 172 188 152 200 144 C212 152 212 172 200 182 Z"/>' +
      '</g>' +
      '<path d="M200 170 C194 164 196 154 202 154 C208 156 206 166 200 168" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.2"/>' +
      '</svg>';
  };
})();
