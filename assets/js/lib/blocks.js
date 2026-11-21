// Блоки справочника и пошаговые разборы. Описываются в JSON модуля.
import { h, R, rich, F, tube, shuffle } from './ui.js';
import { solubilityTable } from './chem.js';

export function renderBlock(b) {
  const card = h('div', { class: 'card' });
  if (b.title) card.append(h('h3', { html: rich(b.title) }));
  switch (b.type) {
    case 'list':
      card.append(h('ul', { class: 'clean' }, b.items.map(i => h('li', { html: rich(i) }))));
      break;
    case 'table':
      card.append(h('table', { class: 't' },
        b.head ? h('thead', {}, h('tr', {}, b.head.map(c => h('th', { html: rich(c) })))) : null,
        h('tbody', {}, b.rows.map(r => h('tr', {}, r.map(c => h('td', { html: rich(c) })))))));
      break;
    case 'formula':
      b.items.forEach(i => card.append(h('div', { class: 'formula-box', html: rich(i) })));
      if (b.note) card.append(R('p', b.note, { class: 'meta' }));
      break;
    case 'tubes':
      card.append(h('div', { class: 'tubes' }, b.items.map(t => h('div', { class: 'tube-fig' },
        tube({ ppt: t.color, gas: t.gas, smell: t.smell, liquid: t.liquid, w: 40 }),
        F(t.f, 'b'), h('small', {}, t.name)))));
      break;
    case 'solubility':
      card.append(solubility());
      break;
    default:
      card.append(R('p', b.text || ''));
  }
  if (b.text && b.type !== 'text' && b.type) card.append(R('p', b.text, { class: 'meta', style: { marginTop: '8px' } }));
  return card;
}

export function solubility() {
  const t = solubilityTable();
  return h('div', {},
    h('div', { class: 'sol' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th'), t.cats.map(c => h('th', { html: F(c).outerHTML })))),
      h('tbody', {}, t.rows.map(r => h('tr', {}, h('th', { html: F(r.an).outerHTML }), r.cells.map(c => h('td', { class: c.c }, c.t))))))),
    h('div', { class: 'legend' },
      h('span', {}, h('i', { style: { background: 'color-mix(in srgb,#16a34a 30%,transparent)' } }), 'Р — растворимо'),
      h('span', {}, h('i', { style: { background: 'color-mix(in srgb,#f59e0b 40%,transparent)' } }), 'М — малорастворимо'),
      h('span', {}, h('i', { style: { background: 'color-mix(in srgb,#dc2626 35%,transparent)' } }), 'Н — нерастворимо'),
      h('span', {}, '— не существует или разлагается водой')));
}

// Пошаговый разбор. Шаг с полем choices — ученик сам выбирает следующий шаг (первый вариант верный).
export function renderExample(ex) {
  const card = h('div', { class: 'card' });
  card.append(h('div', { class: 'eyebrow' }, ex.guided ? 'Попробуйте сами' : 'Разбор'));
  card.append(h('h3', { style: { marginTop: '4px' }, html: rich(ex.title) }));
  if (ex.problem) card.append(R('p', ex.problem));
  const steps = h('div', { class: 'steps' });
  card.append(steps);
  const els = ex.steps.map(s => {
    const el = h('div', { class: 'step hidden' });
    const content = h('div', {}, h('div', { html: rich(s.text) }), s.why ? h('div', { class: 'why', html: rich(s.why) }) : null);
    if (s.choices) {
      const opts = shuffle(s.choices.map((c, i) => ({ c, ok: i === 0 })));
      const box = h('div', { class: 'step-choices' });
      el.append(h('div', { class: 'small muted' }, s.ask || 'Какой следующий шаг?'), box);
      opts.forEach(o => {
        const b = h('button', { class: 'opt', onclick: () => {
          if (o.ok) { box.remove(); el.firstChild.remove(); el.append(content); next.disabled = shown >= els.length; if (shown >= els.length) next.textContent = 'Готово'; }
          else { b.classList.add('bad'); b.disabled = true; }
        } }, h('span', { html: rich(o.c) }));
        box.append(b);
      });
    } else el.append(content);
    steps.append(el);
    return { el, s };
  });
  let shown = 0;
  const next = h('button', { class: 'btn sm', onclick: () => revealNext() }, 'Следующий шаг');
  const actions = h('div', { class: 'actions' }, next);
  card.append(actions);
  function revealNext() {
    if (shown >= els.length) return;
    const cur = els[shown]; cur.el.classList.remove('hidden'); shown++;
    // если текущий шаг требует выбора — ждём ответа
    if (cur.s.choices && cur.el.querySelector('.step-choices')) { next.disabled = true; return; }
    next.disabled = shown >= els.length;
    if (shown >= els.length) next.textContent = 'Готово';
  }
  // Первый шаг сразу
  revealNext();
  return card;
}
