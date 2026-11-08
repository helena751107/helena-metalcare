/* HELENA METALCARE — Web MCP adapter
 *
 * 목적: 이 랜딩 페이지를 에이전트가 "읽고, 열고, 짚고, 안내할 수 있는" 도구 표면으로 만든다.
 *       공통 계약(page.describe/targets/act/state)은 mcp/webmcp.js 가 담당하고,
 *       여기서는 이 사이트에만 있는 12개 care.* 도구와 도구 패널 UI 를 얹는다.
 *
 * 안전: 이 사이트는 의료 진단·자문이 아니다. 도구 설명과 status 에 그 경계를 같이 내보낸다.
 *       응급 상황은 119 · 112 · 지역 정신건강 위기상담.
 */
import { installWebMCP } from './webmcp.js';

const VERSION = '1.0';
const THEME_KEY = 'helena-psycare-wz-theme';
const NOTE = 'Not medical advice. In an emergency: 119 · 112 · local mental-health crisis line.';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let API = null;
let spotted = null;
let spotTimer = 0;

/* ---------- section helpers ---------- */
const allSections = () => [$('#cover'), ...$$('section.chapter')].filter(Boolean);

function metaOf(sec) {
  if (!sec) return null;
  const num = norm(sec.querySelector('.ch-label .num')?.textContent || '') || null;
  const label = norm(sec.querySelector('.ch-label')?.textContent || '').replace(num || '', '').trim()
    || (sec.id === 'cover' ? 'Cover' : sec.id);
  const title = norm(sec.querySelector('.ch-title')?.textContent || sec.querySelector('h1')?.textContent || '');
  const chapter = sec.classList.contains('chapter');
  const open = chapter ? sec.querySelector('.acc-head')?.getAttribute('aria-expanded') === 'true' : true;
  return { id: sec.id, num, label, title, chapter, open };
}

function resolveSection(q) {
  const list = allSections();
  if (q == null || q === '') return null;
  const s = String(q).trim();
  const idq = s.replace(/^#/, '').toLowerCase();
  const metas = list.map(metaOf);
  return list.find((el) => el.id.toLowerCase() === idq) ||
    list.find((el, i) => metas[i].num === s) ||
    list.find((el, i) => (metas[i].label + ' ' + metas[i].title).toLowerCase().includes(idq)) ||
    (/^\d+$/.test(s) ? list[+s] : null) || null;
}

function sections() {
  return allSections().map((sec) => {
    const m = metaOf(sec);
    const r = sec.getBoundingClientRect();
    return { ...m, top: Math.round(r.top + scrollY) };
  });
}

function openSection(sec) {
  if (!sec) return null;
  if (sec.id !== 'cover' && sec.classList.contains('chapter')) {
    const head = sec.querySelector('.acc-head');
    if (head && head.getAttribute('aria-expanded') !== 'true') head.click();
  } else {
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return metaOf(sec);
}

function closeSection(sec) {
  const head = sec?.querySelector?.('.acc-head');
  if (head && head.getAttribute('aria-expanded') === 'true') head.click();
}

function currentSection() {
  let id = 'cover';
  for (const sec of allSections()) {
    if (sec.getBoundingClientRect().top < innerHeight * 0.35) id = sec.id;
  }
  return id;
}

function blockText(root) {
  const out = [];
  $$('h1,h2,h3,p,li,.lv,.cap,.ch-deck', root).forEach((el) => {
    if (el.closest('.acc-head')) return;
    if (el.tagName === 'LI' && el.querySelector('li')) return;
    const t = norm(el.textContent);
    if (t && !out.includes(t)) out.push(t);
  });
  return out.join('\n');
}

/* ---------- tools ---------- */
const TOOLS = {};

TOOLS['care.status'] = {
  description: 'Where the reader is: current section, theme, open chapters, reading progress, transport. Start here.',
  inputSchema: { type: 'object', properties: {} },
  execute: () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return {
      site: 'helena-metalcare',
      version: VERSION,
      url: location.href,
      title: document.title,
      theme: document.documentElement.getAttribute('data-theme') || 'dark',
      section: currentSection(),
      progress: max > 0 ? Math.round((scrollY / max) * 100) : 0,
      chapters: sections().filter((s) => s.chapter).map((s) => ({ id: s.id, open: s.open })),
      methodStep: $$('.m-step').findIndex((el) => el.classList.contains('active')),
      transport: API?.registered || 'none',
      tools: Object.keys(API?.tools || {}).length,
      note: NOTE
    };
  }
};

TOOLS['care.sections'] = {
  description: 'The seven chapters plus the cover: id, number, label, title, whether the accordion is open.',
  inputSchema: { type: 'object', properties: {} },
  execute: () => sections()
};

TOOLS['care.open'] = {
  description: 'Open a chapter (accordion) and scroll to it. Accepts id ("method"), number ("03"), or words ("levels").',
  inputSchema: { type: 'object', properties: { section: { type: 'string', description: 'method | map | 03 | levels …' } }, required: ['section'] },
  execute: ({ section }) => {
    const sec = resolveSection(section);
    if (!sec) throw new Error(`section not found: ${section} (try ${allSections().map((s) => s.id).join(', ')})`);
    return { opened: openSection(sec) };
  }
};

TOOLS['care.close'] = {
  description: 'Collapse one chapter, or every open chapter with {all:true}. Keeps the page quiet.',
  inputSchema: { type: 'object', properties: { section: { type: 'string' }, all: { type: 'boolean' } } },
  execute: ({ section, all } = {}) => {
    const closed = [];
    if (all || section == null) {
      allSections().forEach((sec) => {
        if (sec.classList.contains('chapter') && metaOf(sec).open) { closeSection(sec); closed.push(sec.id); }
      });
    } else {
      const sec = resolveSection(section);
      if (!sec) throw new Error('section not found: ' + section);
      closeSection(sec);
      closed.push(sec.id);
    }
    return { closed };
  }
};

TOOLS['care.theme'] = {
  description: 'Switch paper: dark (default) or light, or toggle. Same setting the Theme button writes.',
  inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['toggle', 'dark', 'light'] } } },
  execute: ({ mode = 'toggle' } = {}) => {
    const root = document.documentElement;
    const cur = root.getAttribute('data-theme') || 'dark';
    const next = mode === 'toggle' ? (cur === 'dark' ? 'light' : 'dark') : mode;
    if (!['dark', 'light'].includes(next)) throw new Error('mode must be toggle | dark | light');
    if (next !== cur) {
      const btn = $('#themeBtn');
      if (btn) btn.click(); else root.setAttribute('data-theme', next);
    }
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    return { theme: root.getAttribute('data-theme') || next };
  }
};

TOOLS['care.method'] = {
  description: 'The 5-step care loop. Without step: the current step and all five. With step 0–4: select it and read the panel.',
  inputSchema: { type: 'object', properties: { step: { type: 'number', minimum: 0, maximum: 4 } } },
  execute: async ({ step } = {}) => {
    const steps = $$('.m-step');
    if (!steps.length) throw new Error('method steps not found');
    const read = (i) => ({
      step: i,
      title: norm($('#methodPanel h3')?.textContent || ''),
      body: norm($('#methodPanel p')?.textContent || '')
    });
    if (step == null) {
      const active = steps.findIndex((el) => el.classList.contains('active'));
      return {
        active,
        steps: steps.map((el) => ({
          step: +el.dataset.m,
          n: norm(el.querySelector('.n')?.textContent || ''),
          en: norm(el.querySelector('.en')?.textContent || ''),
          ko: norm(el.querySelector('.ko')?.textContent || ''),
          d: norm(el.querySelector('.d')?.textContent || ''),
          active: el.classList.contains('active')
        })),
        panel: active >= 0 ? read(active) : null
      };
    }
    const i = Number(step);
    if (!Number.isInteger(i) || !steps[i]) throw new Error('step must be 0–4');
    steps[i].click();
    await wait(40);
    return read(i);
  }
};

TOOLS['care.levels'] = {
  description: 'The three household care levels (L0 steady · L1 strain · L2 crisis) with their actions, verbatim.',
  inputSchema: { type: 'object', properties: {} },
  execute: () => $$('.tier-card').map((card) => ({
    level: norm(card.querySelector('.lv')?.textContent || ''),
    title: norm(card.querySelector('h3')?.textContent || ''),
    summary: norm(card.querySelector('p')?.textContent || ''),
    actions: $$('li', card).map((li) => norm(li.textContent)),
    tone: card.style.getPropertyValue('--tc') || null
  })).concat([{ note: NOTE }])
};

TOOLS['care.map'] = {
  description: 'The safety-net map nodes (Home · Mind · Clinic · MetalCare · Admin Log · Care Daemon · Community) and their tooltips.',
  inputSchema: { type: 'object', properties: {} },
  execute: () => $$('.svg-arch .node').map((node) => {
    const [title, body] = (node.dataset.tip || '|').split('|');
    return { title: norm(title), body: norm(body), active: node.classList.contains('active') };
  })
};

TOOLS['care.search'] = {
  description: 'Search the webzine text. Returns section, element and a snippet. {open:true} opens the chapter of the first hit.',
  inputSchema: {
    type: 'object',
    properties: {
      q: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 30 },
      open: { type: 'boolean' }
    },
    required: ['q']
  },
  execute: ({ q, limit = 8, open = false } = {}) => {
    const needle = norm(q).toLowerCase();
    if (needle.length < 2) throw new Error('q must be at least 2 characters');
    const seen = new Set();
    const hits = [];
    allSections().some((sec) => {
      const meta = metaOf(sec);
      $$('h1,h2,h3,p,li,.lv,.cap,.ch-deck', sec).some((el) => {
        if (el.closest('.acc-head')) return false;
        if (el.tagName === 'LI' && el.querySelector('li')) return false;
        const t = norm(el.textContent);
        if (t.length < 4 || !t.toLowerCase().includes(needle) || seen.has(t)) return false;
        seen.add(t);
        hits.push({
          section: meta.id,
          where: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''),
          text: t.slice(0, 240),
          _el: el
        });
        return hits.length >= limit;
      });
      return hits.length >= limit;
    });
    let opened = null;
    if (open && hits.length) {
      const sec = document.getElementById(hits[0].section);
      if (sec && sec.classList.contains('chapter')) { openSection(sec); opened = sec.id; }
      spotElement(hits[0]._el, 1800);
    }
    return { q, hits: hits.slice(0, limit).map(({ _el, ...h }) => h), opened, more: hits.length >= limit };
  }
};

TOOLS['care.read'] = {
  description: 'Plain text of a chapter, in reading order. For summarizing without scraping the DOM.',
  inputSchema: {
    type: 'object',
    properties: { section: { type: 'string' }, max: { type: 'number', minimum: 200, maximum: 8000 } },
    required: ['section']
  },
  execute: ({ section, max = 1600 } = {}) => {
    const sec = resolveSection(section);
    if (!sec) throw new Error('section not found: ' + section);
    const full = blockText(sec);
    return {
      section: sec.id,
      title: metaOf(sec).title,
      chars: full.length,
      truncated: full.length > max,
      text: full.slice(0, max)
    };
  }
};

TOOLS['care.docs'] = {
  description: 'The documents and sibling sites this webzine points to: docs bridge, README, Admin Log, S21 hub, Discord, repo.',
  inputSchema: { type: 'object', properties: {} },
  execute: () => {
    const seen = new Set();
    const local = [], ecosystem = [];
    $$('a[href]').forEach((a) => {
      const raw = a.getAttribute('href');
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) return;
      const u = new URL(raw, location.href);
      if (seen.has(u.href)) return;
      seen.add(u.href);
      const item = { title: norm(a.textContent) || u.pathname, href: u.href };
      if (u.origin === location.origin) local.push(item);
      else ecosystem.push(item);
    });
    const known = [
      { title: 'Docs bridge', href: new URL('pages/', location.href).href },
      { title: 'README (HTML)', href: new URL('README.html', location.href).href },
      { title: 'CLAUDE (HTML)', href: new URL('CLAUDE.html', location.href).href },
      { title: 'llms.txt', href: new URL('llms.txt', location.href).href },
      { title: 'sitemap.xml', href: new URL('sitemap.xml', location.href).href }
    ];
    const have = new Set(local.map((d) => d.href));
    const docs = local.concat(known.filter((k) => !have.has(k.href)));
    return {
      docs,
      ecosystem,
      repo: 'https://github.com/helena751107/helena-metalcare',
      live: 'https://helena751107.github.io/helena-metalcare/'
    };
  }
};

TOOLS['care.spot'] = {
  description: 'Point at something: scroll it to the center and ring it in gold for a moment. Selector (#method) or words ("5-Step").',
  inputSchema: {
    type: 'object',
    properties: { target: { type: 'string' }, ms: { type: 'number', minimum: 400, maximum: 6000 } },
    required: ['target']
  },
  execute: ({ target, ms = 1800 } = {}) => {
    let el = null;
    const s = String(target || '');
    if (/^[#.[]/.test(s)) el = document.querySelector(s);
    if (!el && /^[#.[]/.test(s)) el = resolveSection(s);
    if (!el) el = API?.find(s) || null;
    if (!el) el = resolveSection(s);
    if (!el) throw new Error('target not found: ' + target);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    spotElement(el, ms);
    return { target: el.dataset.mcpId || el.id || el.className || el.tagName, text: norm(el.textContent).slice(0, 90), ms };
  }
};

function spotElement(el, ms) {
  if (!el) return;
  el.classList.add('wmcp-spot');
  clearTimeout(spotTimer);
  spotted = el;
  spotTimer = setTimeout(() => { el.classList.remove('wmcp-spot'); if (spotted === el) spotted = null; }, Math.max(400, Math.min(6000, +ms || 1600)));
}

/* ---------- install ---------- */
API = installWebMCP({
  name: 'helena-metalcare',
  description: 'Helena MetalCare — a care webzine for getting to know a sister\'s schizophrenia. Read chapters, open the care loop, check levels, point at the safety map. ' + NOTE,
  tools: TOOLS,
  state: () => API?.tools['care.status'].execute()
});

window.helenaMCP = API;

/* ---------- dock UI ---------- */
const EXAMPLES = {
  'page.act': { ops: [{ scroll: '#method' }, { wait: 500 }, { click: 'Method' }] },
  'care.open': { section: 'method' },
  'care.close': { all: true },
  'care.search': { q: 'sleep', limit: 6 },
  'care.read': { section: 'method', max: 1200 },
  'care.spot': { target: '#method', ms: 1800 },
  'care.method': { step: 2 },
  'care.theme': { mode: 'toggle' }
};

function exampleFor(tool) {
  const props = tool.inputSchema?.properties || {};
  const keys = Object.keys(props);
  if (!keys.length) return {};
  if (EXAMPLES[tool.name]) return EXAMPLES[tool.name];
  const out = {};
  keys.forEach((k) => {
    if (k === 'section') out[k] = 'method';
    else if (k === 'q') out[k] = 'sleep';
    else if (k === 'step') out[k] = 0;
    else if (k === 'mode') out[k] = 'toggle';
    else if (k === 'target') out[k] = '#method';
    else if (k === 'ms') out[k] = 1800;
    else if (k === 'limit') out[k] = 6;
    else if (k === 'max') out[k] = 1200;
    else if (k === 'open') out[k] = false;
    else if (k === 'all') out[k] = true;
  });
  return out;
}

function buildDock() {
  if ($('.wmcp')) return;

  const seal = document.createElement('button');
  seal.type = 'button';
  seal.className = 'wmcp-seal';
  seal.setAttribute('aria-expanded', 'false');
  seal.setAttribute('aria-controls', 'wmcp-panel');
  seal.setAttribute('aria-label', 'Open Web MCP tools');
  seal.title = 'Web MCP — the page as tools (Esc closes)';
  seal.innerHTML = '<span class="wmcp-dot" aria-hidden="true"></span><span class="wmcp-seal-t">MCP</span>';

  const panel = document.createElement('section');
  panel.className = 'wmcp-panel';
  panel.id = 'wmcp-panel';
  panel.dataset.open = 'false';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Web MCP tools');
  panel.innerHTML = `
    <header class="wmcp-head">
      <div class="wmcp-kick"><i aria-hidden="true"></i><span>Web MCP</span><span class="wmcp-chip" data-transport>bridge</span></div>
      <h2 class="wmcp-title">MetalCare <em>Tools</em></h2>
      <p class="wmcp-sub">The page, made operable. <span data-toolcount>16</span> tools · <code>window.__webmcp</code></p>
      <button type="button" class="wmcp-x" aria-label="Close">✕</button>
    </header>
    <div class="wmcp-tabs" role="tablist">
      <button type="button" class="wmcp-tab" role="tab" data-tab="tools" aria-selected="true">Tools</button>
      <button type="button" class="wmcp-tab" role="tab" data-tab="run" aria-selected="false">Run</button>
      <button type="button" class="wmcp-tab" role="tab" data-tab="state" aria-selected="false">State</button>
    </div>
    <div class="wmcp-body">
      <div class="wmcp-tabpanel" data-panel="tools" data-on="true"></div>
      <div class="wmcp-tabpanel" data-panel="run" data-on="false">
        <label class="wmcp-label" for="wmcp-tool">Tool</label>
        <select class="wmcp-select" id="wmcp-tool"></select>
        <p class="wmcp-hint" data-hint></p>
        <label class="wmcp-label" for="wmcp-input">Input · JSON</label>
        <textarea class="wmcp-input" id="wmcp-input" rows="6" spellcheck="false"></textarea>
        <button type="button" class="wmcp-run" data-run>Run tool <span class="wmcp-key">⌘↵</span></button>
        <div class="wmcp-meta"><span data-status>ready</span><span data-dur></span></div>
        <pre class="wmcp-out" data-out>Pick a tool, edit the JSON, run.</pre>
      </div>
      <div class="wmcp-tabpanel" data-panel="state" data-on="false">
        <div class="wmcp-chips">
          <span class="wmcp-chip" data-chip="transport">bridge</span>
          <span class="wmcp-chip" data-chip="theme">dark</span>
          <span class="wmcp-chip" data-chip="section">cover</span>
        </div>
        <pre class="wmcp-out wmcp-state" data-state>reading…</pre>
        <p class="wmcp-hint">Live, every 1.2s while this tab is open. Same object an agent gets from <code>care.status</code>.</p>
      </div>
    </div>
    <footer class="wmcp-foot"><span>window.__webmcp · navigator.modelContext</span><span>v${VERSION}</span></footer>`;

  const wrap = document.createElement('div');
  wrap.className = 'wmcp';
  wrap.append(seal, panel);
  document.body.appendChild(wrap);

  const q = (s) => panel.querySelector(s);
  const transport = API.registered || 'none';
  $('[data-transport]', panel).textContent = transport === 'none' ? 'bridge' : transport;
  $('[data-chip="transport"]', panel).textContent = transport === 'none' ? 'window bridge' : transport;
  $('[data-toolcount]', panel).textContent = Object.keys(API.tools).length;

  /* tool list */
  const groups = { care: [], page: [] };
  API.listTools().forEach((t) => {
    const g = t.name.split('.')[0];
    (groups[g] || (groups[g] = [])).push(t);
  });
  const list = $('[data-panel="tools"]');
  const order = ['care', 'page'];
  order.concat(Object.keys(groups).filter((k) => !order.includes(k))).forEach((g) => {
    if (!groups[g]?.length) return;
    const h = document.createElement('p');
    h.className = 'wmcp-group';
    h.textContent = g === 'care' ? `Care · this webzine (${groups[g].length})` : `Page · universal (${groups[g].length})`;
    list.appendChild(h);
    groups[g].forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wmcp-tool';
      b.dataset.tool = t.name;
      b.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span class="nm">${t.name}</span><span class="ds">${t.description}</span><span class="go" aria-hidden="true">→</span>`;
      b.addEventListener('click', () => {
        tab('run');
        selectTool(t.name);
        q('#wmcp-input').focus();
      });
      list.appendChild(b);
    });
  });

  /* tabs */
  const tabs = [...panel.querySelectorAll('.wmcp-tab')];
  function tab(name) {
    tabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    panel.querySelectorAll('.wmcp-tabpanel').forEach((p) => { p.dataset.on = String(p.dataset.panel === name); });
    if (name === 'state') { tickState(); startState(); } else stopState();
  }
  tabs.forEach((b) => b.addEventListener('click', () => tab(b.dataset.tab)));

  /* run */
  const sel = q('#wmcp-tool');
  API.listTools().forEach((t) => {
    const o = document.createElement('option');
    o.value = t.name;
    o.textContent = t.name;
    sel.appendChild(o);
  });

  function selectTool(name) {
    sel.value = name;
    const t = API.tools[name];
    q('[data-hint]').textContent = t?.description || '';
    q('#wmcp-input').value = JSON.stringify(exampleFor(t || {}), null, 2);
    q('[data-out]').textContent = 'Ready. ' + (t ? 'Run to see the result.' : '');
    q('[data-out]').classList.remove('err');
    q('[data-dur]').textContent = '';
  }
  sel.addEventListener('change', () => selectTool(sel.value));
  selectTool('care.status');

  async function run() {
    const name = sel.value;
    const t = API.tools[name];
    const out = q('[data-out]');
    const status = q('[data-status]');
    let input = {};
    try { input = q('#wmcp-input').value.trim() ? JSON.parse(q('#wmcp-input').value) : {}; }
    catch (e) { out.textContent = 'Invalid JSON — ' + e.message; out.classList.add('err'); status.textContent = 'input error'; return; }
    const t0 = performance.now();
    status.textContent = 'running…';
    try {
      const r = await t.execute(input);
      const dur = Math.round(performance.now() - t0);
      let body = JSON.stringify(r, null, 2);
      if (body.length > 14000) body = body.slice(0, 14000) + '\n… truncated in UI';
      out.textContent = body;
      out.classList.remove('err');
      status.textContent = 'ok';
      q('[data-dur]').textContent = dur + ' ms';
      tickState();
    } catch (e) {
      out.textContent = e.message;
      out.classList.add('err');
      status.textContent = 'error';
      q('[data-dur]').textContent = Math.round(performance.now() - t0) + ' ms';
    }
  }
  q('[data-run]').addEventListener('click', run);
  q('#wmcp-input').addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  });

  /* state */
  let stateTimer = 0;
  async function tickState() {
    try {
      const s = await API.tools['care.status'].execute();
      q('[data-state]').textContent = JSON.stringify(s, null, 2);
      q('[data-chip="theme"]').textContent = s.theme;
      q('[data-chip="section"]').textContent = s.section;
    } catch (e) { q('[data-state]').textContent = 'state error: ' + e.message; }
  }
  function startState() { stopState(); stateTimer = setInterval(tickState, 1200); tickState(); }
  function stopState() { clearInterval(stateTimer); }

  /* open / close */
  function setOpen(open) {
    seal.setAttribute('aria-expanded', String(open));
    panel.dataset.open = String(open);
    panel.setAttribute('aria-hidden', String(!open));
    if (open) { tickState(); } else { stopState(); }
  }
  seal.addEventListener('click', () => setOpen(panel.dataset.open !== 'true'));
  q('.wmcp-x').addEventListener('click', () => { setOpen(false); seal.focus(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.dataset.open === 'true') { setOpen(false); seal.focus(); }
  });

  if (location.hash === '#mcp') setTimeout(() => setOpen(true), 300);
  addEventListener('hashchange', () => { if (location.hash === '#mcp') setOpen(true); });
}

buildDock();
