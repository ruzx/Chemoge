// Справочник: таблица растворимости + шпаргалки всех тем.
import { h } from '../lib/ui.js';
import { renderBlock, solubility } from '../lib/blocks.js';

export function render(root, _arg, { content }) {
  root.append(h('div', { class: 'row' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Справочник'), h('h1', {}, 'Шпаргалки')), h('span', { class: 'spacer' }),
    h('button', { class: 'btn sm', onclick: () => window.print() }, 'Печать')));
  const nav = h('div', { class: 'row', style: { margin: '12px 0 4px' } },
    h('a', { class: 'chip', href: '#cheats', onclick: e => { e.preventDefault(); document.getElementById('sec-sol').scrollIntoView({ behavior: 'smooth' }); } }, 'Растворимость'),
    content.modules.filter(m => m.cheatsheet.length).map(m => h('a', { class: 'chip', href: '#cheats', onclick: e => { e.preventDefault(); document.getElementById('sec-' + m.id).scrollIntoView({ behavior: 'smooth' }); } }, m.title)));
  root.append(nav);
  root.append(h('h2', { id: 'sec-sol' }, 'Таблица растворимости'), h('div', { class: 'card' }, solubility()));
  for (const m of content.modules) {
    if (!m.cheatsheet.length) continue;
    root.append(h('h2', { id: 'sec-' + m.id }, m.title), h('div', { class: 'sheet' }, m.cheatsheet.map(renderBlock)));
  }
}
