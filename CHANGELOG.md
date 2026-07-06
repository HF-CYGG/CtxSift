# Changelog

## Unreleased

- None pending for this release branch.

## 1.3.0-alpha.0 - 2026-07-07

- Added a VS Code command example that shells out to the local CtxSift CLI.
- Added a public GitHub-only web demo example that returns CtxSift JSON bundles.
- Added `pnpm test:examples` and included it in `pnpm run release:check`.
- Kept root CLI production dependencies unchanged while adding example workflows.

## 1.2.0-alpha.0 - 2026-07-07

- Promoted the artifact-first GitHub Action workflow to the v1.2 alpha boundary.
- Added regression coverage for read-only default workflow permissions and sticky-comment gating.
- Added v1.2 alpha release notes and updated release metadata.

## 1.1.0-alpha.0 - 2026-07-07

- Added workspace graph alpha for pnpm and `package.json` workspaces.
- Added package-level reasons and workspace score components to selected files.
- Added optional JSON/Markdown workspace graph output.
- Added optional sticky PR review-context comments for the GitHub Actions workflow.
- Added `--workspace-aware`, `--workspace-graph`, and `--package` CLI options.
- Added package manifest parsing, build target extraction, import edge extraction, and package-level ranking helpers.
- Added `--profile balanced|private|strict` with audit risk score and blocked high-risk file reporting.
- Added deterministic local benchmark fixtures, `pnpm bench` scripts, and Markdown/JSON benchmark reports.
- Added root `action.yml` composite action and GitHub Action usage documentation for artifact-only and sticky-comment modes.
- Updated release state documentation for v1.1.0-alpha.0 readiness.

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
