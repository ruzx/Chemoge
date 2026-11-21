// Движок реакций ионного обмена для школьного курса.
// Данные: ионы, вещества (растворы), таблица растворимости, цвета осадков, особые случаи.
// Всё в разметке формул: индексы — цифры после букв, заряд — ^2+ / ^-.

export const CATIONS = {
  H:   { f: 'H',   z: 1, name: 'водород' },
  Li:  { f: 'Li',  z: 1 }, Na: { f: 'Na', z: 1 }, K: { f: 'K', z: 1 },
  NH4: { f: 'NH4', z: 1, poly: true },
  Ba:  { f: 'Ba',  z: 2 }, Ca: { f: 'Ca', z: 2 }, Mg: { f: 'Mg', z: 2 },
  Al:  { f: 'Al',  z: 3 }, Zn: { f: 'Zn', z: 2 }, Cu: { f: 'Cu', z: 2 },
  Fe2: { f: 'Fe',  z: 2 }, Fe3: { f: 'Fe', z: 3 }, Ag: { f: 'Ag', z: 1 },
};
export const ANIONS = {
  OH:   { f: 'OH',   z: 1, poly: true },
  Cl:   { f: 'Cl',   z: 1 }, Br: { f: 'Br', z: 1 }, I: { f: 'I', z: 1 },
  NO3:  { f: 'NO3',  z: 1, poly: true },
  SO4:  { f: 'SO4',  z: 2, poly: true },
  SO3:  { f: 'SO3',  z: 2, poly: true },
  CO3:  { f: 'CO3',  z: 2, poly: true },
  HCO3: { f: 'HCO3', z: 1, poly: true },
  PO4:  { f: 'PO4',  z: 3, poly: true },
  SiO3: { f: 'SiO3', z: 2, poly: true },
};
const CAT_ORDER = ['H', 'Li', 'Na', 'K', 'NH4', 'Ba', 'Ca', 'Mg', 'Al', 'Zn', 'Cu', 'Fe2', 'Fe3', 'Ag'];
const AN_ORDER = ['OH', 'Cl', 'Br', 'I', 'NO3', 'SO4', 'SO3', 'CO3', 'HCO3', 'PO4', 'SiO3'];

export const ionLabel = (key, isCat) => {
  const d = isCat ? CATIONS[key] : ANIONS[key];
  return `${d.f}^${d.z > 1 ? d.z : ''}${isCat ? '+' : '-'}`;
};

// Растворимость: R — растворимо, M — малорастворимо, N — нерастворимо,
// X — разлагается водой / не существует, S — особый случай (газ, вода, ОВР), ? — вне школьного курса.
// Строки — катионы, столбцы в порядке AN_ORDER.
const SOL_ROWS = {
  //      OH  Cl  Br  I   NO3 SO4 SO3 CO3 HCO3 PO4 SiO3
  H:   ['S','R','R','R','R','R','S','S','S','R','S'],
  Li:  ['R','R','R','R','R','R','R','M','R','N','N'],
  Na:  ['R','R','R','R','R','R','R','R','R','R','R'],
  K:   ['R','R','R','R','R','R','R','R','R','R','R'],
  NH4: ['S','R','R','R','R','R','R','R','R','R','?'],
  Ba:  ['R','R','R','R','R','N','N','N','R','N','N'],
  Ca:  ['M','R','R','R','R','M','N','N','R','N','N'],
  Mg:  ['N','R','R','R','R','R','M','N','R','N','N'],
  Al:  ['N','R','R','R','R','R','?','S','S','N','?'],
  Zn:  ['N','R','R','R','R','R','?','N','?','N','?'],
  Cu:  ['N','R','R','S','R','R','?','S','?','N','?'],
  Fe2: ['N','R','R','R','R','R','?','N','?','N','?'],
  Fe3: ['N','R','R','S','R','R','?','S','S','N','?'],
  Ag:  ['S','N','N','N','R','M','N','N','?','N','?'],
};
export function sol(c, a) { return SOL_ROWS[c]?.[AN_ORDER.indexOf(a)] ?? '?'; }

// Для отображения таблицы растворимости (S и ? показываем как «—»)
export function solubilityTable() {
  const view = v => ({ R: 'Р', M: 'М', N: 'Н', X: '—', S: '—', '?': '—' })[v];
  const cls = v => ({ R: 'R', M: 'M', N: 'N' })[v] || 'X';
  const fix = { 'H|OH': ['—', 'X'], 'H|SiO3': ['Н', 'N'], 'NH4|OH': ['Р', 'R'], 'Ag|OH': ['—', 'X'], 'Cu|I': ['—', 'X'], 'Fe3|I': ['—', 'X'] };
  const cats = CAT_ORDER, ans = AN_ORDER.filter(a => a !== 'HCO3');
  return {
    cats: cats.map(c => ionLabel(c, true)),
    rows: ans.map(a => ({ an: ionLabel(a, false), cells: cats.map(c => { const k = `${c}|${a}`; if (fix[k]) return { t: fix[k][0], c: fix[k][1] }; const v = sol(c, a); return { t: view(v), c: cls(v) }; }) })),
  };
}

// Цвета осадков. css — цвет слоя в пробирке.
const WHITE = { name: 'белый', css: '#e6e8e4' };
const PPT_COLOR = {
  'Cu|OH': { name: 'голубой', css: '#4fa3e0' },
  'Fe2|OH': { name: 'серо-зелёный', css: '#8fa58a' },
  'Fe3|OH': { name: 'бурый', css: '#9c4a1a' },
  'Ag|Cl': { name: 'белый творожистый', css: '#e6e8e4' },
  'Ag|Br': { name: 'светло-жёлтый', css: '#efe6a0' },
  'Ag|I': { name: 'жёлтый', css: '#f0d23a' },
  'Ag|CO3': { name: 'желтовато-белый', css: '#eee8c8' },
  'Ag|PO4': { name: 'жёлтый', css: '#f0c23a' },
  'Cu|PO4': { name: 'голубой', css: '#69b4cf' },
  'Fe2|CO3': { name: 'белый с зеленоватым оттенком', css: '#dbe2d0' },
  'Fe2|PO4': { name: 'белый (сероватый)', css: '#e2e4dc' },
  'Fe3|PO4': { name: 'желтовато-белый', css: '#f0e6b6' },
};
const AMPHOTERIC = { Al: 'Al(OH)3 + OH^- = [Al(OH)4]^-', Zn: 'Zn(OH)2 + 2OH^- = [Zn(OH)4]^2-' };

// Цвет раствора по ионам
const SOLUTION_COLOR = { Cu: 'rgba(60,140,230,.32)', Fe3: 'rgba(205,140,40,.32)', Fe2: 'rgba(150,200,140,.25)' };

const gcd = (a, b) => b ? gcd(b, a % b) : a;

// Формула соединения катион+анион
export function compound(c, a) {
  const C = CATIONS[c], A = ANIONS[a];
  const g = gcd(C.z, A.z), nc = A.z / g, na = C.z / g;
  const part = (d, n) => n > 1 ? (d.poly ? `(${d.f})${n}` : `${d.f}${n}`) : d.f;
  return { formula: part(C, nc) + part(A, na), nc, na };
}
const coef = n => n > 1 ? String(n) : '';

// ---------------- Вещества (растворы) ----------------
// ph — примерное значение для 5–10 % раствора (для индикаторов).
const S = (id, name, f, cat, an, nc, na, ph, group, extra = {}) => ({ id, name, f, ions: [[cat, nc], [an, na]], ph, group, ...extra });
export const SUBSTANCES = [
  S('HCl', 'соляная кислота', 'HCl', 'H', 'Cl', 1, 1, 0.5, 'Кислоты'),
  S('H2SO4', 'серная кислота', 'H2SO4', 'H', 'SO4', 2, 1, 0.5, 'Кислоты'),
  S('HNO3', 'азотная кислота', 'HNO3', 'H', 'NO3', 1, 1, 0.5, 'Кислоты'),
  S('NaOH', 'гидроксид натрия', 'NaOH', 'Na', 'OH', 1, 1, 13.5, 'Щёлочи'),
  S('KOH', 'гидроксид калия', 'KOH', 'K', 'OH', 1, 1, 13.5, 'Щёлочи'),
  S('NaCl', 'хлорид натрия', 'NaCl', 'Na', 'Cl', 1, 1, 7, 'Соли'),
  S('LiCl', 'хлорид лития', 'LiCl', 'Li', 'Cl', 1, 1, 7, 'Соли'),
  S('KBr', 'бромид калия', 'KBr', 'K', 'Br', 1, 1, 7, 'Соли'),
  S('KI', 'иодид калия', 'KI', 'K', 'I', 1, 1, 7, 'Соли'),
  S('NaNO3', 'нитрат натрия', 'NaNO3', 'Na', 'NO3', 1, 1, 7, 'Соли'),
  S('KNO3', 'нитрат калия', 'KNO3', 'K', 'NO3', 1, 1, 7, 'Соли'),
  S('Na2SO4', 'сульфат натрия', 'Na2SO4', 'Na', 'SO4', 2, 1, 7, 'Соли'),
  S('K2SO4', 'сульфат калия', 'K2SO4', 'K', 'SO4', 2, 1, 7, 'Соли'),
  S('Na2CO3', 'карбонат натрия', 'Na2CO3', 'Na', 'CO3', 2, 1, 11.5, 'Соли'),
  S('K2CO3', 'карбонат калия', 'K2CO3', 'K', 'CO3', 2, 1, 11.5, 'Соли'),
  S('NaHCO3', 'гидрокарбонат натрия', 'NaHCO3', 'Na', 'HCO3', 1, 1, 8.3, 'Соли'),
  S('Na2SO3', 'сульфит натрия', 'Na2SO3', 'Na', 'SO3', 2, 1, 10, 'Соли'),
  S('Na3PO4', 'фосфат натрия', 'Na3PO4', 'Na', 'PO4', 3, 1, 12, 'Соли'),
  S('Na2SiO3', 'силикат натрия', 'Na2SiO3', 'Na', 'SiO3', 2, 1, 12, 'Соли'),
  S('NH4Cl', 'хлорид аммония', 'NH4Cl', 'NH4', 'Cl', 1, 1, 4.8, 'Соли'),
  S('NH42SO4', 'сульфат аммония', '(NH4)2SO4', 'NH4', 'SO4', 2, 1, 4.9, 'Соли'),
  S('BaCl2', 'хлорид бария', 'BaCl2', 'Ba', 'Cl', 1, 2, 7, 'Соли'),
  S('BaNO32', 'нитрат бария', 'Ba(NO3)2', 'Ba', 'NO3', 1, 2, 7, 'Соли'),
  S('CaCl2', 'хлорид кальция', 'CaCl2', 'Ca', 'Cl', 1, 2, 7, 'Соли'),
  S('CaNO32', 'нитрат кальция', 'Ca(NO3)2', 'Ca', 'NO3', 1, 2, 7, 'Соли'),
  S('MgCl2', 'хлорид магния', 'MgCl2', 'Mg', 'Cl', 1, 2, 6, 'Соли'),
  S('MgSO4', 'сульфат магния', 'MgSO4', 'Mg', 'SO4', 1, 1, 6, 'Соли'),
  S('AlCl3', 'хлорид алюминия', 'AlCl3', 'Al', 'Cl', 1, 3, 3, 'Соли'),
  S('Al2SO43', 'сульфат алюминия', 'Al2(SO4)3', 'Al', 'SO4', 2, 3, 3, 'Соли'),
  S('ZnSO4', 'сульфат цинка', 'ZnSO4', 'Zn', 'SO4', 1, 1, 4.8, 'Соли'),
  S('CuSO4', 'сульфат меди(II)', 'CuSO4', 'Cu', 'SO4', 1, 1, 4, 'Соли'),
  S('CuCl2', 'хлорид меди(II)', 'CuCl2', 'Cu', 'Cl', 1, 2, 4, 'Соли'),
  S('FeSO4', 'сульфат железа(II)', 'FeSO4', 'Fe2', 'SO4', 1, 1, 4, 'Соли'),
  S('FeCl3', 'хлорид железа(III)', 'FeCl3', 'Fe3', 'Cl', 1, 3, 2, 'Соли'),
  S('AgNO3', 'нитрат серебра', 'AgNO3', 'Ag', 'NO3', 1, 1, 6, 'Соли'),
];
export const INDICATORS = [
  { id: 'litmus', name: 'лакмус', indicator: true, group: 'Индикаторы', f: 'лакмус' },
  { id: 'mo', name: 'метилоранж', indicator: true, group: 'Индикаторы', f: 'метилоранж' },
  { id: 'php', name: 'фенолфталеин', indicator: true, group: 'Индикаторы', f: 'фенолфталеин' },
];
export const byId = id => SUBSTANCES.find(s => s.id === id) || INDICATORS.find(s => s.id === id);

export function medium(ph) { return ph < 6.5 ? 'кислая' : ph > 7.5 ? 'щелочная' : 'нейтральная'; }
function indicatorColor(ind, ph) {
  if (ind === 'litmus') return ph < 5 ? ['красный', 'rgba(220,40,60,.45)'] : ph > 8 ? ['синий', 'rgba(50,90,220,.45)'] : ['фиолетовый', 'rgba(130,70,190,.4)'];
  if (ind === 'mo') return ph < 3.1 ? ['красный', 'rgba(220,40,50,.45)'] : ph <= 4.4 ? ['оранжевый', 'rgba(240,130,30,.45)'] : ['жёлтый', 'rgba(240,200,40,.45)'];
  if (ind === 'php') return ph < 8.2 ? ['бесцветный', null] : ph < 10 ? ['бледно-розовый', 'rgba(230,80,170,.22)'] : ['малиновый', 'rgba(210,30,140,.5)'];
}

// ---------------- Особые пары ----------------
const SPECIAL = {
  'H|OH':   { kind: 'water', net: 'H^+ + OH^- = H2O' },
  'H|CO3':  { kind: 'gas', gas: 'CO2', smell: false, net: '2H^+ + CO3^2- = CO2↑ + H2O' },
  'H|HCO3': { kind: 'gas', gas: 'CO2', smell: false, net: 'H^+ + HCO3^- = CO2↑ + H2O' },
  'H|SO3':  { kind: 'gas', gas: 'SO2', smell: true, net: '2H^+ + SO3^2- = SO2↑ + H2O' },
  'H|SiO3': { kind: 'ppt', ppt: { name: 'белый студенистый', css: '#eef1ec' }, product: 'H2SiO3', net: '2H^+ + SiO3^2- = H2SiO3↓' },
  'NH4|OH': { kind: 'gas', gas: 'NH3', smell: true, net: 'NH4^+ + OH^- = NH3↑ + H2O' },
  'Ag|OH':  { kind: 'ppt', ppt: { name: 'бурый', css: '#5b3b24' }, product: 'Ag2O', net: '2Ag^+ + 2OH^- = Ag2O↓ + H2O' },
  'Al|CO3': { kind: 'hydrolysis', ppt: WHITE, product: 'Al(OH)3', gas: 'CO2', net: '2Al^3+ + 3CO3^2- + 3H2O = 2Al(OH)3↓ + 3CO2↑' },
  'Al|HCO3':{ kind: 'hydrolysis', ppt: WHITE, product: 'Al(OH)3', gas: 'CO2', net: 'Al^3+ + 3HCO3^- = Al(OH)3↓ + 3CO2↑' },
  'Fe3|CO3':{ kind: 'hydrolysis', ppt: PPT_COLOR['Fe3|OH'], product: 'Fe(OH)3', gas: 'CO2', net: '2Fe^3+ + 3CO3^2- + 3H2O = 2Fe(OH)3↓ + 3CO2↑' },
  'Fe3|HCO3':{ kind: 'hydrolysis', ppt: PPT_COLOR['Fe3|OH'], product: 'Fe(OH)3', gas: 'CO2', net: 'Fe^3+ + 3HCO3^- = Fe(OH)3↓ + 3CO2↑' },
  'Cu|CO3': { kind: 'hydrolysis', ppt: { name: 'голубовато-зелёный', css: '#5fb3a1' }, product: '(CuOH)2CO3', gas: 'CO2', net: '2Cu^2+ + 2CO3^2- + H2O = (CuOH)2CO3↓ + CO2↑' },
  'Fe3|I':  { kind: 'redox', note: 'раствор буреет — выделяется иод (это окислительно-восстановительная реакция)', color: 'rgba(150,80,20,.5)', net: '2Fe^3+ + 2I^- = 2Fe^2+ + I2' },
  'Cu|I':   { kind: 'redox', note: 'раствор буреет, выпадает осадок (это окислительно-восстановительная реакция)', color: 'rgba(150,80,20,.5)', ppt: { name: 'белый (окрашен иодом)', css: '#e8d9c0' }, net: '2Cu^2+ + 4I^- = 2CuI↓ + I2' },
};

// Событие для пары катион|анион, либо null (ионы остаются в растворе)
function pairEvent(c, a) {
  const key = `${c}|${a}`;
  if (SPECIAL[key]) return { key, c, a, ...SPECIAL[key] };
  const v = sol(c, a);
  if (v === 'R') return null;
  if (v === '?' || v === 'X' || v === 'S') return { key, c, a, kind: 'unknown' };
  const { formula, nc, na } = compound(c, a);
  const color = PPT_COLOR[key] || WHITE;
  return {
    key, c, a, kind: 'ppt', slight: v === 'M', ppt: color, product: formula,
    amphoteric: a === 'OH' && AMPHOTERIC[c] ? AMPHOTERIC[c] : null,
    net: `${coef(nc)}${ionLabel(c, true)} + ${coef(na)}${ionLabel(a, false)} = ${formula}↓`,
  };
}

// ---------------- Смешивание ----------------
// Возвращает { events, visible, liquid, ppt, gas, smell, text, net[], molecular? , unknown }
export function mix(idA, idB, { excess = false } = {}) {
  const A = byId(idA), B = byId(idB);
  if (!A || !B || idA === idB) return null;
  if (A.indicator && B.indicator) return { visible: false, text: 'Смешивать индикаторы между собой бессмысленно', events: [], net: [] };
  if (A.indicator || B.indicator) {
    const ind = A.indicator ? A : B, sub = A.indicator ? B : A;
    const [name, css] = indicatorColor(ind.id, sub.ph);
    return {
      events: [{ kind: 'indicator' }], indicator: true, visible: css !== null || ind.id !== 'php',
      liquid: css || baseLiquid([sub]), text: `${cap(ind.name)}: ${name}. Среда ${medium(sub.ph)}.`, net: [], ph: sub.ph,
      short: name,
    };
  }
  const events = [];
  for (const [P, Q] of [[A, B], [B, A]]) {
    const [cat] = P.ions[0], [an] = Q.ions[1];
    const e = pairEvent(cat, an);
    if (e) events.push(e);
  }
  const res = { events, net: events.filter(e => e.net).map(e => e.net), liquid: baseLiquid([A, B]) };
  const ppts = events.filter(e => e.ppt);
  const gases = events.filter(e => e.gas);
  const redox = events.find(e => e.kind === 'redox');
  res.unknown = events.some(e => e.kind === 'unknown');
  res.ppt = ppts.length ? ppts[0].ppt.css : null;
  res.gas = gases.length > 0; res.smell = gases.some(e => e.smell);
  if (redox) res.liquid = redox.color;

  // Избыток щёлочи растворяет амфотерный гидроксид
  const amph = ppts.find(e => e.amphoteric);
  res.canExcess = !!amph;
  if (amph && excess) {
    res.net.push(amph.amphoteric);
    res.dissolved = true;
    if (ppts.length === 1) res.ppt = null;
  }

  const parts = [];
  for (const e of ppts) {
    if (e === amph && excess) parts.push(`${e.ppt.name} осадок ${fmtProduct(e)} выпал и растворился в избытке щёлочи`);
    else parts.push(`${e.slight ? 'выпадает ' + e.ppt.name + ' осадок (малорастворимое вещество)' : 'выпадает ' + e.ppt.name + ' осадок'}`);
  }
  for (const e of gases) parts.push(`выделяется газ ${e.smell ? 'с резким запахом' : 'без запаха'}`);
  if (redox) parts.push(redox.note);
  if (res.unknown) parts.push('взаимодействие выходит за рамки школьного курса');
  res.visible = parts.length > 0 && !(res.unknown && parts.length === 1);
  if (!parts.length) parts.push(events.some(e => e.kind === 'water') ? 'видимых изменений нет (реакция нейтрализации идёт, но признаков не видно)' : 'видимых изменений нет');
  res.text = cap(parts.join('; ')) + '.';
  res.short = shortObs(res);
  const mol = molecular(A, B, events);
  if (mol) Object.assign(res, mol);
  return res;
}

function fmtProduct(e) { return e.product ? '(`' + e.product + '`)' : ''; }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function baseLiquid(subs) {
  for (const s of subs) for (const [ion] of s.ions || []) if (SOLUTION_COLOR[ion]) return SOLUTION_COLOR[ion];
  return null;
}
// Короткая запись наблюдения — для таблицы эксперимента
export function shortObs(r) {
  if (!r) return '';
  if (r.indicator) return r.short;
  const p = [];
  const ppt = r.events.find(e => e.ppt);
  if (ppt && !(r.dissolved && r.events.filter(e => e.ppt).length === 1)) p.push(`${ppt.ppt.name} осадок`);
  if (r.gas) p.push(`газ ${r.smell ? 'с резким запахом' : 'без запаха'}`);
  if (r.events.some(e => e.kind === 'redox')) p.push('раствор буреет');
  return p.length ? cap(p.join(', ')) : 'Изменений нет';
}

// ---------------- Молекулярное и полное ионное уравнения ----------------
// Только для обычного ионного обмена (без ОВР, совместного гидролиза и неизвестных случаев).
const DECOMP = {
  'H|OH': { parts: [['H2O', 1]] },
  'H|CO3': { parts: [['CO2↑', 1], ['H2O', 1]] },
  'H|HCO3': { parts: [['CO2↑', 1], ['H2O', 1]] },
  'H|SO3': { parts: [['SO2↑', 1], ['H2O', 1]] },
  'NH4|OH': { parts: [['NH3↑', 1], ['H2O', 1]] },
  'Ag|OH': { parts: [['Ag2O↓', 0.5], ['H2O', 0.5]], even: true },
  'H|SiO3': { parts: [['H2SiO3↓', 1]] },
};
function molecular(A, B, events) {
  if (events.some(e => ['hydrolysis', 'redox', 'unknown'].includes(e.kind))) return null;
  if (!events.length) return null;
  const [cA, x] = A.ions[0], [aA, y] = A.ions[1], [cB, u] = B.ions[0], [aB, v] = B.ions[1];
  const P1 = compound(cA, aB), P2 = compound(cB, aA);
  const key1 = `${cA}|${aB}`, key2 = `${cB}|${aA}`;
  let k = null;
  for (let k1 = 1; k1 <= 12 && !k; k1++) for (let k2 = 1; k2 <= 12 && !k; k2++) {
    const k3a = k1 * x / P1.nc, k3b = k2 * v / P1.na, k4a = k2 * u / P2.nc, k4b = k1 * y / P2.na;
    if (k3a === k3b && k4a === k4b && Number.isInteger(k3a) && Number.isInteger(k4a)) {
      if (DECOMP[key1]?.even && k3a % 2) continue;
      if (DECOMP[key2]?.even && k4a % 2) continue;
      k = [k1, k2, k3a, k4a];
    }
  }
  if (!k) return null;
  const [k1, k2, k3, k4] = k;
  const ev1 = events.find(e => e.key === key1), ev2 = events.find(e => e.key === key2);
  const prod = (key, P, kk, ev) => {
    if (DECOMP[key]) return DECOMP[key].parts.map(([f, m]) => ({ f, n: kk * m, whole: true }));
    if (ev && ev.kind === 'ppt') return [{ f: P.formula + '↓', n: kk, whole: true }];
    return [{ f: P.formula, n: kk, whole: false, ions: [[key.split('|')[0], P.nc, true], [key.split('|')[1], P.na, false]] }];
  };
  const prods = [...prod(key1, P1, k3, ev1), ...prod(key2, P2, k4, ev2)];
  // Объединить одинаковые (например, H2O из двух мест)
  let merged = [];
  for (const p of prods) { const m = merged.find(q => q.f === p.f); if (m) m.n += p.n; else merged.push({ ...p }); }
  const rank = p => p.f.endsWith('↓') ? 0 : !p.whole ? 1 : p.f.endsWith('↑') ? 2 : 3;
  merged = merged.sort((a, b) => rank(a) - rank(b));
  const molecularEq = `${coef(k1)}${A.f} + ${coef(k2)}${B.f} = ${merged.map(p => coef(p.n) + p.f).join(' + ')}`;

  // Полное ионное
  const left = [[cA, k1 * x, true], [aA, k1 * y, false], [cB, k2 * u, true], [aB, k2 * v, false]];
  const right = [];
  for (const p of merged) {
    if (p.whole) right.push({ txt: coef(p.n) + p.f });
    else for (const [ion, n, isCat] of p.ions) right.push({ ion, n: n * p.n, isCat });
  }
  const ionTxt = (ion, n, isCat) => coef(n) + ionLabel(ion, isCat);
  const fullEq = left.map(([i, n, c]) => ionTxt(i, n, c)).join(' + ') + ' = ' +
    right.map(r => r.txt || ionTxt(r.ion, r.n, r.isCat)).join(' + ');

  // Сокращённое: убрать ионы-зрители
  const spect = new Set(right.filter(r => r.ion).map(r => r.ion + (r.isCat ? '+' : '-')));
  const l2 = left.filter(([i, , c]) => !spect.has(i + (c ? '+' : '-'))).sort((p, q) => (q[2] ? 1 : 0) - (p[2] ? 1 : 0));
  const r2 = right.filter(r => !r.ion);
  const nums = [...l2.map(l => l[1]), ...r2.map(r => parseInt(r.txt) || 1)];
  const g = nums.reduce((a, b) => gcd(a, b));
  const shortEq = l2.map(([i, n, c]) => ionTxt(i, n / g, c)).join(' + ') + ' = ' +
    r2.map(r => { const n = parseInt(r.txt) || 1; return coef(n / g) + r.txt.replace(/^\d+/, ''); }).join(' + ');
  return { molecularEq, fullEq, shortEq, spectators: [...spect] };
}

// ---------------- Генератор задания «распознай вещества» ----------------
// Две склянки + три реактива: два нужных, один лишний.
const EXP_FLASKS = ['HCl', 'H2SO4', 'NaOH', 'KOH', 'NaCl', 'KBr', 'KI', 'Na2SO4', 'K2SO4', 'Na2CO3', 'K2CO3', 'Na3PO4', 'NH4Cl', 'NH42SO4',
  'BaCl2', 'BaNO32', 'CaCl2', 'MgCl2', 'MgSO4', 'AlCl3', 'ZnSO4', 'CuSO4', 'CuCl2', 'FeSO4', 'FeCl3', 'LiCl', 'NaNO3', 'KNO3'];
const EXP_REAGENTS = ['HCl', 'H2SO4', 'NaOH', 'KOH', 'BaCl2', 'BaNO32', 'AgNO3', 'Na2CO3', 'K2CO3', 'Na3PO4', 'Na2SO4', 'NaNO3', 'KNO3', 'NaCl', 'CaCl2', 'FeCl3', 'CuSO4'];

// Для генератора — только «школьные» качественные реакции
const TYPICAL = new Set(['Ag|Cl', 'Ag|Br', 'Ag|I', 'Ag|PO4', 'Ba|SO4', 'Ba|CO3', 'Ca|CO3', 'Ca|PO4', 'Ba|PO4', 'Li|PO4',
  'H|CO3', 'H|SO3', 'H|SiO3', 'NH4|OH', 'Cu|OH', 'Fe2|OH', 'Fe3|OH', 'Mg|OH', 'Al|OH', 'Zn|OH', 'H|OH']);
function ok(r) { return r && !r.unknown && r.events.every(e => TYPICAL.has(e.key) && !e.slight); }
const sameIon = (a, b) => byId(a).ions.some(([i]) => byId(b).ions.some(([j]) => i === j));

export function makeExperiment(rand = Math.random) {
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  for (let tries = 0; tries < 4000; tries++) {
    const f1 = pick(EXP_FLASKS), f2 = pick(EXP_FLASKS);
    if (f1 === f2 || sameIon(f1, f2) && byId(f1).ions[0][0] === byId(f2).ions[0][0] && byId(f1).ions[1][0] === byId(f2).ions[1][0]) continue;
    const rs = EXP_REAGENTS.filter(r => r !== f1 && r !== f2);
    const r1 = pick(rs), r2 = pick(rs), r3 = pick(rs);
    if (new Set([r1, r2, r3]).size < 3) continue;
    const m = (a, b) => mix(a, b);
    const t = [[m(f1, r1), m(f2, r1)], [m(f1, r2), m(f2, r2)], [m(f1, r3), m(f2, r3)]];
    if (!t.flat().every(ok)) continue;
    const vis = t.map(p => p.map(r => r.visible));
    if (!(vis[0][0] && !vis[0][1] && !vis[1][0] && vis[1][1] && !vis[2][0] && !vis[2][1])) continue;
    // не тривиально: склянки не должны отличаться цветом раствора
    if (baseLiquid([byId(f1)]) || baseLiquid([byId(f2)])) { if (rand() < 0.7) continue; }
    const reagents = [r1, r2, r3].sort(() => rand() - 0.5);
    const flip = rand() < 0.5;
    return { flasks: flip ? [f2, f1] : [f1, f2], reagents, needed: { [f1]: r1, [f2]: r2 }, dummy: r3 };
  }
  return null;
}

export const PICK_GROUPS = ['Кислоты', 'Щёлочи', 'Соли', 'Индикаторы'];
export const allPickable = () => [...SUBSTANCES, ...INDICATORS];
