# Development State

## Current Milestone

v1.3.0-alpha.0 continuous optimization

## Current Release State

- Current package version: `1.3.0-alpha.0`
- Current CLI version: `1.3.0-alpha.0`
- Current branch: `master`
- Latest release commit: `95ab8a3`
- Published GitHub releases:
  - `v1.1.0-alpha.0`
  - `v1.2.0-alpha.0`
  - `v1.3.0-alpha.0`

## Completed Release Milestones

- `v1.1.0-alpha.0`: workspace graph alpha, security profiles, benchmark reports, version consistency regression coverage.
- `v1.2.0-alpha.0`: artifact-first GitHub Action hardening, read-only default permission coverage, sticky-comment gating coverage.
- `v1.3.0-alpha.0`: VS Code command example, public GitHub-only web demo example, `pnpm test:examples`, example packaging coverage.

## Latest Optimization Cycle - 2026-07-07

- Added `tests/release-state.test.ts` to keep release-facing docs synchronized with `package.json#version`.
- Cleaned `DEVELOPMENT_STATE.md` so the current milestone points at `v1.3.0-alpha.0 continuous optimization`.
- Preserved release evidence and removed stale pre-v1.3 milestone text from the active state file.
- Added Web Demo smoke coverage that rejects GitHub repo URLs with query strings or fragments.
- Tightened the public Web Demo repo allowlist so only bare `https://github.com/owner/repo` and `.git` forms pass.

## Latest Verification Evidence

- `pnpm run release:check`: elevated rerun passed after sandbox `spawn EPERM`; 23 Vitest files / 52 tests passed.
- `pnpm test tests/release-state.test.ts`: red phase confirmed stale `DEVELOPMENT_STATE.md`; green phase passed after state cleanup.
- `pnpm run release:check`: post-cleanup elevated rerun passed with 24 Vitest files / 53 tests.
- `pnpm test:examples`: red phase failed on a query-suffixed GitHub URL; green phase passed after Web Demo URL allowlist tightening.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 24 Vitest files / 53 tests, E2E, examples, build, pack dry-run, and high audit.
- `pnpm pack --dry-run`: latest full gate packed `ctxsift@1.3.0-alpha.0` and included `examples`.
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`: latest full gate reported no known vulnerabilities.

## Known Environment Notes

- Windows sandbox runs can block Vitest/esbuild or Node child processes with `spawn EPERM`; affected validation commands are rerun with elevated permissions.
- Networked npm audit and GitHub publication checks require elevated/network-enabled execution in this environment.

## Next Step

- Continue small TDD optimization cycles: pick one release, security, benchmark, example, or CLI behavior invariant; write a failing test; implement the smallest fix; rerun targeted and release-gate validation.

## Latest Milestone Commit Hash

- `af1a7bc` latest committed optimization before the current Web Demo allowlist cycle; current cycle pending commit.
