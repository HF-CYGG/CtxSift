# v1.1.0-alpha.1 Release Notes

## Summary

CtxSift v1.1.0-alpha.1 is a release-closure patch for the v1.1 alpha line. It keeps CLI behavior and output schemas unchanged while moving the post `v1.1.0-alpha.0` release-closure commits onto a new immutable release tag.

Release tag:

- `v1.1.0-alpha.1`

## Highlights

- Keeps the `v1.1.0-alpha.0` tag immutable and uses a new alpha patch tag for current `master`.
- Confirms existing GitHub Releases through `release:publish:api` without treating already-published tags as failures.
- Writes benchmark reports only to `benchmarks/benchmark-report.md` and `benchmarks/benchmark-report.json`.
- Keeps local rules, temporary files, cache directories, and root legacy benchmark reports out of the synchronized release scope.

## Verification

- `npm run release:check`: Passed.
- `npm run bench:fixtures`: Passed, 6 fixtures validated.
- `npm run bench:report`: Passed, reports written to `benchmarks/benchmark-report.md` and `benchmarks/benchmark-report.json`.
- `npm run release:publish:print-command`: Passed, generated the `v1.1.0-alpha.1` release command.
- `git push origin v1.1.0-alpha.1`: Passed, tag pushed to GitHub.
- `npm run release:publish`: Blocked, this environment has no `gh` and no `GH_TOKEN/GITHUB_TOKEN`.
- `npm run release:publish:api`: Blocked, GitHub API returned `401 Requires authentication` for release creation.

## Release Metadata

- Version: `1.1.0-alpha.1`
- Tag: `v1.1.0-alpha.1`
- Release type: alpha prerelease
- Release command preview:
  `gh release create v1.1.0-alpha.1 --title "CtxSift v1.1.0-alpha.1" --notes-file docs/release-v1.1.0-alpha.1.md --target master --verify-tag --prerelease`
- Tag commit:
  `30fc0964821c0eb6b7fc146355818fdb1063339a`
- Verified publication status:
  Pending GitHub authentication.
