# v1.1.0-alpha.0 Release Notes

## Summary

CtxSift v1.1.0-alpha.0 is the workspace-aware alpha release candidate. It keeps
CLI behavior compatible with v1.0.0 while adding package/workspace context,
benchmark evidence, and GitHub Action documentation for review bundles.

Release tag:

- `v1.1.0-alpha.0`

## Highlights

- Workspace graph alpha for pnpm and `package.json` workspaces.
- Package-level reasons and workspace score components in selected files.
- Optional workspace graph output through `--workspace-graph`.
- Security profiles through `--profile balanced|private|strict`.
- Local benchmark fixtures and generated Markdown/JSON benchmark reports.
- Root composite GitHub Action documentation for artifact-first PR review context.

## Benchmark Snapshot

The alpha benchmark report covers 5 deterministic local fixtures:

- Average relevant hit rate: 80.0%.
- Average token saving ratio: 47.7%.
- Average workspace package hit rate: 40.0%.

See [`benchmarks/benchmark-report.md`](../benchmarks/benchmark-report.md) and
[`benchmarks/benchmark-report.json`](../benchmarks/benchmark-report.json) for the
generated reports.

## Verification

- `npm run lint`: Passed.
- `npm run typecheck`: Passed.
- `npm run test`: Passed（提权环境下）。
- `npm run test:e2e`: Passed.
- `npm run test:examples`: Passed.
- `npm run build`: Passed.
- `npm run pack:dry-run`: Passed（`ctxsift-1.1.0-alpha.0.tgz`）。
- `npm run release:publish:print-command`: Passed。
- `npm run release:publish -- --skip-tag-check`: N/A（`v1.1.0-alpha.0` 已发布，重复发布不执行）。
- `npm run release:publish:api -- --skip-tag-check`: Passed，该 tag 已存在，脚本返回现有 Release URL 并成功退出。
- `npm run release:check`: Passed（包含 lint、typecheck、test、e2e、examples、build、pack、audit）。
- `npm run bench:fixtures`: Passed（6 个静态 fixture）。
- `npm run bench:report`: Passed，动态 `pr-diff` 在该运行环境被跳过。报告已写入 `benchmarks/benchmark-report.md/.json`。
- `npm run audit:high`（`npm run audit --audit-level high --registry https://registry.npmjs.org`）：Passed（当前环境未检出已知高危漏洞）。

Release execution requirement:

- 每个版本构建闭环完成后，需执行：
  - `pnpm run release:publish:print-command`
  - `pnpm run release:publish -- --skip-tag-check`
- `gh` CLI 不可用时可走 token 路径（`--use-api`）；当前环境检测到该 release 已存在，脚本确认既有发布并成功退出。

## Environment Notes

Windows sandbox may fail for child-process startup with `spawn EPERM`, and `pnpm`
and `npm` cache cleanup can be blocked under this environment.

For environments with stable `pnpm`/`gh`/token and network, re-run publish and
audit commands and append results.

## Release Metadata

- Version: `1.1.0-alpha.0`
- Tag: `v1.1.0-alpha.0`
- Release type: alpha prerelease
- Release command preview:
  `gh release create v1.1.0-alpha.0 --title "CtxSift v1.1.0-alpha.0" --notes-file docs/release-v1.1.0-alpha.0.md --target master --verify-tag --prerelease`
- Verified publication status:
  `v1.1.0-alpha.0` 已在 GitHub 发布（https://github.com/HF-CYGG/CtxSift/releases/tag/v1.1.0-alpha.0）。
