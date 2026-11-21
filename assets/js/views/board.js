// Доска: своя (рисование пальцем/стилусом/мышью) + ссылка на совместную доску Excalidraw.
import { h, copyText } from '../lib/ui.js';
import { store } from '../lib/store.js';

const COLORS = ['#111827', '#1d4ed8', '#dc2626', '#15803d', '#d97706'];

export function render(root, _arg, { content }) {
  root.append(h('div', { class: 'eyebrow' }, 'Доска'), h('h1', {}, 'Доска'));
  let strokes = store.setting('board') || [];
  let cur = null, color = COLORS[0], width = 3, erase = false, grid = store.setting('boardGrid') ?? true;

  const canvas = h('canvas');
  const wrap = h('div', { class: 'board-wrap' }, canvas);
  const ctx = canvas.getContext('2d');
  const sw = COLORS.map(c => h('button', { class: 'swatch' + (c === color ? ' on' : ''), style: { background: c }, title: 'Цвет', onclick: () => { color = c; erase = false; sync(); } }));
  const sizeBtns = [2, 4, 8].map(w => h('button', { class: 'chip' + (w === 4 ? '' : ''), onclick: () => { width = w; erase = false; sync(); } }, w === 2 ? 'Тонко' : w === 4 ? 'Средне' : 'Толсто'));
  const eraserBtn = h('button', { class: 'chip', onclick: () => { erase = !erase; sync(); } }, 'Ластик');
  const gridBtn = h('button', { class: 'chip', onclick: () => { grid = !grid; store.setting('boardGrid', grid); sync(); redraw(); } }, 'Сетка');
  const toolbar = h('div', { class: 'toolbar' }, ...sw, h('span', { style: { width: '8px' } }), ...sizeBtns, eraserBtn, gridBtn, h('span', { class: 'spacer' }),
    h('button', { class: 'btn sm', onclick: () => { strokes.pop(); persist(); redraw(); } }, 'Отменить'),
    h('button', { class: 'btn sm', onclick: () => { if (strokes.length && confirmClear()) { strokes = []; persist(); redraw(); } } }, 'Очистить'),
    h('button', { class: 'btn sm', onclick: savePng }, 'Сохранить PNG'));
  root.append(toolbar, wrap);

  // Совместная доска
  const live = content.manifest.liveBoard;
  const linkInput = h('input', { readonly: true, value: '' });
  const liveBox = h('div', { class: 'card', style: { marginTop: '18px' } },
    h('h3', {}, 'Совместная доска'),
    h('p', { class: 'meta', style: { marginTop: 0 } }, 'Одна ссылка для ученика и преподавателя: оба видят и рисуют одновременно. Работает в браузере, регистрация не нужна.'),
    h('div', { class: 'row' },
      live ? h('a', { class: 'btn primary', href: live, target: '_blank', rel: 'noopener' }, 'Открыть доску занятий') : null,
      h('button', { class: 'btn' + (live ? '' : ' primary'), onclick: () => { const url = excalidrawRoom(); linkInput.value = url; store.setting('lastRoom', url); window.open(url, '_blank', 'noopener'); } }, 'Создать новую комнату')),
    h('div', { class: 'linkbox' }, linkInput, h('button', { class: 'btn sm', onclick: () => linkInput.value && copyText(linkInput.value) }, 'Копировать')));
  linkInput.value = store.setting('lastRoom') || '';
  root.append(liveBox);

  function sync() {
    sw.forEach((b, i) => b.classList.toggle('on', COLORS[i] === color && !erase));
    sizeBtns.forEach((b, i) => b.classList.toggle('on', [2, 4, 8][i] === width && !erase));
    eraserBtn.classList.toggle('on', erase);
    gridBtn.classList.toggle('on', grid);
  }
  sync();

  function size() {
    const r = canvas.getBoundingClientRect(), d = devicePixelRatio || 1;
    canvas.width = r.width * d; canvas.height = r.height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    redraw();
  }
  function redraw() {
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, r.width, r.height);
    if (grid) {
      ctx.strokeStyle = '#eef0f3'; ctx.lineWidth = 1;
      for (let x = 0; x < r.width; x += 24) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, r.height); ctx.stroke(); }
      for (let y = 0; y < r.height; y += 24) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(r.width, y + .5); ctx.stroke(); }
    }
    for (const s of strokes) drawStroke(s, r);
  }
  function drawStroke(s, r) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = s.e ? '#fff' : s.c; ctx.lineWidth = s.e ? s.w * 5 : s.w;
    ctx.beginPath();
    s.p.forEach(([x, y], i) => { const X = x * r.width, Y = y * r.height; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    if (s.p.length === 1) { const [x, y] = s.p[0]; ctx.lineTo(x * r.width + .1, y * r.height); }
    ctx.stroke();
    if (s.e && grid) { /* сетка под ластиком восстанавливается при перерисовке */ }
  }
  const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); cur = { c: color, w: width * (e.pointerType === 'pen' ? Math.max(.6, e.pressure * 1.6) : 1), e: erase, p: [pos(e)] }; strokes.push(cur); redraw(); });
  canvas.addEventListener('pointermove', e => { if (!cur) return; cur.p.push(pos(e)); const r = canvas.getBoundingClientRect(); drawStroke({ ...cur, p: cur.p.slice(-2) }, r); });
  const end = () => { if (cur) { cur = null; persist(); if (erase) redraw(); } };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  function persist() { try { store.setting('board', strokes.slice(-400)); } catch {} }
  function confirmClear() { return true; }
  function savePng() {
    const a = h('a', { href: canvas.toDataURL('image/png'), download: 'doska.png' });
    document.body.append(a); a.click(); a.remove();
  }
  const ro = new ResizeObserver(size); ro.observe(canvas);
  return () => ro.disconnect();
}

// Ссылка на новую комнату Excalidraw: #room=<20 hex>,<22 символа ключа>
function excalidrawRoom() {
  const rnd = n => crypto.getRandomValues(new Uint8Array(n));
  const id = [...rnd(10)].map(b => b.toString(16).padStart(2, '0')).join('');
  const key = btoa(String.fromCharCode(...rnd(16))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://excalidraw.com/#room=${id},${key}`;
}
