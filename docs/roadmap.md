# CtxSift Roadmap

CtxSift v1.0.0 is the first production-ready CLI release. It includes local
repository packing, public GitHub repository input, deterministic ranking,
diff-aware review bundles, Markdown and JSON emitters, default redaction, CI,
tests, and npm package metadata.

## v1.0.0 Shipped

- `ctxsift --ask "<question>" --repo <path>` local workflow.
- `ctxsift --repo https://github.com/owner/repo --ask "<question>"` public clone workflow.
- `--diff <base>...<head>` review bundles with changed files, related tests, related docs, and risk prompts.
- Markdown and JSON output formats.
- Deterministic file ranking with explainable reasons.
- Token budgeting with explicit dropped-file reasons.
- Default secret exclusion, content redaction, and audit counts.
- CLI E2E tests, fixture coverage, CI workflow, and npm publish metadata.

## v1.1 Ranking Quality

- Improve language-aware related-test discovery.
- Add optional custom ranking weights through a config file.
- Emit richer debug traces for score components.
- Benchmark larger repositories and tune default limits.

## v1.2 GitHub Action Hardening

- Publish a reusable Action wrapper around the CLI.
- Upload bundle artifacts for pull requests.
- Add examples for safe least-privilege permissions.
- Add documentation for private repository execution in CI.

## v1.3 Editor and Web Workflows

- VS Code command that shells out to the local CLI.
- Public Web demo for public repositories only.
- Shareable example bundles without storing private source.

## v2.0 MCP Adapter

- Expose CtxSift bundles through an MCP adapter.
- Keep the CLI as the source of truth.
- Add a dedicated MCP security review for permissions, prompt injection, and tool poisoning.
