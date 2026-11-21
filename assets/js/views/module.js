import { h, R } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { renderBlock, renderExample } from '../lib/blocks.js';
import { renderPath } from '../lib/path.js';

const TABS = [['path', 'Уроки'], ['learn', 'Разборы'], ['sheet', 'Шпаргалка'], ['skills', 'Навыки']];

export function render(root, arg, { content }) {
  const m = content.modules.find(x => x.id === arg) || content.modules[0];
  const mids = [...m.questions, ...m.cards].map(x => x.id);
  root.append(
    h('div', { class: 'row' },
      h('div', {}, h('div', { class: 'eyebrow' }, 'Тема'), h('h1', {}, m.title), m.summary ? h('p', { class: 'muted', style: { margin: 0 } }, m.summary) : null),
      h('span', { class: 'spacer' }),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: `#practice-${m.id}` }, 'Тренировка'),
        m.cards.length ? h('a', { class: 'btn', href: `#cards-${m.id}` }, 'Карточки') : null)),
  );
  const tabs = h('div', { class: 'tabs' });
  const pane = h('div');
  root.append(tabs, pane);
  let tab = store.setting('tab-' + m.id) || 'path';
  function show(t) {
    tab = t; store.setting('tab-' + m.id, t);
    tabs.replaceChildren(...TABS.map(([k, label]) => h('button', { class: k === t ? 'on' : '', onclick: () => show(k) }, label)));
    pane.replaceChildren();
    if (t === 'path') {
      pane.append(renderPath(m, content.modules.indexOf(m), { withHeader: false }));
    } else if (t === 'learn') {
      if (!m.examples.length) pane.append(h('p', { class: 'muted' }, 'Разборов пока нет.'));
      pane.append(h('div', { class: 'grid', style: { maxWidth: '780px' } }, m.examples.map(renderExample)));
    } else if (t === 'sheet') {
      pane.append(h('div', { class: 'sheet' }, m.cheatsheet.map(renderBlock)));
    } else {
      pane.append(h('div', { class: 'card', style: { maxWidth: '780px' } }, m.skills.map(s => {
        const ids = m.questions.filter(q => q.skill === s.id).map(q => q.id);
        const p = Math.round(store.mastery(ids) * 100);
        return h('div', { class: 'skill-row' },
          h('a', { href: `#practice-${m.id}--${s.id}` }, s.title),
          h('div', { class: 'bar' }, h('i', { style: { width: p + '%' } })),
          h('span', { class: 'muted' }, `${p}%`));
      }), h('p', { class: 'meta', style: { marginTop: '10px' } }, 'Нажмите на навык, чтобы потренировать только его.')));
    }
  }
  show(tab);
}
