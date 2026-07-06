# CtxSift Roadmap

CtxSift v1.0.0 is the first stable production-ready CLI release. It includes local
repository packing, public GitHub repository input, deterministic ranking,
diff-aware review bundles, Markdown and JSON emitters, default redaction, CI,
tests, and npm package metadata.

## v1.0.0 Release Scope

- `ctxsift --ask "<question>" --repo <path>` local workflow.
- `ctxsift --repo https://github.com/owner/repo --ask "<question>"` public clone workflow.
- `--diff <base>...<head>` review bundles with changed files, related tests, related docs, and risk prompts.
- Markdown and JSON output formats.
- Deterministic file ranking with explainable reasons.
- Token budgeting with explicit dropped-file reasons.
- Default secret exclusion, content redaction, and audit counts.
- CLI E2E tests, fixture coverage, CI workflow, release check script, and npm publish metadata.

## v1.1 Dual-Line Alpha

- Add pnpm / package.json workspace detection.
- Emit optional workspace graph metadata with package nodes, internal dependency edges, focused packages, and package-level reasons.
- Boost files in diff-touched workspace packages and their direct internal dependencies.
- Keep ranking deterministic and dependency-free.

## v1.2 GitHub Action Hardening

- Upload Markdown and JSON review-context artifacts for pull requests.
- Add optional sticky PR summary comments, disabled by default.
- Keep default workflow permissions at `contents: read`; require `pull-requests: write` only when comments are explicitly enabled.
- Add documentation for private repository execution in CI.

## v1.3 Editor and Web Workflows

- VS Code command that shells out to the local CLI.
- Public Web demo for public repositories only.
- Shareable example bundles without storing private source.

## v2.0 MCP Adapter

- Expose CtxSift bundles through an MCP adapter.
- Keep the CLI as the source of truth.
- Add a dedicated MCP security review for permissions, prompt injection, and tool poisoning.
