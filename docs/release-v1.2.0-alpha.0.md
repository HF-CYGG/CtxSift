# v1.2.0-alpha.0 Release Notes

## Summary

CtxSift v1.2.0-alpha.0 is the GitHub Action hardening alpha. It keeps the CLI
and bundle schema compatible while formalizing the artifact-first pull request
workflow and optional sticky PR summary comments.

Release tag:

- `v1.2.0-alpha.0`

## Highlights

- Root composite `action.yml` for review-context generation.
- Default artifact-only mode with Markdown and JSON review bundles.
- Default workflow permission remains `contents: read`.
- Sticky PR comments remain opt-in through `comment: "true"` and
  `github-token`.
- Sticky comments contain only review metadata and never embed source chunks.

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

## Release Metadata

- Version: `1.2.0-alpha.0`
- Tag: `v1.2.0-alpha.0`
- Release type: alpha prerelease
