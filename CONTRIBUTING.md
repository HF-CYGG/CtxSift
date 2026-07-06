# Contributing

## Setup

```bash
pnpm install
pnpm build
```

## Checks

Run the same gates used by CI:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm pack --dry-run
pnpm run release:check
```

`pnpm run release:check` is the release gate used by CI and `prepublishOnly`.

## Principles

- Keep ranking deterministic and explainable.
- Do not add cloud, LLM, vector database, or MCP dependencies to the core CLI.
- Keep redaction enabled by default.
- Add tests for new ranking, output, diff, and security behavior.
