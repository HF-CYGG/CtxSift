# Development State

## Current Milestone

v1.3.0-alpha.0 continuous optimization

## Current Release State

- Current package version: `1.3.0-alpha.0`
- Current CLI version: `1.3.0-alpha.0`
- Current branch: `master`
- Latest release commit: `95ab8a3`
- Published GitHub releases:
  - `v1.0.0`
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
- Added Web Demo smoke coverage for non-strict `maxTokens` values such as `12abc` and `1.5`.
- Tightened Web Demo `maxTokens` parsing so only safe positive integer values pass through to the CLI.
- Added VS Code command smoke coverage for non-strict `maxTokens` values such as `12abc` and `1.5`.
- Tightened VS Code command helper `maxTokens` parsing so only safe positive integer values pass through to the CLI.
- Added CLI option coverage for non-strict `--max-tokens` values such as `12abc` and `1.5`.
- Tightened core CLI `--max-tokens` parsing so only safe positive integer values are accepted.
- Added CLI option coverage that rejects GitHub repo URLs with query strings or fragments.
- Tightened core CLI `--repo` GitHub URL parsing so only bare `https://github.com/owner/repo` and `.git` forms pass.
- Added repository source coverage for strict GitHub URL recognition and unsupported remote URL rejection.
- Tightened repository source preparation so non-GitHub HTTP(S) URLs are rejected before local loading.
- Added CLI option coverage that rejects unsupported remote repo URLs such as `https://example.com/...` and `http://github.com/...`.
- Tightened core CLI `--repo` parsing so unsupported HTTP(S) remote URLs fail during argument parsing.
- Added CLI option coverage that rejects blank required values such as whitespace-only `--repo` and `--ask`.
- Tightened core CLI required-value parsing so whitespace-only values are treated as missing.
- Added GitHub PR comment coverage that rejects invalid owner, repo, and pull request route parameters before fetching.
- Tightened GitHub PR comment upsert validation to block path injection and non-positive pull request numbers.
- Added GitHub PR comment CLI coverage that rejects whitespace-only `--bundle` and `--artifact` values.
- Tightened GitHub PR comment CLI required-value parsing so whitespace-only values are treated as missing.
- Added GitHub PR comment CLI coverage for strict `GITHUB_REPOSITORY` owner/repo parsing.
- Tightened GitHub PR comment CLI repository parsing so extra path segments and blank owner/repo values are rejected.
- Added GitHub PR comment CLI coverage for strict pull request event number parsing.
- Tightened GitHub PR comment CLI event parsing so missing, non-integer, or non-positive pull request numbers are rejected before comment upsert.
- Added GitHub PR comment coverage that rejects whitespace-only tokens before fetching.
- Tightened GitHub PR comment upsert validation so blank tokens are rejected before Authorization headers are built.
- Added GitHub PR comment coverage that trims token whitespace before sending Authorization headers.
- Tightened GitHub PR comment upsert header construction so validated tokens are normalized once before list, update, or create requests.
- Added GitHub PR comment coverage that rejects whitespace-only comment bodies before fetching.
- Tightened GitHub PR comment upsert validation so blank comment bodies are rejected before GitHub requests are sent.
- Added GitHub PR comment coverage that rejects invalid existing sticky comment ids before updating.
- Tightened GitHub PR comment response handling so sticky comment ids from GitHub JSON are validated as positive integers before update URLs are built.
- Added GitHub PR comment coverage that rejects non-array comments list responses before writing.
- Tightened GitHub PR comment response handling so the comments list JSON must be an array before sticky-comment lookup.
- Added GitHub PR comment coverage that rejects non-object comments list items before writing.
- Tightened GitHub PR comment response handling so each comments list item must be an object before sticky-comment lookup.
- Added GitHub PR comment coverage that rejects non-string comment body fields before sticky-comment matching.
- Tightened GitHub PR comment response handling so present comment body fields must be strings before `.includes` matching.
- Added GitHub PR comment CLI coverage that rejects invalid `GITHUB_REPOSITORY` path segment characters.
- Tightened GitHub PR comment CLI repository parsing so owner and repo segments reject whitespace, query, or fragment characters before comment upsert.
- Added GitHub PR comment coverage that rejects `.` and `..` owner/repo path segments before fetching.
- Tightened GitHub PR comment route and CLI repository validation so dot segments are rejected before GitHub URLs are built.
- Added GitHub PR comment format coverage that keeps the selected-file summary separator stable.
- Restored the PR comment selected-file separator after a UTF-8 encoding regression.

## Latest Verification Evidence

- `pnpm run release:check`: elevated rerun passed after sandbox `spawn EPERM`; 23 Vitest files / 52 tests passed.
- `pnpm test tests/release-state.test.ts`: red phase confirmed stale `DEVELOPMENT_STATE.md`; green phase passed after state cleanup.
- `pnpm run release:check`: post-cleanup elevated rerun passed with 24 Vitest files / 53 tests.
- `pnpm test:examples`: red phase failed on a query-suffixed GitHub URL; green phase passed after Web Demo URL allowlist tightening.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 24 Vitest files / 53 tests, E2E, examples, build, pack dry-run, and high audit.
- `pnpm test:examples`: red phase failed on missing exception for `maxTokens=12abc`; green phase passed after strict positive-integer parsing.
- `pnpm test:examples`: red phase failed on missing VS Code helper exception for `maxTokens=12abc`; green phase passed after strict positive-integer parsing.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 24 Vitest files / 53 tests, E2E, examples, build, pack dry-run, and high audit after VS Code helper tightening.
- `pnpm test tests/cli-options.test.ts`: red phase failed on missing CLI exception for `--max-tokens 12abc`; green phase passed with 3 tests after strict positive-integer parsing.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 24 Vitest files / 54 tests, E2E, examples, build, pack dry-run, and high audit after core CLI tightening.
- `pnpm test tests/cli-options.test.ts`: red phase failed on missing CLI exception for `--repo https://github.com/HF-CYGG/CtxSift?tab=readme`; green phase passed with 4 tests after strict GitHub repo URL parsing.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 24 Vitest files / 55 tests, E2E, examples, build, pack dry-run, and high audit after CLI GitHub repo URL tightening.
- `pnpm test tests/repo-source.test.ts`: red phase failed on missing exported GitHub URL recognizer and unsupported remote URL rejection; green phase passed with 2 tests after repository source tightening.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 57 tests, E2E, examples, build, pack dry-run, and high audit after repository source tightening.
- `pnpm test tests/cli-options.test.ts`: red phase failed on missing CLI exception for unsupported remote repo URLs; green phase passed with 5 tests after CLI remote URL tightening.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 58 tests, E2E, examples, build, pack dry-run, and high audit after CLI unsupported remote URL tightening.
- `pnpm test tests/cli-options.test.ts`: red phase failed on missing CLI exception for whitespace-only `--repo`; green phase passed with 6 tests after required-value tightening.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 59 tests, E2E, examples, build, pack dry-run, and high audit after CLI required-value tightening.
- `pnpm test tests/github-pr-comment.test.ts`: red phase failed because invalid owner reached fetch; green phase passed with 4 tests after route parameter validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 60 tests, E2E, examples, build, pack dry-run, and high audit after GitHub PR comment route parameter tightening.
- `pnpm test tests/github-pr-comment.test.ts`: red phase failed on missing exception for whitespace-only `--bundle`; green phase passed with 5 tests after PR comment CLI required-value tightening.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 61 tests, E2E, examples, build, pack dry-run, and high audit after PR comment CLI required-value tightening.
- `pnpm test tests/github-pr-comment.test.ts`: red phase failed because `parseGitHubRepository` was missing; green phase passed with 6 tests after strict repository parsing.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 62 tests, E2E, examples, build, pack dry-run, and high audit after PR comment CLI repository parsing tightening.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because `parsePullRequestNumber` was missing; green phase passed with 7 tests after strict pull request event parsing.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 63 tests, E2E, examples, build, pack dry-run, and high audit after PR comment CLI pull request event parsing tightening.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because whitespace-only token reached fetch; green phase passed with 7 tests after token validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 63 tests, E2E, examples, build, pack dry-run, and high audit after PR comment token validation.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because Authorization headers preserved token whitespace; green phase passed with 8 tests after token normalization.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 64 tests, E2E, examples, build, pack dry-run, and high audit after PR comment token normalization.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because whitespace-only comment body reached fetch; green phase passed with 8 tests after body validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 64 tests, E2E, examples, build, pack dry-run, and high audit after PR comment body validation.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because invalid existing sticky comment id reached update fetch; green phase passed with 9 tests after comment id validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 65 tests, E2E, examples, build, pack dry-run, and high audit after PR comment id validation.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because a non-array comments response reached `.find`; green phase passed with 10 tests after comments response shape validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 66 tests, E2E, examples, build, pack dry-run, and high audit after PR comment comments-response validation.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because a null comments response item reached sticky-comment lookup; green phase passed with 11 tests after comments item validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 67 tests, E2E, examples, build, pack dry-run, and high audit after PR comment comments-item validation.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because a numeric comment body reached sticky-comment matching; green phase passed with 12 tests after comment body type validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 68 tests, E2E, examples, build, pack dry-run, and high audit after PR comment comment-body field validation.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because `GITHUB_REPOSITORY` accepted invalid path segment characters; green phase passed with 12 tests after repository segment validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 68 tests, E2E, examples, build, pack dry-run, and high audit after PR comment repository segment validation.
- `pnpm test tests/github-pr-comment.test.ts`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated red phase failed because dot owner/repo segments reached fetch or repository parsing; green phase passed with 12 tests after dot-segment validation.
- `pnpm run release:check`: sandbox run hit Vitest/esbuild `spawn EPERM`; elevated rerun passed with 25 Vitest files / 68 tests, E2E, examples, build, pack dry-run, and high audit after PR comment dot-segment validation.
- `pnpm test tests/github-pr-comment.test.ts`: elevated red phase failed because the selected-file summary contained `�?`; green phase passed with 12 tests after restoring the separator.
- `pnpm run release:check`: elevated rerun passed with 25 Vitest files / 68 tests, E2E, examples, build, pack dry-run, and high audit after PR comment separator regression coverage.
- `pnpm pack --dry-run`: latest full gate packed `ctxsift@1.3.0-alpha.0` and included `examples`.
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`: latest full gate reported no known vulnerabilities.

## Known Environment Notes

- Windows sandbox runs can block Vitest/esbuild or Node child processes with `spawn EPERM`; affected validation commands are rerun with elevated permissions.
- Networked npm audit and GitHub publication checks require elevated/network-enabled execution in this environment.

## Next Step

- Continue small TDD optimization cycles: pick one release, security, benchmark, example, or CLI behavior invariant; write a failing test; implement the smallest fix; rerun targeted and release-gate validation.

## Latest Milestone Commit Hash

- `24178ce` latest committed optimization before the current GitHub PR comment dot-segment validation cycle; current cycle pending commit.
