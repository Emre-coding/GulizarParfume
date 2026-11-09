/* ==========================================================
   Gülizar — kodla çizilmiş, gül biçimli 3D parfüm şişesi (Three.js)
   Fotoğraf ya da hazır model yok: cam, sıvı, etiket, kapak ve
   kaide tamamen burada üretiliyor.
   ========================================================== */
(function () {
  'use strict';
  const F = window.FARO = window.FARO || {};
  const TAU = Math.PI * 2;

  /* Şişe ölçüleri (dünya birimi) */
  const BW = 1.34, BH = 1.62, BD = 0.66;      // gövde
  const PR = 1.2, PH = 0.3;                   // kaide
  const LABEL_W = BW * 0.64, LABEL_H = BH * 0.64;
  F.BOTTLE = { BW, BH, BD, PR, PH };

  /* ---------- Etiket (canvas) ---------- */
  function spaced(x, text, cx, y, spacing) {
    if ('letterSpacing' in x) {
      x.letterSpacing = spacing + 'px';
      x.fillText(text, cx + spacing / 2, y);
      x.letterSpacing = '0px';
    } else {
      x.fillText(text, cx, y);
    }
  }

  function rr(x, px, py, w, h, r) {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  function drawMonogram(x, cx, cy, s, gold) {
    x.save();
    x.translate(cx, cy);
    x.strokeStyle = gold;
    x.lineWidth = s * 0.05;
    x.lineCap = 'round';
    // halkanın arka yarısı
    x.save(); x.rotate(-0.28); x.beginPath(); x.ellipse(0, s * 0.06, s * 1.08, s * 0.32, 0, Math.PI, TAU); x.stroke(); x.restore();
    // harf
    x.fillStyle = gold;
    x.font = 'italic 400 ' + Math.round(s * 1.55) + 'px Newsreader, Georgia, serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('G', -s * 0.04, s * 0.04);
    // halkanın ön yarısı
    x.save(); x.rotate(-0.28); x.beginPath(); x.ellipse(0, s * 0.06, s * 1.08, s * 0.32, 0, 0, Math.PI); x.stroke(); x.restore();
    x.restore();
  }
  F.drawMonogram = drawMonogram;

  F.drawLabel = function (p) {
    const W = 640, H = Math.round(640 * (LABEL_H / LABEL_W));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');

    // buzlu etiket alanı
    const fg = x.createLinearGradient(0, 0, 0, H);
    fg.addColorStop(0, 'rgba(255,240,226,0.10)');
    fg.addColorStop(1, 'rgba(255,240,226,0.04)');
    x.fillStyle = fg;
    rr(x, 6, 6, W - 12, H - 12, 12);
    x.fill();
    x.strokeStyle = 'rgba(255,232,200,0.24)';
    x.lineWidth = 2.5;
    x.stroke();

    const gold = x.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
    gold.addColorStop(0, '#b4843a');
    gold.addColorStop(0.5, '#f7dfa2');
    gold.addColorStop(1, '#b4843a');

    x.textAlign = 'center';
    x.textBaseline = 'alphabetic';

    x.fillStyle = 'rgba(246,236,222,0.9)';
    x.font = '600 26px Inter, sans-serif';
    spaced(x, 'GÜLİZAR', W / 2, 96, 12);
    x.fillStyle = 'rgba(246,236,222,0.55)';
    x.font = '500 13px Inter, sans-serif';
    spaced(x, 'PARFÜM', W / 2, 122, 8);

    drawMonogram(x, W / 2, 262, 96, gold);

    // isim — sığmazsa iki satır
    x.fillStyle = '#f6ecdc';
    let fs = 82;
    x.font = '400 ' + fs + 'px Newsreader, Georgia, serif';
    const words = p.name.split(' ');
    if (x.measureText(p.name).width > W * 0.84 && words.length > 1) {
      fs = 64;
      x.font = '400 ' + fs + 'px Newsreader, Georgia, serif';
      const half = Math.ceil(words.length / 2);
      x.fillText(words.slice(0, half).join(' '), W / 2, 432);
      x.fillText(words.slice(half).join(' '), W / 2, 500);
    } else {
      while (x.measureText(p.name).width > W * 0.84 && fs > 36) {
        fs -= 2;
        x.font = '400 ' + fs + 'px Newsreader, Georgia, serif';
      }
      x.fillText(p.name, W / 2, 462);
    }

    x.fillStyle = 'rgba(246,236,222,0.6)';
    x.font = '500 19px Inter, sans-serif';
    spaced(x, 'No. ' + p.no, W / 2, 566, 5);

    x.fillStyle = 'rgba(246,236,222,0.85)';
    x.font = 'italic 400 30px Newsreader, Georgia, serif';
    x.fillText('Eau de Parfum', W / 2, 622);

    x.fillStyle = 'rgba(246,236,222,0.5)';
    x.font = '500 15px Inter, sans-serif';
    spaced(x, '50 ML', W / 2, H - 46, 7);

    return c;
  };

  /* ---------- Sahne ---------- */
  F.createStage = function (THREE, canvas, perfumes) {
    const lerp = (a, b, t) => a + (b - a) * t;
    const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // Yüksek yoğunluklu ekranlarda (1.5x ve üstü) pikseller zaten küçük; ayrıca kenar yumuşatma (MSAA) gereksiz yük
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 1.5, powerPreference: 'high-performance' });
    // çözünürlük: başta en fazla 1.5x; kare süresi uzarsa main.js setQuality ile düşürür
    let DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(DPR);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.localClippingEnabled = true;   // sıvı seviyesi bir kesme düzlemiyle çiziliyor

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
    const size = { w: 1, h: 1 };

    /* Stüdyo ortam ışığı — yansımalar için sanal softbox'lar */
    (function buildEnvironment() {
      const env = new THREE.Scene();
      env.add(new THREE.Mesh(
        new THREE.BoxGeometry(24, 14, 24),
        new THREE.MeshBasicMaterial({ color: 0x0b0908, side: THREE.BackSide })
      ));
      const panel = (w, h, pos, rot, intensity, tint) => {
        const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        mesh.position.set(pos[0], pos[1], pos[2]);
        mesh.rotation.set(rot[0], rot[1], rot[2]);
        env.add(mesh);
      };
      panel(1.6, 9, [-6.5, 1, 1.5], [0, Math.PI / 2, 0], 7, 0xffffff);   // sol şerit
      panel(1.1, 9, [6.5, 1, -0.5], [0, -Math.PI / 2, 0], 4.5, 0xfff0dd); // sağ şerit
      panel(9, 5, [0, 6.9, 0.5], [Math.PI / 2, 0, 0], 2.6, 0xffffff);     // tavan
      panel(7, 4, [0, 1.5, -11.5], [0, 0, 0], 1.4, 0xffb27a);             // sıcak arka
      panel(5, 2.5, [1.5, 0.5, 11.5], [0, Math.PI, 0], 1.6, 0xffffff);    // ön dolgu
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(env, 0.03).texture;
      pmrem.dispose();
    })();

    /* Arka plan (shader) — cam içinde kırılsın diye WebGL'de çiziliyor */
    const bgU = {
      uBg: { value: new THREE.Color(F.hero.bg) },
      uGlow: { value: new THREE.Color(F.hero.glow) },
      uGlowPos: { value: new THREE.Vector2(0.7, 0.6) },
      uFloorPos: { value: new THREE.Vector2(0.7, 0.2) },
      uBeamPos: { value: new THREE.Vector2(0.7, 0.75) },
      uHorizon: { value: 0.3 },
      uAspect: { value: 1.6 },
      uTime: { value: 0 },
      uBeam: { value: 1 },
      uDim: { value: 1 }
    };
    const bgMat = new THREE.ShaderMaterial({
      uniforms: bgU,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 uBg; uniform vec3 uGlow;
        uniform vec2 uGlowPos; uniform vec2 uFloorPos; uniform vec2 uBeamPos;
        uniform float uHorizon; uniform float uAspect; uniform float uTime; uniform float uBeam; uniform float uDim;
        varying vec2 vUv;
        float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        void main() {
          vec2 uv = vUv;
          vec2 asp = vec2(uAspect, 1.0);
          vec3 col = uBg * (0.45 + 0.7 * smoothstep(-0.1, 1.1, uv.y));

          vec2 d = (uv - uGlowPos) * asp;
          col += uGlow * exp(-dot(d, d) * 1.45) * 0.95;
          vec2 d2 = (uv - vec2(0.12, 0.98)) * asp;
          col += uGlow * 0.14 * exp(-dot(d2, d2) * 1.1);

          // zemin
          float fm = smoothstep(uHorizon + 0.015, uHorizon - 0.04, uv.y);
          vec2 fd = (uv - uFloorPos) * vec2(uAspect * 0.5, 3.0);
          float pool = exp(-dot(fd, fd) * 2.0);
          vec3 floorCol = uBg * (0.28 + 0.3 * smoothstep(0.0, uHorizon, uv.y)) + uGlow * pool * 0.8;
          col = mix(col, floorCol, fm);
          col += uGlow * 0.12 * exp(-pow((uv.y - uHorizon) * 50.0, 2.0)) * exp(-pow((uv.x - uFloorPos.x) * 1.4, 2.0));

          // deniz feneri huzmesi
          if (uBeam > 0.001) {
            vec2 b = (uv - uBeamPos) * asp;
            float r = length(b);
            float ang = atan(b.y, b.x);
            float a0 = 1.5708 + sin(uTime * 0.3) * 1.15;
            float da = mod(ang - a0 + 3.14159, 6.28318) - 3.14159;
            float beam = exp(-da * da * 16.0) * smoothstep(0.03, 0.3, r) * exp(-r * 0.7);
            col += mix(uGlow, vec3(1.0, 0.85, 0.62), 0.6) * beam * 0.26 * uBeam * step(uHorizon, uv.y);
          }

          vec2 q = (uv - 0.5) * vec2(1.0, 1.1);
          col *= 1.0 - dot(q, q) * 0.9;
          col *= uDim;
          gl_FragColor = vec4(max(col, 0.0), 1.0);
          #include <colorspace_fragment>
          gl_FragColor.rgb += (hash(uv * vec2(1931.0, 1087.0) + fract(uTime * 7.13)) - 0.5) * 0.022;
        }
      `
    });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bg.frustumCulled = false;
    bg.renderOrder = -100;
    scene.add(bg);

    /* ---------- Geometri yardımcıları ---------- */
    // Pürüzsüz köşeli kutu (RoundedBox mantığı)
    function roundedBox(w, h, d, r, seg) {
      const segments = (seg || 4) * 2 + 1;
      const geo = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
      const pos = geo.attributes.position, nor = geo.attributes.normal;
      const box = new THREE.Vector3(w, h, d).multiplyScalar(0.5).subScalar(r);
      const half = 0.5 / segments;
      const p = new THREE.Vector3(), n = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i);
        n.copy(p);
        n.x -= Math.sign(n.x) * half;
        n.y -= Math.sign(n.y) * half;
        n.z -= Math.sign(n.z) * half;
        n.normalize();
        pos.setXYZ(i,
          box.x * Math.sign(p.x) + n.x * r,
          box.y * Math.sign(p.y) + n.y * r,
          box.z * Math.sign(p.z) + n.z * r);
        nor.setXYZ(i, n.x, n.y, n.z);
      }
      pos.needsUpdate = true;
      nor.needsUpdate = true;
      return geo;
    }

    // Dalga için bol bölmeli, köşeleri yumuşatılmış kutu (sıvı)
    function softBox(w, h, d, r) {
      const geo = new THREE.BoxGeometry(w, h, d, 40, 24, 14);
      const pos = geo.attributes.position;
      const p = new THREE.Vector3(), inner = new THREE.Vector3(), n = new THREE.Vector3();
      const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
      const cl = (v, a) => Math.max(-a, Math.min(a, v));
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i);
        inner.set(cl(p.x, hx), cl(p.y, hy), cl(p.z, hz));
        n.subVectors(p, inner);
        const len = n.length();
        if (len > 1e-6) { n.multiplyScalar(r / len); p.copy(inner).add(n); }
        pos.setXYZ(i, p.x, p.y, p.z);
      }
      geo.computeVertexNormals();
      geo.translate(0, h / 2, 0);
      return geo;
    }

    function radialTexture(stops, sx, sy) {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const x = c.getContext('2d');
      x.save();
      x.translate(128, 128);
      x.scale(sx || 1, sy || 1);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 128);
      stops.forEach((s) => g.addColorStop(s[0], s[1]));
      x.fillStyle = g;
      x.fillRect(-128 / (sx || 1), -128 / (sy || 1), 256 / (sx || 1), 256 / (sy || 1));
      x.restore();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    /* ---------- Malzemeler ---------- */
    const p0 = perfumes[0];

    // Not: Physical + clearcoat yerine Standard malzeme — piksel başına neredeyse yarı maliyet,
    // yansımalar ortam ışığı yoğunluğu artırılarak telafi ediliyor.
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 0.03,
      envMapIntensity: 4.2,
      transparent: true,
      depthWrite: false
    });
    glassMat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
        float fres = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 2.4);
        float lum = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11));
        gl_FragColor.a = clamp(0.04 + fres * 0.6 + lum * 0.9, 0.0, 0.96);`);
    };

    /* Sıvı: gerçek ışık geçirgenliği (transmission) sahneyi her karede iki kez çizdiriyordu.
       Yerine tek geçişte "arkadan aydınlanan sıvı" görünümü veren hafif bir shader kullanıyoruz:
       ortası ve üstü parlak, kenarları koyu, yüzeyi parlak. */
    const liqU = { uWave: { value: 0.12 }, uTime: { value: 0 }, uTop: { value: 1 } };
    const liqCur = new THREE.Color(p0.liquid);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: liqCur.clone().multiplyScalar(0.55),
      metalness: 0,
      roughness: 0.1,
      emissive: liqCur.clone(),
      emissiveIntensity: 0.62,
      envMapIntensity: 1.25,
      transparent: true,
      opacity: 0.94
    });
    const WHITE = new THREE.Color(1, 1, 1);
    function applyLiquid() {
      liquidMat.color.copy(liqCur).multiplyScalar(0.55);
      liquidMat.emissive.copy(liqCur);
      if (surfMat) { surfMat.color.copy(liqCur).multiplyScalar(0.6); surfMat.emissive.copy(liqCur); }
    }
    let surfMat = null;   // sıvı yüzeyi (aşağıda oluşturuluyor)
    liquidMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWave = liqU.uWave;
      sh.uniforms.uTime = liqU.uTime;
      sh.uniforms.uTop = liqU.uTop;
      sh.vertexShader = 'uniform float uWave;\nuniform float uTime;\nuniform float uTop;\nvarying float vLiqY;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          float wTop = smoothstep(uTop - 0.24, uTop, position.y);
          transformed.y += wTop * uWave * (
            sin(position.x * 4.2 + uTime * 3.1) * 0.07 +
            sin(position.z * 6.0 - uTime * 2.3) * 0.035 +
            sin(position.x * 9.5 - uTime * 5.4) * 0.016);
          vLiqY = position.y / uTop;`);
      sh.fragmentShader = 'varying float vLiqY;\n' +
        sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float facing = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
          float body = mix(0.22, 1.0, pow(facing, 1.3)) * mix(0.5, 1.3, smoothstep(0.0, 0.95, vLiqY));
          float band = exp(-pow((vLiqY - 0.8) * 7.0, 2.0)) * facing * 0.35;
          totalEmissiveRadiance *= body + band;`);
    };
    liquidMat.customProgramCacheKey = () => 'faro-liquid';

    // kapaktaki gül: pembe-şeftali emaye; kokunun rengine hafifçe çalar
    // kapak renkleri şişenin paletinden: gül = vurgu rengi, yapraklar = sıvı rengi + altın, boyun = kapak rengi + bronz
    const roseCol = (p) => new THREE.Color(p.accent).lerp(new THREE.Color('#ffffff'), 0.12);
    const leafCol = (p) => new THREE.Color(p.liquid).lerp(new THREE.Color('#d8b440'), 0.45);
    const collarCol = (p) => new THREE.Color(p.cap).lerp(new THREE.Color('#3a2c22'), 0.5);
    const capMat = new THREE.MeshStandardMaterial({
      color: roseCol(p0),
      metalness: 0.35,
      roughness: 0.28,
      envMapIntensity: 2.0
    });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9ae62, metalness: 1, roughness: 0.2, envMapIntensity: 1.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0807, metalness: 0.3, roughness: 0.4 });
    // sıvının içinden görünsün diye derinlik testi kapalı, sıvıdan sonra çizilir
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0xf2e6dc, transparent: true, opacity: 0.5, depthTest: false, depthWrite: false });
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0xefe9e1,
      roughness: 0.4,
      envMapIntensity: 1.05,
      side: THREE.DoubleSide
    });

    /* Etiket dokuları */
    const labelTextures = perfumes.map((p) => {
      const t = new THREE.CanvasTexture(F.drawLabel(p));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    });
    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTextures[0],
      emissive: 0xffffff,
      emissiveMap: labelTextures[0],
      emissiveIntensity: 0.42,
      roughness: 0.4,
      metalness: 0.15,
      transparent: true,
      depthWrite: false
    });

    /* ---------- Gül biçimi ----------
       Gövde: alttan dar, ortada dolgun, üstte boyuna doğru kapanan bir gül çiçeği.
       Yüzey, gövdeyi saran 5 dış yaprak + üstte 3 iç yaprak kıvrımıyla şekilleniyor. */
    const sstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    const curvePts = (rows, n) => new THREE.SplineCurve(rows.map(([y, r]) => new THREE.Vector2(r, y)))
      .getPoints(n).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));

    // [yükseklik, yarıçap]
    const ROSE_PROFILE = [[0.00, 0.30], [0.06, 0.36], [0.25, 0.48], [0.50, 0.60], [0.80, 0.68], [1.05, 0.69],
      [1.25, 0.64], [1.42, 0.52], [1.54, 0.36], [1.60, 0.26], [BH, 0.235]];
    const profPts = curvePts(ROSE_PROFILE, 160);
    function rProf(y) {
      if (y <= profPts[0].y) return profPts[0].x;
      for (let i = 1; i < profPts.length; i++) {
        const a = profPts[i - 1], b = profPts[i];
        if (y <= b.y) return a.x + (b.x - a.x) * ((y - a.y) / Math.max(1e-6, b.y - a.y));
      }
      return profPts[profPts.length - 1].x;
    }
    // yaprak biçimleri: lobe = dolgun yaprak (ortası 1, aralar 0), saw = üst üste binen yaprak (kenarda keskin basamak)
    const lobe = (n, a) => Math.pow(0.5 + 0.5 * Math.cos(n * a), 0.35);
    // (basamak tek bölmede değil, kısa bir eğimle iner → tırtıklı parlama olmaz)
    const saw = (n, a) => {
      let v = (n * a) / TAU; v -= Math.floor(v);
      const w = 0.1;
      return v < 1 - w ? v / (1 - w) : (1 - v) / w;
    };
    // yaprak katmanları: yarıçap çarpanı (en dıştaki katman görünür → üst üste binen yaprak kenarları)
    const petalEnv = (t) => sstep(0, 0.12, t) * (1 - sstep(0.94, 1, t));
    // A katmanının yalnızca dolgun yaprak kavisi (etiket bunun üstüne oturur)
    const petalA = (y, phi) => { const t = y / BH; return 1 - 0.19 * petalEnv(t) * (1 - lobe(5, phi + 0.25 * (t - 0.48))); };
    function petal(y, phi) {
      const t = y / BH;
      const env = petalEnv(t);
      // A: alttaki 5 büyük dış yaprak (etiket bir yaprağın ortasına denk gelir)
      const kA = petalA(y, phi)
        + 0.03 * Math.exp(-Math.pow((t - 0.76) / 0.05, 2))          // yaprak ucunun hafif dışa kıvrılması
        - 0.25 * sstep(0.78, 0.9, t);
      // B: gövdenin üst yarısında sarmal dizilmiş, birbirinin üstüne binen 5 yaprak
      const kB = 1 - 0.15 * env * (1 - saw(5, phi + 0.4 - 0.8 * t)) - 0.25 * (1 - sstep(0.3, 0.45, t));
      // C: boyna yakın, sıkıca sarılmış 3 iç yaprak (gülün kalbi)
      const kC = 1 - 0.12 * env * (1 - saw(3, phi + 1.0 - 3.0 * t)) - 0.25 * (1 - sstep(0.68, 0.8, t));
      return Math.max(kA, kB, kC);
    }
    // döndürülmüş profil + yaprak kıvrımı
    function roseLathe(pts, segs, yOff, shape) {
      const geo = new THREE.LatheGeometry(pts, segs);
      geo.rotateY(Math.PI);   // dikiş arkada kalsın
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        if (Math.hypot(x, z) < 1e-6) continue;
        const k = shape(y + yOff, Math.atan2(x, z));
        pos.setXYZ(i, x * k, y, z * k);
      }
      geo.computeVertexNormals();
      return geo;
    }

    /* ---------- Model ---------- */
    const root = new THREE.Group();
    scene.add(root);

    // kaide
    const pts = [];
    const e = 0.04;
    pts.push(new THREE.Vector2(0, -PH));
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector2(PR - e + Math.cos(a) * e, -PH + e + Math.sin(a) * e));
    }
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector2(PR - e + Math.cos(a) * e, -e + Math.sin(a) * e));
    }
    pts.push(new THREE.Vector2(0, 0));
    const pedestal = new THREE.Mesh(new THREE.LatheGeometry(pts, 120), pedMat);
    root.add(pedestal);

    // gölge + renkli ışık yansıması (kaide üstü)
    const shadowTex = (function () {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const x = c.getContext('2d');
      x.filter = 'blur(18px)';
      x.fillStyle = 'rgba(0,0,0,0.9)';
      x.beginPath();
      x.ellipse(128, 128, 74, 74, 0, 0, TAU);   // yuvarlak gül gövdesinin gölgesi
      x.fill();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(BW * 1.9, BW * 1.9),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.75, toneMapped: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    root.add(shadow);

    const causticMat = new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(255,255,255,0.9)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']], 1, 1),
      color: new THREE.Color(p0.accent),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      opacity: 0.55
    });
    const caustic = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.1), causticMat);
    caustic.rotation.x = -Math.PI / 2;
    caustic.position.set(0.05, 0.004, BD / 2 + 0.42);
    root.add(caustic);

    // şişe
    const bottle = new THREE.Group();
    root.add(bottle);

    // cam: gül biçimli gövde
    const r0 = rProf(0);
    const glassPts = [new THREE.Vector2(0, 0), new THREE.Vector2(r0 - 0.05, 0), new THREE.Vector2(r0 - 0.015, 0.006)];
    for (let i = 0; i <= 72; i++) {
      const y = 0.03 + (BH - 0.03) * (i / 72);
      glassPts.push(new THREE.Vector2(rProf(y), y));
    }
    glassPts.push(new THREE.Vector2(0, BH));
    const glass = new THREE.Mesh(roseLathe(glassPts, 200, 0, petal), glassMat);
    glass.renderOrder = 3;
    bottle.add(glass);

    // sıvı: camın içini aynı biçimde dolduruyor (üst yüzey dalga için bol bölmeli)
    const LIN = 0.07, LBASE = 0.17;
    const liqH = BH * 0.86 - LBASE;
    liqU.uTop.value = liqH;
    const rin = (yy) => rProf(yy + LBASE) - LIN;
    const liqPts = [new THREE.Vector2(0, 0), new THREE.Vector2(rin(0) - 0.04, 0), new THREE.Vector2(rin(0.03) - 0.01, 0.015)];
    for (let i = 1; i <= 40; i++) {
      const yy = 0.03 + (liqH - 0.03) * (i / 40);
      liqPts.push(new THREE.Vector2(rin(yy), yy));
    }
    for (let i = 1; i <= 14; i++) liqPts.push(new THREE.Vector2(rin(liqH) * (1 - i / 14), liqH));
    const liquid = new THREE.Mesh(roseLathe(liqPts, 180, LBASE, petal), liquidMat);
    liquid.position.y = LBASE;
    bottle.add(liquid);

    /* Sıvı seviyesi: sıvı bir kesme düzlemiyle kısaltılır, üstüne o yükseklikteki
       gül kesitine uyan düz bir yüzey çizilir. (Dikey sıkıştırma olmaz: gövde altta dar,
       ortada geniş olduğu için sıvı camdan taşardı.) */
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
    liquidMat.clippingPlanes = [clipPlane];
    surfMat = new THREE.MeshStandardMaterial({
      // yansıma düşük tutuldu: yukarıdan bakınca stüdyo ışığını beyaz yansıtıp sıvının rengini örtmesin
      color: liqCur.clone().multiplyScalar(0.6), emissive: liqCur.clone(), emissiveIntensity: 0.85,
      roughness: 0.35, metalness: 0, envMapIntensity: 0.3, transparent: true, opacity: 0.95, side: THREE.DoubleSide
    });
    const SURF_N = 120;
    const surfPos = new Float32Array((SURF_N + 2) * 3);
    const surfNor = new Float32Array((SURF_N + 2) * 3);
    for (let i = 0; i < SURF_N + 2; i++) surfNor[i * 3 + 1] = 1;
    const surfIdx = [];
    for (let i = 0; i < SURF_N; i++) surfIdx.push(0, i + 2, i + 1);
    const surfGeo = new THREE.BufferGeometry();
    surfGeo.setAttribute('position', new THREE.BufferAttribute(surfPos, 3));
    surfGeo.setAttribute('normal', new THREE.BufferAttribute(surfNor, 3));
    surfGeo.setIndex(surfIdx);
    const surface = new THREE.Mesh(surfGeo, surfMat);
    surface.visible = false;
    bottle.add(surface);
    function buildSurface(y) {   // y: şişe içinde yükseklik
      surfPos[0] = 0; surfPos[1] = y; surfPos[2] = 0;
      const r0 = rProf(y) - LIN;
      for (let i = 0; i <= SURF_N; i++) {
        const phi = (i / SURF_N) * TAU;
        const r = Math.max(0, r0 * petal(y, phi) - 0.003);
        surfPos[(i + 1) * 3] = r * Math.sin(phi);
        surfPos[(i + 1) * 3 + 1] = y;
        surfPos[(i + 1) * 3 + 2] = r * Math.cos(phi);
      }
      surfGeo.attributes.position.needsUpdate = true;
      surfGeo.computeBoundingSphere();
    }
    let level = 1, levelTarget = 1, lastSurfY = -1;
    const clipN = new THREE.Vector3(), clipP = new THREE.Vector3(), clipQ = new THREE.Quaternion();
    function applyLevel() {
      if (level > 0.999) {   // dolu: kesme yok, sıvının dalgalı üst yüzeyi görünür
        clipPlane.set(clipN.set(0, -1, 0), 100);
        surface.visible = false;
        liquid.visible = true;
        return;
      }
      const yL = LBASE + liqH * level;
      if (Math.abs(yL - lastSurfY) > 1e-4) { buildSurface(yL); lastSurfY = yL; }
      surface.visible = liquid.visible = level > 0.004;
      clipP.set(0, yL, 0);
      bottle.localToWorld(clipP);
      bottle.getWorldQuaternion(clipQ);
      clipN.set(0, -1, 0).applyQuaternion(clipQ);
      clipPlane.setFromNormalAndCoplanarPoint(clipN, clipP);
    }

    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, BH - 0.12, 10), tubeMat);
    tube.position.set(0, (BH - 0.12) / 2 + 0.1, -0.02);
    tube.renderOrder = 1;
    bottle.add(tube);

    // etiket: önündeki büyük yaprağın kavisine oturan bükülmüş yüzey
    const LBL_W = LABEL_W * 0.82, LBL_H = LABEL_H * 0.82, LBL_Y = BH * 0.48;
    const labelGeo = new THREE.PlaneGeometry(LBL_W, LBL_H, 40, 30);
    {
      const pos = labelGeo.attributes.position;
      const R0 = rProf(LBL_Y);
      for (let i = 0; i < pos.count; i++) {
        const y = LBL_Y + pos.getY(i);
        const phi = pos.getX(i) / R0;
        const r = rProf(y) * petalA(y, phi) - 0.03;
        pos.setXYZ(i, r * Math.sin(phi), y, r * Math.cos(phi));
      }
      labelGeo.computeVertexNormals();
    }
    // sıvının yaprak kıvrımları etiketin önüne geçmesin (arka yüz zaten çizilmiyor)
    labelMat.depthTest = false;
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.renderOrder = 2;
    bottle.add(label);

    // altın boyun + sprey başlığı
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.08, 64), goldMat);
    collar.position.y = BH + 0.04;
    bottle.add(collar);
    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.012, 12, 64), goldMat);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.y = BH + 0.004;
    bottle.add(collarRing);
    // basılabilen sprey başlığı (sap + düğme + püskürtme deliği tek grup)
    const PRESS_DEPTH = 0.085;
    const actuator = new THREE.Group();
    bottle.add(actuator);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 24), goldMat);
    stem.position.y = BH + 0.13;
    actuator.add(stem);
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.13, 64), goldMat);
    button.position.y = BH + 0.24;
    actuator.add(button);
    const buttonTop = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.016, 12, 64), goldMat);
    buttonTop.rotation.x = Math.PI / 2;
    buttonTop.position.y = BH + 0.305;
    actuator.add(buttonTop);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 20), darkMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(0.165, BH + 0.25, 0);
    actuator.add(nozzle);
    let press = 0;

    /* kapak (assets/gül_kapaklı_şişe.png'deki tıpa örnek alındı):
       koyu bronz kademeli boyun + altından yana açılan sarı-altın emaye yapraklar
       + öne eğik, yarı açık pembe-şeftali emaye gül + ortasında küçük bir taş */
    const capGroup = new THREE.Group();
    const CAP_Y = BH + 0.08;
    capGroup.position.y = CAP_Y;
    capMat.side = THREE.DoubleSide;   // taç yaprakların iki yüzü de görünür

    // bronz boyun
    const bronzeMat = new THREE.MeshStandardMaterial({ color: collarCol(p0), metalness: 0.85, roughness: 0.32, envMapIntensity: 1.4 });
    const collarPts = [[0, -0.03], [0.26, -0.03], [0.285, -0.015], [0.285, 0.005], [0.26, 0.025], [0.22, 0.035],
      [0.2, 0.05], [0.185, 0.07], [0.185, 0.11], [0.2, 0.125], [0.2, 0.14], [0, 0.14]].map(([r, y]) => new THREE.Vector2(r, y));
    capGroup.add(new THREE.Mesh(new THREE.LatheGeometry(collarPts, 96), bronzeMat));

    // gül + yapraklar: boynun üstünde, izleyiciye doğru hafif eğik
    const bloom = new THREE.Group();
    bloom.position.set(0, 0.12, 0);
    bloom.rotation.set(0.28, 0, -0.08);
    capGroup.add(bloom);

    // Sivri uçlarda komşu üçgenlerin normalleri birbirini sıfırlayabiliyor; GPU sıfır vektörü
    // normalize edince NaN çıkıyor ve o noktalar ışıktan bağımsız simsiyah çiziliyor.
    function fixNormals(g) {
      const n = g.attributes.normal;
      for (let i = 0; i < n.count; i++) {
        const x = n.getX(i), y = n.getY(i), z = n.getZ(i);
        if (!(x * x + y * y + z * z > 1e-8)) n.setXYZ(i, 0, 0, 1);
      }
      n.needsUpdate = true;
      return g;
    }
    // sarı-altın emaye yapraklar: ucu sivri, ortası katlı, kenarı hafif dişli, uca doğru aşağı sarkar
    // (hafif ışıma: karanlık açıdan bakınca da emaye sarısı siyaha düşmesin)
    const leafMat = new THREE.MeshStandardMaterial({ color: leafCol(p0), metalness: 0.25, roughness: 0.35, envMapIntensity: 1.5, emissive: leafCol(p0).multiplyScalar(0.3), emissiveIntensity: 1, side: THREE.DoubleSide });
    function leafGeo(L, Wd, fold, droop) {
      const g = new THREE.PlaneGeometry(Wd, L, 8, 18);
      g.translate(0, L / 2, 0);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const v = pos.getY(i) / L;
        const u = pos.getX(i) / (Wd / 2);
        // (sıfır genişlik sivri uçta sıfır alanlı üçgen → normal hesaplanamaz → siyah nokta; küçük bir alt sınır)
        let width = Math.max(0.03, Math.pow(Math.sin(Math.PI * Math.pow(v, 0.8)), 0.8));
        width *= 1 + 0.07 * Math.sin(v * 38) * v;              // dişli kenar
        const x = u * (Wd / 2) * width;
        let z = -fold * Math.abs(u) * (Wd / 2) * width;          // orta damar boyunca katlı
        z += droop * v * v * L;                                  // uç aşağı sarkar
        pos.setXYZ(i, x, pos.getY(i), z);
      }
      g.computeVertexNormals();
      return fixNormals(g);
    }
    const lrand = (function () { let s = 3; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    for (let i = 0; i < 6; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = (i / 6) * TAU + 0.3 + (lrand() - 0.5) * 0.4;
      const L = 0.46 + lrand() * 0.14;
      const leafMesh = new THREE.Mesh(leafGeo(L, 0.2 + lrand() * 0.04, 0.32, 0.1 + lrand() * 0.08), leafMat);
      leafMesh.position.set(0, 0.02, 0.12);
      leafMesh.rotation.x = Math.PI / 2 - 0.22 - lrand() * 0.12;   // gülün altından yana ve hafif yukarı açılır
      leafMesh.rotation.z = (lrand() - 0.5) * 0.3;
      holder.add(leafMesh);
      bloom.add(holder);
    }

    // kalp: sarmal sarılmış küçük gonca (sprey başlığını örter)
    const CORE_H = 0.32;
    const corePts = [new THREE.Vector2(0, 0)].concat(curvePts([[0, 0.16], [0.05, 0.18], [0.13, 0.19], [0.21, 0.16],
      [0.27, 0.11], [0.3, 0.06], [0.315, 0.02], [CORE_H, 0]], 48));
    const coreShape = (y, phi) => {
      const t = y / CORE_H;
      const env = sstep(0.03, 0.3, t) * (1 - sstep(0.92, 1, t));
      const outer = 1 - 0.17 * env * (1 - saw(3, phi + 2.4 * t));
      const inner = 1 - 0.12 * env * (1 - saw(2, phi + 1.3 - 4.0 * t)) - 0.2 * (1 - sstep(0.45, 0.6, t));
      return Math.max(outer, inner);
    };
    bloom.add(new THREE.Mesh(roseLathe(corePts, 140, 0, coreShape), capMat));
    // ortadaki küçük taş
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xefe4ff, metalness: 0.1, roughness: 0.02, envMapIntensity: 3, emissive: 0x6a4a90, emissiveIntensity: 0.25 });
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), gemMat);
    gem.position.set(0, CORE_H - 0.01, 0.01);
    bloom.add(gem);

    // tek gül yaprağı: dipte dar, yukarıda geniş ve YUVARLAK uçlu (kalp/kürek biçimi);
    // enine kaşık gibi çukur, üst kenarı dışa doğru kıvrılmış (gül yaprağının tipik geri dönen kenarı)
    function petalGeo(w, h, cup, roll) {
      const g = new THREE.PlaneGeometry(w, h, 16, 16);
      g.translate(0, h / 2, 0);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const v = pos.getY(i) / h;
        const u = pos.getX(i) / (w / 2);
        // en profili: dipten genişler, üstte yarım daire gibi kapanır
        const width = v < 0.62
          ? 0.3 + 0.7 * Math.sqrt(Math.sin((Math.PI / 2) * (v / 0.62)))
          : Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.62) / 0.4, 2)));
        const x = u * (w / 2) * width;
        let z = -cup * (1 - u * u * 0.0) * (u * u) * (w / 2) * width;   // kaşık
        z += roll * Math.pow(Math.max(0, v - 0.55) / 0.45, 2) * h;      // üst kenar dışa döner
        z += roll * 0.6 * Math.pow(Math.abs(u), 3) * Math.max(0, v - 0.4) * h;  // yan kenarlar da hafif geri kıvrık
        pos.setXYZ(i, x, pos.getY(i), z);
      }
      g.computeVertexNormals();
      return fixNormals(g);
    }
    const prand = (function () { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    // [adet, taban yarıçapı, taban yüksekliği, en, boy, açılma (radyan), çukurluk, kenar kıvrımı]
    // görseldeki gibi yarı açık bir gül: içte sıkı, dışta kaşık gibi kıvrık ama yatay olmayan yapraklar
    const RINGS = [
      [3, 0.10, 0.06, 0.30, 0.26, 0.12, 0.80, 0.05],
      [4, 0.14, 0.05, 0.36, 0.28, 0.32, 0.70, 0.12],
      [5, 0.19, 0.03, 0.42, 0.30, 0.58, 0.60, 0.20],
      [6, 0.23, 0.01, 0.46, 0.29, 0.85, 0.50, 0.28]
    ];
    RINGS.forEach(([n, r0, y0, w, h, tilt, cup, curl], k) => {
      const geo = petalGeo(w, h, cup, curl);
      for (let i = 0; i < n; i++) {
        const holder = new THREE.Group();
        holder.rotation.y = (i / n) * TAU + k * 0.55 + (prand() - 0.5) * 0.25;
        const petalMesh = new THREE.Mesh(geo, capMat);
        petalMesh.position.set(0, y0, r0);
        petalMesh.rotation.x = tilt + (prand() - 0.5) * 0.12;   // dışa doğru açılma
        petalMesh.rotation.z = (prand() - 0.5) * 0.15;
        holder.add(petalMesh);
        bloom.add(holder);
      }
    });
    bottle.add(capGroup);

    /* ---------- Işıklar ---------- */
    scene.add(new THREE.HemisphereLight(0xfff3e6, 0x1a0d08, 0.4));
    // ayrı tepe spot ışığı kaldırıldı (bir ışık daha = her pikselde bir hesap daha); anahtar ışık güçlendirildi
    const key = new THREE.DirectionalLight(0xfff6ec, 2.3);
    key.position.set(-2.5, 7, 4.5);
    scene.add(key);
    const rimL = new THREE.PointLight(0xffffff, 14, 14, 2);
    rimL.position.set(-2.8, 2.6, -2.4);
    scene.add(rimL);
    const rimR = new THREE.PointLight(0xffffff, 18, 14, 2);
    rimR.position.set(2.9, 2.1, -2.2);
    scene.add(rimR);

    /* ---------- Durum ---------- */
    const target = { shiftX: 0.2, shiftY: 0, camZ: 9.6, camY: 1.75, lookY: 1.08, rotY: -0.42, cap: 0, beam: 1, intro: 0 };
    const cur = Object.assign({}, target);
    let scrollShift = 0;

    const colT = { bg: new THREE.Color(F.hero.bg), glow: new THREE.Color(F.hero.glow) };
    const liqTarget = new THREE.Color(p0.liquid);
    const capTarget = roseCol(p0);
    const leafTarget = leafCol(p0), collarTarget = collarCol(p0);
    function setCapTargets(p) { capTarget.copy(roseCol(p)); leafTarget.copy(leafCol(p)); collarTarget.copy(collarCol(p)); }
    const accTarget = new THREE.Color(p0.accent);
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

    let perfIdx = 0, desired = 0, spinT = 1, spinAngle = 0, swapped = true;

    function applyPerfumeInstant(i) {
      const p = perfumes[i];
      perfIdx = desired = i;
      spinT = 1; spinAngle = 0; swapped = true;
      labelMat.map = labelMat.emissiveMap = labelTextures[i];
      labelMat.needsUpdate = true;
      liqTarget.set(p.liquid); liqCur.copy(liqTarget); applyLiquid();
      setCapTargets(p); capMat.color.copy(capTarget); leafMat.color.copy(leafTarget); bronzeMat.color.copy(collarTarget);
      accTarget.set(p.accent); causticMat.color.copy(accTarget);
    }

    function startSpin() {
      spinT = 0;
      swapped = false;
      const p = perfumes[desired];
      liqTarget.set(p.liquid);
      setCapTargets(p);
      accTarget.set(p.accent);
    }

    function setPerfume(i, instant) {
      if (instant) { applyPerfumeInstant(i); return; }
      if (i === desired) return;
      desired = i;
      if (spinT >= 1) startSpin();
      else if (!swapped) {
        const p = perfumes[desired];
        liqTarget.set(p.liquid); setCapTargets(p); accTarget.set(p.accent);
      }
    }

    function setColors(bgHex, glowHex, instant) {
      colT.bg.set(bgHex);
      colT.glow.set(glowHex);
      if (instant) { bgU.uBg.value.copy(colT.bg); bgU.uGlow.value.copy(colT.glow); }
    }

    function setTarget(o) { Object.assign(target, o); }
    function snap() { Object.assign(cur, target); }

    /* ---------- Projeksiyon yardımcıları ---------- */
    const v3 = new THREE.Vector3();
    function toUv(x, y, z, out) {
      v3.set(x, y, z);
      root.localToWorld(v3);
      v3.project(camera);
      out.set((v3.x + 1) / 2, (v3.y + 1) / 2);
      return out;
    }
    const tmp2 = new THREE.Vector2();
    function updateBgProjection(aspect) {
      bgU.uAspect.value = aspect;
      toUv(0, 1.15, -1.6, bgU.uGlowPos.value);
      toUv(0, -PH, 0.15, bgU.uFloorPos.value);
      toUv(0, BH + 0.55, -1.4, bgU.uBeamPos.value);
      bgU.uHorizon.value = toUv(0, -PH, -2.4, tmp2).y;
    }

    function resize() {
      size.w = window.innerWidth;
      size.h = window.innerHeight;
      renderer.setPixelRatio(DPR);
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
    }
    resize();

    /* ---------- Kare güncelleme ---------- */
    function update(dt, time) {
      for (const k in target) cur[k] = damp(cur[k], target[k], k === 'intro' ? 1.4 : 4.5, dt);
      mouse.sx = damp(mouse.sx, mouse.x, 2.5, dt);
      mouse.sy = damp(mouse.sy, mouse.y, 2.5, dt);

      const kc = 1 - Math.exp(-3 * dt);
      bgU.uBg.value.lerp(colT.bg, kc);
      bgU.uGlow.value.lerp(colT.glow, kc);
      rimL.color.copy(bgU.uGlow.value).lerp(WHITE, 0.35);
      rimR.color.copy(rimL.color);

      const kl = 1 - Math.exp(-2.4 * dt);
      liqCur.lerp(liqTarget, kl);
      applyLiquid();
      capMat.color.lerp(capTarget, kl);
      // ışık almayan yaprak altları siyaha düşmesin: gülün kendi renginden hafif bir ışıma
      capMat.emissive.copy(capMat.color).multiplyScalar(0.22);
      leafMat.color.lerp(leafTarget, kl);
      leafMat.emissive.copy(leafMat.color).multiplyScalar(0.3);
      bronzeMat.color.lerp(collarTarget, kl);
      causticMat.color.lerp(accTarget, kl);

      // dönüş + etiket değişimi
      let wavePulse = 0;
      if (spinT < 1) {
        spinT = Math.min(1, spinT + dt / 1.25);
        spinAngle = easeInOut(spinT) * TAU;
        wavePulse = Math.sin(spinT * Math.PI) * 0.9;
        if (!swapped && spinT >= 0.5) {
          labelMat.map = labelMat.emissiveMap = labelTextures[desired];
          labelMat.needsUpdate = true;
          perfIdx = desired;
          swapped = true;
        }
        if (spinT >= 1) {
          spinAngle = 0;
          if (desired !== perfIdx) startSpin();
        }
      }
      liqU.uTime.value = time;
      liqU.uWave.value = 0.1 + wavePulse;

      root.position.y = (1 - cur.intro) * -0.4;
      bottle.rotation.y = cur.rotY + Math.sin(time * 0.45) * 0.06 + mouse.sx * 0.2 + spinAngle;
      // kapak açılınca ekranın üstünden dışarı çıkar
      capGroup.position.set(-cur.cap * 0.4, CAP_Y + cur.cap * 6.0, cur.cap * 0.1);
      capGroup.rotation.set(cur.cap * 0.15, cur.cap * 0.7, -cur.cap * 0.35);
      actuator.position.y = -press * PRESS_DEPTH;
      // basınca şişe hafifçe kaideye çöker
      bottle.position.y = -press * 0.012;
      bottle.scale.set(1 + press * 0.004, 1 - press * 0.006, 1 + press * 0.004);

      camera.position.set(mouse.sx * 0.28, cur.camY - mouse.sy * 0.16, cur.camZ);
      camera.lookAt(0, cur.lookY, 0);
      camera.setViewOffset(size.w, size.h, -cur.shiftX * size.w, (cur.shiftY + scrollShift) * size.h, size.w, size.h);
      camera.updateMatrixWorld();
      root.updateMatrixWorld();

      // sıvı seviyesi (sıkınca yumuşakça iner, dolunca yükselir)
      level = damp(level, levelTarget, 5, dt);
      if (Math.abs(level - levelTarget) < 0.0005) level = levelTarget;
      applyLevel();

      renderer.toneMappingExposure = 0.25 + 0.8 * cur.intro;
      bgU.uDim.value = 0.2 + 0.8 * cur.intro;
      bgU.uBeam.value = cur.beam;
      bgU.uTime.value = time;
      updateBgProjection(size.w / size.h);
    }

    function render() { renderer.render(scene, camera); }

    /* Ekrandaki bir nokta (CSS px) kapağın üstüne denk geliyor mu? */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function hitCap(clientX, clientY) {
      ndc.set((clientX / size.w) * 2 - 1, -(clientY / size.h) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(capGroup, true).length > 0;
    }
    /* ... ya da şişenin herhangi bir yerine (gövde, etiket, sprey başlığı) */
    function hitBottle(clientX, clientY) {
      ndc.set((clientX / size.w) * 2 - 1, -(clientY / size.h) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(bottle, true).length > 0;
    }

    /* Sprey ağzının ekran konumu (CSS px) */
    function nozzleScreen() {
      v3.set(0.18, BH + 0.25 - press * PRESS_DEPTH, 0);
      bottle.localToWorld(v3);
      v3.project(camera);
      return { x: (v3.x + 1) / 2 * size.w, y: (1 - v3.y) / 2 * size.h };
    }

    /* Ürün kartları için tek kare görüntü */
    function snapshot(i, w, h) {
      const keepIdx = perfIdx;
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();

      applyPerfumeInstant(i);
      const p = perfumes[i];
      root.position.y = 0;
      bottle.rotation.y = -0.34;
      capGroup.position.set(0, CAP_Y, 0);
      capGroup.rotation.set(0, 0, 0);
      liqU.uWave.value = 0.08;
      camera.position.set(0, 1.45, 8.9);
      camera.lookAt(0, 0.9, 0);
      camera.updateMatrixWorld();
      root.updateMatrixWorld(true);

      bgU.uBg.value.set(p.cardBg);
      bgU.uGlow.value.set(p.cardGlow);
      bgU.uBeam.value = 0;
      bgU.uDim.value = 1;
      rimL.color.copy(bgU.uGlow.value).lerp(new THREE.Color(1, 1, 1), 0.35);
      rimR.color.copy(rimL.color);
      renderer.toneMappingExposure = 1.05;
      updateBgProjection(w / h);

      // ürün kartı her zaman dolu şişeyi gösterir
      clipPlane.set(clipN.set(0, -1, 0), 100);
      surface.visible = false;
      liquid.visible = true;
      renderer.render(scene, camera);
      lastSurfY = -1;
      const url = canvas.toDataURL('image/jpeg', 0.9);

      applyPerfumeInstant(keepIdx);
      bgU.uBg.value.copy(colT.bg);
      bgU.uGlow.value.copy(colT.glow);
      resize();
      return url;
    }

    return {
      renderer,
      update,
      render,
      resize,
      snapshot,
      setTarget,
      setColors,
      setPerfume,
      snap,
      nozzleScreen,
      hitCap,
      hitBottle,
      setScrollShift(v) { scrollShift = v; },
      setPress(v) { press = v; },
      // sıvı seviyesi: 0 (boş) … 1 (dolu)
      setLevel(v, instant) { levelTarget = Math.max(0, Math.min(1, v)); if (instant) level = levelTarget; },
      get level() { return levelTarget; },
      setQuality(pr) {
        const next = Math.min(pr, window.devicePixelRatio || 1);
        if (Math.abs(next - DPR) < 0.01) return;
        DPR = next;
        resize();
      },
      get quality() { return DPR; },
      pointer(x, y) { mouse.x = x; mouse.y = y; },
      get perfume() { return perfIdx; }
    };
  };
})();
