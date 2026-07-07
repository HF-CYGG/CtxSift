# CtxSift Benchmark Report

Generated: 2026-07-07T07:32:58.963Z

These fixture benchmarks are deterministic local checks. They compare selected context size against a simple full-repo text baseline and do not claim model-answer quality.

## Summary

- Fixtures: 5
- Average relevant hit rate: 80.0%
- Average token saving ratio: 47.7%
- Average workspace package hit rate: 40.0%

## Results

| Fixture | Selected files | Selected tokens | Full repo tokens | Token saving | Relevant hit rate | Top-5 coverage | Workspace hit rate | Dropped | Security findings | Generation ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| simple-ts | 6 | 237 | 273 | 13.2% | 100.0% | 100.0% | 0.0% | 3 | 1 | 21 |
| pnpm-monorepo | 5 | 145 | 192 | 24.5% | 100.0% | 100.0% | 100.0% | 4 | 0 | 9 |
| turbo-monorepo | 3 | 94 | 192 | 51.0% | 100.0% | 100.0% | 100.0% | 6 | 0 | 5 |
| nx-monorepo | 0 | 0 | 192 | 100.0% | 0.0% | 0.0% | 0.0% | 0 | 0 | 6 |
| secrets | 2 | 37 | 74 | 50.0% | 100.0% | 100.0% | 0.0% | 0 | 1 | 3 |

