// Карточка: вспомнить → открыть → оценить себя.
import { h, rich } from './ui.js';
import { store } from './store.js';
import { game, sound } from './game.js';

export function renderCard(c, { onNext, session }) {
  const root = h('div', { class: 'flash' });
  const face = h('div', { class: 'card face' },
    h('div', { class: 'eyebrow', style: { marginBottom: '14px' } }, 'Вспомните'),
    h('div', { html: rich(c.front) }));
  root.append(face);
  const t0 = Date.now();
  const setDock = el => session ? session.dock(el) : root.append(el);
  setDock(h('div', { class: 'dock' }, h('div', { class: 'dock-in' },
    h('div', { class: 'msg meta' }, 'Ответьте про себя, потом откройте'),
    h('button', { class: 'btn primary', onclick: reveal }, 'Показать ответ'))));
  function reveal() {
    sound('tap');
    face.append(h('div', { class: 'back', html: rich(c.back) }));
    const rate = (ok, sure) => {
      store.record(c.id, { ok, sure, skill: c.skill, module: c.module, kind: 'c', answer: !ok ? 'не вспомнил' : sure ? 'помню' : 'с трудом', ms: Date.now() - t0, text: String(c.front).replace(/[`^]/g, '') });
      const xp = game.answer(ok && sure, ok ? 0.5 : 0); session?.combo();
      onNext && onNext({ ok, sure, xp });
    };
    setDock(h('div', { class: 'dock' }, h('div', { class: 'dock-in rate', style: { display: 'grid', width: '100%' } },
      h('button', { class: 'btn red', onclick: () => rate(false, false) }, 'Не вспомнил'),
      h('button', { class: 'btn', onclick: () => rate(true, false) }, 'С трудом'),
      h('button', { class: 'btn green', onclick: () => rate(true, true) }, 'Помню'))));
  }
  return root;
}
