# AGENTS.md

## 全局 Codex 指令

## 通用工作习惯

- 默认使用中文回答。
- 修改代码前先阅读项目结构和相关文件。
- 不要无理由重构。
- 不要引入新依赖，除非先说明原因。
- 不要泄露密钥、Token、Cookie、数据库密码等敏感信息。
- 修改后说明改了哪些文件、为什么改、如何测试。
- 遇到风险操作，如删除文件、数据库迁移、大规模重构，需要先说明风险。

## Superpowers 全局工作流

- 每次收到任务后，在回答、提问、读文件或改代码前，先检查是否有已安装的 Superpowers skill 适用。
- 默认优先使用 `using-superpowers` 作为总控规则；只要有 1% 可能适用，就调用对应 skill。
- 新功能、创意实现、产品/界面/架构设计前，先使用 `brainstorming`。
- 多步骤实现前，先使用 `writing-plans` 形成可执行计划。
- 执行已确认计划时，不得自动使用 `subagent-driven-development`、`dispatching-parallel-agents` 或任何子智能体；只有我明确要求“使用子 agent / 子智能体 / 并行 agent / 团队流程”时才允许调用。
- 实现功能或修复 bug 前，使用 `test-driven-development`，除非我明确要求跳过测试或当前任务不适合 TDD。
- 遇到 bug、测试失败、构建失败或异常行为时，先使用 `systematic-debugging` 找根因，不要直接猜测修复。
- 声称完成、修复或测试通过前，使用 `verification-before-completion` 做最终验证。
- 用户的明确指令优先于 Superpowers；如果 Superpowers 与我的直接要求冲突，按我的要求执行并简要说明。

### 子智能体调用限制

- 默认禁止自动调用任何子智能体。只有当我明确授权使用子 agent 时，才允许。

## Project

This repository implements CtxSift, a question-aware codebase context packer for AI coding agents.

CtxSift should pack the right files for the task, not the whole repository.

## Product Principles

- Do not build a generic full-repo-to-text clone.
- Prioritize question-aware file selection.
- Prioritize diff-aware review bundles.
- Prioritize local-first execution.
- Prioritize secret redaction and auditability.
- Prefer deterministic, explainable ranking before adding heavy ML or vector databases.
- Keep the CLI fast, scriptable, and easy to install.

## Tech Expectations

- Prefer TypeScript and Node.js.
- Prefer pnpm.
- Prefer small, mature dependencies.
- Keep core logic testable as pure modules.
- Keep CLI code thin.
- Do not introduce LangChain, vector databases, cloud services, or MCP as required v1 dependencies.
- Do not add production dependencies without a clear reason.

## Language Rules

- PR/RP 描述、git 提交信息和代码注释必须使用中文；引用命令、API 名称、文件路径、错误文本时可保留原文。

## Required Commands

Before considering work complete, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm pack --dry-run
pnpm run release:check
```

If a command does not exist, create the closest equivalent script.

## Definition of Done

A task is done only when:

- implementation is complete;
- tests are added or updated;
- all relevant tests pass;
- documentation reflects the actual behavior;
- CLI examples work;
- security-sensitive behavior is tested;
- no README claim describes an unimplemented feature.

## Security Rules

- Redaction is on by default.
- `.env`, private keys, tokens, credentials, certificates, and generated secrets must not be exported by default.
- Do not trust remote repository configuration by default.
- Do not print secrets in logs.
- Do not weaken tests, linting, or type checks to pass CI.
- If `--no-redact` exists, it must show a clear warning.

## Release Rules

Do not mark the project as v1.0.0 unless:

- CLI works through the package bin.
- Markdown and JSON outputs are stable.
- diff-aware mode works.
- security redaction tests pass.
- CI and `pnpm run release:check` pass.
- README, docs, changelog, and package metadata are complete.

## State Persistence

Maintain DEVELOPMENT_STATE.md during long-running work. It must include:

- current milestone;
- completed tasks;
- failed tests;
- unresolved blockers;
- next step;
- latest verification commands;
- latest commit hash if committed.

## Long-running autonomous development loop

1. Inspect current repository state.
2. Update DEVELOPMENT_STATE.md.
3. Plan the smallest coherent milestone.
4. Implement.
5. Add or update tests.
6. Run relevant tests.
7. Fix failures.
8. Re-run tests.
9. Update docs.
10. Commit only when the milestone is stable.

## Git 与 PR 全局规则

### 发布规则（v1.1.0-alpha 闭环）

- 每个版本闭环必须满足：`version` 已更新、文档一致、验证证据入档，并在 GitHub 创建 Release。
- 建议顺序：
  - `npm run release:check`（或已稳定环境下等价闭环）
  - `npm run release:publish:print-command`
  - `npm run release:publish -- --skip-tag-check`
- 发布前后不得更改 CLI 公共行为与输出 schema。
- 发布结果（含 Release URL/状态）必须写入 `DEVELOPMENT_STATE.md` 当前里程碑区段。


### Git 提交信息规则（仅输出提交信息，不要额外解释）

- 使用中文生成 Git 提交信息，格式必须参考以下风格：

feat: 新增用户邮箱支持、会话在线状态追踪与通知中心功能

- 新增用户邮箱字段，为 sys_user 表添加 email 列并添加唯一约束，更新前后端用户创建/编辑的表单、校验逻辑及接口定义
- 新增会话心跳机制，后台添加会话实时更新接口，前端自动发送心跳维持会话，后端采用节流策略降低数据库写压力
- 新增完整的通知中心系统:
  - 新增通知规则、通知事件、站内收件箱、外发记录等数据库实体与表结构
  - 实现通知事件触发、规则匹配、多渠道分发的完整流程
  - 新增后台通知配置页面，支持配置通知接收人、触发条件与外发渠道
  - 集成订单、客服消息的事件通知逻辑
- 新增管理端在线状态页面，展示当前在线用户与会话情况

#### 规则要求

1. 使用 Conventional Commits 格式，例如 feat、fix、refactor、docs、style、test、chore、perf、build、ci。
2. 如果是业务模块改动，可以使用作用域，例如 feat(o2o):、fix(order):、refactor(notification):。
3. 标题必须简短明确，优先使用“动词 + 功能对象 + 关键变化”的表达方式。
4. 标题控制在 50 字以内。
5. 正文使用中文项目符号，概括主要改动。
6. 每个要点应说明“改了什么 + 为什么/带来什么效果”。
7. 如果一个要点下面包含多个子功能，可以使用二级缩进列表。
8. 不要写“由 AI 生成”“Codex 修改”等无关内容。
9. 不要堆砌文件名，除非文件名对理解改动很关键。
10. 不要写空泛表述，例如“优化代码”“修复问题”，必须说明具体优化或具体问题。
11. 如果改动很小，可以只生成一行标题，不强制写正文。
12. 如果涉及数据库、接口、权限、通知、订单、客服消息、配置项，需要在正文中明确说明。
13. 如果涉及风险较高的改动，例如数据迁移、权限校验、通知分发、支付或订单状态流转，需要在正文中单独列出。
14. 输出只包含 commit message，不要额外解释。


#### 任务示例（按你当前要求）

feat新增教师账号支持并重构客户端账号体系

1. 完善客户端账号体系，正式支持教师账号:
   1. 新增 `ClientUserProfileKind` 枚举，将账号划分为个人、教师、部门共享三类
   2. 重构客户端注册流程，废弃原部门注册模式，新增教师账号注册通道，支持通过教职工号自动拉取目录信息
   3. 新增数据库启动时的自动迁移逻辑，将历史部门账号迁移为已核验的教师个人账号
2. 更新全端展示文案与 U 组件，替换原部门账号相关表述为教师/部门共享账号
3. 重构后端用户管理 API，支持按身份类型筛选和创建不同类型的客户端账号
4. 修复教职工目录服务的关联查询逻辑，适配新的账号核验规则
5. 新增客户端账号治理相关的验证脚本

### PR 示例（按你当前需求）

#### 标题

feat新增教师账号支持并重构客户端账号体系

#### 描述（模板）

## 变更概述

- 完成客户端账号体系改造，支持教师账号接入主链路，替代历史的部门账号默认流程。
- 通过数据库迁移与接口重构，保证历史数据平滑切换，减少账号展示与核验逻辑偏差。

## 主要改动

- 新增 `ClientUserProfileKind`，将账号类型细分为个人、教师、部门共享。
- 重构客户端注册流程：
  - 去除原部门注册入口的默认路径。
  - 新增教师账号注册通道。
  - 教职工号可自动关联并补齐目录信息。
- 新增数据库启动迁移逻辑，将历史部门账号迁移为已核验教师个人账号。
- 全端文案与 U 组件更新为“教师账号/部门共享账号”表述。
- 后端用户管理 API 增加按身份类型筛选与分类型创建能力。
- 修复教职工目录服务关联查询，使其与新的核验规则一致。
- 增加客户端账号治理验证脚本，用于回归校验。

## 测试与验证

- 已按既有标准完成 lint/typecheck/test:e2e/build/pack/release:check 等闭环命令（如受限环境存在 EPERM，请记录并在放开后复跑）。
- 验证历史部门账号迁移脚本与教师账号注册链路的成功率、错误码与回滚行为。
- 如有未执行的场景，需在描述中标注“未实际执行，需要后续本地或测试环境验证”。

## 风险与注意事项

- 数据迁移与账号类型重定义涉及历史账号兼容性，需优先在预发数据上演练。
- 目录信息联动失败时，需控制回退路径，避免影响现有普通个人账号登录与创建。
- 仅在权限已核实的后台角色开放教师账号管理能力，避免越权创建。

### Pull request 说明规则（标题+正文）

请使用中文生成 Pull Request 标题和描述，整体风格要简洁、正式、便于代码审查。

#### 标题格式

feat: 新增用户邮箱支持、会话在线状态追踪与通知中心功能

或带模块作用域：
feat(o2o): 更新预订单展示单号规则与校验逻辑

标题要求：
1. 使用 Conventional Commits 格式，例如 feat、fix、refactor、docs、style、test、chore、perf、build、ci。
2. 可以根据模块添加作用域，例如 order、o2o、notification、customer-service、admin、auth、database、frontend、backend。
3. 标题应准确概括本次 PR 的核心目标，避免过长。
4. 不要写“Codex 修改”“AI 生成”等无关内容。

#### PR 描述格式

PR 描述必须使用以下 Markdown 格式：

## 变更概述

- 简要说明本次 PR 解决的问题或新增的能力。
- 如果涉及多个模块，按功能分点说明。

## 主要改动

- 新增 / 修改 / 重构的核心功能点。
- 涉及数据库、接口、前端页面、后端服务、权限、通知、订单状态、客服消息等内容时必须明确列出。
- 如果有多级功能，可使用二级缩进列表。

## 测试与验证

- 说明已验证或建议验证的内容。
- 如果没有实际运行测试，需要明确写“未实际运行，需要后续在本地或测试环境验证”。

## 风险与注意事项

- 说明可能影响的功能范围。
- 如果涉及数据库迁移、通知发送、订单状态、权限校验、外部接口、消息推送，需要单独列出风险。
- 如果风险较低，也需要写明“风险较低，主要影响范围为……”。

#### 示例格式

## 变更概述

- 新增通知中心能力，支持订单和客服消息事件触发后的站内通知、邮箱提醒与飞书机器人提醒。
- 支持在管理端配置通知渠道、通知规则和用户提醒偏好。

## 主要改动

- 新增通知规则、通知事件、站内收件箱和外发记录等数据结构。
- 新增订单和客服消息事件触发逻辑。
- 新增飞书机器人 Webhook 配置与签名校验发送逻辑。
- 新增邮箱提醒发送任务和失败记录。
- 新增管理端通知配置页面，支持配置接收人、触发事件和提醒渠道。

## 测试与验证

- 验证新订单创建后可生成站内通知。
- 验证客服消息创建后可触发提醒事件。
- 验证邮箱提醒和飞书机器人测试发送逻辑。
- 未实际运行完整回归测试时，需要注明待后续验证。

## 风险与注意事项

- 涉及通知分发和外部 Webhook 调用，需要注意重复发送和失败重试。
- 飞书 Webhook 和签名密钥属于敏感配置，不应输出到日志或提交到仓库。
- 通知规则配置错误可能导致部分管理账号无法收到提醒。

#### 规则要求

1. PR 描述必须清楚说明“为什么改、改了什么、如何验证、有什么风险”。
2. 不要只罗列文件名。
3. 不要空泛描述。
4. 不要编造未做过的测试。
5. 输出内容应适合直接发布到 GitHub Pull Request。

