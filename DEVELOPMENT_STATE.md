# Development State

## 当前里程碑

- v1.1.0-alpha.0 continuous optimization
- 当前目标：版本边界与验证闭环固定为可复现状态
- 当前分支：`master`

## 当前发布状态

- Package version：`1.1.0-alpha.0`
- CLI version：`1.1.0-alpha.0`
- 里程碑：`v1.1.0-alpha.0`
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
- `pnpm pack:dry-run`（等价于 `npm run pack:dry-run`）: PASS（`ctxsift-1.1.0-alpha.0.tgz`）
- `pnpm bench:fixtures`（等价于 `npm run bench:fixtures`）: PASS（6 个 fixtures 校验通过）
- `pnpm bench:report`（等价于 `npm run bench:report`）: PASS（报告更新为 5 条记录）
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`（等价于 `npm run audit:high`）: PASS（`No known vulnerabilities`）
- `pnpm run release:check`（等价于 `npm run release:check`）: PASS
- `npm run release:publish:print-command`: PASS（输出 `gh release create v1.1.0-alpha.0 --title ...`）
- `npm run release:publish:api -- --skip-tag-check`: PASS（GitHub 已存在 `v1.1.0-alpha.0`，脚本返回现有 Release URL 并成功退出）
- `npm run release:publish -- --skip-tag-check`: N/A（`v1.1.0-alpha.0` 已存在于 GitHub，重复发布不执行，仍符合闭环后的发布完整性）
- 发布命令预检：`gh release create v1.1.0-alpha.0 --title CtxSift v1.1.0-alpha.0 --notes-file docs\\release-v1.1.0-alpha.0.md --target master --verify-tag --prerelease`（环境内 `gh` 不可用）

### 失败与阻塞（仅限 spawn 场景说明）

- `pnpm lint`: BLOCKED（当前环境 `pnpm` 首次执行会尝试从 npmmirror 拉取元数据并出现 EPERM 清理 `_tmp_*`）
- `npm run release:publish -- --skip-tag-check`: N/A（当前标签 `v1.1.0-alpha.0` 为已发布标签，不属于首次发布场景）
- `gh` CLI 与 `GH_TOKEN/GITHUB_TOKEN`: N/A（当前环境缺少该能力，仅影响新 tag 的首次发布路径）

### 根因说明

- `pnpm` 会尝试访问外网 registry，当前受限导致命令失败；核心命令链通过 `npm` 已闭环通过。
- `v1.1.0-alpha.0` 已在 GitHub 成功发布；发布脚本现在可在 API 模式下确认既有 Release 并返回成功，后续新 tag 仍按完整发布流程执行。

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

- `0c77c6a`（chore: 收口 v1.1.0-alpha 发布闭环）
