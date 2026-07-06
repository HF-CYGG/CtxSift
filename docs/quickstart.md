# Quickstart

## Install From Source

```bash
pnpm install
pnpm build
node dist/cli.js --repo . --ask "Where does auth start?"
```

## Pack a Local Repository

```bash
ctxsift --repo . --ask "Explain the config system" --format markdown
```

## Pack a Public GitHub Repository

```bash
ctxsift --repo https://github.com/user/repo --ask "How does routing work?" --format json
```

CtxSift clones public GitHub repositories into a temporary directory, reads them locally, and removes the temporary checkout after the bundle is generated.

## Generate a Review Bundle

```bash
ctxsift --repo . --diff main...HEAD --mode review --out review-context.md
```

The output is context for an AI reviewer, not an automated review verdict.

In pnpm or `package.json` workspaces, review bundles also include package-level reasons for diff-touched packages and their direct internal dependencies. The included GitHub Actions example uploads review context artifacts and can optionally update a sticky PR summary comment.
