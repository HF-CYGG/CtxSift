# v1.0.0 Release Candidate Checklist

## Summary

CtxSift v1.0.0 is prepared as a stable question-aware context packer for local repositories and public GitHub repositories, with diff-aware review bundles, Markdown/JSON output, token budgeting, and default secret redaction.

## Highlights

- `ctxsift --repo . --ask "Where does auth start?"`
- `ctxsift --repo . --diff main...HEAD --mode review`
- `ctxsift --repo https://github.com/user/repo --ask "How does routing work?"`
- JSON schema `1.0` for downstream tooling.
- GitHub Action example for PR review-context artifacts.

## Pre-Publish Checklist

- [ ] `pnpm install`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e`
- [ ] `pnpm build`
- [ ] `pnpm pack --dry-run`
- [ ] `pnpm run audit:high`
- [ ] `pnpm run release:check`
- [ ] Confirm `package.json` version is `1.0.0`.
- [ ] Confirm README does not claim non-v1 features.
- [ ] Confirm GitHub Actions CI passed on the release branch.
- [ ] Confirm install smoke from the generated package tarball.
- [ ] Confirm public GitHub repository input smoke.
- [ ] Create GitHub release using this draft.
