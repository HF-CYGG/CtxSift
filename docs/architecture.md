# Architecture

CtxSift is a small TypeScript CLI with pure, testable modules.

## Data Flow

1. `cli.ts` parses CLI options into a `PackRequest`.
2. `repo-source.ts` prepares a local path or temporary public GitHub clone.
3. `repo-loader.ts` scans files, applies ignores, sniffs binary content, and builds a file tree.
4. `diff.ts` parses `base...head` and summarizes changed files when review mode is used.
5. `workspace-detector.ts` and `workspace-graph.ts` detect pnpm / package.json workspaces, internal dependency edges, build-tool metadata, and package-level focus reasons.
6. `question-ranker.ts` assigns deterministic scores and reasons, including workspace package boosts for changed packages and their internal dependencies.
7. `token-budgeter.ts` enforces token limits and records dropped-file reasons.
8. `security-redactor.ts` redacts common secret patterns in the selected output files.
9. `emitter.ts` renders Markdown or JSON schema `1.0`.

## Workspace Graph Behavior

Workspace analysis is optional and deterministic. When CtxSift finds `pnpm-workspace.yaml` or root `package.json#workspaces`, it:

- detects workspace package manifests matched by common patterns such as `apps/*`, `packages/*`, and `.`;
- records package names, package paths, scripts, and internal dependency edges;
- records `turbo.json` and `nx.json` as build-tool metadata without parsing their full project graphs;
- marks packages touched by a requested diff and their direct internal dependencies as focused packages;
- adds package-level reasons to selected files and exposes the graph in optional JSON field `workspaces`.

Repositories without workspace configuration keep the same v1 output shape except that `workspaces` is omitted.

## Large Repository Behavior

Large repositories can contain tens of thousands of candidate files. CtxSift keeps output size bounded by:

- capping the rendered file tree and adding an omitted-count line;
- capping `manifest.droppedFiles` to the first representative entries;
- recording the remaining count in `manifest.droppedFilesOmitted`;
- redacting only files that will be emitted in `chunks`, since non-selected files never leave the process.

This keeps the bundle focused on the token-budgeted context instead of allowing metadata to dominate the output.

## Non-Goals for v1

No MCP server, VSCode extension, web demo, SaaS, private GitHub App, embedding RAG, or heavy multi-language AST system is required for v1. The workspace graph alpha intentionally avoids full Turbo/Nx graph parsing and multi-language AST import tracing.
