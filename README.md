# 诗云 · 个人文学知识库（Literature Vault）

> **English**：[README.en.md](README.en.md) · 本仓库中文 Introduction

> 把 Obsidian 变成一个**可归档、可检索、可赏析**的个人文学仓库；诗云（Shiyun）是一套直接挂在仓库上的诗词可视化与赏析服务。

一个「一个人 + AI 维护」的文学仓库项目，包含两部分：

| 模块 | 说明 |
|------|------|
| **知识库规范** | raw 写作区 → wiki 归档区的双维度归档体系：frontmatter 规范、8 主题分类、5 大体裁识别、随吟/专辑拆分、总目与日志管理，配套 Agent Skill（ingest / query / lint） |
| **诗云可视化（v2）** | 纯 Node.js 零依赖本地服务（端口 8899）：诗字形词云（品）、逐篇赏析展示（赏）、可选大模型即时生评（AI）、Obsidian Local REST API 数据源切换 |

---

## 📖 详细介绍 & 视频

- 📝 **详细文章介绍**：[在公众号阅读完整长文](https://mp.weixin.qq.com/s/_CSb7TX7-n2PfjKBUr5zpA)
- 🎬 **B 站视频介绍**：[诗云 · 个人文学知识库（Literature Vault）。共赏诗和代码之美~](https://www.bilibili.com/video/BV1bYbf6dEwm/?share_source=copy_web&vd_source=618e61e5419fab55e21e5990fe9ee9e8)

### 🎥 仓库内演示视频

<video src="assets/video/诗云介绍.mp4" controls width="100%"></video>

> 视频同时托管在仓库内 `assets/video/诗云介绍.mp4`，方便离线 / 弱网环境直接查看。

---

## 特性

### 📚 知识库侧
- **双维度归档**：按「语言 → 主题」与「年份 → 语言 → 主题」自动组织，同一首诗在两个维度各有一份
- **Frontmatter 规范**：诗 / 文选 / 摘录 / 专辑 / 赏析五种文档类型统一定义（含干支纪年时间戳）
- **体裁识别**：近体诗 / 词 / 现代诗 / 随吟 / 英文诗 五类，AI 自动判定
- **随吟拆分**：一行一首的随吟写作区，归档时自动按首拆分为独立诗篇
- **专辑拆分**：多语言混合的专辑（如 `For Senior Wu`）按日期拆分为独立诗歌入档
- **文学检索与健康巡检**：`/query` 双链式检索、`/lint` 死链/孤岛/格式体检
- **赏析体系**：每篇赏析对应一首已归档作品，frontmatter 含 `rating` 与 `best_line`，诗云「赏」按体裁选取展示片段

### 🎨 诗云侧（零依赖，纯 Node 标准库）
- **品**：实时读取归档诗集，`data/poem-words.json` 内置词典（源自 chinese-poetry 全宋词语料高频+PMI 筛选）优先分词，未命中回退二元组合，生成诗字形词云
- **赏**：优先展有赏析的作品，按 `form` 体裁选取段落：近体诗取整句、词/现代诗/英文诗取整段、随吟取整句；无赏析可一键调用大模型即时生评
- **双数据源**：默认直读本地文件；开启 Obsidian Local REST API 后自动切换为实时 API 读取
- **配置热更新**：`config.json` 管理数据源与 LLM 参数，网页端可改
<img width="2529" height="1381" alt="image" src="https://github.com/user-attachments/assets/ca32d6c8-f44e-497d-88dc-afae85203f55" />
<img width="2530" height="1372" alt="image" src="https://github.com/user-attachments/assets/3253d85c-857c-4193-bafd-7d1c6cc48813" />
---

## 快速开始

### 环境要求
- Node.js ≥ 18（内置 `fetch`）
- 一个按本仓库规范组织的 Obsidian 文学知识库（见 `docs/知识库建立与管理.md`）

### 1. 目录约定

```
你的文学库/
├── raw/            # 写作区（源文件）
│   ├── 诗集/       #   中文/ en/ freestyle/(随吟)
│   ├── 文选/       #   散文/故事/思考
│   ├── 专辑/       #   多语言混合合集
│   └── 收藏/       #   摘录（不参与归档）
├── wiki/           # 输出层
│   ├── 归档/       #   诗集/ 文选/ 专辑/（主题+年份双维度）
│   ├── 赏析/       #   作品赏析层
│   ├── 年选集/     #   年度整编（/// 分隔）
│   ├── index.md    #   文学总目
│   └── log.md      #   操作日志
└── 诗云/           # 本可视化系统
```

### 2. 启动诗云

Windows：
```bat
# 双击 诗云/start.bat，或
node server.js
```

macOS / Linux：
```bash
cd 诗云
node server.js
```

浏览器打开 <http://localhost:8899>。

> server.js 默认从 `../wiki/归档/诗集` 与 `../wiki/赏析` 读取数据，请保证诗云目录位于你的文学库根目录下。

### 3. 配置（可选）

`config.json`（不入 git）：

```json
{
  "source": "auto",
  "author": "你的笔名",
  "llm": { "base": "https://api.deepseek.com", "key": "sk-xxx", "model": "deepseek-v4-pro" }
}
```

| 字段 | 说明 |
|------|------|
| `source` | `auto`（默认，优先 Obsidian 回落本地）/ `local` / `obsidian` |
| `author` | 作者名，AI 赏析助手以此称呼你；留空则用占位符 `XXX` |
| `llm.base` | OpenAI 兼容接口地址（`/chat/completions`） |
| `llm.key` | API Key |
| `llm.model` | 模型名 |

### 4. 接入 Obsidian 实时数据源（可选）

1. 安装社区插件 **Obsidian Local REST API**
2. 启用并开启 `Enable Insecure Server`，记住端口（默认 27123）
3. 设置页拿到 `API Key`
4. 网页右上角数据源切到 Obsidian，或把 `config.json` 的 `source` 设为 `"obsidian"`

### 5. 接入大模型（可选）

网页「一键生评」或前端配置项填入 base / key / model。兼容所有 OpenAI Chat Completions 协议的服务（DeepSeek、通义、Moonshot 等）。

---

## API 一览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 数据源、Obsidian 可用性、LLM 配置状态 |
| `/api/poems` | GET | 诗单（`?source=local\|obsidian`）；返回 `{source,total,poems[]}`，含 `lines` 与 `stanzas` |
| `/api/reviews` | GET | 全部赏析 `{total,reviews[]}`（含 rating / best_line） |
| `/api/config` | POST | 热更新 source 与 llm 配置 |
| `/api/ask` | POST | 大模型即时生评，体 `{poem:{title,year,theme,text,picked}, llm?}` |

---

## 目录结构

```
shiyun/
├── server.js               # 零依赖 HTTP 服务（Node 标准库）
├── index.html              # 前端单页（品 + 赏 + 配置）
├── start.bat               # Windows 启动脚本
├── data/
│   └── poem-words.json     # 内置分词词典（2517 词）
├── assets/                 # 词云剪影资源
├── config.example.json     # 配置示例
├── docs/
│   ├── 知识库建立与管理.md  # 仓库规范、工作流、Agent Skill
│   └── 诗云连接与开发.md    # 架构、解析逻辑、API、二次开发
└── README.md
```

## License

[MIT](LICENSE)
