# AGENTS.md



## Project



This repository implements CtxSift, a question-aware codebase context packer for AI coding agents.



CtxSift should pack the right files for the task, not the whole repository.



## Product Principles



- Do not build a generic full-repo-to-text clone.

- Prioritize question-aware file selection.

- Prioritize diff-aware review bundles.

- Prioritize local-first execution.

- Prioritize secret redaction and auditability.

- Prefer deterministic, explainable ranking before adding heavy ML or vector databases.

- Keep the CLI fast, scriptable, and easy to install.



## Tech Expectations



- Prefer TypeScript and Node.js.

- Prefer pnpm.

- Prefer small, mature dependencies.

- Keep core logic testable as pure modules.

- Keep CLI code thin.

- Do not introduce LangChain, vector databases, cloud services, or MCP as required v1 dependencies.

- Do not add production dependencies without a clear reason.



## Required Commands



Before considering work complete, run:



```bash

pnpm lint

pnpm typecheck

pnpm test

pnpm test:e2e

pnpm build

pnpm pack --dry-run
```

If a command does not exist, create the closest equivalent script.

## Definition of Done

A task is done only when:

- implementation is complete;
- tests are added or updated;
- all relevant tests pass;
- documentation reflects the actual behavior;
- CLI examples work;
- security-sensitive behavior is tested;
- no README claim describes an unimplemented feature.

## Security Rules

- Redaction is on by default.
- `.env`, private keys, tokens, credentials, certificates, and generated secrets must not be exported by default.
- Do not trust remote repository configuration by default.
- Do not print secrets in logs.
- Do not weaken tests, linting, or type checks to pass CI.
- If `--no-redact` exists, it must show a clear warning.

## Release Rules

Do not mark the project as v1.0.0 unless:

- CLI works through the package bin.
- Markdown and JSON outputs are stable.
- diff-aware mode works.
- security redaction tests pass.
- CI passes.
- README, docs, changelog, and package metadata are complete.
