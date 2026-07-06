# v1.1.0-alpha.0 Release Notes

## Summary

CtxSift v1.1.0-alpha.0 is the workspace-aware alpha release candidate. It keeps
the CLI behavior compatible with v1.0.0 while adding package/workspace context,
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

The alpha benchmark report covers 6 deterministic local fixtures:

- Average relevant hit rate: 83.3%.
- Average token saving ratio: 39.8%.
- Average workspace package hit rate: 33.3%.

See [`../benchmark-report.md`](../benchmark-report.md) and
[`../benchmark-report.json`](../benchmark-report.json) for the generated reports.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm pack --dry-run`
- `pnpm run release:check`
- `pnpm bench:fixtures`
- `pnpm bench:report`
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`

## Environment Notes

Some Windows sandbox runs can fail at child-process startup with `spawn EPERM` or
`spawnSync node EPERM`. The release gate was rerun for those commands in an
elevated local context and passed.

## Release Metadata

- Version: `1.1.0-alpha.0`
- Tag: `v1.1.0-alpha.0`
- Release type: alpha prerelease
