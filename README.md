# CtxSift

为任务打包真正相关的文件，而不是把整个仓库塞进上下文。

CtxSift 是一个本地优先的问题感知型代码库上下文打包器。它读取本地仓库或公开 GitHub 仓库，根据你的问题、路径、文档、测试、入口文件和 diff 信息对文件排序，默认排除/脱敏敏感内容，并输出适合 AI 编程助手使用的 Markdown 或 JSON 上下文包。

适用对象包括 Claude、ChatGPT、Codex、Cursor、Aider，以及后续可以接入的 GitHub Action、编辑器插件或 MCP 工具链。

## 核心价值

传统 full-repo 打包器关注“导出所有文件”。CtxSift 关注“这次任务需要哪些文件”。

- 问题感知：围绕 `--ask` 的问题筛选文件，而不是全仓导出。
- 可解释：每个入选文件都会给出选择理由。
- 可控预算：按 token 预算裁剪，并说明被丢弃文件的原因。
- 适合代码评审：支持 `--diff base...head` 生成 review bundle。
- 默认安全：自动忽略 `.env`、密钥、证书、生成产物、二进制文件和大文件。
- 本地优先：核心流程不调用 LLM、不上传私有代码、不依赖向量数据库。

## 快速开始

```bash
pnpm add -g ctxsift

ctxsift --repo . --ask "Where does auth start?"
```

常用命令：

```bash
# 根据问题打包本地仓库上下文
ctxsift --repo . --ask "Where does auth start?"

# 输出 JSON，方便后续工具消费
ctxsift --repo . --ask "How does routing work?" --format json --out ctxbundle.json

# 为当前分支生成 diff-aware 评审上下文
ctxsift --repo . --diff main...HEAD --mode review --format markdown --out review-context.md

# 读取公开 GitHub 仓库
ctxsift --repo https://github.com/user/repo --ask "How does routing work?" --format json
```

## CLI 参数

| 参数 | 说明 |
| --- | --- |
| `--repo <path-or-url>` | 本地仓库路径或公开 GitHub 仓库 URL。 |
| `--ask <question>` | 当前任务/问题，排序器会围绕它选择文件。 |
| `--diff <base>...<head>` | 生成 diff-aware review bundle。 |
| `--mode <mode>` | 支持 `question`、`review`、`diff`、`onboarding`、`bugfix`。 |
| `--max-tokens <number>` | 输出 token 预算，默认 `20000`。 |
| `--format markdown|json` | 输出 Markdown 或 JSON。 |
| `--out <file>` | 写入文件；不传则输出到 stdout。 |
| `--include <glob[,glob]>` | 强制包含指定路径模式。 |
| `--exclude <glob[,glob]>` | 排除指定路径模式。 |
| `--no-redact` | 关闭内容脱敏，会向 stderr 打印警告。 |
| `--debug` | 保留调试开关，供后续扩展。 |
| `--version` | 输出版本号。 |
| `--help` | 输出帮助信息。 |

## 输出内容

Markdown 输出适合直接复制给 AI 助手：

```text
# CtxSift Bundle

## Task
Where does auth start?

## Selected Files
### src/auth/login.ts
- Reasons: query matched file path; query matched file content

## Audit
- Redactions: 0
```

JSON 输出面向自动化工具，当前 schema 为 `1.0`，包含：

- `task`：问题、模式、目标模型等任务信息。
- `repo`：仓库来源、root、ref。
- `manifest`：token、选中文件数、丢弃文件、`droppedFilesOmitted` 截断计数、redaction 数量。
- `tree`：入选候选文件树。
- `selectedFiles`：文件路径、语言、分数、理由。
- `chunks`：实际输出内容。
- `review`：diff-aware 模式下的 changed files、相关测试/文档、风险提示。
- `audit`：扫描、忽略、脱敏统计。

## 工作逻辑

CtxSift 的主流程如下：

```text
CLI 参数
  -> PackRequest
  -> 准备本地/远程仓库
  -> 扫描候选文件
  -> 文件分类
  -> 安全过滤与内容脱敏
  -> 问题感知排序
  -> token 预算裁剪
  -> Markdown / JSON 输出
```

核心模块：

- `RepoLoader`：读取目录、合并 `.gitignore` 和内置忽略规则、统一 Windows/Unix 路径。
- `FileClassifier`：识别源码、测试、文档、配置、生成产物、二进制和敏感文件。
- `QuestionRanker`：基于 query 命中、路径、内容、README/docs、测试关联、入口文件和 diff 信息打分。
- `TokenBudgeter`：估算 token，并在超预算时稳定裁剪低优先级文件。
- `SecurityRedactor`：脱敏常见 secret，并输出审计计数。
- `BundleEmitter`：生成 Markdown 或 JSON bundle。
- `CliApp`：解析 CLI 参数、串联数据流、处理错误码。

大型仓库下，CtxSift 会截断 `tree` 和 `manifest.droppedFiles` 元数据，避免输出包被数万条候选路径撑大；被截断数量会通过 `droppedFilesOmitted` 保留。

## 安全默认值

默认会排除或脱敏：

- `.env` / `.env.*`
- `*.pem`、`*.key`、证书和私钥文件
- OpenAI key
- GitHub token
- AWS access key / secret
- JWT / bearer token
- `DATABASE_URL`
- 常见 `password` / `credential` 赋值
- `node_modules`、`dist`、`build`、coverage、二进制文件、大文件

如果使用 `--no-redact`，CtxSift 会继续运行，但会输出明确警告。不要把未脱敏 bundle 分享到公开环境。

## 当前状态

当前仓库已正式发布 `v1.0.0`。

发布页：

- [CtxSift v1.0.0](https://github.com/HF-CYGG/CtxSift/releases/tag/v1.0.0)

当前版本具备：

- 可安装 CLI：`ctxsift`
- 本地路径和公开 GitHub 仓库输入
- 问题感知排序
- diff-aware review bundle
- Markdown / JSON 输出
- 默认安全排除与内容脱敏
- 单元、集成、CLI E2E、安全和 fixture 测试
- GitHub Actions CI
- npm 发布前检查脚本

当前发布门禁：

```bash
pnpm run release:check
```

该命令覆盖：

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm pack --dry-run`
- `pnpm run audit:high`

最近一次 `v1.0.0` 发布验证已通过完整门禁；GitHub Actions CI 对发布提交返回 `success`。

## 大型仓库实测

当前已使用 `microsoft/vscode` 级别的大型生产仓库做压力测试。测试数据统一保存在项目根目录的 `large-project-test/` 下，不进入发布包和 Git 提交。

实测后做过的关键优化：

- 截断大型仓库的 `tree` 和 `droppedFiles` 元数据，单个 JSON bundle 从约 3.4 MB 降到约 130 KB。
- 只对最终输出文件执行内容脱敏，默认 redaction 场景耗时接近 `--no-redact` 对照场景。
- 保留 `droppedFilesOmitted`，避免为了减小输出而丢失审计信息。

## 本地开发

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm pack --dry-run
pnpm run release:check
```

更多文档：

- [快速开始](docs/quickstart.md)
- [CLI 参考](docs/cli.md)
- [安全模型](docs/security.md)
- [Review Bundle](docs/review-bundle.md)
- [架构说明](docs/architecture.md)
- [发布检查清单](docs/release-v1.0.0.md)
