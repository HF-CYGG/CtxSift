# v1.0.0 Release Notes

## Summary

CtxSift v1.0.0 is the first stable release of the question-aware context packer
for local repositories and public GitHub repositories. It ships the installable
`ctxsift` CLI, diff-aware review bundles, Markdown/JSON output, token budgeting,
large-repository metadata caps, and default secret redaction.

Release page:

- https://github.com/HF-CYGG/CtxSift/releases/tag/v1.0.0

## Highlights

- `ctxsift --repo . --ask "Where does auth start?"`
- `ctxsift --repo . --diff main...HEAD --mode review`
- `ctxsift --repo https://github.com/user/repo --ask "How does routing work?"`
- JSON schema `1.0` for downstream tooling.
- GitHub Action example for PR review-context artifacts.
- Tested against real repositories including Y-Link, VSCode, Kubernetes, Django,
  and Spring Framework.

## Verification

- `pnpm run release:check` passed.
- Vitest: 13 test files, 27 tests passed.
- CLI E2E passed.
- TypeScript build passed.
- `pnpm pack --dry-run` passed.
- `pnpm audit --audit-level high` reported no known vulnerabilities.
- GitHub Actions CI passed on the release commit.

## Release Metadata

- Version: `1.0.0`
- Tag: `v1.0.0`
- Release commit: `e9a5c04`
- Release type: stable, not prerelease
