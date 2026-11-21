// Карточки темы: сначала «пора повторить», затем новые. #cards-<модуль> или #cards-all
import { h, shuffle } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { allCards } from '../lib/content.js';
import { renderCard } from '../lib/flash.js';
import { openSession, closeSession, fmtTime } from '../lib/session.js';

export function render(root, arg, { content }) {
  const mod = content.modules.find(m => m.id === arg);
  const cards = mod ? mod.cards : allCards(content);
  const back = mod ? `#module-${mod.id}` : '#home';
  const now = Date.now();
  const due = cards.filter(c => store.item(c.id) && store.item(c.id).due <= now);
  const fresh = cards.filter(c => !store.item(c.id));
  let queue = [...shuffle(due), ...shuffle(fresh)].slice(0, 12);
  if (!queue.length) queue = shuffle(cards).slice(0, 10);
  const s = openSession(root, { onClose: () => (location.hash = back) });
  let i = 0, known = 0, xp = 0; const t0 = Date.now();
  const next = () => {
    s.progress(i / queue.length);
    if (i >= queue.length) return s.finish({ title: 'Карточки пройдены!', xp, acc: Math.round(known / queue.length * 100), time: fmtTime(Date.now() - t0),
      buttons: [h('a', { class: 'btn', href: back }, 'Готово'), mod ? h('a', { class: 'btn primary', href: `#practice-${mod.id}` }, 'К заданиям') : null] });
    s.stage.replaceChildren(renderCard(queue[i], { session: s, onNext: r => { if (r.ok && r.sure) known++; xp += r.xp; i++; next(); } }));
  };
  next();
  return closeSession;
}
