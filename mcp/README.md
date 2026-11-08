# Web MCP — the page as a tool surface

This folder makes the MetalCare webzine operable by an agent (tutorial MCP, Playwright, or a
browser that ships `navigator.modelContext`) **without changing how the page works for people**.

```
mcp/
  webmcp.js          generic runtime — the same contract on every landing page
  metalcare.mcp.js    this site: 12 care.* tools + the gold dock UI
  metalcare.mcp.css   the dock's styles, drawn from the page's own --gold / --paper variables
```

## Integration (two lines)

```html
<link rel="stylesheet" href="mcp/metalcare.mcp.css">
<script type="module" src="mcp/metalcare.mcp.js"></script>
```

The module registers the tools and mounts the dock. `#mcp` in the URL opens it.

## Contract

Three surfaces, one shape:

| surface | who uses it |
|---|---|
| `navigator.modelContext.provideContext({tools})` (or `registerTool`) | Chrome / WebMCP-aware browsers |
| `window.__webmcp.call(name, input)` · `listTools()` · `registered` | Playwright, MCP bridges, tutorial scripts |
| the dock (seal → Tools / Run / State) | people watching the page |

Every tool is `{ name, description, inputSchema, execute }`. The runtime always adds the four
universal tools: `page.describe`, `page.targets`, `page.act`, `page.state`. `page.act` speaks the
same vocabulary as the tutorial director DSL — `click`, `type`, `scroll`, `focus`, `key`, `js`,
`wait` — so one scene script can drive any page built with this kit.

## The 12 care tools

| tool | does |
|---|---|
| `care.status` | section, theme, open chapters, progress, transport — start here |
| `care.sections` | the cover + seven chapters (id, number, label, title, open) |
| `care.open` / `care.close` | open a chapter and scroll to it / collapse one or all |
| `care.theme` | dark · light · toggle (same setting as the Theme button) |
| `care.method` | the 5-step care loop; `{step:0..4}` selects and reads a step |
| `care.levels` | L0 steady · L1 strain · L2 crisis, with actions and the emergency note |
| `care.map` | the seven safety-net map nodes and their tooltips |
| `care.search` | full-text search; `{open:true}` opens the first hit's chapter |
| `care.read` | plain text of a chapter, in reading order, truncated to `max` |
| `care.docs` | docs bridge, README, llms.txt, ecosystem links, repo |
| `care.spot` | scroll to a target and ring it in gold for a moment |

Safety is part of the interface: `care.status` and `page.describe` carry
*"Not medical advice. In an emergency: 119 · 112 · local mental-health crisis line."*
`care.levels` returns the same note with the actions. No personal records are ever exposed.

## Verify

```bash
python3 -m http.server 8123
python3 - <<'PY'
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto("http://localhost:8123/")
    pg.wait_for_function("() => window.__webmcp")
    print(pg.evaluate("window.__webmcp.listTools().map(t => t.name)"))
    print(pg.evaluate("window.__webmcp.call('care.status')"))
    print(pg.evaluate("window.__webmcp.call('care.open', {section:'method'})"))
    b.close()
PY
```

## Reuse on the next landing page

Copy `webmcp.js` unchanged, write a `<site>.mcp.js` that maps that page's own vocabulary
(sections, chapters, scenes, filters) to tools, and keep the same file names and tool grammar.
The runtime is the contract; each site only supplies meaning.
