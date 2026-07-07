# Changelog

## Unreleased

- None pending for this release branch.

## 1.1.0-alpha.1 - 2026-07-07

### 已实现功能

- 发布边界修正：用 `1.1.0-alpha.1` 承载 `master` 上晚于 `v1.1.0-alpha.0` 的发布收口提交，避免移动已发布 tag。
- 发布脚本收敛：`release:publish:api` 在 release 已存在时返回现有 Release URL 并成功退出，便于同版本闭环复核。
- 基准产物收敛：`bench:report` 仅写入 `benchmarks/benchmark-report.md/json` 主产物，避免根目录旧报告进入同步范围。
- 同步范围收敛：保留本地规则文件和临时文件在忽略范围内，仅同步版本、文档、脚本、测试和主基准证据。

### 未发布功能

- 本次 alpha patch 不新增 CLI 公共能力，不改变输出 schema。

## 1.3.0-alpha.0 - 2026-07-07

- Added a VS Code command example that shells out to the local CtxSift CLI.
- Added a public GitHub-only web demo example that returns CtxSift JSON bundles.
- Added `pnpm test:examples` and included it in `pnpm run release:check`.
- Added release publishing helper `pnpm run release:publish` and `pnpm run release:publish:print-command` for GitHub Release flow.
- Kept root CLI production dependencies unchanged while adding example workflows.

## 1.2.0-alpha.0 - 2026-07-07

- Promoted the artifact-first GitHub Action workflow to the v1.2 alpha boundary.
- Added regression coverage for read-only default workflow permissions and sticky-comment gating.
- Added v1.2 alpha release notes and updated release metadata.

## 1.1.0-alpha.0 - 2026-07-07

### 已实现功能

- 版本边界收口：将版本号固定为 `1.1.0-alpha.0`，并在 README、发布说明、`DEVELOPMENT_STATE.md` 与 `AGENTS.md` 中同步版本信息与发布闭环要求。
- 发布策略收敛：新增并保留 `pnpm run release:publish` 与 `pnpm run release:publish:print-command`，将 GitHub Release 作为版本交付闭环标准步骤。
- 文档与行为一致：对 `docs/github-action.md`、`docs/review-bundle.md`、`docs/benchmark.md` 与 `docs/release-v1.1.0-alpha.0.md` 进行齐套更新，明确 artifact、comment 开关与权限边界。
- 基准复核：新增可复用基准报告输出，记录选中文件数、token 节省率、命中率与安全发现，并同步到 `benchmarks/benchmark-report.md/json`。
- 发布记录模板：更新 `DEVELOPMENT_STATE.md` 为固定里程碑模板，并记录 release:check/audit/pack 命令结果与阻塞原因。

### 未发布功能

- 本次 v1.1.0-alpha 收口不新增教师账号体系或其他业务功能；如有新增能力需在后续版本条目中补齐。

## 1.0.0 - 2026-07-07

- Added installable `ctxsift` CLI.
- Added local directory and public GitHub repository inputs.
- Added question-aware deterministic file ranking with reasons.
- Added diff-aware review bundle mode.
- Added Markdown and JSON schema `1.0` outputs.
- Added token budgeting, dropped-file reasons, and audit summaries.
- Added default redaction for common secret classes and `--no-redact` warning.
- Added GitHub Actions CI and review-bundle workflow example.
- Added unit, integration, CLI E2E, fixture, diff, and security tests.
- Added release gate script covering lint, typecheck, tests, E2E, build, pack dry-run, and high-severity audit.
- Added large-repository metadata caps and selected-output redaction for production-scale repositories.
