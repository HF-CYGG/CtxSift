# CLI Reference

## Required Inputs

- `--repo <path-or-github-url>`: local directory or public GitHub URL.
- `--ask <question>`: task question. Optional only when using `--diff`.
- `--diff <base>...<head>`: Git diff range for review bundles.

## Options

- `--mode question|review|diff|onboarding|bugfix`: defaults to `question`.
- `--max-tokens <number>`: hard token budget, default `20000`.
- `--format markdown|json`: defaults to `markdown`.
- `--out <file>`: write bundle to a file.
- `--include <glob[,glob]>`: force include matching files.
- `--exclude <glob[,glob]>`: exclude matching files.
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

## Examples

```bash
ctxsift --repo . --ask "Where does auth start?"
ctxsift --repo . --ask "Why might caching break?" --max-tokens 20000
ctxsift --repo . --diff main...HEAD --mode review
ctxsift --repo . --ask "Explain the config system" --format json --out ctxbundle.json
```
