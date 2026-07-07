# Benchmark Toolkit

CtxSift includes a local benchmark harness for regression checks around selective
packing, workspace awareness, review bundles, and security defaults.

The benchmark is intentionally small and deterministic. It uses repository
fixtures under `tests/fixtures`, does not call LLMs or hosted services, and does
not require API keys. Secret-related fixtures use fake values only.

## Commands

```bash
pnpm bench
pnpm bench:fixtures
pnpm bench:report
```

- `pnpm bench` builds the CLI, validates fixtures, and writes both reports.
- `pnpm bench:fixtures` checks that the benchmark fixture repositories exist.
- `pnpm bench:report` runs the CLI against each fixture and writes
  `benchmarks/benchmark-report.json` and `benchmarks/benchmark-report.md`.

## Fixtures

| Fixture | Purpose |
| --- | --- |
| `simple-ts` | Basic TypeScript repository selection. |
| `pnpm-monorepo` | pnpm workspace package selection and internal package focus. |
| `turbo-monorepo` | Turbo metadata plus package-scoped selection. |
| `nx-monorepo` | Nx metadata and workspace graph-only output. |
| `secrets` | Strict profile handling for high-risk files and redaction audit counts. |
| `pr-diff` | Generated Git PR fixture for diff-aware review bundles. |

## Metrics

The JSON report records these metrics per fixture:

- `selectedFilesCount`: number of files selected into the bundle.
- `estimatedTokens`: selected bundle token estimate from CtxSift output.
- `relevantFilesHitRate`: expected relevant files selected by the fixture.
- `droppedFilesCount`: dropped files plus omitted dropped-file metadata.
- `securityFindingsCount`: redactions plus blocked high-risk file count.
- `bundleGenerationMs`: wall-clock CLI runtime for the fixture on this machine.
- `fullRepoBaselineTokens`: simple local full-repo text token baseline.
- `selectedContextTokenSavingRatio`: estimated token reduction against the
  full-repo baseline.
- `topNRelevantFileCoverage`: expected relevant files appearing in the top five
  selected files.
- `workspacePackageHitRate`: expected focused workspace packages present in the
  workspace graph output.

`bundleGenerationMs` is machine-dependent. The fixture content and benchmark
procedure are deterministic, but absolute timings should be compared only within
similar local environments.

## Current Snapshot

The committed report from the latest successful `pnpm bench:report` run covers:

- 5 fixtures (static local fixtures).
- Average relevant hit rate: 80.0%.
- Average token saving ratio: 47.7%.
- Average workspace package hit rate: 40.0%.

`pr-diff` is generated at report time from a synthetic git fixture. In environments
where `git` cannot be executed, that dynamic fixture is skipped and the static
fixtures above are used.

See [`benchmarks/benchmark-report.md`](../benchmarks/benchmark-report.md) for the generated Markdown
table and [`benchmarks/benchmark-report.json`](../benchmarks/benchmark-report.json) for machine-readable
results.

The `nx-monorepo` fixture intentionally runs graph-only mode. It validates graph
emission without selecting source chunks, so its selected-file and relevant-file
metrics are zero by design.
