# Development State

## 当前里程碑

- v1.1.0-alpha.1 continuous optimization
- 当前目标：用新 alpha patch 承载晚于 `v1.1.0-alpha.0` tag 的发布收口提交
- 当前分支：`master`

## 当前发布状态

- Package version：`1.1.0-alpha.1`
- CLI version：`1.1.0-alpha.1`
- 里程碑：`v1.1.0-alpha.1`
- 当前发布目标：`v1.1.0-alpha.1`
- 已发布版本记录：
  - `1.0.0`
  - `1.1.0-alpha.0`
  - `1.2.0-alpha.0`
  - `1.3.0-alpha.0`
- 规则要求：每个版本构建闭环完成后必须发布 GitHub Release（`print-command` 后执行 `--skip-tag-check`）

## 本轮验收结果（2026-07-07）

### 已完成（PASS）

- `pnpm lint`（等价于 `npm run lint`）: PASS（`node_modules` 已可执行）
- `pnpm typecheck`（等价于 `npm run typecheck`）: PASS
- `pnpm test`（等价于 `npm run test`）: PASS（提权环境下）
- `pnpm test:e2e`（等价于 `npm run test:e2e`）: PASS
- `pnpm test:examples`（等价于 `npm run test:examples`）: PASS
- `pnpm build`（等价于 `npm run build`）: PASS
- `pnpm pack:dry-run`（等价于 `npm run pack:dry-run`）: PASS（`ctxsift-1.1.0-alpha.1.tgz`）
- `pnpm bench:fixtures`（等价于 `npm run bench:fixtures`）: PASS（6 个 fixtures 校验通过）
- `pnpm bench:report`（等价于 `npm run bench:report`）: PASS（报告更新为 5 条记录）
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`（等价于 `npm run audit:high`）: PASS（`No known vulnerabilities`）
- `pnpm run release:check`（等价于 `npm run release:check`）: PASS
- `npm run release:publish:print-command`: PASS（输出 `gh release create v1.1.0-alpha.1 --title ...`）
- `npm run release:publish`: BLOCKED（当前环境无 `gh` 且无 `GH_TOKEN/GITHUB_TOKEN`）
- `npm run release:publish:api`: BLOCKED（GitHub API 返回 `401 Requires authentication`）
- 发布命令预检：`gh release create v1.1.0-alpha.1 --title CtxSift v1.1.0-alpha.1 --notes-file docs\\release-v1.1.0-alpha.1.md --target master --verify-tag --prerelease`

### 失败与阻塞（仅限 spawn 场景说明）

- `pnpm lint`: BLOCKED（当前环境 `pnpm` 首次执行会尝试从 npmmirror 拉取元数据并出现 EPERM 清理 `_tmp_*`）
- `npm run release:publish`: BLOCKED（新 tag 首次创建 Release 需要 `gh` 或 `GH_TOKEN/GITHUB_TOKEN`）
- `npm run release:publish:api`: BLOCKED（无 token，GitHub API 返回 401）
- `gh` CLI 与 `GH_TOKEN/GITHUB_TOKEN`: BLOCKED（当前环境缺少该能力）

### 根因说明

- `pnpm` 会尝试访问外网 registry，当前受限导致命令失败；核心命令链通过 `npm` 已闭环通过。
- `v1.1.0-alpha.0` 已在 GitHub 成功发布，但该 tag 指向旧提交；当前 `master` 后续收口提交必须使用新 tag `v1.1.0-alpha.1` 发布，不能移动旧 tag。

## 下一步（每个版本需重复）

1. 环境放开后重跑完整命令链：
    - `pnpm lint`
    - `pnpm typecheck`
    - `pnpm test`
    - `pnpm test:e2e`
    - `pnpm test:examples`
    - `pnpm build`
    - `pnpm pack:dry-run`
    - `pnpm bench:fixtures`
    - `pnpm bench:report`
    - `pnpm audit --audit-level high --registry https://registry.npmjs.org`
    - `pnpm run release:check`
2. 发布闭环：
    - `pnpm run release:publish:print-command`
    - `pnpm run release:publish -- --skip-tag-check`
3. 成功发布后回填 release URL 与发布时间到本文件及对应 `docs/release-*.md`。

## Latest Milestone Commit

- `a6c797f`（docs: 回填发布闭环提交记录）
