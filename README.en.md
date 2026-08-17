# Shiyun · Personal Literature Vault

> Turn Obsidian into a **personal literary knowledge base** that can be archived, searched, and appreciated. Shiyun is a visualization & appreciation service that lives right inside the vault.

A literature vault project maintained by "one person + AI", delivered in two parts:

| Module | Description |
|--------|-------------|
| **Vault conventions** | Dual-dimension archiving from the `raw/` writing area to the `wiki/` archive area: frontmatter spec, 8 themes, 5 forms, snap/collection splitting, index & log management, with companion Agent Skills (ingest / query / lint) |
| **Shiyun visualization (v2)** | Zero-dependency Node.js local service (port 8899): poem-shaped word cloud (品), per-poem appreciation display (赏), optional LLM instant reviews (AI), and an optional Obsidian Local REST API data source |

---

## Features

### 📚 Vault side
- **Dual-dimension archiving**: organized by "language → theme" and "year → language → theme"; each poem exists in both dimensions
- **Frontmatter spec**: five document types (poem / essay / clipping / collection / review) with unified definitions, including Gan-zhi (sexagenary cycle) timestamps
- **Form detection**: 近体诗 (regulated verse) / 词 (ci) / 现代诗 (free verse) / 随吟 (snap) / 英文诗 (English) — auto-detected by the AI pipeline
- **Snap splitting**: one-line-per-poem snap writing area; automatically split into individual poems on ingest
- **Collection splitting**: multi-language collections (e.g. `For Senior Wu`) split into individual poems by date
- **Search & health checks**: `/query` dual-link retrieval, `/lint` dead-link / orphan / format inspection
- **Review system**: each review maps to one archived poem via frontmatter (`poem` must equal the poem's `title`); Shiyun picks display segments by `form`

### 🎨 Shiyun side (zero dependencies, Node standard library only)
- **品 (Cloud)**: reads the archived poems live; `data/poem-words.json` built-in dictionary (frequency + PMI filtered from the chinese-poetry Song-ci corpus) for segmentation, falling back to bigrams — renders a poem-shaped word cloud
- **赏 (Appreciate)**: prefers poems that have reviews; picks segments by `form` — regulated verse by full line, ci/free verse/English by stanza, snaps by line; one-click LLM instant review when no review exists
- **Dual data sources**: local file reading by default; switches to the Obsidian Local REST API in real time when enabled
- **Hot-reloadable config**: `config.json` manages data source and LLM params; editable from the web UI

---

## Quick Start

### Requirements
- Node.js ≥ 18 (built-in `fetch`)
- An Obsidian literature vault organized per this repo's conventions (see `docs/知识库建立与管理.md`)

### 1. Layout

```
your vault/
├── raw/            # writing area (source)
│   ├── 诗集/       #   中文/ en/ snap/
│   ├── 文选/       #   essays / stories / thoughts
│   ├── 专辑/       #   mixed-language collections
│   └── 收藏/       #   clippings (not archived)
├── wiki/           # output layer
│   ├── 归档/       #   诗集/ 文选/ 专辑/ (theme + year dimensions)
│   ├── 赏析/       #   reviews
│   ├── 年选集/     #   yearly anthologies (///-separated)
│   ├── index.md    #   master index
│   └── log.md      #   operation log
└── 诗云/           # this visualization service
```

### 2. Start Shiyun

Windows:
```bat
# double-click 诗云/start.bat, or
node server.js
```

macOS / Linux:
```bash
cd 诗云
node server.js
```

Open <http://localhost:8899> in your browser.

> server.js reads `../wiki/归档/诗集` and `../wiki/赏析` relative to its own directory — keep the 诗云 folder at the root of your vault.

### 3. Configuration (optional)

`config.json` (not tracked by git):

```json
{
  "source": "auto",
  "author": "Your Pen Name",
  "llm": { "base": "https://api.deepseek.com", "key": "sk-xxx", "model": "deepseek-v4-pro" }
}
```

| Field | Description |
|-------|-------------|
| `source` | `auto` (default: prefer Obsidian, fall back to local) / `local` / `obsidian` |
| `author` | Pen name used by the AI review assistant; falls back to the placeholder `XXX` when empty |
| `llm.base` | Any OpenAI-compatible endpoint (`/chat/completions`) |
| `llm.key` | API key |
| `llm.model` | Model name |

### 4. Obsidian live data source (optional)

1. Install the community plugin **Obsidian Local REST API**
2. Enable it and turn on `Enable Insecure Server` (default port 27123); copy the API key
3. Switch the data source to Obsidian in the web UI, or set `"source": "obsidian"` in `config.json`

### 5. LLM instant reviews (optional)

Fill in base / key / model in the web UI. Compatible with any service implementing the OpenAI Chat Completions protocol (DeepSeek, Qwen, Moonshot, …).

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Data source, Obsidian availability, LLM config status |
| `/api/poems` | GET | Poem list (`?source=local\|obsidian`); returns `{source,total,poems[]}` with `lines` & `stanzas` |
| `/api/reviews` | GET | All reviews `{total,reviews[]}` (includes rating / best_line) |
| `/api/config` | POST | Hot-update source / author / llm config |
| `/api/ask` | POST | LLM instant review, body `{poem:{title,year,theme,text,picked}, llm?}` |

---

## Directory Layout

```
shiyun/
├── server.js               # zero-dependency HTTP server (Node standard library)
├── index.html              # single-page frontend (cloud + appreciate + settings)
├── start.bat               # Windows launcher
├── data/
│   └── poem-words.json     # built-in segmentation dictionary (2517 words)
├── assets/                 # word-cloud mask images
├── config.example.json     # config template
├── docs/
│   ├── 知识库建立与管理.md  # vault conventions, workflows, Agent Skills
│   └── 诗云连接与开发.md    # architecture, parsing logic, API, development guide
└── README.md
```

## License

[MIT](LICENSE)