# v1.3.0-alpha.0 Release Notes

## Summary

CtxSift v1.3.0-alpha.0 adds editor and web workflow examples while keeping the
CLI as the source of truth. The root CLI remains dependency-light and compatible
with the v1 JSON and Markdown outputs.

Release tag:

- `v1.3.0-alpha.0`

## Highlights

- VS Code command example in `examples/vscode-command`.
- Public web demo example in `examples/public-web-demo`.
- Web demo accepts only public `https://github.com/owner/repo` URLs.
- Example workflows default to `profile: private`.
- `pnpm test:examples` smoke-checks example argument construction and URL
  safety.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:examples`
- `pnpm build`
- `pnpm pack --dry-run`
- `pnpm run release:check`
- `pnpm bench:fixtures`
- `pnpm bench:report`
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`

## Release Metadata

- Version: `1.3.0-alpha.0`
- Tag: `v1.3.0-alpha.0`
- Release type: alpha prerelease
