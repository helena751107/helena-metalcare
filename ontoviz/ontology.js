/* HELENA METALCARE — care ontology.
 *
 * One knowledge base behind the landing page: every glow on screen is a node
 * with a class, a weight, and a source (chapter + line from the webzine). The
 * graph, the dashboard, the inspector and the Web MCP tools all read this one
 * object.
 */

export const COL = ['#f4efe6', '#e85d4c', '#d4a84b', '#3db8a8', '#8b7cf0', '#8fb3c9', '#f0c75e'];
export const CLASS = ['Hub', 'Pillar', 'Method', 'Level', 'Channel', 'Boundary', 'Install'];
export const SECTIONS = ['cover', 'pillars', 'map', 'method', 'crisis', 'channels', 'boundary', 'install'];

const N = [];
const L = [];
const add = (id, label, cls, s, val, ref, quote, desc, extra = {}) => {
  N.push({ id, label, cls, s, val, ref, quote, desc, ...extra });
};
const link = (source, target, rel) => L.push({ source, target, rel });

/* ── hub + chapters ─────────────────────────────────────────────── */
add('care', 'HELENA METALCARE', 'Hub', 0, 14, 'Cover', 'Care safety comes before wish content, view counts, or distribution.',
  'The Track 1 hub. An ontology of one household’s care: what must not break, what to do next, where help lives.', { chapter: 'cover', big: 1 });
add('ch.pillars', '01 · Pillars', 'Hub', 0, 7, '01 · Pillars', 'Four Pillars · So They Don’t Break',
  'Four load-bearing pillars. Tap one to see what it carries and which routine it protects.', { chapter: 'pillars' });
add('ch.map', '02 · Safety Net Map', 'Hub', 0, 7, '02 · Infographic', 'Care moves through official channels, home, and records at the same time.',
  'The safety net as a map: home, mind, official path, record, daemon and community.', { chapter: 'map' });
add('ch.method', '03 · Care Loop', 'Hub', 0, 7, '03 · Method', 'The 5-Step Care Loop',
  'A small loop that can be run at 2am: scan, level, act, note, rest.', { chapter: 'method' });
add('ch.levels', '04 · Levels', 'Hub', 0, 7, '04 · Levels', 'Steady / Worsening / Emergency',
  'A household sketch of escalation. Emergency bypasses the loop.', { chapter: 'crisis' });
add('ch.channels', '05 · Channels', 'Hub', 0, 7, '05 · Channels', 'Care breaks when isolated.',
  'Where the facts and the handoffs live: admin log, phone hub, Discord/Telegram.', { chapter: 'channels' });
add('ch.boundary', '06 · Boundary', 'Hub', 0, 7, '06 · Boundary', 'What this repo is not.',
  'A hard edge around the system: no diagnosis, no legal advice, no raw records, no naming.', { chapter: 'boundary' });
add('ch.install', '07 · Install', 'Hub', 0, 7, '07 · Install', 'Add to Home Screen',
  'No service worker. Manifest plus a coral monogram, so it opens fast in a crisis.', { chapter: 'install' });
['ch.pillars', 'ch.map', 'ch.method', 'ch.levels', 'ch.channels', 'ch.boundary', 'ch.install'].forEach((c) => link('care', c, 'chapter'));

/* ── pillars ────────────────────────────────────────────────────── */
add('p.safety', 'Safety', 'Pillar', 1, 9, '01 · Pillars', 'Crisis contacts · door security · medication · fire safety.',
  'Physical safety at home is priority one. Official numbers first.', { chapter: 'pillars', weight: 96 });
add('p.mind', 'Mind', 'Pillar', 1, 8, '01 · Pillars', 'Emotional load on caregiver and person. Observation, not diagnosis.',
  'Burndown signals, one-line sleep/meal log, referrals through official channels.', { chapter: 'pillars', weight: 88 });
add('p.record', 'Record', 'Pillar', 1, 7, '01 · Pillars', 'What happened. Facts only. Reusable material.',
  'A three-line session card, cross-referenced with the administrative axis. No sensitive information.', { chapter: 'pillars', weight: 84 });
add('p.community', 'Community', 'Pillar', 1, 7, '01 · Pillars', 'A place that isn’t alone. Discourtesy is the failure mode.',
  'Discord lobby, telegram bot lane, courteous handoff.', { chapter: 'pillars', weight: 80 });
['p.safety', 'p.mind', 'p.record', 'p.community'].forEach((c) => link('ch.pillars', c, 'contains'));

/* ── map entities ───────────────────────────────────────────────── */
add('m.home', 'Home', 'Pillar', 1, 6, '02 · Infographic', 'The person, caregiver, and daily routine. The stage for all safety.',
  'Day · bodies. Where the loop actually runs.', { chapter: 'map' });
add('m.official', 'Official', 'Channel', 4, 6, '02 · Infographic', 'Mental health, administrative and medical channels. Center · 119.',
  'The official path. Slow on purpose, but it holds.', { chapter: 'map' });
add('m.log', 'Admin Log', 'Channel', 4, 5, '02 · Infographic', 'The helana_log record: DW · BL · DC.',
  'Where facts from official channels are kept.', { chapter: 'map', href: 'https://helena751107.github.io/helana_log/' });
add('m.daemon', 'Care Daemon', 'Install', 6, 5, '02 · Infographic', 'Phone care daemon and health check. S21 Hub.',
  'A small machine that notices when care is about to break.', { chapter: 'map', href: 'https://helena751107.github.io/helena_phone/' });
['m.home', 'm.official', 'm.log', 'm.daemon'].forEach((c) => link('ch.map', c, 'contains'));
link('ch.map', 'p.mind', 'contains');

/* ── method ─────────────────────────────────────────────────────── */
add('s.scan', 'Scan', 'Method', 2, 5, '03 · Method', 'Body · home · meds · doors. Before judging, sweep the facts with your eyes only.',
  '01. The person’s state, home safety, and the caregiver’s sleep.', { chapter: 'method' });
add('s.level', 'Level', 'Method', 2, 5, '03 · Method', 'Steady · worsening · emergency.',
  '02. Name the level before choosing an action.', { chapter: 'method' });
add('s.act', 'Act', 'Method', 2, 5, '03 · Method', 'Just one thing.',
  '03. One action beats a plan. In a crisis, skip the loop.', { chapter: 'method' });
add('s.note', 'Note', 'Method', 2, 5, '03 · Method', '3 lines of fact.',
  '04. What happened, what was done, what changed.', { chapter: 'method' });
add('s.rest', 'Rest', 'Method', 2, 5, '03 · Method', 'The caregiver is human too.',
  '05. Rest is part of the loop, not a reward after it.', { chapter: 'method' });
['s.scan', 's.level', 's.act', 's.note', 's.rest'].forEach((c) => link('ch.method', c, 'contains'));
['s.scan', 's.level', 's.act', 's.note'].forEach((c, i) => link(c, ['s.level', 's.act', 's.note', 's.rest'][i], 'flow'));
link('s.rest', 's.scan', 'flow');

/* ── levels + contacts ──────────────────────────────────────────── */
add('lv.steady', 'Steady', 'Level', 3, 6, '04 · Levels', 'Routine is running. Prevention and record-keeping.',
  'L0. Medication, meals, sleep. One-line cards. A weekly check-in.', { chapter: 'crisis' });
add('lv.worsening', 'Worsening', 'Level', 3, 6, '04 · Levels', 'Load is rising. Rest before schedule.',
  'L1. Scale back broadcasting and work. Share with the center. Postpone admin appointments.', { chapter: 'crisis' });
add('lv.emergency', 'Emergency', 'Level', 3, 9, '04 · Levels', 'Go through official channels immediately. Stop content.',
  'L2. Do not handle it alone. Stop publishing and call.', { chapter: 'crisis', hot: 1 });
['lv.steady', 'lv.worsening', 'lv.emergency'].forEach((c) => link('ch.levels', c, 'contains'));
add('c.119', '119', 'Level', 3, 6, '04 · Levels', '119 · 112 · your local mental health crisis hotline · the emergency room.',
  'Emergency services. The first call when there is risk of harm.', { chapter: 'crisis' });
add('c.112', '112', 'Level', 3, 5, '04 · Levels', '119 · 112 · local mental-health crisis line.',
  'Police. When safety at home is at risk right now.', { chapter: 'crisis' });
add('c.line', 'Crisis line', 'Level', 3, 5, '04 · Levels', 'Local mental health welfare center · crisis line.',
  'The mental-health crisis line and local welfare center.', { chapter: 'crisis' });
['c.119', 'c.112', 'c.line'].forEach((c) => { link('ch.levels', c, 'contains'); link('lv.emergency', c, 'routes'); });

/* ── channels ───────────────────────────────────────────────────── */
add('chn.log', 'Helana Log', 'Channel', 4, 6, '05 · Channels', 'Administrative log for disability, basic livelihood, dementia.',
  'Where the facts from official channels are kept.', { chapter: 'channels', href: 'https://helena751107.github.io/helana_log/' });
add('chn.hub', 'S21 Phone Hub', 'Channel', 4, 5, '05 · Channels', 'Care daemon · health check · constitution.',
  'The workstation that keeps the daemon alive.', { chapter: 'channels', href: 'https://helena751107.github.io/helena_phone/' });
add('chn.discord', 'Discord · Telegram', 'Channel', 4, 5, '05 · Channels', 'Lobby · bot reports. A courteous handoff.',
  'Signal lanes. Never for sensitive records.', { chapter: 'channels', href: 'https://discord.gg/JTYSZv2WQE' });
['chn.log', 'chn.hub', 'chn.discord'].forEach((c) => link('ch.channels', c, 'contains'));

/* ── boundary ───────────────────────────────────────────────────── */
add('b.t1', 'Track 1 first', 'Boundary', 5, 8, '06 · Boundary', 'Care safety before wish content, view counts, or distribution.',
  'Only Track 2 is allowed to break.', { chapter: 'boundary' });
add('b.medical', 'Not diagnosis', 'Boundary', 5, 6, '06 · Boundary', 'No medical diagnosis or prescription.',
  'The loop observes; clinicians diagnose.', { chapter: 'boundary' });
add('b.legal', 'Not legal advice', 'Boundary', 5, 5, '06 · Boundary', 'No legal advice, no benefits-claim agency work.',
  'We connect to official channels; we do not act as an agent.', { chapter: 'boundary' });
add('b.records', 'No raw records', 'Boundary', 5, 5, '06 · Boundary', 'No publishing raw personal medical records.',
  'Facts may be recorded. Raw records stay out.', { chapter: 'boundary' });
['b.t1', 'b.medical', 'b.legal', 'b.records'].forEach((c) => link('ch.boundary', c, 'contains'));

/* ── install ────────────────────────────────────────────────────── */
add('i.manifest', 'Manifest', 'Install', 6, 5, '07 · Install', 'Manifest + coral C monogram. No service worker.',
  'Add to Home Screen. Standalone window, fast open.', { chapter: 'install' });
add('i.standalone', 'Standalone', 'Install', 6, 4, '07 · Install', 'Manifest + icons, so it opens fast in a crisis.',
  'Crisis opens the app, not a browser tab.', { chapter: 'install' });
['i.manifest', 'i.standalone'].forEach((c) => link('ch.install', c, 'contains'));

/* ── cross-relations: the care logic ───────────────────────────── */
[['p.safety', 'm.home'], ['p.safety', 'm.official'], ['p.safety', 's.scan'], ['p.safety', 'lv.steady'],
 ['p.mind', 'm.daemon'], ['p.mind', 's.rest'], ['p.mind', 'lv.worsening'],
 ['p.record', 'm.log'], ['p.record', 's.note'], ['p.record', 'chn.log'],
 ['p.community', 'chn.discord'], ['p.community', 's.rest'],
 ['m.home', 'm.official'], ['m.home', 'm.daemon'], ['m.official', 'm.log'], ['m.official', 'c.119'],
 ['s.scan', 'lv.steady'], ['s.level', 'lv.steady'], ['s.level', 'lv.worsening'], ['s.level', 'lv.emergency'],
 ['s.act', 'lv.worsening'], ['s.note', 'm.log'], ['s.rest', 'p.mind'],
 ['lv.steady', 'chn.log'], ['lv.worsening', 'm.official'], ['lv.worsening', 'chn.log'],
 ['chn.log', 'm.log'], ['chn.hub', 'm.daemon'], ['chn.discord', 'p.community'],
 ['b.t1', 'lv.emergency'], ['b.t1', 'care'], ['b.medical', 's.scan'], ['b.legal', 'chn.log'], ['b.records', 'm.log'],
 ['i.standalone', 'lv.emergency'], ['i.manifest', 'care'], ['i.manifest', 'i.standalone']
].forEach(([a, b]) => link(a, b, 'support'));

/* ── deterministic layout: chapter ring, entities orbiting their chapter ── */
const chapterOf = {};
SECTIONS.forEach((ch, i) => { chapterOf[ch] = i; });
const chapters = ['ch.pillars', 'ch.map', 'ch.method', 'ch.levels', 'ch.channels', 'ch.boundary', 'ch.install'];
const byId = new Map(N.map((n) => [n.id, n]));
const chapterPos = {};
N.forEach((n) => {
  const ch = n.chapter;
  if (n.id === 'care') { n.pos = [0, 46, 0]; return; }
  if (n.id.startsWith('ch.')) {
    const k = chapters.indexOf(n.id), a = (k / chapters.length) * Math.PI * 2 - Math.PI / 2;
    n.pos = [Math.cos(a) * 330, 36 + Math.sin(k * 1.7) * 38, Math.sin(a) * 330];
    chapterPos[n.chapter] = n.pos;
  }
});
const counts = {};
N.forEach((n) => { if (!n.id.startsWith('ch.') && n.id !== 'care') counts[n.chapter] = (counts[n.chapter] || 0) + 1; });
const seen = {};
N.forEach((n) => {
  if (n.id === 'care' || n.id.startsWith('ch.')) return;
  const base = chapterPos[n.chapter] || [0, 0, 0];
  const k = (seen[n.chapter] = (seen[n.chapter] || 0) + 1) - 1;
  const m = Math.max(1, counts[n.chapter]);
  const a = k * 2.399963 + chapterOf[n.chapter] * 0.7;
  const r = 74 + (k % 3) * 26;
  const y = Math.sin(k * 1.3 + 0.6) * 46 + (k % 2 ? 16 : -12);
  n.pos = [base[0] + Math.cos(a) * r, base[1] + y, base[2] + Math.sin(a) * r];
});

export const NODES = N;
export const LINKS = L.filter((l) => byId.has(l.source) && byId.has(l.target));
export const CHAPTER_IDS = chapters;
export const chapterIndex = (id) => SECTIONS.indexOf(String(id || '').replace(/^ch\./, ''));
export const stats = {
  nodes: NODES.length,
  relations: LINKS.length,
  chapters: chapters.length,
  sources: new Set(NODES.map((n) => n.ref)).size
};
