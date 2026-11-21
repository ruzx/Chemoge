// Повторение по расписанию: всё, что «созрело», вперемешку (задания и карточки).
import { h, shuffle } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { allQuestions, allCards } from '../lib/content.js';
import { renderQuestion } from '../lib/quiz.js';
import { renderCard } from '../lib/flash.js';
import { openSession, closeSession, fmtTime } from '../lib/session.js';

export function render(root, _arg, { content }) {
  const qs = allQuestions(content), cs = allCards(content);
  const byId = new Map([...qs.map(q => [q.id, { t: 'q', x: q }]), ...cs.map(c => [c.id, { t: 'c', x: c }])]);
  let queue = shuffle(store.dueIds(id => byId.has(id)).map(id => byId.get(id))).slice(0, 20);
  if (!queue.length) queue = shuffle([...qs, ...cs].filter(x => !store.seen(x.id))).slice(0, 8).map(x => byId.get(x.id));
  if (!queue.length) {
    root.append(h('div', { class: 'card done-card' }, h('h1', {}, 'Всё повторено'), h('p', { class: 'muted' }, 'Следующие задания появятся по расписанию.'), h('a', { class: 'btn primary', href: '#practice-all' }, 'Дополнительная тренировка')));
    return;
  }
  const s = openSession(root);
  let i = 0, right = 0, xp = 0;
  const t0 = Date.now(), total = queue.length;
  const next = () => {
    s.progress(i / total);
    if (i >= total) {
      return s.finish({ title: 'Повторение завершено!', xp, acc: Math.round(right / total * 100), time: fmtTime(Date.now() - t0), buttons: [h('a', { class: 'btn primary', href: '#home' }, 'Продолжить')] });
    }
    const it = queue[i];
    const done = r => { if (r.full || (r.ok && r.sure)) right++; xp += r.xp || 0; i++; next(); };
    s.stage.replaceChildren(it.t === 'q' ? renderQuestion(it.x, { session: s, onNext: done }) : renderCard(it.x, { session: s, onNext: done }));
    window.scrollTo({ top: 0 });
  };
  next();
  return closeSession;
}
