# v1.0.0 Release Draft

## Summary

CtxSift v1.0.0 ships a stable question-aware context packer for local repositories and public GitHub repositories, with diff-aware review bundles, Markdown/JSON output, token budgeting, and default secret redaction.

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
- [ ] Confirm `package.json` version is `1.0.0`.
- [ ] Confirm README does not claim non-v1 features.
- [ ] Create GitHub release using this draft.
