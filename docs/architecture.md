# Architecture

CtxSift is a small TypeScript CLI with pure, testable modules.

## Data Flow

1. `cli.ts` parses CLI options into a `PackRequest`.
2. `repo-source.ts` prepares a local path or temporary public GitHub clone.
3. `repo-loader.ts` scans files, applies ignores, sniffs binary content, and builds a file tree.
4. `diff.ts` parses `base...head` and summarizes changed files when review mode is used.
5. `question-ranker.ts` assigns deterministic scores and reasons.
6. `token-budgeter.ts` enforces token limits and records dropped-file reasons.
7. `security-redactor.ts` redacts common secret patterns in the selected output files.
8. `emitter.ts` renders Markdown or JSON schema `1.0`.

## Large Repository Behavior

Large repositories can contain tens of thousands of candidate files. CtxSift keeps output size bounded by:

- capping the rendered file tree and adding an omitted-count line;
- capping `manifest.droppedFiles` to the first representative entries;
- recording the remaining count in `manifest.droppedFilesOmitted`;
- redacting only files that will be emitted in `chunks`, since non-selected files never leave the process.

This keeps the bundle focused on the token-budgeted context instead of allowing metadata to dominate the output.

## Non-Goals for v1

No MCP server, VSCode extension, web demo, SaaS, private GitHub App, embedding RAG, or heavy multi-language AST system is required for v1.
