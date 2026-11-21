// Распознавание веществ в двух склянках (как в практическом задании ОГЭ). Варианты генерируются.
import { h, F, tube, toast } from '../lib/ui.js';
import { byId, mix, makeExperiment, shortObs } from '../lib/chem.js';
import { store } from '../lib/store.js';

export function render(root) {
  root.append(h('div', { class: 'eyebrow' }, 'Практическое задание'), h('h1', {}, 'Распознавание веществ'));
  const stage = h('div', { style: { marginTop: '18px', maxWidth: '820px' } });
  root.append(stage);
  newTask();

  function newTask() {
    const ex = makeExperiment();
    if (!ex) { stage.replaceChildren(h('p', {}, 'Не удалось составить вариант. Обновите страницу.')); return; }
    const st = { step: 1, chosen: new Set(), cells: {}, concl: [null, null] };
    const names = ex.flasks.map(id => byId(id));
    const shuffledNames = [...names].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    const name = s => [F(s.f, 'b'), ' — ', s.name];

    function draw() {
      stage.replaceChildren();
      stage.append(h('div', { class: 'card' },
        h('p', { style: { marginTop: 0 } }, 'В склянках № 1 и № 2 находятся растворы веществ: ',
          ...shuffledNames.flatMap((s, i) => [i ? ' и ' : '', h('b', {}, s.name), ' (', F(s.f), ')']), '. Какой раствор где — неизвестно.'),
        h('p', { style: { marginBottom: 0 } }, 'Даны реактивы: ', ...ex.reagents.flatMap((id, i) => [i ? ', ' : '', byId(id).name, ' (', F(byId(id).f), ')']), '.')));

      // Шаг 1: выбрать два реактива
      const s1 = h('div', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'eyebrow' }, 'Шаг 1'),
        h('h3', { style: { marginTop: '4px' } }, 'Выберите два реактива, которые нужны для распознавания'));
      const chips = h('div', { class: 'row' }, ex.reagents.map(id => {
        const needed = Object.values(ex.needed).includes(id);
        let cls = 'chip';
        if (st.step > 1) cls += needed ? ' ok' : st.chosen.has(id) ? ' bad' : '';
        else if (st.chosen.has(id)) cls += ' on';
        return h('button', { class: cls, onclick: () => { if (st.step > 1) return; st.chosen.has(id) ? st.chosen.delete(id) : st.chosen.size < 2 && st.chosen.add(id); draw(); } }, byId(id).name);
      }));
      s1.append(chips);
      if (st.step === 1) s1.append(h('div', { class: 'actions' }, h('button', { class: 'btn primary', disabled: st.chosen.size !== 2, onclick: () => {
        const ok = [...st.chosen].every(id => Object.values(ex.needed).includes(id));
        store.record('exp-reagents', { ok, sure: true, skill: 'experiment', module: 'lab', kind: 'x', text: `Выбор реактивов: ${ex.flasks.map(f => byId(f).f).join(' / ')}`, answer: [...st.chosen].map(id => byId(id).f).join(', ') });
        st.reagentsOk = ok; st.step = 2; draw();
      } }, 'Проверить')));
      else s1.append(h('p', { class: 'small ' + (st.reagentsOk ? '' : 'muted'), style: { marginBottom: 0 } },
        st.reagentsOk ? 'Верно.' : `Нужны: ${Object.values(ex.needed).map(id => byId(id).name).join(' и ')}. «${byId(ex.dummy).name}» не даёт признаков ни с одним веществом.`));
      stage.append(s1);
      if (st.step < 2) return;

      // Шаг 2: опыты
      const s2 = h('div', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'eyebrow' }, 'Шаг 2'),
        h('h3', { style: { marginTop: '4px' } }, 'Проведите опыты'), h('p', { class: 'meta', style: { marginTop: 0 } }, 'Нажмите на клетку, чтобы добавить реактив в пробирку.'));
      const reags = Object.values(ex.needed);
      const table = h('table', { class: 'exp-table' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Реактив'), h('th', {}, 'Склянка № 1'), h('th', {}, 'Склянка № 2'))),
        h('tbody', {}, reags.map(r => h('tr', {}, h('td', {}, byId(r).name, h('br'), F(byId(r).f)),
          ...ex.flasks.map((f, fi) => {
            const key = r + '|' + fi; const res = st.cells[key];
            return h('td', { class: 'cell' + (res ? ' done' : ''), onclick: () => { if (!res) { st.cells[key] = mix(f, r); draw(); } } },
              res ? h('div', { class: 'flask' }, tube({ liquid: res.liquid || undefined, ppt: res.ppt, gas: res.gas, smell: res.smell, w: 30 }), h('span', { class: 'small' }, shortObs(res)))
                : h('span', { class: 'muted small' }, 'провести опыт'));
          })))));
      s2.append(h('div', { style: { overflowX: 'auto' } }, table));
      stage.append(s2);
      const allDone = reags.every(r => [0, 1].every(fi => st.cells[r + '|' + fi]));
      if (!allDone) return;

      // Шаг 3: вывод
      const s3 = h('div', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'eyebrow' }, 'Шаг 3'), h('h3', { style: { marginTop: '4px' } }, 'Вывод'));
      [0, 1].forEach(fi => {
        s3.append(h('div', { class: 'row', style: { margin: '8px 0' } }, h('span', { style: { minWidth: '110px' } }, `Склянка № ${fi + 1}:`),
          shuffledNames.map(s => {
            let cls = 'chip';
            if (st.step > 2) cls += s.id === ex.flasks[fi] ? ' ok' : st.concl[fi] === s.id ? ' bad' : '';
            else if (st.concl[fi] === s.id) cls += ' on';
            return h('button', { class: cls, onclick: () => { if (st.step > 2) return; st.concl[fi] = s.id; draw(); } }, s.name);
          })));
      });
      if (st.step === 2) s3.append(h('div', { class: 'actions' }, h('button', { class: 'btn primary', disabled: !(st.concl[0] && st.concl[1]), onclick: () => {
        const ok = st.concl[0] === ex.flasks[0] && st.concl[1] === ex.flasks[1];
        store.record('exp-conclusion', { ok, sure: true, skill: 'experiment', module: 'lab', kind: 'x', text: `Вывод: ${ex.flasks.map(f => byId(f).f).join(' / ')}`, answer: st.concl.map(id => byId(id).f).join(' / ') });
        st.step = 3; toast(ok ? 'Верно' : 'Неверно — смотрите таблицу'); draw();
      } }, 'Проверить')));
      stage.append(s3);
      if (st.step < 3) return;

      // Шаг 4: уравнения
      const s4 = h('div', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'eyebrow' }, 'Шаг 4'), h('h3', { style: { marginTop: '4px' } }, 'Уравнения реакций'),
        h('p', { class: 'meta', style: { marginTop: 0 } }, 'Запишите сами на бумаге, затем сверьтесь.'));
      const det = h('details', {}, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, 'Показать уравнения'));
      ex.flasks.forEach(f => {
        const r = mix(f, ex.needed[f]);
        det.append(h('p', { style: { margin: '12px 0 4px' } }, h('b', {}, byId(f).name), ' + ', byId(ex.needed[f]).name),
          ...[['Молекулярное', r.molecularEq], ['Полное ионное', r.fullEq], ['Сокращённое ионное', r.shortEq]].filter(x => x[1]).map(([t, e]) => h('div', { class: 'eq' }, h('small', {}, t), F(e))));
      });
      s4.append(det, h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: newTask }, 'Новый вариант')));
      stage.append(s4);
    }
    draw();
  }
}
