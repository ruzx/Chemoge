// Интерактивные виджеты для уроков. Каждый: (box, params, goal, done) — done() вызывается, когда цель достигнута.
// Новый виджет: добавьте функцию в WIDGETS и используйте "widget": "<имя>" в JSON урока.
import { h, F, rich, tube } from './ui.js';
import { mix, byId, compound } from './chem.js';
import { sound } from './game.js';

const fmtN = (x, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toString().replace('.', ',');

function slider(label, { min, max, step, value, unit }, onInput) {
  const out = h('output', {}, fmtN(value) + (unit ? ' ' + unit : ''));
  const inp = h('input', { type: 'range', min, max, step, value });
  inp.addEventListener('input', () => { out.textContent = fmtN(+inp.value) + (unit ? ' ' + unit : ''); onInput(+inp.value); });
  return { el: h('div', { class: 'slider' }, h('label', { html: rich(label) }), inp, out), inp };
}
function readout(items) { return h('div', { class: 'readout' }, items.map(([v, l]) => h('div', {}, h('b', { html: v }), h('span', { html: rich(l) })))); }

// ---------- Раствор: масса вещества и воды → массовая доля ----------
function fraction(box, p, goal, done) {
  const st = { s: p.s0 ?? 10, w: p.w0 ?? 90 };
  const vis = h('div', { style: { display: 'flex', justifyContent: 'center' } });
  const ro = h('div');
  const s1 = slider(`m(${p.solute || 'соли'}), г`, { min: 0, max: p.maxSolute || 50, step: p.stepSolute || 1, value: st.s, unit: 'г' }, v => { st.s = v; draw(); });
  const s2 = slider('m(воды), г', { min: 0, max: p.maxWater || 300, step: p.stepWater || 5, value: st.w, unit: 'г' }, v => { st.w = v; draw(); });
  box.append(vis, s1.el, s2.el, ro);
  let reached = false;
  function draw() {
    const total = st.s + st.w, w = total ? st.s / total * 100 : 0;
    const maxT = (p.maxSolute || 50) + (p.maxWater || 300);
    const level = 150 - Math.max(6, total / maxT * 120);
    let dots = '';
    const n = Math.round(st.s * 1.2);
    for (let k = 0; k < n; k++) { const x = 42 + (k * 37 % 96), y = level + 6 + (k * 61 % Math.max(8, 146 - level)); dots += `<circle cx="${x}" cy="${y}" r="2.6" fill="#ff9600"/>`; }
    vis.innerHTML = `<svg viewBox="0 0 180 170" width="200" height="190">
      <path d="M36 14 V150 a10 10 0 0 0 10 10 h88 a10 10 0 0 0 10 -10 V14" fill="none" stroke="currentColor" stroke-width="3" opacity=".55"/>
      <clipPath id="bk"><path d="M38 14 V150 a8 8 0 0 0 8 8 h88 a8 8 0 0 0 8 -8 V14z"/></clipPath>
      <g clip-path="url(#bk)"><rect x="30" y="${level}" width="120" height="170" fill="#1cb0f6" opacity=".22"/>${dots}</g>
    </svg>`;
    ro.replaceChildren(readout([[fmtN(st.s) + ' г', 'вещество'], [fmtN(total) + ' г', 'раствор = вещество + вода'], [fmtN(w, 1) + ' %', 'ω = m(в-ва) / m(р-ра)']]));
    if (goal && !reached) {
      const okW = goal.w == null || Math.abs(w - goal.w) <= (goal.tol ?? 0.05);
      const okT = goal.total == null || Math.abs(total - goal.total) < 0.01;
      if (okW && okT && total > 0) { reached = true; done(); }
    }
  }
  draw();
}

// ---------- Моль: масса → количество вещества ----------
function mole(box, p, goal, done) {
  const M = p.M; let m = p.m0 ?? 0;
  const vis = h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '76px', alignItems: 'center' } });
  const ro = h('div');
  const s = slider(`m(\`${p.f}\`), г`, { min: 0, max: p.max || M * 5, step: p.step || 1, value: m, unit: 'г' }, v => { m = v; draw(); });
  box.append(h('p', { class: 'meta', style: { textAlign: 'center', margin: '0 0 10px' }, html: rich(`1 моль \`${p.f}\` = ${M} г. Один шарик — 1 моль.`) }), vis, s.el, ro);
  let reached = false;
  function draw() {
    const n = m / M;
    vis.replaceChildren();
    const full = Math.floor(n + 1e-9), part = n - full;
    for (let k = 0; k < Math.min(full, 12); k++) vis.append(ball(1));
    if (part > 0.01) vis.append(ball(part));
    if (!n) vis.append(h('span', { class: 'meta' }, 'пусто'));
    ro.replaceChildren(readout([[fmtN(m) + ' г', 'масса'], [M + ' г/моль', 'молярная масса'], [fmtN(n) + ' моль', 'n = m / M']]));
    if (goal && !reached && Math.abs(n - goal.n) < 1e-6) { reached = true; done(); }
  }
  draw();
}
function ball(frac) {
  return h('span', { html: `<svg width="54" height="54" viewBox="0 0 54 54"><clipPath id="b${Math.round(frac * 100)}"><rect x="0" y="${54 - frac * 54}" width="54" height="54"/></clipPath><circle cx="27" cy="27" r="24" fill="none" stroke="#1cb0f6" stroke-width="3"/><circle cx="27" cy="27" r="22" fill="#1cb0f6" clip-path="url(#b${Math.round(frac * 100)})"/></svg>` });
}

// ---------- Молярная масса: собрать формулу из атомов ----------
function molar(box, p, goal, done) {
  const cnt = p.atoms.map(() => 0);
  const colors = ['#1cb0f6', '#58cc02', '#ff9600', '#ce82ff', '#ff4b4b'];
  const rows = h('div', { style: { display: 'grid', gap: '8px' } });
  const barBox = h('div');
  const info = h('div');
  box.append(h('p', { class: 'meta', style: { margin: '0 0 10px' }, html: rich(`Соберите \`${p.formula}\`: укажите число атомов каждого элемента.`) }), rows, barBox, info);
  let reached = false, picked = null;
  p.atoms.forEach(([el, ar], i) => {
    const val = h('span', {}, '0');
    rows.append(h('div', { class: 'row', style: { justifyContent: 'space-between' } },
      h('div', { class: 'row' }, h('span', { style: { width: '14px', height: '14px', borderRadius: '4px', background: colors[i] } }), h('b', {}, el), h('span', { class: 'meta' }, `Ar = ${ar}`)),
      h('div', { class: 'stepper' }, h('button', { onclick: () => { cnt[i] = Math.max(0, cnt[i] - 1); val.textContent = cnt[i]; sound('tap'); draw(); } }, '−'), val, h('button', { onclick: () => { cnt[i] = Math.min(12, cnt[i] + 1); val.textContent = cnt[i]; sound('tap'); draw(); } }, '+'))));
  });
  function draw() {
    const parts = p.atoms.map(([el, ar], i) => ({ el, m: ar * cnt[i], c: colors[i] }));
    const M = parts.reduce((a, b) => a + b.m, 0);
    barBox.replaceChildren(h('div', { style: { display: 'flex', height: '34px', borderRadius: '10px', overflow: 'hidden', margin: '14px 0 6px', background: 'var(--line)' } },
      parts.filter(x => x.m).map(x => h('div', { title: x.el, style: { flex: x.m, background: x.c, color: '#fff', fontWeight: 900, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '13px' }, onclick: () => { picked = x.el; draw(); } }, `${x.el}: ${x.m}`))));
    const okCounts = p.atoms.every(([, , n], i) => cnt[i] === n);
    const pk = parts.find(x => x.el === picked);
    info.replaceChildren(readout([[String(M) + ' г/моль', 'M = сумма Ar × число атомов'], ...(okCounts && pk ? [[fmtN(pk.m / M * 100, 1) + ' %', `ω(${pk.el}) = ${pk.m} / ${M}`]] : [])]),
      okCounts && !pk ? h('p', { class: 'meta' }, 'Нажмите на часть полосы, чтобы увидеть массовую долю элемента.') : '');
    if (!reached && okCounts && (!goal || !goal.pick || picked === goal.pick)) { reached = true; done(); }
  }
  draw();
}

// ---------- Пропорция по уравнению ----------
function ratio(box, p, goal, done) {
  const kg = p.kGiven, kf = p.kFind;
  let n = p.n0 ?? 0.2;
  const eq = h('div', { class: 'formula-box', html: rich(p.equation) });
  const vis = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', margin: '10px 0' } });
  const ro = h('div');
  const s = slider(`n(\`${p.given}\`), моль`, { min: 0, max: p.max || 1, step: p.step || 0.1, value: n, unit: 'моль' }, v => { n = v; draw(); });
  box.append(eq, vis, s.el, ro);
  let reached = false;
  function dots(count, color) {
    const wrap = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', minHeight: '60px', alignContent: 'center' } });
    const k = Math.round(count * 10);
    for (let i = 0; i < Math.min(k, 40); i++) wrap.append(h('span', { style: { width: '14px', height: '14px', borderRadius: '50%', background: color } }));
    return wrap;
  }
  function draw() {
    const nf = n * kf / kg;
    vis.replaceChildren(
      h('div', { style: { textAlign: 'center' } }, dots(n, '#1cb0f6'), F(p.given, 'b')),
      h('div', { style: { fontSize: '26px', fontWeight: 900, color: 'var(--muted)' } }, '→'),
      h('div', { style: { textAlign: 'center' } }, dots(nf, '#58cc02'), F(p.find, 'b')));
    ro.replaceChildren(readout([[fmtN(n) + ' моль', `n(\`${p.given}\`)`], [`${kg} : ${kf}`, 'по коэффициентам'], [fmtN(nf) + ' моль', `n(\`${p.find}\`)`]]),
      h('p', { class: 'meta', style: { textAlign: 'center' } }, 'Каждая точка — 0,1 моль'));
    if (goal && !reached && Math.abs((goal.find != null ? nf : n) - (goal.find ?? goal.given)) < 1e-6) { reached = true; done(); }
  }
  draw();
}

// ---------- Вычеркни ионы-зрители ----------
function cancel(box, p, goal, done) {
  const r = mix(p.a, p.b);
  if (!r || !r.fullEq) { box.append(h('p', {}, 'Нет уравнения')); return; }
  const [L, Rt] = r.fullEq.split(' = ');
  const tokens = side => side.split(' + ').map(t => ({ t, ion: t.replace(/^\d+/, ''), whole: !/\^/.test(t) }));
  const left = tokens(L), right = tokens(Rt);
  const spect = new Set(left.filter(a => right.some(b => b.ion === a.ion && !a.whole)).map(a => a.ion));
  const crossed = new Set();
  box.append(h('p', { class: 'meta', style: { margin: '0 0 8px' } }, 'Нажимайте на ионы, которые есть и слева, и справа.'));
  const line = h('div', { class: 'eqline' });
  const net = h('div');
  box.append(line, net);
  function draw() {
    line.replaceChildren();
    const put = (arr) => arr.forEach((x, i) => {
      if (i) line.append(h('span', { class: 'op' }, '+'));
      const el = h('span', { class: 'tok' + (x.whole ? ' whole' : '') + (crossed.has(x.ion) && !x.whole ? ' gone' : ''), html: rich('`' + x.t + '`') });
      if (!x.whole && !crossed.has(x.ion)) el.onclick = () => {
        if (spect.has(x.ion)) { crossed.add(x.ion); sound('tap'); draw(); }
        else { el.classList.add('shake'); sound('bad'); setTimeout(() => el.classList.remove('shake'), 300); }
      };
      line.append(el);
    });
    put(left); line.append(h('span', { class: 'op' }, '=')); put(right);
    if (crossed.size === spect.size) {
      net.replaceChildren(h('div', { class: 'eq', style: { marginTop: '14px' } }, h('small', {}, 'Сокращённое ионное уравнение'), F(r.shortEq)));
      done();
    }
  }
  draw();
}

// ---------- Смешай и добейся признака ----------
function mixer(box, p, goal, done) {
  const st = { a: null, b: null };
  const chips = h('div', { class: 'row', style: { gap: '6px' } });
  const out = h('div', { style: { display: 'flex', gap: '16px', alignItems: 'center', marginTop: '14px', minHeight: '120px' } });
  box.append(chips, out);
  let reached = false;
  function draw() {
    chips.replaceChildren(...p.options.map(id => h('button', { class: 'chip' + (st.a === id || st.b === id ? ' on' : ''), onclick: () => pick(id) }, F(byId(id).f))));
    if (!(st.a && st.b)) { out.replaceChildren(tube({ w: 46, liquid: st.a ? undefined : 'transparent' }), h('span', { class: 'meta' }, 'Выберите два раствора')); return; }
    const r = mix(st.a, st.b);
    out.replaceChildren(tube({ w: 46, liquid: r.liquid || undefined, ppt: r.ppt, gas: r.gas, smell: r.smell }), h('div', { html: rich(r.text) }));
    const g = goal || {};
    const ppt = r.events.find(e => e.ppt);
    const ok = (g.color ? ppt && ppt.ppt.name.startsWith(g.color) : true) && (g.gas != null ? r.gas === g.gas : true) && (g.smell != null ? r.smell === g.smell : true) && (g.none ? !r.visible : true);
    if (ok && !reached) { reached = true; done(); }
  }
  function pick(id) {
    sound('tap');
    if (st.a === id) st.a = null; else if (st.b === id) st.b = null;
    else if (!st.a) st.a = id; else if (!st.b) st.b = id; else { st.a = st.b; st.b = id; }
    draw();
  }
  draw();
}

export const WIDGETS = { fraction, mole, molar, ratio, cancel, mix: mixer };
