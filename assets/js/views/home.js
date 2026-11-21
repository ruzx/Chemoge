import { h, icons } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { allQuestions, allCards } from '../lib/content.js';
import { sync } from '../lib/sync.js';
import { game, DAILY_GOAL } from '../lib/game.js';
import { renderPath, nextNode } from '../lib/path.js';

export function render(root, _arg, { content }) {
  const ids = [...allQuestions(content), ...allCards(content)].map(x => x.id);
  const due = store.dueIds(id => ids.includes(id)).length;

  if (sync.enabled && !store.setting('name')) {
    const inp = h('input', { class: 'text-input', placeholder: 'Имя и фамилия', style: { flex: 1, minWidth: '180px', width: 'auto', fontSize: '18px' } });
    root.append(h('div', { class: 'card', style: { marginBottom: '18px' } },
      h('h3', {}, 'Как вас зовут?'),
      h('p', { class: 'meta', style: { marginTop: 0 } }, 'Результаты будут приходить преподавателю под этим именем.'),
      h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', onclick: () => { if (inp.value.trim()) { store.setting('name', inp.value.trim()); location.reload(); } } }, 'Сохранить'))));
  }

  const nxt = nextNode(content.modules);
  const left = h('div');
  content.modules.forEach((m, i) => left.append(renderPath(m, i)));

  const xp = game.xpToday, frac = Math.min(1, xp / DAILY_GOAL);
  const right = h('div', { class: 'grid', style: { position: 'sticky', top: '84px' } },
    h('a', { class: 'btn green wide', href: nxt.href, style: { padding: '16px' } }, 'Продолжить: ', nxt.title),
    h('div', { class: 'card' },
      h('div', { class: 'goal' },
        h('div', { class: 'ring', html: ring(frac) }),
        h('div', {}, h('h3', { style: { margin: 0 } }, 'Цель на день'), h('div', { class: 'meta' }, `${xp} / ${DAILY_GOAL} XP`))),
      h('div', { class: 'stats3', style: { marginTop: '14px' } },
        stat('🔥 ' + store.streak(), 'дней подряд'), stat('⚡ ' + game.xpTotal, 'всего XP'), stat('⭐ ' + game.level, 'уровень'))),
    h('div', { class: 'grid side-tools' },
    h('a', { class: 'card tool', href: '#review' }, h('div', { class: 'ico', style: { background: '#ff9600' }, html: icons.repeat }),
      h('div', {}, h('h3', { style: { margin: 0 } }, 'Повторение'), h('div', { class: 'meta' }, due ? `${due} ждут повторения` : 'Долгов нет'))),
    h('a', { class: 'card tool', href: '#blitz' }, h('div', { class: 'ico', style: { background: '#ce82ff' }, html: BOLT }),
      h('div', {}, h('h3', { style: { margin: 0 } }, 'Блиц'), h('div', { class: 'meta' }, '10 вопросов на скорость'))),
    h('a', { class: 'card tool', href: '#lab' }, h('div', { class: 'ico', style: { background: '#1cb0f6' }, html: icons.flask }),
      h('div', {}, h('h3', { style: { margin: 0 } }, 'Лаборатория'), h('div', { class: 'meta' }, 'Смешивайте растворы'))),
    h('a', { class: 'card tool', href: '#exp' }, h('div', { class: 'ico', style: { background: '#58cc02' }, html: icons.search }),
      h('div', {}, h('h3', { style: { margin: 0 } }, 'Распознавание'), h('div', { class: 'meta' }, 'Что в склянках?')))));

  root.append(h('div', { class: 'hero' }, left, right));
}

const BOLT = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>';
function stat(v, l) { return h('div', { class: 'stat' }, h('b', {}, v), h('span', {}, l)); }
function ring(f) {
  const r = 30, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--line)" stroke-width="9"/><circle cx="36" cy="36" r="${r}" fill="none" stroke="#ffc800" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 36 36)"/><text x="36" y="42" text-anchor="middle" font-size="18" font-weight="900" fill="currentColor">${Math.round(f * 100)}%</text></svg>`;
}
export function plural(n, a, b, c) { const m = n % 10, k = n % 100; return m === 1 && k !== 11 ? a : m >= 2 && m <= 4 && (k < 10 || k >= 20) ? b : c; }
