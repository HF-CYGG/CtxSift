# v1.1.0-alpha.1 Release Notes

## Summary

CtxSift v1.1.0-alpha.1 is a release-closure patch for the v1.1 alpha line. It
keeps CLI behavior and output schemas unchanged while moving the post
`v1.1.0-alpha.0` release-closure commits onto a new immutable release tag.

Release tag:

- `v1.1.0-alpha.1`

## Highlights

- Keeps the `v1.1.0-alpha.0` tag immutable and uses a new alpha patch tag for
  current `master`.
- Confirms existing GitHub Releases through `release:publish:api` without
  treating already-published tags as failures.
- Writes benchmark reports only to `benchmarks/benchmark-report.md` and
  `benchmarks/benchmark-report.json`.
- Keeps local rules, temporary files, cache directories, and root legacy
  benchmark reports out of the synchronized release scope.

## Verification

- `npm run release:check`: Passed.
- `npm run bench:fixtures`: Passed（6 fixtures）。
- `npm run bench:report`: Passed，报告写入 `benchmarks/benchmark-report.md/json`。
- `npm run release:publish:print-command`: Passed，生成 `v1.1.0-alpha.1` release 命令。
- `npm run release:publish`: Blocked（当前环境无 `gh` 且无 `GH_TOKEN/GITHUB_TOKEN`）。
- `npm run release:publish:api`: Blocked（GitHub API 返回 `401 Requires authentication`，新 release 需要 token）。

## Release Metadata

- Version: `1.1.0-alpha.1`
- Tag: `v1.1.0-alpha.1`
- Release type: alpha prerelease
- Release command preview:
  `gh release create v1.1.0-alpha.1 --title "CtxSift v1.1.0-alpha.1" --notes-file docs/release-v1.1.0-alpha.1.md --target master --verify-tag --prerelease`
- Verified publication status:
  Pending GitHub authentication.
