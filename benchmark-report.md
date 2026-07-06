# CtxSift Benchmark Report

Generated: 2026-07-06T19:32:55.382Z

These fixture benchmarks are deterministic local checks. They compare selected context size against a simple full-repo text baseline and do not claim model-answer quality.

## Summary

- Fixtures: 6
- Average relevant hit rate: 83.3%
- Average token saving ratio: 39.8%
- Average workspace package hit rate: 33.3%

## Results

| Fixture | Selected files | Selected tokens | Full repo tokens | Token saving | Relevant hit rate | Top-5 coverage | Workspace hit rate | Dropped | Security findings | Generation ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| simple-ts | 6 | 237 | 273 | 13.2% | 100.0% | 100.0% | 0.0% | 3 | 1 | 159 |
| pnpm-monorepo | 5 | 145 | 192 | 24.5% | 100.0% | 100.0% | 100.0% | 4 | 0 | 173 |
| turbo-monorepo | 3 | 94 | 192 | 51.0% | 100.0% | 100.0% | 100.0% | 6 | 0 | 159 |
| nx-monorepo | 0 | 0 | 192 | 100.0% | 0.0% | 0.0% | 0.0% | 0 | 0 | 153 |
| secrets | 2 | 37 | 74 | 50.0% | 100.0% | 100.0% | 0.0% | 0 | 1 | 166 |
| pr-diff | 3 | 45 | 45 | 0.0% | 100.0% | 100.0% | 0.0% | 0 | 0 | 261 |

