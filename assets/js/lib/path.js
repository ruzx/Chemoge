// «Путь» темы: уроки → тренировка → карточки (как дорожка в Duolingo).
import { h } from './ui.js';
import { store } from './store.js';

export const UNIT_COLORS = [['#58cc02', '#58a700'], ['#1cb0f6', '#1899d6'], ['#ce82ff', '#a568cc'], ['#ff9600', '#d97c00'], ['#ff4b4b', '#ea2b2b']];
const ICO = {
  lesson: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3l9 5-9 5-9-5 9-5zm-6 8.2v4.3c0 1.6 2.7 3.5 6 3.5s6-1.9 6-3.5v-4.3l-6 3.3-6-3.3z"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M3 9h2v6H3zM19 9h2v6h-2zM6 6h3v12H6zM15 6h3v12h-3zM9 11h6v2H9z"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="#fff"><rect x="4" y="6" width="12" height="15" rx="2" opacity=".6"/><rect x="8" y="3" width="12" height="15" rx="2"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.4l7-.8z"/></svg>',
};
const OFFS = [0, 46, 70, 46, 0, -46, -70, -46];

export function nodesFor(m) {
  const done = store.setting('lessons') || {};
  const nodes = m.lessons.map(l => ({ kind: 'lesson', title: l.title, href: `#lesson-${m.id}--${l.id}`, done: !!done[`${m.id}--${l.id}`] }));
  const mids = m.questions.map(q => q.id);
  nodes.push({ kind: 'practice', title: 'Тренировка', href: `#practice-${m.id}`, done: store.mastery(mids) >= 0.6 });
  if (m.cards.length) nodes.push({ kind: 'cards', title: 'Карточки', href: `#cards-${m.id}`, done: store.mastery(m.cards.map(c => c.id)) >= 0.6 });
  return nodes;
}

export function nextNode(modules) {
  for (const m of modules) { const n = nodesFor(m).find(x => !x.done); if (n) return n; }
  return { title: 'Смешанная тренировка', href: '#practice-all' };
}

export function renderPath(m, colorIdx, { withHeader = true } = {}) {
  const [c, cd] = UNIT_COLORS[colorIdx % UNIT_COLORS.length];
  const nodes = nodesFor(m);
  const firstOpen = nodes.findIndex(n => !n.done);
  const wrap = h('div');
  if (withHeader) wrap.append(h('div', { class: 'unit', style: { background: c } },
    h('div', {}, h('h3', {}, m.title), m.summary ? h('p', {}, m.summary) : null),
    h('a', { class: 'btn sm', href: `#module-${m.id}` }, 'Справка')));
  const path = h('div', { class: 'path' });
  nodes.forEach((n, i) => {
    const isNext = i === firstOpen;
    path.append(h('a', { class: 'node' + (n.done ? ' done' : '') + (isNext ? ' next' : ''), href: n.href, style: { transform: `translateX(${OFFS[i % OFFS.length]}px)`, color: c } },
      isNext ? h('span', { class: 'start' }, 'Начать') : null,
      h('span', { class: 'disc', style: { background: c, borderBottomColor: cd }, html: n.done ? ICO.star : ICO[n.kind] }),
      h('span', { class: 'lbl' }, n.title)));
  });
  wrap.append(path);
  return wrap;
}
