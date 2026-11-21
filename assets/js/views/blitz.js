// Блиц в стиле Kahoot: 10 вопросов, 20 секунд, очки за скорость, личные рекорды.
import { h, rich, shuffle } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { allQuestions } from '../lib/content.js';
import { game, sound } from '../lib/game.js';
import { openSession, closeSession } from '../lib/session.js';
import { plain } from '../lib/quiz.js';

const TIME = 20;
const TILES = [['#e21b3c', '▲'], ['#1368ce', '◆'], ['#d89e00', '●'], ['#26890c', '■']];

export function render(root, _arg, { content }) {
  const pool = allQuestions(content).filter(q => q.type === 'single' && q.options.length <= 4);
  let timer = null;
  start();

  function start() {
    root.replaceChildren();
    const s = openSession(root);
    const qs = shuffle(pool).slice(0, 10);
    let i = 0, score = 0, right = 0, xp = 0;
    const next = () => {
      s.progress(i / qs.length);
      if (i >= qs.length) return finish();
      const q = qs[i];
      let left = TIME, answered = false;
      const t0 = Date.now();
      const timeBar = h('i', { style: { width: '100%', background: '#ce82ff', transition: 'width .1s linear' } });
      const pts = h('div', { class: 'big-num', style: { fontSize: '22px', textAlign: 'right' } }, String(score));
      const tiles = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px', marginTop: '18px' } });
      const order = shuffle(q.options.map((o, k) => k));
      const btns = order.map((k, pos) => {
        const [col, shape] = TILES[pos];
        const b = h('button', { class: 'opt kahoot', style: { background: col, minHeight: '86px', fontSize: '19px' }, onclick: () => pick(k, b) },
          h('span', { style: { fontSize: '22px', width: '26px' } }, shape), h('span', { html: rich(q.options[k]) }));
        tiles.append(b); return b;
      });
      s.stage.replaceChildren(h('div', { class: 'lesson-screen' },
        h('div', { class: 'row' }, h('div', { class: 'bar thin', style: { flex: 1 } }, timeBar), pts),
        h('p', { class: 'q-text', style: { marginTop: '18px', textAlign: 'center' }, html: rich(q.text) }), tiles));
      s.dock(null);
      clearInterval(timer);
      timer = setInterval(() => {
        left -= 0.1; timeBar.style.width = Math.max(0, left / TIME * 100) + '%';
        if (left <= 0) { clearInterval(timer); pick(-1, null); }
      }, 100);
      function pick(k, el) {
        if (answered) return; answered = true; clearInterval(timer);
        const ok = k === q.answer;
        let gain = 0;
        if (ok) { gain = Math.round(500 + 500 * Math.max(0, left) / TIME) + (game.combo >= 2 ? 100 : 0); score += gain; right++; }
        xp += game.answer(ok); s.combo();
        store.record(q.id, { ok, sure: true, skill: q.skill, module: q.module, answer: k >= 0 ? String(k + 1) : 'нет ответа', ms: Date.now() - t0, text: plain(q.text), score: ok ? 1 : 0, max: 1 });
        btns.forEach((b, pos) => { const kk = order[pos]; b.disabled = true; b.style.opacity = kk === q.answer ? '1' : '.35'; if (kk === q.answer) b.style.outline = '4px solid #fff'; });
        pts.textContent = String(score);
        s.dock(h('div', { class: `dock ${ok ? 'ok' : 'bad'}` }, h('div', { class: 'dock-in' },
          h('div', { class: 'msg' }, h('b', {}, ok ? `+${gain}` : k < 0 ? 'Время вышло' : 'Мимо'), q.explain ? h('div', { class: 'exp', html: rich(q.explain) }) : null),
          h('button', { class: 'btn', onclick: () => { i++; next(); } }, 'Дальше'))));
      }
    };
    next();

    function finish() {
      const best = [...(store.setting('blitzBest') || []), { score, d: new Date().toLocaleDateString('ru-RU') }].sort((a, b) => b.score - a.score).slice(0, 5);
      store.setting('blitzBest', best);
      const isRecord = best[0].score === score && score > 0;
      s.finish({
        title: isRecord ? 'Новый рекорд!' : 'Блиц завершён', xp, acc: Math.round(right / qs.length * 100),
        extra: [h('div', { class: 'big-num', style: { margin: '6px 0 16px' } }, score + ' очков'),
          h('div', { class: 'card', style: { maxWidth: '320px', margin: '0 auto 10px', textAlign: 'left' } }, h('h3', {}, 'Ваши рекорды'),
            ...best.map((b, n) => h('div', { class: 'row', style: { justifyContent: 'space-between', padding: '4px 0' } }, h('span', {}, `${n + 1}. ${b.d}`), h('b', {}, String(b.score)))))],
        buttons: [h('a', { class: 'btn', href: '#home' }, 'Готово'), h('button', { class: 'btn primary', onclick: start }, 'Ещё раз')],
      });
    }
  }
  return () => { clearInterval(timer); closeSession(); };
}
