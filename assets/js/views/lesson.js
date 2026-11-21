// Интерактивный урок: экраны с текстом, виджетами и вопросами. #lesson-<модуль>--<урок>
import { h, rich, tube, F } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { game, sound } from '../lib/game.js';
import { renderQuestion } from '../lib/quiz.js';
import { WIDGETS } from '../lib/widgets.js';
import { openSession, closeSession, fmtTime } from '../lib/session.js';

const OK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="#58a700" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export function render(root, arg, { content }) {
  const [mid, lid] = arg.split('--');
  const mod = content.modules.find(m => m.id === mid);
  const lesson = mod?.lessons.find(l => l.id === lid);
  if (!lesson) { root.append(h('p', {}, 'Урок не найден.')); return; }
  const back = `#module-${mid}`;
  const s = openSession(root, { onClose: () => (location.hash = back) });
  const screens = lesson.screens;
  let i = 0, xp = 0, right = 0, asked = 0;
  const t0 = Date.now();

  function next() {
    s.progress(i / screens.length);
    if (i >= screens.length) return finish();
    const sc = screens[i];
    const go = () => { i++; next(); };
    window.scrollTo({ top: 0 });
    if (sc.type === 'question') {
      asked++;
      const q = { points: 1, ...sc, type: sc.qtype || 'single', id: `${mid}-${lid}-s${i}`, module: mid, skill: sc.skill || lesson.skill };
      s.stage.replaceChildren(h('div', { class: 'lesson-screen' }, renderQuestion(q, { session: s, onNext: r => { xp += r.xp; if (r.full) right++; go(); } })));
      return;
    }
    const el = h('div', { class: 'lesson-screen' });
    if (sc.title) el.append(h('h1', { html: rich(sc.title) }));
    if (sc.text) el.append(h('p', { class: 'lead', html: rich(sc.text) }));
    if (sc.formula) el.append(h('div', { class: 'formula-box', html: rich(sc.formula) }));
    if (sc.tubes) el.append(h('div', { class: 'tubes', style: { justifyContent: 'center', margin: '16px 0' } }, sc.tubes.map(t => h('div', { class: 'tube-fig' }, tube({ ppt: t.color, gas: t.gas, smell: t.smell, w: 44 }), F(t.f, 'b'), h('small', {}, t.name)))));
    if (sc.note) el.append(h('p', { class: 'meta', html: rich(sc.note) }));
    s.stage.replaceChildren(el);
    const contBtn = h('button', { class: 'btn primary', onclick: go }, 'Продолжить');
    if (sc.type === 'widget' && WIDGETS[sc.widget]) {
      const box = h('div', { class: 'widget' });
      const goalTag = sc.goalText ? h('div', { class: 'goal-tag', html: '🎯 ' + rich(sc.goalText) }) : null;
      if (goalTag) box.append(goalTag);
      el.append(box);
      let reached = false;
      const onGoal = () => {
        if (reached) return; reached = true;
        sound('ok'); game.addXP(5); xp += 5;
        goalTag?.classList.add('done');
        s.dock(h('div', { class: 'dock ok' }, h('div', { class: 'dock-in' },
          h('div', { class: 'msg' }, h('b', {}, h('span', { class: 'badge', html: OK_ICO }), sc.success || 'Получилось!'), sc.after ? h('div', { class: 'exp', html: rich(sc.after) }) : null),
          h('button', { class: 'btn', onclick: go }, 'Продолжить'))));
      };
      WIDGETS[sc.widget](box, sc.params || {}, sc.goal, onGoal);
      if (!reached) {
        if (sc.goal) { contBtn.disabled = true; s.dock(h('div', { class: 'dock' }, h('div', { class: 'dock-in' }, h('div', { class: 'msg meta' }, 'Выполните задание, чтобы продолжить'), contBtn))); }
        else s.dock(h('div', { class: 'dock' }, h('div', { class: 'dock-in' }, h('span', { class: 'spacer' }), contBtn)));
      }
    } else {
      s.dock(h('div', { class: 'dock' }, h('div', { class: 'dock-in' }, h('span', { class: 'spacer' }), contBtn)));
    }
  }

  function finish() {
    const doneMap = { ...(store.setting('lessons') || {}) };
    const first = !doneMap[`${mid}--${lid}`];
    doneMap[`${mid}--${lid}`] = Date.now();
    store.setting('lessons', doneMap);
    if (first) { game.addXP(20); xp += 20; }
    store.record(`${mid}-${lid}-lesson`, { ok: true, sure: true, module: mid, skill: lesson.skill, kind: 'l', text: `Урок: ${lesson.title}`, answer: asked ? `${right}/${asked}` : 'пройден', ms: Date.now() - t0 });
    const idx = mod.lessons.indexOf(lesson), nextL = mod.lessons[idx + 1];
    s.finish({
      title: 'Урок пройден!', xp, acc: asked ? Math.round(right / asked * 100) : null, time: fmtTime(Date.now() - t0),
      buttons: [h('a', { class: 'btn', href: back }, 'К теме'), nextL ? h('a', { class: 'btn primary', href: `#lesson-${mid}--${nextL.id}` }, 'Следующий урок') : h('a', { class: 'btn primary', href: `#practice-${mid}` }, 'Тренировка')],
    });
  }
  next();
  return closeSession;
}
