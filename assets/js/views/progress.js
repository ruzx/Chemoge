// Прогресс: навыки, калибровка уверенности, отчёт для преподавателя, перенос данных.
import { h, copyText, toast, rich } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { plural } from './home.js';
import { sync } from '../lib/sync.js';

export function render(root, _arg, { content }) {
  const log = store.data.log;
  root.append(h('div', { class: 'eyebrow' }, 'Прогресс'), h('h1', {}, 'Прогресс'));
  if (!log.length) { root.append(h('p', { class: 'muted' }, 'Пока нет ответов. Начните с тренировки.'), h('a', { class: 'btn primary', href: '#practice-all' }, 'Тренировка')); return; }

  const week = Date.now() - 7 * 864e5;
  const recent = log.filter(l => l.t >= week);
  const acc = arr => arr.length ? Math.round(arr.reduce((s, l) => s + l.ok, 0) / arr.length * 100) : 0;
  root.append(h('div', { class: 'grid g4', style: { marginTop: '16px' } },
    stat(String(log.length), 'ответов всего'),
    stat(`${recent.length}`, 'за 7 дней'),
    stat(`${acc(recent.length ? recent : log)}%`, 'точность за неделю'),
    stat(String(store.streak()), plural(store.streak(), 'день подряд', 'дня подряд', 'дней подряд'))));

  // Навыки
  root.append(h('h2', {}, 'Навыки'));
  const skillsCard = h('div', { class: 'card' });
  const rows = [];
  for (const m of content.modules) for (const s of m.skills) {
    const ids = m.questions.filter(q => q.skill === s.id).map(q => q.id);
    const tries = log.filter(l => l.module === m.id && l.skill === s.id).slice(-20);
    rows.push({ m, s, mastery: store.mastery(ids), acc: acc(tries), n: tries.length });
  }
  const exp = log.filter(l => l.module === 'lab').slice(-20);
  if (exp.length) rows.push({ m: { id: 'lab', title: 'Практика' }, s: { title: 'Распознавание веществ' }, mastery: acc(exp) / 100, acc: acc(exp), n: exp.length, link: '#exp' });
  for (const r of rows) skillsCard.append(h('div', { class: 'skill-row' },
    h('a', { href: r.link || `#practice-${r.m.id}--${r.s.id}` }, r.s.title, h('span', { class: 'meta' }, ` · ${r.m.title}`)),
    h('div', { class: 'bar' }, h('i', { style: { width: Math.round(r.mastery * 100) + '%', background: r.acc < 60 && r.n ? 'var(--bad)' : undefined } })),
    h('span', { class: 'muted' }, r.n ? `${r.acc}%` : '—')));
  skillsCard.append(h('p', { class: 'meta', style: { marginTop: '8px' } }, 'Полоса — доля освоенных заданий (ответ закреплён повторением). Число — точность последних попыток.'));
  root.append(skillsCard);

  // Калибровка
  const c = { sr: 0, sw: 0, ur: 0, uw: 0 };
  for (const l of log.slice(-300)) { if (l.sure) l.ok === 1 ? c.sr++ : c.sw++; else l.ok === 1 ? c.ur++ : c.uw++; }
  root.append(h('h2', {}, 'Уверенность'), h('div', { class: 'card' },
    h('div', { class: 'calib' },
      h('div', { class: 'h' }), h('div', { class: 'h' }, 'Верно'), h('div', { class: 'h' }, 'Неверно'),
      h('div', { class: 'h', style: { textAlign: 'right' } }, 'Уверен'), h('div', {}, String(c.sr)), h('div', { class: c.sw ? 'danger' : '' }, String(c.sw)),
      h('div', { class: 'h', style: { textAlign: 'right' } }, 'Не уверен'), h('div', {}, String(c.ur)), h('div', {}, String(c.uw))),
    h('p', { class: 'meta', style: { marginTop: '10px' } }, 'Уверенные ошибки — самые важные: это неверно выученные правила. Они возвращаются на повторение в тот же день.')));

  // Трудные задания
  const qmap = new Map(content.modules.flatMap(m => [...m.questions, ...m.cards]).map(x => [x.id, x]));
  const hard = Object.entries(store.data.items).filter(([id, it]) => qmap.has(id) && it.n >= 1 && !it.lastOk).map(([id]) => qmap.get(id)).slice(0, 8);
  if (hard.length) root.append(h('h2', {}, 'Последние ошибки'), h('div', { class: 'card' },
    h('ul', { class: 'clean' }, hard.map(q => h('li', { class: 'small', html: rich(q.text || q.front) }))),
    h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#review' }, 'Повторить'))));

  // Отчёт и перенос
  root.append(h('h2', {}, 'Отчёт и данные'), h('div', { class: 'card' },
    sync.enabled ? h('p', { style: { marginTop: 0 } }, `Результаты автоматически отправляются преподавателю${store.setting('name') ? ' (' + store.setting('name') + ')' : ''}.`,
      sync.pending() ? h('span', { class: 'muted' }, ` В очереди: ${sync.pending()} — уйдут, когда появится интернет.`) : null,
      ' ', h('button', { class: 'btn sm ghost', onclick: () => { store.setting('name', ''); location.hash = '#home'; } }, 'Сменить имя')) : null,
    h('p', { class: 'meta', style: { marginTop: 0 } }, 'Прогресс хранится в этом браузере. Отчёт можно отправить преподавателю, данные — перенести на другое устройство.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => copyText(report(rows, c, recent, log)) }, 'Скопировать отчёт'),
      h('button', { class: 'btn', onclick: () => copyText(store.export()) }, 'Скопировать данные'),
      h('button', { class: 'btn', onclick: importData }, 'Загрузить данные'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn ghost', onclick: () => { if (confirmReset()) { store.reset(); location.reload(); } } }, 'Сбросить'))));

  function importData() {
    const box = h('textarea', { style: { width: '100%', height: '120px', marginTop: '10px', font: 'inherit', fontSize: '13px' }, placeholder: 'Вставьте скопированные данные' });
    const btn = h('button', { class: 'btn primary sm', style: { marginTop: '8px' }, onclick: () => { try { store.import(box.value); toast('Загружено'); setTimeout(() => location.reload(), 500); } catch { toast('Неверный формат'); } } }, 'Загрузить');
    root.lastChild.append(box, btn); box.focus();
  }
  let armed = false;
  function confirmReset() { if (armed) return true; armed = true; toast('Нажмите «Сбросить» ещё раз для подтверждения', 2500); setTimeout(() => armed = false, 3000); return false; }
}

function stat(v, label) { return h('div', { class: 'card' }, h('div', { class: 'big-num', style: { fontSize: '30px' } }, v), h('div', { class: 'meta' }, label)); }

function report(rows, c, recent, log) {
  const d = new Date().toLocaleDateString('ru-RU');
  const lines = [`Отчёт по химии — ${d}`, `Ответов за 7 дней: ${recent.length}, всего: ${log.length}`, ''];
  lines.push('Навыки (освоено / точность последних):');
  for (const r of rows) lines.push(`• ${r.s.title}: ${Math.round(r.mastery * 100)}% / ${r.n ? r.acc + '%' : '—'}`);
  lines.push('', `Уверенно и неверно: ${c.sw}; не уверен, но верно: ${c.ur}`);
  return lines.join('\n');
}
