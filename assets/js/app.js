// Маршрутизатор. Адрес: #вид или #вид-аргумент (например #module-ions, #practice-all).
// Новый вид = файл assets/js/views/<вид>.js с export function render(root, arg, ctx).
import { loadContent } from './lib/content.js';
import { h } from './lib/ui.js';
import { store } from './lib/store.js';
import { sync } from './lib/sync.js';
import { refreshTop } from './lib/game.js';

const VIEWS = ['home', 'module', 'lesson', 'practice', 'review', 'cards', 'blitz', 'lab', 'exp', 'cheats', 'board', 'progress'];
const app = document.getElementById('app');
// append без «null»: виды могут передавать необязательные элементы
const nativeAppend = app.append.bind(app);
app.append = (...n) => nativeAppend(...n.filter(x => x != null && x !== false));
let cleanup = null;

// Персональная ссылка: ?s=Имя — имя ученика для отчётов
try {
  const q = new URLSearchParams(location.search);
  if (q.get('s')) { store.setting('name', q.get('s').trim().slice(0, 80)); history.replaceState(null, '', location.pathname + location.hash); }
} catch {}

// Тема
const themeKey = 'chem-oge-theme';
function applyTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem(themeKey, t); } catch {} }
let theme; try { theme = localStorage.getItem(themeKey); } catch {}
applyTheme(theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
document.getElementById('themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

function parse() {
  const raw = decodeURIComponent(location.hash.slice(1)) || 'home';
  const i = raw.indexOf('-');
  const view = i < 0 ? raw : raw.slice(0, i);
  const arg = i < 0 ? '' : raw.slice(i + 1);
  return VIEWS.includes(view) ? { view, arg } : { view: 'home', arg: '' };
}

let syncReady = false;
async function route() {
  const { view, arg } = parse();
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  if (typeof cleanup === 'function') { try { cleanup(); } catch {} }
  cleanup = null;
  document.body.classList.remove('in-session');
  refreshTop();
  try {
    const content = await loadContent();
    if (!syncReady) { syncReady = true; sync.init(content.manifest.reportUrl, () => store.setting('name')); store.onRecord(ev => {
      const m = content.modules.find(x => x.id === ev.module);
      sync.push({ ...ev, moduleName: m ? m.title : (ev.module === 'lab' ? 'Практика' : ev.module), skillName: m?.skills.find(x => x.id === ev.skill)?.title || (ev.skill === 'experiment' ? 'Распознавание веществ' : ev.skill) });
    }); }
    const mod = await import(`./views/${view}.js`);
    app.replaceChildren();
    cleanup = await mod.render(app, arg, { content, go: hash => { location.hash = hash; } });
    document.title = (content.manifest.title || 'Химия · ОГЭ');
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    app.replaceChildren(h('div', { class: 'card' },
      h('h3', {}, 'Не удалось загрузить страницу'),
      h('p', { class: 'muted small' }, 'Откройте сайт через веб-сервер (GitHub Pages или python -m http.server), а не как файл.'),
      h('pre', { class: 'small muted' }, String(e && e.message || e))));
  }
}

addEventListener('hashchange', route);
route();

// PWA: офлайн-режим и установка на телефон
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
