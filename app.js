/* =========================================================
   Page interactions
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const EMAIL = 'raabhyabansal@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/raabhya-aggarwal/';
const RESUME = 'https://drive.google.com/drive/folders/1yobtjq7--S3pc9Lzm_GVyknJBPdgC-Ti?usp=share_link';

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- theme: nox (dark) / lumos (light) ---------- */
const themeBtn = $('#themeBtn');
function setTheme(t, announce) {
  document.body.classList.toggle('light', t === 'light');
  themeBtn.textContent = t === 'light' ? 'Nox' : 'Lumos';
  if (window.Scene) Scene.setTheme(t);
  store.set('theme', t);
  if (announce) toast(t === 'light' ? 'Lumos ✦ lights on' : 'Nox ✦ lights off');
}
setTheme(store.get('theme') || 'dark');
themeBtn.addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light', true));

/* ---------- nav state + active section + 3D shape per section ---------- */
const nav = $('#nav'), canvas = $('#scene');
addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });

const sections = $$('[data-shape]');
const sectionIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const i = +e.target.dataset.shape;
    if (window.Scene) Scene.setShape(i);
    canvas.style.opacity = i === 0 ? 1 : 0.5;
    $$('.links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -45% 0px' });
sections.forEach(s => sectionIO.observe(s));

/* ---------- reveal on scroll ---------- */
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}), { threshold: 0.12 });
$$('.reveal').forEach(el => revealIO.observe(el));

/* ---------- custom cursor ---------- */
const cursor = $('#cursor');
if (matchMedia('(pointer:fine)').matches) {
  addEventListener('pointermove', e => {
    cursor.style.opacity = 1;
    cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    cursor.classList.toggle('big', !!e.target.closest('a,button,.term,.cell,[role=button]'));
  });
}

/* ---------- hero name: letters dodge the cursor ---------- */
const name = $('#name');
$$('.line', name).forEach(line => {
  line.innerHTML = [...line.textContent].map(c => `<span class="ch">${c}</span>`).join('');
});
const chars = $$('.ch', name);
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  addEventListener('pointermove', e => {
    chars.forEach(ch => {
      const r = ch.getBoundingClientRect();
      const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
      const d = Math.hypot(dx, dy), R = 140;
      if (d < R) {
        const f = (1 - d / R) * 26;
        ch.style.transform = `translate(${dx / d * f}px, ${dy / d * f}px) rotate(${dx / d * f * .4}deg)`;
      } else ch.style.transform = '';
    });
  }, { passive: true });
}

/* ---------- polaroid stack ---------- */
const stack = $('#stack');
let order = $$('.polaroid', stack);
const rots = [-4, 5, -9];
function layout() {
  order.forEach((p, i) => {
    p.style.zIndex = order.length - i;
    p.style.transform = `translate(${i * 16}px, ${i * 12}px) rotate(${rots[i]}deg)`;
  });
}
layout();
function nextPhoto() {
  const top = order[0];
  top.style.transform = 'translate(120%, -10%) rotate(18deg)';
  setTimeout(() => { order = [...order.slice(1), top]; layout(); }, 320);
}
stack.addEventListener('click', nextPhoto);
stack.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextPhoto(); } });

/* ---------- equation terms (tap support on touch) ---------- */
$$('.term,.term-op').forEach(t => t.addEventListener('click', () => {
  const was = t.classList.contains('show');
  $$('.term,.term-op').forEach(x => x.classList.remove('show'));
  if (!was) t.classList.add('show');
}));

/* ---------- certificate lightbox ---------- */
const lb = $('#lightbox'), lbImg = $('#lbImg');
$$('.cert').forEach(b => b.addEventListener('click', () => { lbImg.src = b.dataset.full; lbImg.alt = b.dataset.alt; lb.classList.add('open'); }));
lb.addEventListener('click', () => lb.classList.remove('open'));

/* =========================================================
   F1 · lights out reaction game
   ========================================================= */
(function () {
  const g = $('#gantry'), lamps = $$('.lamp', g);
  const st = $('#f1Status'), tm = $('#f1Time'), bestEl = $('#f1Best');
  let state = 'idle', timers = [], goAt = 0;
  let best = +store.get('f1best') || 0;
  if (best) bestEl.textContent = best + ' ms';

  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const off = () => { lamps.forEach(l => l.classList.remove('on')); g.classList.remove('go'); };

  function start() {
    clear(); off(); state = 'arming'; st.textContent = 'Wait for it…'; tm.textContent = '--';
    lamps.forEach((l, i) => timers.push(setTimeout(() => l.classList.add('on'), 900 * (i + 1))));
    const hold = 900 * 5 + 400 + Math.random() * 2400;
    timers.push(setTimeout(() => { off(); g.classList.add('go'); state = 'go'; goAt = performance.now(); st.textContent = 'GO!'; }, hold));
  }
  function press() {
    if (state === 'idle' || state === 'done') return start();
    if (state === 'arming') {
      clear(); off(); state = 'done'; st.textContent = 'Jump start! Tap to retry'; tm.textContent = 'Penalty'; return;
    }
    if (state === 'go') {
      const ms = Math.round(performance.now() - goAt);
      state = 'done'; tm.textContent = ms + ' ms';
      let verdict = ms < 200 ? 'Pole-position reflexes' : ms < 300 ? 'Solid launch' : ms < 450 ? 'Lost a place or two' : 'Still in the garage?';
      if (!best || ms < best) { best = ms; store.set('f1best', ms); bestEl.textContent = ms + ' ms'; verdict = 'New best! ' + verdict; }
      st.textContent = verdict + '. Tap to go again';
    }
  }
  g.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
  g.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(); } });
  window.F1 = { start: () => { g.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(start, 600); } };
})();

/* =========================================================
   Sudoku 6 × 6 (boxes are 2 rows × 3 columns)
   ========================================================= */
(function () {
  const N = 6, BR = 2, BC = 3;
  const gridEl = $('#sgrid'), pad = $('#pad'), msg = $('#sMsg');
  let board, given, sel = -1, startedAt = 0, won = false;

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function solvedGrid() {
    // valid base pattern, then shuffle digits, rows inside bands, columns inside stacks, and bands
    const base = (r, c) => (BC * (r % BR) + Math.floor(r / BR) + c) % N;
    const digits = shuffle([1, 2, 3, 4, 5, 6]);
    const bands = shuffle([0, 1, 2]).flatMap(b => shuffle([0, 1]).map(r => b * BR + r));
    const cols = shuffle([0, 1]).flatMap(s => shuffle([0, 1, 2]).map(c => s * BC + c));
    const out = [];
    for (const r of bands) for (const c of cols) out.push(digits[base(r, c)]);
    return out;
  }

  const row = i => Math.floor(i / N), col = i => i % N;
  const box = i => Math.floor(row(i) / BR) * BR + Math.floor(col(i) / BC);
  const peers = (i, j) => i !== j && (row(i) === row(j) || col(i) === col(j) || box(i) === box(j));

  function newPuzzle() {
    const sol = solvedGrid();
    const holes = new Set(shuffle([...Array(36).keys()]).slice(0, 18));
    board = sol.map((v, i) => holes.has(i) ? 0 : v);
    given = board.map(v => v > 0);
    sel = -1; startedAt = 0; won = false;
    gridEl.classList.remove('won');
    msg.textContent = 'Pick a cell, then a number.';
    render();
  }

  function render() {
    gridEl.innerHTML = '';
    board.forEach((v, i) => {
      const c = document.createElement('button');
      c.className = 'cell' + (given[i] ? ' given' : v ? ' user' : '');
      if (col(i) % BC === BC - 1 && col(i) !== N - 1) c.classList.add('bx');
      if (row(i) % BR === BR - 1 && row(i) !== N - 1) c.classList.add('by');
      if (sel >= 0 && peers(i, sel)) c.classList.add('peer');
      if (i === sel) c.classList.add('sel');
      if (v && board.some((w, j) => w === v && peers(i, j))) c.classList.add('bad');
      c.textContent = v || '';
      c.setAttribute('aria-label', `Row ${row(i) + 1} column ${col(i) + 1}${v ? ', ' + v : ', empty'}`);
      c.addEventListener('click', () => { if (!given[i] && !won) { sel = i; render(); } });
      gridEl.appendChild(c);
    });
  }

  function put(v) {
    if (sel < 0 || given[sel] || won) return;
    if (!startedAt) startedAt = Date.now();
    board[sel] = v; render();
    const full = board.every(x => x), clean = board.every((x, i) => !board.some((y, j) => y === x && peers(i, j)));
    if (full && clean) {
      won = true; gridEl.classList.add('won');
      const s = Math.round((Date.now() - startedAt) / 1000);
      msg.textContent = `Solved in ${s}s. Nicely done!`;
      if (window.Scene) Scene.burst();
    } else if (full) msg.textContent = 'Almost: something clashes (in red).';
  }

  [1, 2, 3, 4, 5, 6].forEach(n => {
    const b = document.createElement('button'); b.textContent = n; b.addEventListener('click', () => put(n)); pad.appendChild(b);
  });
  const er = document.createElement('button'); er.textContent = '⌫'; er.setAttribute('aria-label', 'Erase'); er.addEventListener('click', () => put(0)); pad.appendChild(er);

  addEventListener('keydown', e => {
    if (sel < 0 || $('#palette').classList.contains('open')) return;
    if (e.key >= '1' && e.key <= '6') put(+e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') put(0);
    else if (e.key.startsWith('Arrow')) {
      const d = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      let n = sel + d; if (n >= 0 && n < 36) { sel = n; render(); e.preventDefault(); }
    }
  });
  $('#sNew').addEventListener('click', newPuzzle);
  window.Sudoku = { reset: newPuzzle };
  newPuzzle();
})();

/* ---------- bookshelf ---------- */
(function () {
  const spines = $$('.spine'), box = $('#bookDetail');
  const t = $('#bdTitle'), a = $('#bdAuthor'), n = $('#bdNote'), badge = $('#bdBadge');
  function show(sp) {
    spines.forEach(x => x.classList.remove('out'));
    sp.classList.add('out');
    box.style.opacity = 0;
    setTimeout(() => {
      t.textContent = sp.dataset.title; a.textContent = sp.dataset.author; n.textContent = sp.dataset.note;
      badge.textContent = sp.classList.contains('current') ? 'Currently reading' : '';
      if (sp.classList.contains('q')) n.innerHTML += ' <a href="#connect">Recommend one ↓</a>';
      box.style.opacity = 1;
    }, 180);
  }
  spines.forEach(sp => sp.addEventListener('click', () => show(sp)));
  $('#pickBook').addEventListener('click', () => {
    const real = spines.filter(x => !x.classList.contains('q') && !x.classList.contains('out'));
    show(real[Math.floor(Math.random() * real.length)]);
  });
  show($('.spine.current'));
  window.Books = { pick: () => $('#pickBook').click() };
})();

/* ---------- skills: click a chip, watch it type ---------- */
(function () {
  const S = {
    python: ['analysis.py', 'import pandas as pd\n\nstops = pd.read_csv("stops.csv")\nstops.groupby("route")["riders"].sum()'],
    sql:    ['query.sql', 'SELECT route, AVG(wait_min) AS avg_wait\nFROM trips\nGROUP BY route\nORDER BY avg_wait DESC;'],
    r:      ['model.R', 'model <- lm(riders ~ distance, data = stops)\nsummary(model)'],
    stats:  ['notes.txt', 'H0: mean_A = mean_B\n\nt = (x̄A − x̄B) / √(s²A/nA + s²B/nB)\nreject H0 if p < 0.05'],
    excel:  ['Book1.xlsx', '=XLOOKUP(A2, Routes[ID], Routes[Riders], "not found")\n\n=SUMIFS(Fares[Amount], Fares[Month], "Nov")'],
    vba:    ['Module1.bas', 'Sub CleanReport()\n    With ActiveSheet.Range("A1").CurrentRegion\n        .RemoveDuplicates Columns:=1, Header:=xlYes\n        .Sort Key1:=.Columns(2), Order1:=xlDescending\n    End With\nEnd Sub'],
    macros: ['macro.log', '● Recording...\n  1. format headers\n  2. sort by date\n  3. filter blanks\n■ Saved as "WeeklyTidy"\n\n▶ Next report: one click.'],
    html:   ['index.html', '<section id="skills">\n  <h2>What I work with</h2>\n  <!-- you are looking at it -->\n</section>'],
    css:    ['style.css', '.skill.on {\n  background: var(--teal);\n  color: var(--bg);\n}']
  };
  const code = $('#code'), file = $('#codeFile');
  let timer;
  function type(k) {
    clearTimeout(timer);
    const [f, txt] = S[k]; file.textContent = f; code.textContent = '';
    let i = 0;
    (function step() { code.textContent = txt.slice(0, ++i); if (i < txt.length) timer = setTimeout(step, 18); })();
  }
  $$('.skill').forEach(b => b.addEventListener('click', () => {
    $$('.skill').forEach(x => x.classList.remove('on')); b.classList.add('on'); type(b.dataset.k);
  }));
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { type('python'); io.disconnect(); } }, { threshold: .3 });
  io.observe($('#skills'));
})();

/* ---------- writing: typewriter line ---------- */
(function () {
  const el = $('#typed');
  const lines = ['Some thoughts are too long for a caption.', 'So sometimes I write them down.', 'Pull up a chair.'];
  let li = 0, i = 0, del = false, started = false;
  function tick() {
    const L = lines[li];
    el.textContent = L.slice(0, i);
    if (!del && i < L.length) { i++; return setTimeout(tick, 45); }
    if (!del) { del = true; return setTimeout(tick, 1800); }
    if (i > 0) { i--; return setTimeout(tick, 22); }
    del = false; li = (li + 1) % lines.length; setTimeout(tick, 300);
  }
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !started) { started = true; tick(); o.disconnect(); } }, { threshold: .3 }).observe(el);
})();

/* ---------- connect chips ---------- */
const line = $('#cLine'), mailBtn = $('#mailBtn');
$$('.chip').forEach(c => c.addEventListener('click', () => {
  $$('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on');
  line.style.opacity = 0;
  setTimeout(() => { line.textContent = c.dataset.line; line.style.opacity = 1; }, 180);
  mailBtn.href = `mailto:${EMAIL}?subject=${encodeURIComponent(c.dataset.sub)}`;
}));
async function copyEmail() {
  try { await navigator.clipboard.writeText(EMAIL); toast('Email copied'); }
  catch (e) { toast(EMAIL); }
}
$('#copyBtn').addEventListener('click', copyEmail);

/* =========================================================
   Command palette (press "/" or the Menu button)
   ========================================================= */
(function () {
  const pal = $('#palette'), input = $('#palInput'), list = $('#palList');
  const go = id => document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  const open = url => window.open(url, '_blank', 'noopener');
  const cmds = [
    ['About me', 'go', () => go('about')],
    ['Work & experience', 'go', () => go('work')],
    ['Dissertation on GitHub', 'open', () => open('https://github.com/raabhya/bus-stop-location-portland')],
    ['Skills', 'go', () => go('skills')],
    ['Play: Lights out', 'play', () => F1.start()],
    ['Play: New sudoku', 'play', () => { Sudoku.reset(); go('sudoku'); }],
    ['My bookshelf', 'go', () => go('books')],
    ['Pick me a book', 'play', () => { go('books'); Books.pick(); }],
    ['My writing on Substack', 'open', () => open('https://substack.com/@raabhya282')],
    ['Connect', 'go', () => go('connect')],
    ['Résumé', 'open', () => open(RESUME)],
    ['Copy email', 'copy', copyEmail],
    ['LinkedIn', 'open', () => open(LINKEDIN)],
    ['Lumos', 'light mode', () => setTheme('light', true)],
    ['Nox', 'dark mode', () => setTheme('dark', true)],
    ['Back to top', 'go', () => go('top')]
  ];
  let shown = cmds, idx = 0;

  function draw() {
    const q = input.value.trim().toLowerCase();
    shown = cmds.filter(c => (c[0] + ' ' + c[1]).toLowerCase().includes(q));
    idx = Math.min(idx, Math.max(shown.length - 1, 0));
    list.innerHTML = shown.length ? '' : '<li>No match. Try “lumos”.</li>';
    shown.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = i === idx ? 'on' : '';
      li.innerHTML = `<span>${c[0]}</span><small>${c[1]}</small>`;
      li.addEventListener('click', () => run(i));
      li.addEventListener('mousemove', () => { if (idx !== i) { idx = i; draw(); } });
      list.appendChild(li);
    });
  }
  function run(i) { const c = shown[i]; if (!c) return; close(); c[2](); }
  function openPal() { pal.classList.add('open'); input.value = ''; idx = 0; draw(); input.focus(); }
  function close() { pal.classList.remove('open'); }

  $('#paletteBtn').addEventListener('click', openPal);
  pal.addEventListener('click', e => { if (e.target === pal) close(); });
  input.addEventListener('input', () => { idx = 0; draw(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { idx = (idx + 1) % shown.length; draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { idx = (idx - 1 + shown.length) % shown.length; draw(); e.preventDefault(); }
    if (e.key === 'Enter') run(idx);
  });
  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); openPal(); }
    if (e.key === 'Escape') { close(); lb.classList.remove('open'); }
  });
})();
