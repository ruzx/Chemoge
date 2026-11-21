// Отрисовка вопроса любого типа и проверка ответа.
// Типы: single, multi (выбрать несколько), match (соответствие А-Б-В), number, order (последовательность).
import { h, R, rich, shuffle } from './ui.js';
import { store } from './store.js';
import { game } from './game.js';

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
import { sound } from './game.js';

const OK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="#58a700" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const BAD_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="#ea2b2b" stroke-width="3.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const PRAISE = ['Отлично!', 'Верно!', 'Так держать!', 'Точно!', 'Великолепно!'];

// Вопрос + нижняя панель «Проверить → результат». session — из openSession.
export function renderQuestion(q, { index, total, onNext, session, nextLabel = 'Продолжить' } = {}) {
  const root = h('div', { class: 'q' });
  const state = { sel: q.type === 'multi' ? new Set() : q.type === 'match' || q.type === 'order' ? [] : null, done: false, t0: Date.now() };
  root.append(h('div', { class: 'q-head' },
    h('span', {}, q.type === 'match' ? 'Соответствие' : q.type === 'multi' ? 'Выберите несколько' : q.type === 'number' ? 'Расчёт' : q.type === 'order' ? 'Последовательность' : 'Выберите ответ'),
    h('span', {}, q.points > 1 ? `${q.points} балла` : '')));
  root.append(R('p', q.text, { class: 'q-text' }));
  const body = h('div');
  root.append(body);

  let check;
  if (q.type === 'single' || q.type === 'multi') check = renderChoice(q, body, state);
  else if (q.type === 'match') check = renderMatch(q, body, state);
  else if (q.type === 'order') check = renderOrder(q, body, state);
  else if (q.type === 'number') check = renderNumber(q, body, state, () => submit());

  const unsure = h('input', { type: 'checkbox' });
  const checkBtn = h('button', { class: 'btn green', onclick: () => submit() }, 'Проверить');
  const dock = h('div', { class: 'dock' }, h('div', { class: 'dock-in' },
    h('label', { class: 'unsure', style: { margin: 0, flex: 1 } }, unsure, 'Не уверен'), checkBtn));
  const setDock = el => session ? session.dock(el) : root.append(el);
  setDock(dock);
  const onKey = e => { if (e.key === 'Enter' && !e.target.matches('input[type=text]')) { e.preventDefault(); state.done ? cont() : submit(); } };
  addEventListener('keydown', onKey);
  let cont = () => {};

  function submit() {
    if (state.done) return;
    const res = check();
    if (!res) { root.querySelector('.opts,.match,.num-input')?.classList.add('shake'); setTimeout(() => root.querySelector('.shake')?.classList.remove('shake'), 300); return; }
    state.done = true;
    const sure = !unsure.checked;
    const score = res.score, max = q.points;
    const full = score === max;
    store.record(q.id, { ok: full ? true : score / max, sure, skill: q.skill, module: q.module, answer: res.given, ms: Date.now() - state.t0, text: plain(q.text), score, max });
    const xp = game.answer(full, score / max);
    session?.combo();
    const cls = full ? 'ok' : score > 0 ? 'part' : 'bad';
    const title = full ? (sure ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : 'Верно! Вопрос вернётся раньше') :
      score > 0 ? `Почти: ${score} из ${max}` : (sure ? 'Уверенная ошибка — разберём' : 'Неправильно');
    cont = () => { removeEventListener('keydown', onKey); onNext && onNext({ score, max, full, sure, xp }); };
    setDock(h('div', { class: `dock ${cls}` }, h('div', { class: 'dock-in' },
      h('div', { class: 'msg' },
        h('b', {}, h('span', { class: 'badge', html: full ? OK_ICO : BAD_ICO }), title),
        !full && res.correctText ? h('div', { class: 'exp', html: 'Ответ: ' + rich(res.correctText) }) : null,
        q.explain ? h('div', { class: 'exp', html: rich(q.explain) }) : null),
      h('button', { class: 'btn', onclick: () => cont() }, nextLabel))));
  }
  return root;
}

function renderChoice(q, body, state) {
  const multi = q.type === 'multi';
  // Порядок вариантов сохраняем (на экзамене ответ записывают номерами)
  const list = h('div', { class: 'opts' });
  const btns = q.options.map((o, i) => {
    const b = h('button', { class: 'opt', onclick: () => {
      if (state.done) return;
      sound('tap');
      if (multi) { state.sel.has(i) ? state.sel.delete(i) : state.sel.add(i); b.classList.toggle('sel'); }
      else { state.sel = i; btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); }
    } }, h('span', { class: 'n' }, String(i + 1)), h('span', { html: rich(o) }));
    list.append(b); return b;
  });

  body.append(list);
  return () => {
    if (multi ? state.sel.size === 0 : state.sel == null) return null;
    const ans = multi ? q.answer : [q.answer];
    const chosen = multi ? [...state.sel] : [state.sel];
    btns.forEach((b, i) => { b.disabled = true; if (ans.includes(i)) b.classList.add('ok'); else if (chosen.includes(i)) b.classList.add('bad'); b.classList.remove('sel'); });
    let score;
    if (!multi) score = state.sel === q.answer ? q.points : 0;
    else {
      const wrong = chosen.filter(i => !ans.includes(i)).length + ans.filter(i => !chosen.includes(i)).length;
      const extra = chosen.length > ans.length;
      score = wrong === 0 ? q.points : (q.points === 2 && wrong === 1 && !extra ? 1 : 0);
    }
    return { score, correctText: multi ? ans.map(i => i + 1).sort().join('') : null, given: chosen.map(i => i + 1).sort().join('') };
  };
}

function renderMatch(q, body, state) {
  body.append(h('div', { class: 'right-list' }, q.right.map((r, i) => h('div', { html: `<b>${i + 1})</b> ${rich(r)}` }))));
  const rows = q.left.map((l, li) => {
    const pick = h('div', { class: 'pick' });
    const bs = q.right.map((_, ri) => {
      const b = h('button', { onclick: () => {
        if (state.done) return;
        state.sel[li] = ri; bs.forEach(x => x.classList.remove('sel')); b.classList.add('sel');
      } }, String(ri + 1));
      pick.append(b); return b;
    });
    return { el: h('div', { class: 'match-row' }, h('div', { html: `<b>${LETTERS[li]})</b> ${rich(l)}` }), pick), bs };
  });
  body.append(h('div', { class: 'match' }, rows.map(r => r.el)));
  return () => {
    if (q.left.some((_, i) => state.sel[i] == null)) return null;
    let wrong = 0;
    rows.forEach((r, li) => r.bs.forEach((b, ri) => {
      b.disabled = true; b.classList.remove('sel');
      if (ri === q.answer[li]) b.classList.add('ok');
      else if (ri === state.sel[li]) { b.classList.add('bad'); }
    }));
    q.left.forEach((_, li) => { if (state.sel[li] !== q.answer[li]) wrong++; });
    const score = wrong === 0 ? q.points : (q.points === 2 && wrong === 1 ? 1 : 0);
    return { score, correctText: q.answer.map(a => a + 1).join(''), given: q.left.map((_, li) => state.sel[li] + 1).join('') };
  };
}

function renderOrder(q, body, state) {
  // Ученик нажимает варианты в нужном порядке
  const out = h('div', { class: 'row', style: { minHeight: '40px', margin: '8px 0' } });
  const list = h('div', { class: 'opts' });
  const btns = q.options.map((o, i) => {
    const b = h('button', { class: 'opt', onclick: () => {
      if (state.done || state.sel.includes(i)) return;
      state.sel.push(i); b.classList.add('sel'); draw();
    } }, h('span', { class: 'n' }, String(i + 1)), h('span', { html: rich(o) }));
    list.append(b); return b;
  });
  const reset = h('button', { class: 'btn sm ghost', onclick: () => { if (state.done) return; state.sel = []; btns.forEach(b => b.classList.remove('sel')); draw(); } }, 'Сбросить');
  function draw() { out.replaceChildren(...state.sel.map(i => h('span', { class: 'chip on' }, String(i + 1))), state.sel.length ? reset : h('span', { class: 'meta' }, 'Нажимайте варианты по порядку')); }
  draw();
  body.append(list, out);
  return () => {
    if (state.sel.length !== q.options.length) return null;
    btns.forEach(b => b.disabled = true);
    const okAll = state.sel.every((v, k) => v === q.answer[k]);
    return { score: okAll ? q.points : 0, correctText: q.answer.map(a => a + 1).join(''), given: state.sel.map(i => i + 1).join('') };
  };
}

function renderNumber(q, body, state, submit) {
  const inp = h('input', { type: 'text', inputmode: 'decimal', placeholder: 'Ответ', autocomplete: 'off' });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  body.append(h('div', { class: 'num-input' }, inp, q.unit ? h('span', { class: 'muted' }, q.unit) : null));
  setTimeout(() => inp.focus(), 50);
  return () => {
    const v = parseFloat(inp.value.replace(',', '.').trim());
    if (Number.isNaN(v)) return null;
    inp.disabled = true;
    const tol = q.tol ?? Math.max(Math.abs(q.answer) * 0.01, 0.01);
    const ok = Math.abs(v - q.answer) <= tol;
    return { score: ok ? q.points : 0, correctText: `${String(q.answer).replace('.', ',')}${q.unit ? ' ' + q.unit : ''}`, given: String(v) };
  };
}

// Подбор вопросов для сессии: сначала «пора повторить», потом новые, затем слабые; чередуем навыки.
export function buildSession(questions, n = 10) {
  const now = Date.now();
  const due = [], fresh = [], rest = [];
  for (const q of questions) {
    const it = store.item(q.id);
    if (!it) fresh.push(q);
    else if (it.due <= now) due.push(q);
    else rest.push(q);
  }
  rest.sort((a, b) => (store.item(a.id).box - store.item(b.id).box) || (store.item(a.id).due - store.item(b.id).due));
  const pool = [...shuffle(due), ...shuffle(fresh), ...rest].slice(0, Math.max(n * 2, n));
  // Чередование по навыкам
  const bySkill = {};
  for (const q of pool) (bySkill[q.skill || '_'] ||= []).push(q);
  const groups = Object.values(bySkill);
  const out = [];
  while (out.length < n && groups.some(g => g.length)) for (const g of groups) if (g.length && out.length < n) out.push(g.shift());
  return out;
}

// Текст без разметки — для отчёта
export const plain = t => String(t || '').replace(/`/g, '').replace(/\*\*/g, '').replace(/\^/g, '').slice(0, 160);
