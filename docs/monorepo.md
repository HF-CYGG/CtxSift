# Monorepo Selective Packing

CtxSift can analyze workspace structure before ranking files. The goal is to select task-relevant package context, not dump the whole monorepo.

## Supported Inputs

- `pnpm-workspace.yaml` with common list patterns such as `apps/*`, `packages/*`, and `.`.
- Root `package.json#workspaces`, including array form and `{ "packages": [...] }` form.
- Workspace `package.json` files with `name`, `scripts`, and dependency groups.
- `turbo.json` and `nx.json` as build-tool metadata.
- `tsconfig*.json` `references` as TypeScript project-reference targets.
- Static JavaScript/TypeScript import specifiers that target internal workspace package names.

## Commands

```bash
ctxsift --repo . --ask "How does auth work?" --workspace-aware
ctxsift --repo . --workspace-graph --format json
ctxsift --repo . --package apps/web --ask "Why might routing break?"
ctxsift --repo . --diff main...HEAD --mode review --workspace-aware
```

`--workspace-aware` is explicit documentation of intent. CtxSift also analyzes workspace metadata automatically when workspace config is present.

`--workspace-graph` can run without `--ask` or `--diff`. In that mode, CtxSift emits graph metadata without source chunks.

## Output

JSON bundles can include optional `workspaces` metadata:

- `packages`: workspace package nodes.
- `dependencyEdges`: internal package dependency edges from manifests.
- `buildTargets`: package scripts, Turbo/Nx markers, and TypeScript project references.
- `importEdges`: source imports that target internal workspace package names.
- `focusedPackages`: packages matched by diff, dependency, query, or `--package`.
- `packageReasons`: explainable package-level reasons.

Markdown bundles include a `Workspace Graph` summary when workspace metadata exists.

## Current Limits

CtxSift does not parse full Turbo or Nx project graphs yet. Import analysis is a deterministic regex-based pass over source text and only records imports to internal workspace package names. It does not require AST dependencies or external services.
