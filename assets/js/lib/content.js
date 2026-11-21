// Загрузка контента: content/manifest.json → список модулей → content/modules/<id>.json
let cache = null;

export async function loadContent() {
  if (cache) return cache;
  const manifest = await fetch('content/manifest.json', { cache: 'no-cache' }).then(r => r.json());
  const modules = await Promise.all(manifest.modules.map(id =>
    fetch(`content/modules/${id}.json`, { cache: 'no-cache' }).then(r => r.json()).then(m => normalize({ ...m, id: m.id || id }))
      .catch(e => { console.error('Модуль не загрузился:', id, e); return null; })));
  cache = { manifest, modules: modules.filter(Boolean) };
  return cache;
}

function normalize(m) {
  m.skills = m.skills || [];
  m.cheatsheet = m.cheatsheet || [];
  m.examples = m.examples || [];
  m.lessons = m.lessons || [];
  m.questions = (m.questions || []).map((q, i) => ({ ...q, id: q.id || `${m.id}-q${i + 1}`, module: m.id, points: q.points || 1 }));
  m.cards = (m.cards || []).map((c, i) => ({ ...c, id: c.id || `${m.id}-c${i + 1}`, module: m.id }));
  return m;
}

export function skillTitle(content, moduleId, skillId) {
  const m = content.modules.find(x => x.id === moduleId);
  return m?.skills.find(s => s.id === skillId)?.title || skillId || '—';
}

export function allQuestions(content) { return content.modules.flatMap(m => m.questions); }
export function allCards(content) { return content.modules.flatMap(m => m.cards); }
