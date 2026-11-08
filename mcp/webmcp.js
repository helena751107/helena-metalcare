/* WEBMCP — 모든 랜딩 페이지를 에이전트가 조작할 수 있는 도구 표면으로.
 *
 * 무엇: 페이지마다 다시 만들지 않는다. 이 파일 하나를 넣으면
 *       (1) 표준 4도구(page.describe / page.targets / page.act / page.state)가 자동 등록되고
 *       (2) 페이지 고유 도구를 adapter 로 얹는다.
 *
 * 왜: 튜토리얼 MCP·에이전트가 페이지를 "찍는" 방식이 페이지마다 달라지면 안 된다.
 *     대본 DSL(move/click/type/spot/callout/cam)과 같은 어휘를 쓴다.
 *
 * 등록: navigator.modelContext.registerTool (Chrome WebMCP) 가 있으면 등록,
 *       없으면 window.__webmcp 로 동일 계약을 노출 (헤드리스 Playwright·MCP 브리지용).
 *
 * 사용
 *   import { installWebMCP } from './runtime/webmcp.js';
 *   installWebMCP({ name: 'lfai-webgl', description: '...', tools: { 'graph.camera': {...} },
 *                   state: () => ({ ... }), snapshot: () => 'data:image/png;base64,...' });
 */
const VERSION = '1.0';

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

function isVisible(el) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const st = getComputedStyle(el);
  return st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0';
}

function labelOf(el) {
  const cls = typeof el.className === 'string' ? el.className : '';
  return norm(el.getAttribute('aria-label') || el.getAttribute('title') || el.dataset.mcpName ||
    el.innerText || el.value || el.getAttribute('placeholder') || el.id || cls).slice(0, 80);
}

/* 페이지의 조작 가능한 대상 목록 — id 는 안정적이도록 data-mcp-id 를 박아 둔다 */
function targets(root = document) {
  const sel = 'button, a[href], input, select, textarea, [role="button"], [data-mcp]';
  return [...root.querySelectorAll(sel)].filter(isVisible).slice(0, 300).map((el, i) => {
    if (!el.dataset.mcpId) el.dataset.mcpId = (el.id ? 'id:' + el.id : 'i:' + i);
    return {
      id: el.dataset.mcpId,
      tag: el.tagName.toLowerCase(),
      text: labelOf(el),
      type: el.getAttribute('type') || null,
      href: el.getAttribute('href') || null,
      disabled: !!el.disabled,
      box: (() => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })()
    };
  });
}

function findTarget(q) {
  if (q == null) throw new Error('대상 없음: selector/text/index 중 하나 필요');
  if (typeof q === 'number') return document.querySelectorAll('[data-mcp-id]')[q] || null;
  if (typeof q === 'object') {
    const all = [...document.querySelectorAll(q.sel || '[data-mcp-id]')];
    const has = norm(q.has || '');
    return all.find((el) => !has || norm(el.innerText).includes(has)) || null;
  }
  const s = String(q);
  if (s.startsWith('#') || s.startsWith('.') || s.startsWith('[')) return document.querySelector(s);
  const byAttr = [...document.querySelectorAll('[data-mcp-id]')].find((el) => el.dataset.mcpId === s);
  if (byAttr) return byAttr;
  return [...document.querySelectorAll('[data-mcp-id]')].find((el) => norm(el.innerText) === s) ||
    [...document.querySelectorAll('[data-mcp-id]')].find((el) => norm(el.innerText).includes(s)) || null;
}

/* 대본 DSL 과 같은 어휘: click · type · scroll · focus · key · js */
async function act(ops) {
  const list = Array.isArray(ops) ? ops : [ops];
  const done = [];
  for (const op of list) {
    if (!op || typeof op !== 'object') continue;
    if (op.js) { done.push({ js: String(op.js).slice(0, 60), value: await (0, eval)(op.js) }); continue; }
    if (op.click !== undefined) {
      const el = findTarget(op.click);
      if (!el) throw new Error('click 대상 없음: ' + JSON.stringify(op.click));
      el.scrollIntoView({ block: 'center' });
      el.click();
      done.push({ click: el.dataset.mcpId, text: labelOf(el) });
      await new Promise((r) => setTimeout(r, op.ms || 120));
      continue;
    }
    if (op.type !== undefined) {
      const el = findTarget(op.type.at !== undefined ? op.type.at : op.at);
      if (!el) throw new Error('type 대상 없음');
      el.focus();
      el.value = '';
      const text = String(op.type.text ?? op.text ?? '');
      for (const ch of text) {
        el.value += ch;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 1000 / (op.type.cps || 20)));
      }
      done.push({ type: text, into: el.dataset.mcpId });
      continue;
    }
    if (op.scroll !== undefined) {
      if (op.scroll === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (op.scroll === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      else { const el = findTarget(op.scroll); el && el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      done.push({ scroll: op.scroll });
      continue;
    }
    if (op.focus !== undefined) { const el = findTarget(op.focus); el && el.focus(); done.push({ focus: op.focus }); continue; }
    if (op.wait) { await new Promise((r) => setTimeout(r, Math.min(5000, +op.wait || 0))); done.push({ wait: op.wait }); continue; }
    if (op.key) { document.dispatchEvent(new KeyboardEvent('keydown', { key: op.key, bubbles: true })); done.push({ key: op.key }); }
  }
  return done;
}

function tool(name, description, inputSchema, execute) {
  return { name, description, inputSchema: inputSchema || { type: 'object', properties: {} }, execute };
}

export function installWebMCP(opts = {}) {
  const name = opts.name || (document.title || 'page').slice(0, 40);
  const state = opts.state || (() => ({ url: location.href, title: document.title }));
  const extra = opts.tools || {};

  const base = {
    'page.describe': tool('page.describe', '이 페이지가 무엇이고 무엇을 할 수 있는지. 에이전트의 첫 호출.',
      {}, () => ({
        name, version: VERSION, url: location.href, title: document.title,
        description: opts.description || norm(document.querySelector('meta[name=description]')?.content || ''),
        sections: [...document.querySelectorAll('section[id], .sec, [data-section]')].slice(0, 40).map((s) => ({ id: s.id || null, h: norm(s.querySelector('h1,h2,h3')?.innerText || '').slice(0, 60) })),
        tools: Object.keys({ ...base, ...extra }),
        targets: targets().length
      })),
    'page.targets': tool('page.targets', '조작 가능한 요소 목록 (id·글자·위치). click 대상 고르기용.',
      { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } },
      ({ query = '', limit = 80 } = {}) => {
        const q = query.toLowerCase();
        return targets().filter((t) => !q || (t.text + ' ' + t.id).toLowerCase().includes(q)).slice(0, limit);
      }),
    'page.act': tool('page.act', '대본 DSL 동작 실행 — click / type / scroll / focus / key / js. 배열로 여러 개.',
      { type: 'object', properties: { ops: { type: 'array', items: { type: 'object' } } }, required: ['ops'] },
      ({ ops }) => act(ops)),
    'page.state': tool('page.state', '현재 페이지 상태(숫자·선택·모드). 실행 보고가 아니라 결과 보고.',
      {}, () => state())
  };

  // adapter 도구는 { description, inputSchema, execute } 만 줘도 되게 이름을 채운다
  const all = {};
  Object.entries({ ...base, ...extra }).forEach(([key, t]) => {
    all[key] = {
      name: t.name || key,
      description: t.description || '',
      inputSchema: t.inputSchema || { type: 'object', properties: {} },
      execute: t.execute
    };
  });
  const api = {
    version: VERSION, name, tools: all,
    listTools: () => Object.values(all).map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
    call: async (toolName, input = {}) => {
      const t = all[toolName];
      if (!t) throw new Error('도구 없음: ' + toolName + ' (' + Object.keys(all).join(', ') + ')');
      return await t.execute(input);
    },
    targets, act, find: findTarget
  };

  // 1) 브라우저 WebMCP (Chrome) — 있으면 등록
  let registered = 'none';
  const mc = navigator.modelContext;
  try {
    if (mc && typeof mc.provideContext === 'function') {
      mc.provideContext({ tools: Object.values(all) });
      registered = 'provideContext';
    } else if (mc && typeof mc.registerTool === 'function') {
      Object.values(all).forEach((t) => mc.registerTool(t));
      registered = 'registerTool';
    }
  } catch (e) {
    registered = 'error: ' + e.message;
  }

  // 2) 어디서나 — 동일 계약을 창에 노출 (Playwright · MCP 브리지 · 튜토리얼 대본)
  window.__webmcp = api;
  window.__webmcp.registered = registered;
  document.documentElement.setAttribute('data-webmcp', name);
  try {
    document.dispatchEvent(new CustomEvent('webmcp:ready', { detail: { name, tools: Object.keys(all), registered } }));
  } catch (e) {}
  return api;
}

export { targets, act, findTarget };
export default installWebMCP;
