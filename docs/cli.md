# CLI Reference

## Required Inputs

- `--repo <path-or-github-url>`: local directory or public GitHub URL.
- `--ask <question>`: task question. Optional only when using `--diff`.
- `--diff <base>...<head>`: Git diff range for review bundles.
- `--workspace-graph`: workspace graph output. This can be used without `--ask` or `--diff`.

## Options

- `--mode question|review|diff|onboarding|bugfix`: defaults to `question`.
- `--max-tokens <number>`: hard token budget, default `20000`.
- `--format markdown|json`: defaults to `markdown`.
- `--out <file>`: write bundle to a file.
- `--include <glob[,glob]>`: force include matching files.
- `--exclude <glob[,glob]>`: exclude matching files.
- `--workspace-aware`: explicitly enable workspace/package graph analysis. CtxSift also analyzes workspace metadata automatically when it finds workspace config.
- `--workspace-graph`: output workspace graph metadata without selecting source chunks when no task is provided.
- `--package <workspace-name-or-path>`: focus ranking on a workspace package, such as `apps/web` or `@scope/web`.
- `--profile balanced|private|strict`: choose the security policy. Defaults to `balanced`.
- `--no-redact`: disable redaction and print a warning.
- `--debug`: reserved for verbose diagnostics.
- `--version`: print CLI version.
- `--help`: print usage.

## Large Repository Output

For large repositories, CtxSift caps verbose metadata so JSON and Markdown remain practical to copy or upload:

- `tree` includes a bounded list plus an omitted-count line.
- `manifest.droppedFiles` is capped.
- `manifest.droppedFilesOmitted` records how many dropped-file entries were omitted from metadata.
- `audit.redactions` counts redactions in emitted output files.

## Workspace Graph Output

When a repository includes `pnpm-workspace.yaml` or root `package.json#workspaces`, output can include optional `workspaces` metadata:

- package nodes with names, paths, scripts, and package manifests;
- internal dependency edges between workspace packages;
- focused packages touched by a requested diff and their direct internal dependencies;
- package-level reasons that also appear on selected files.
- build targets from package scripts, Turbo/Nx metadata, and TypeScript project references;
- simple import edges from source files to internal workspace packages.

Repositories without workspace configuration omit this field.

## Examples

```bash
ctxsift --repo . --ask "Where does auth start?"
ctxsift --repo . --workspace-graph --format json
ctxsift --repo . --package apps/web --ask "Why might routing break?"
ctxsift --repo . --ask "Explain config loading" --profile private
ctxsift --repo . --ask "Why might caching break?" --max-tokens 20000
ctxsift --repo . --diff main...HEAD --mode review
ctxsift --repo . --ask "Explain the config system" --format json --out ctxbundle.json
```
