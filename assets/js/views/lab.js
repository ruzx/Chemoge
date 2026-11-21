// Виртуальная лаборатория: два раствора → предсказание → результат и уравнения.
import { h, F, tube, rich } from '../lib/ui.js';
import { allPickable, PICK_GROUPS, byId, mix } from '../lib/chem.js';

const PRED = [['ppt', 'Осадок'], ['gas', 'Газ'], ['color', 'Окраска'], ['none', 'Без изменений']];

export function render(root) {
  const st = { a: null, b: null, pred: null, excess: false };
  root.append(h('div', { class: 'eyebrow' }, 'Лаборатория'), h('h1', {}, 'Смешивание растворов'),
    h('p', { class: 'muted', style: { marginTop: 0 } }, 'Выберите два вещества. Сначала предскажите результат.'));
  const left = h('div');
  const stage = h('div', { class: 'card stage' });
  root.append(h('div', { class: 'lab', style: { marginTop: '18px' } }, left, h('div', {}, stage)));

  for (const g of PICK_GROUPS) {
    left.append(h('div', { class: 'pick-group' }, h('div', { class: 'eyebrow' }, g),
      h('div', { class: 'row' }, allPickable().filter(s => s.group === g).map(s =>
        h('button', { class: 'chip', title: s.name, 'data-id': s.id, onclick: () => choose(s.id) }, s.indicator ? s.name : F(s.f))))));
  }

  function choose(id) {
    if (st.a === id || st.b === id) return;
    if (!st.a) st.a = id; else if (!st.b) st.b = id; else { st.a = st.b; st.b = id; }
    st.excess = false; st.result = null; draw();
  }

  function draw() {
    left.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.id === st.a || c.dataset.id === st.b));
    const slot = (id, k) => h('div', { class: 'slot' + (id ? ' filled' : ''), title: id ? 'Убрать' : '', onclick: () => { if (id) { st[k] = null; st.result = null; draw(); } } },
      id ? h('div', {}, byId(id).indicator ? byId(id).name : F(byId(id).f), h('div', { class: 'meta' }, byId(id).indicator ? 'индикатор' : byId(id).name)) : h('span', { class: 'muted small' }, k === 'a' ? 'Вещество 1' : 'Вещество 2'));
    const r = st.result;
    stage.replaceChildren(
      h('div', { class: 'slots' }, slot(st.a, 'a'), slot(st.b, 'b')),
      tube(r ? { liquid: r.liquid || undefined, ppt: r.ppt, gas: r.gas, smell: r.smell, w: 62 } : { liquid: st.a ? undefined : 'transparent', w: 62, level: st.a && st.b ? 18 : 60 }),
      !r ? h('div', { class: 'obs' },
        h('div', { class: 'eyebrow', style: { marginBottom: '6px' } }, 'Предсказание'),
        h('div', { class: 'row', style: { gap: '6px' } }, PRED.map(([k, l]) => h('button', { class: 'chip' + (st.pred === k ? ' on' : ''), onclick: () => { st.pred = st.pred === k ? null : k; draw(); } }, l))),
        h('button', { class: 'btn primary', style: { width: '100%', marginTop: '12px' }, disabled: !(st.a && st.b), onclick: doMix }, 'Смешать'))
        : resultView(r));
  }

  function doMix() { st.result = mix(st.a, st.b, { excess: st.excess }); draw(); }

  function resultView(r) {
    const actual = r.indicator ? 'color' : r.ppt || r.events.some(e => e.ppt) ? 'ppt' : r.gas ? 'gas' : r.events.some(e => e.kind === 'redox') ? 'color' : 'none';
    const actualSet = new Set([actual, ...(r.gas ? ['gas'] : []), ...(r.events.some(e => e.ppt) ? ['ppt'] : [])]);
    const predOk = st.pred ? actualSet.has(st.pred) : null;
    const box = h('div', { class: 'obs' });
    if (predOk !== null) box.append(h('div', { class: `chip ${predOk ? 'ok' : 'bad'}`, style: { marginBottom: '10px' } }, predOk ? 'Предсказание верное' : 'Предсказание неверное'));
    box.append(h('p', { style: { margin: '0 0 10px' }, html: rich(r.text) }));
    if (r.canExcess && !st.excess) box.append(h('button', { class: 'btn sm', onclick: () => { st.excess = true; doMix(); } }, 'Добавить избыток щёлочи'));
    const eqs = [];
    if (r.molecularEq) eqs.push(['Молекулярное', r.molecularEq], ['Полное ионное', r.fullEq], ['Сокращённое ионное', r.shortEq]);
    else r.net.forEach(n => eqs.push(['Ионное уравнение', n]));
    if (st.excess && r.molecularEq) r.net.slice(-1).forEach(n => eqs.push(['Избыток щёлочи', n]));
    if (eqs.length) {
      const det = h('details', { style: { marginTop: '10px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, 'Уравнения'),
        eqs.map(([t, e]) => h('div', { class: 'eq' }, h('small', {}, t), F(e))));
      box.append(det);
    }
    box.append(h('div', { class: 'row', style: { marginTop: '12px' } },
      h('button', { class: 'btn', onclick: () => { st.result = null; st.pred = null; st.excess = false; draw(); } }, 'Ещё раз'),
      h('button', { class: 'btn ghost', onclick: () => { st.a = st.b = st.result = st.pred = null; st.excess = false; draw(); } }, 'Очистить')));
    return box;
  }
  draw();
}
