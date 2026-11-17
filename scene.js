/* =========================================================
   Background scene (three.js)
   A cloud of particles that morphs into a different
   mathematical shape for each section of the page:
   0 torus knot · 1 sphere · 2 wave surface · 3 Lorenz attractor
   4 double helix · 5 Möbius strip · 6 galaxy
   ========================================================= */
(function () {
  const canvas = document.getElementById('scene');
  if (!window.THREE || !canvas) { if (canvas) canvas.style.display = 'none'; return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 720;
  const N = small ? 2200 : 4200;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 7;

  /* ---------- shape generators: each returns Float32Array of N*3 ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);

  function torusKnot() {
    const out = new Float32Array(N * 3), p = 2, q = 3;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const r = 1.6 + 0.6 * Math.cos(q * t);
      const cx = r * Math.cos(p * t), cy = r * Math.sin(p * t), cz = 0.6 * Math.sin(q * t);
      const a = rand(0, Math.PI * 2), s = rand(0.05, 0.32);
      out.set([cx + s * Math.cos(a), cy + s * Math.sin(a), cz + s * Math.cos(a + 1.3)], i * 3);
    }
    return out;
  }
  function sphere() {
    const out = new Float32Array(N * 3), g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i, R = 2.3;
      out.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
    }
    return out;
  }
  function wave() {
    const out = new Float32Array(N * 3), side = Math.ceil(Math.sqrt(N));
    for (let i = 0; i < N; i++) {
      const x = ((i % side) / side - 0.5) * 7, z = (Math.floor(i / side) / side - 0.5) * 7;
      const y = Math.sin(x * 1.1) * Math.cos(z * 1.1) * 0.8;
      out.set([x, y - 0.4, z], i * 3);
    }
    return out;
  }
  function helix() {
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const strand = i % 3, t = (i / N) * Math.PI * 8, y = (i / N - 0.5) * 7;
      if (strand < 2) {
        const ph = strand * Math.PI;
        out.set([1.2 * Math.cos(t + ph) + rand(-.05, .05), y, 1.2 * Math.sin(t + ph) + rand(-.05, .05)], i * 3);
      } else { // rungs between strands
        const k = rand(-1, 1);
        out.set([1.2 * Math.cos(t) * k, y, 1.2 * Math.sin(t) * k], i * 3);
      }
    }
    return out;
  }
  function galaxy() {
    const out = new Float32Array(N * 3), arms = 4;
    for (let i = 0; i < N; i++) {
      const r = Math.pow(Math.random(), 1.4) * 3.6, arm = (i % arms) / arms * Math.PI * 2;
      const a = arm + r * 1.3, j = 0.35 * (1 - r / 4);
      out.set([Math.cos(a) * r + rand(-j, j), rand(-j, j) * 0.6, Math.sin(a) * r + rand(-j, j)], i * 3);
    }
    return out;
  }

  function lorenz() { // the butterfly-shaped Lorenz attractor
    const out = new Float32Array(N * 3);
    let x = 0.1, y = 0, z = 0; const dt = 0.006;
    for (let k = 0; k < 400; k++) { const dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - 8 / 3 * z; x += dx * dt; y += dy * dt; z += dz * dt; }
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < 2; k++) { const dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - 8 / 3 * z; x += dx * dt; y += dy * dt; z += dz * dt; }
      out.set([x * 0.11, (z - 25) * 0.11, y * 0.11], i * 3);
    }
    return out;
  }
  function mobius() {
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2, v = rand(-0.7, 0.7), R = 2;
      out.set([(R + v * Math.cos(u / 2)) * Math.cos(u), v * Math.sin(u / 2), (R + v * Math.cos(u / 2)) * Math.sin(u)], i * 3);
    }
    return out;
  }

  // one shape per section: hero, about, work, skills, play, writing, connect
  const shapes = [torusKnot(), sphere(), wave(), lorenz(), helix(), mobius(), galaxy()];
  const tilts = [[0.2, 0], [0, 0], [0.55, 0], [0.1, 0], [0.15, 0], [0.7, 0], [1.0, 0]];

  /* ---------- particles ---------- */
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  // start scattered so the first shape "assembles" on load
  for (let i = 0; i < N * 3; i++) pos[i] = rand(-9, 9);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const colors = new Float32Array(N * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const palettes = {
    dark:  [new THREE.Color('#37c6e0'), new THREE.Color('#e3b45c'), new THREE.Color('#f3ede2')],
    light: [new THREE.Color('#1f7a8c'), new THREE.Color('#b8892f'), new THREE.Color('#14232b')]
  };
  function paint(theme) {
    const p = palettes[theme];
    for (let i = 0; i < N; i++) {
      const r = Math.random(), c = r < 0.62 ? p[0] : r < 0.86 ? p[1] : p[2];
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.attributes.color.needsUpdate = true;
    mat.blending = theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.opacity = theme === 'dark' ? 0.85 : 0.75;
    mat.needsUpdate = true;
  }

  // soft round sprite drawn on a tiny canvas
  const sprite = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const mat = new THREE.PointsMaterial({ size: small ? 0.07 : 0.06, map: sprite, vertexColors: true, transparent: true, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);
  paint(document.body.classList.contains('light') ? 'light' : 'dark');

  /* ---------- state ---------- */
  let target = 0, offsetX = small ? 0 : 2.2, targetOffsetX = offsetX;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  // public hooks used by app.js
  window.Scene = {
    setShape(i) {
      target = i;
      const wide = innerWidth >= 900;
      targetOffsetX = wide ? (i === 0 ? 2.2 : 2.6) : 0;
    },
    setTheme(t) { paint(t); },
    burst() { for (let i = 0; i < N * 3; i++) pos[i] += rand(-1.5, 1.5); }
  };

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    Scene.setShape(target);
  });

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const ease = reduce ? 0.2 : 0.035;
  (function loop() {
    const t = clock.getElapsedTime(), tgt = shapes[target];
    for (let i = 0; i < N * 3; i++) pos[i] += (tgt[i] - pos[i]) * ease;
    geo.attributes.position.needsUpdate = true;

    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    offsetX += (targetOffsetX - offsetX) * 0.04;
    const spin = reduce ? 0.02 : 0.12;
    group.rotation.y = t * spin + mouse.sx * 0.8;
    group.rotation.x = tilts[target][0] + mouse.sy * 0.5;
    group.position.x = offsetX;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
})();
