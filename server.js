const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'wiki', '归档', '诗集');
const REVIEW_DIR = path.resolve(__dirname, '..', 'wiki', '赏析');
const CFG_FILE = path.join(__dirname, 'config.json');
const PORT = 8899;

/* ---------- 配置 ---------- */
function readCfg() {
  try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')); }
  catch { return { source: 'auto', author: '', llm: { base: '', key: '', model: '' } }; }
}
function saveCfg(c) {
  fs.writeFileSync(CFG_FILE, JSON.stringify(c, null, 2), 'utf8');
}
function obsidianInfo() {
  try {
    const d = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '.obsidian', 'plugins', 'obsidian-local-rest-api', 'data.json'), 'utf8'));
    return { key: d.apiKey || '', port: d.insecurePort || 27123, available: !!(d.apiKey && d.enableInsecureServer) };
  } catch { return { key: '', port: 27123, available: false }; }
}

/* ---------- 解析 ---------- */
function parseMd(t) {
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  let fm = {}, body = t;
  if (m) {
    for (const ln of m[1].split(/\r?\n/)) {
      const i = ln.indexOf(':');
      if (i > 0) fm[ln.slice(0, i).trim()] = ln.slice(i + 1).trim().replace(/^"|"$/g, '');
    }
    body = m[2];
  }
  return { fm, body };
}
function poemLines(body) {
  return body.split(/\r?\n/).map(s => s.trim())
    .filter(s => s && !/^!\[\[/.test(s) && !/^```/.test(s) && !/^#/.test(s) && !/^<!--/.test(s) && !/^---/.test(s));
}
function poemStanzas(body) {
  return body.split(/\n[ \t]*\n/).map(seg => poemLines(seg)).filter(a => a.length);
}

/* ---------- 数据源：本地 ---------- */
function extractYear(p, created) {
  if (created) {
    const m = created.match(/(20\d{2})/);
    if (m) return m[1];
  }
  return (p.match(/[\\/](20\d{2})[\\/]/) || [])[1] || '';
}
function scanLocal() {
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.md$/i.test(e.name)) files.push(p);
    }
  })(ROOT);
  let id = 0;
  const seen = new Set();
  return files.map(p => {
    const t = fs.readFileSync(p, 'utf8');
    const { fm, body } = parseMd(t);
    const created = fm.created || '';
    const year = extractYear(p, created);
    return {
      id: id++, title: fm.title || path.basename(p, '.md'),
      year, lang: fm.lang || 'zh', theme: fm.theme || '',
      form: fm.form || '', created,
      lines: poemLines(body), stanzas: poemStanzas(body)
    };
  }).filter(x => {
    if (!x.lines.length) return false;
    const k = x.title + '|' + x.lang + '|' + x.lines[0];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ---------- 数据源：Obsidian Local REST API ---------- */
let obCache = { t: 0, poems: null };

async function scanObsidian() {
  if (obCache.poems && Date.now() - obCache.t < 30000) return obCache.poems;
  const info = obsidianInfo();
  if (!info.available) throw new Error('Obsidian Local REST API 未启用');
  const base = `http://127.0.0.1:${info.port}`;
  const headers = { Authorization: 'Bearer ' + info.key };

  /* v4 API：/vault/{dir} 返回该层 {files:[...]}，目录条目以 / 结尾 → BFS */
  const md = [];
  const queue = ['wiki/'];
  while (queue.length) {
    const dir = queue.shift();
    let d;
    try {
      const r = await fetch(base + '/vault/' + encodeURIComponent(dir), { headers });
      if (r.status !== 200) continue;
      d = await r.json();
    } catch { continue; }
    for (const name of d.files || []) {
      const p = dir + name;
      if (name.endsWith('/')) queue.push(p);
      else if (/\.md$/i.test(p) && p.includes('归档/诗集')) md.push(p);
    }
  }

  const out = [];
  let id = 0;
  const seen = new Set();
  for (const f of md.slice(0, 600)) {
    try {
      const r = await fetch(base + '/vault/' + encodeURIComponent(f), { headers });
      if (r.status !== 200) continue;
      const t = await r.text();
      const { fm, body } = parseMd(t);
      const created = fm.created || '';
      const year = (f.match(/[\\/](20\d{2})[\\/]/) || [])[1] || (created.match(/(20\d{2})/) || [])[1] || '';
      const lines = poemLines(body);
      if (!lines.length) continue;
      const k = (fm.title || path.basename(f, '.md')) + '|' + (fm.lang || 'zh') + '|' + lines[0];
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        id: id++, title: fm.title || path.basename(f, '.md'),
        year, lang: fm.lang || 'zh', theme: fm.theme || '',
        form: fm.form || '', created,
        lines, stanzas: poemStanzas(body)
      });
    } catch (e) { /* 单个文件失败跳过 */ }
  }
  obCache = { t: Date.now(), poems: out };
  return out;
}

/* ---------- 赏析 ---------- */
function scanReviews() {
  if (!fs.existsSync(REVIEW_DIR)) return [];
  const out = [];
  for (const fn of fs.readdirSync(REVIEW_DIR)) {
    if (!/\.md$/i.test(fn)) continue;
    const t = fs.readFileSync(path.join(REVIEW_DIR, fn), 'utf8');
    const { fm, body } = parseMd(t);
    out.push({
      poem: fm.poem || path.basename(fn, '.md'),
      theme: fm.theme || '', rating: fm.rating || '',
      best_line: fm.best_line || '', body: body.trim()
    });
  }
  return out;
}

/* ---------- LLM ---------- */
async function askLLM(llm, poem, author) {
  const base = (llm.base || '').replace(/\/+$/, '');
  if (!base || !llm.key || !llm.model) throw new Error('未配置完整的大模型参数');
  const who = (author || '').trim() || 'XXX';
  const prompt = `你是${who}的文学赏析助手。请为他的诗写一则赏析（250字以内，中文），先点出所选诗句之美，再联系全诗与主题说明佳处，语言凝练典雅。\n\n诗题：《${poem.title}》\n年份：${poem.year}\n主题：${poem.theme}\n全诗：\n${poem.text}\n\n所赏诗句：「${poem.picked}」\n\n若提供了既有赏析，请精炼化用，不要照抄。`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + llm.key },
      body: JSON.stringify({
        model: llm.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8, max_tokens: 4000
      }),
      signal: ctrl.signal
    });
    const d = await r.json();
    if (!r.ok) throw new Error('LLM 响应异常: ' + (d.error?.message || r.status));
    const msg = d.choices?.[0]?.message;
    const content = (msg?.content || '').trim();
    if (!content) {
      const rc = (msg?.reasoning_content || '').trim();
      const fr = d.choices?.[0]?.finish_reason;
      if (fr === 'length' || rc) throw new Error('模型把 token 全用在思考上了，未产出正文（推理模型请增大 max_tokens 或换非推理模型）');
      return '';
    }
    return content;
  } finally { clearTimeout(timer); }
}

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

  try {
    if (u.pathname === '/api/status') {
      const cfg = readCfg();
      const ob = obsidianInfo();
      send(200, {
        source: cfg.source, author: cfg.author || '', obsidianAvailable: ob.available,
        llmConfigured: !!(cfg.llm.base && cfg.llm.key && cfg.llm.model),
        llm: { base: cfg.llm.base, model: cfg.llm.model, keySet: !!cfg.llm.key }
      });
      return;
    }
    if (u.pathname === '/api/config' && req.method === 'POST') {
      let b = '';
      for await (const c of req) b += c;
      const cfg = readCfg();
      const n = JSON.parse(b);
      cfg.source = n.source || cfg.source;
      if (typeof n.author === 'string') cfg.author = n.author;
      if (n.llm) { cfg.llm = { ...cfg.llm, ...n.llm }; }
      saveCfg(cfg);
      send(200, { ok: true });
      return;
    }
    if (u.pathname === '/api/poems') {
      let poems, used;
      const want = u.searchParams.get('source') || readCfg().source;
      if (want === 'obsidian') {
        try { poems = await scanObsidian(); used = 'obsidian'; } catch (e) { send(502, { error: 'Obsidian 数据源不可用: ' + e.message }); return; }
      } else if (want === 'local') {
        poems = scanLocal(); used = 'local';
      } else {
        try { poems = await scanObsidian(); used = 'obsidian'; } catch { poems = scanLocal(); used = 'local'; }
      }
      if (!poems.length) { send(404, { error: '未找到任何作品' }); return; }
      send(200, { source: used, total: poems.length, poems });
      return;
    }
    if (u.pathname === '/api/reviews') {
      const reviews = scanReviews();
      send(200, { total: reviews.length, reviews });
      return;
    }
    if (u.pathname === '/api/ask' && req.method === 'POST') {
      let b = '';
      for await (const c of req) b += c;
      const body = JSON.parse(b);
      const cfg = readCfg();
      const llm = body.llm || cfg.llm;
      const text = await askLLM(llm, body.poem || {}, cfg.author);
      send(200, { text });
      return;
    }

    /* 静态资源 */
    let rel;
    try { rel = u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname); }
    catch { rel = u.pathname; }
    let fp = path.normalize(path.join(__dirname, rel));
    if (!fp.startsWith(path.join(__dirname, ''))) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not Found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    });
  } catch (e) {
    send(500, { error: e.message });
  }
}).listen(PORT, () => {
  console.log('诗云 v2 已启动: http://localhost:' + PORT);
  console.log('诗集目录: ' + ROOT);
  const ob = obsidianInfo();
  console.log(ob.available ? 'Obsidian Local REST API: 可用' : 'Obsidian Local REST API: 未启用（将回落本地直读）');
});