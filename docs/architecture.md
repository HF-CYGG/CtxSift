# Architecture

CtxSift is a small TypeScript CLI with pure, testable modules.

## Data Flow

1. `cli.ts` parses CLI options into a `PackRequest`.
2. `repo-source.ts` prepares a local path or temporary public GitHub clone.
3. `repo-loader.ts` scans files, applies ignores, sniffs binary content, and builds a file tree.
4. `diff.ts` parses `base...head` and summarizes changed files when review mode is used.
5. `question-ranker.ts` assigns deterministic scores and reasons.
6. `security-redactor.ts` redacts common secret patterns.
7. `token-budgeter.ts` enforces token limits and records dropped-file reasons.
8. `emitter.ts` renders Markdown or JSON schema `1.0`.

## Non-Goals for v1

No MCP server, VSCode extension, web demo, SaaS, private GitHub App, embedding RAG, or heavy multi-language AST system is required for v1.
