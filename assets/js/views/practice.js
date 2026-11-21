// Тренировка: 10 заданий, чередование навыков, приоритет — то, что пора повторить.
// #practice-all · #practice-<модуль> · #practice-<модуль>--<навык>
import { h } from '../lib/ui.js';
import { allQuestions } from '../lib/content.js';
import { renderQuestion, buildSession } from '../lib/quiz.js';
import { openSession, closeSession, fmtTime } from '../lib/session.js';

export function render(root, arg, { content }) {
  const [mid, skill] = (arg || 'all').split('--');
  let pool = mid === 'all' ? allQuestions(content) : (content.modules.find(m => m.id === mid)?.questions || []);
  if (skill) pool = pool.filter(q => q.skill === skill);
  const back = mid === 'all' ? '#home' : `#module-${mid}`;
  start();

  function start() {
    root.replaceChildren();
    const s = openSession(root, { onClose: () => (location.hash = back) });
    const session = buildSession(pool, Math.min(10, pool.length));
    if (!session.length) { s.stage.append(h('p', { class: 'muted' }, 'Заданий пока нет.')); return; }
    const st = { score: 0, max: 0, xp: 0, sureWrong: 0, t0: Date.now() };
    let i = 0;
    const next = () => {
      s.progress(i / session.length);
      if (i >= session.length) return finish();
      s.stage.replaceChildren(renderQuestion(session[i], {
        session: s, onNext: r => { st.score += r.score; st.max += r.max; st.xp += r.xp; if (!r.full && r.sure) st.sureWrong++; i++; next(); },
      }));
      window.scrollTo({ top: 0 });
    };
    next();
    function finish() {
      const acc = Math.round(st.score / Math.max(1, st.max) * 100);
      s.finish({
        title: acc >= 80 ? 'Отличная тренировка!' : acc >= 50 ? 'Хорошая работа!' : 'Тренировка завершена',
        xp: st.xp, acc, time: fmtTime(Date.now() - st.t0),
        extra: st.sureWrong ? [h('p', { class: 'muted' }, `Уверенных ошибок: ${st.sureWrong} — они вернутся на повторение сегодня.`)] : [],
        buttons: [h('a', { class: 'btn', href: back }, 'Готово'), h('button', { class: 'btn primary', onclick: start }, 'Ещё 10')],
      });
    }
  }
  return closeSession;
}
