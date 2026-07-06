# CtxSift

Pack the right files for the task, not the whole repo.

CtxSift is a question-aware codebase context packer for AI coding agents. It reads a local repository or public GitHub repository, ranks the files that matter for your task, redacts risky content by default, and emits a Markdown or JSON bundle for Claude, ChatGPT, Cursor, Codex, Aider, or any review agent.

```bash
pnpm add -g ctxsift
ctxsift --repo . --ask "Where does auth start?"
ctxsift --repo . --diff main...HEAD --mode review --format markdown --out review-context.md
ctxsift --repo https://github.com/user/repo --ask "How does routing work?" --format json
```

## Why Not Full-Repo Packing?

Full-repo packers optimize for exporting everything. CtxSift optimizes for task fit:

- ranks files by query, path, docs, tests, entrypoints, diff relevance, size, and secret risk
- explains why each selected file was included
- drops irrelevant files with reasons instead of silently omitting them
- produces review bundles for PR/diff workflows
- redacts common secrets by default and emits an audit summary

## Example Output

```text
$ ctxsift --repo . --ask "Where does auth start?"
# CtxSift Bundle
## Task
Where does auth start?
## Selected Files
### src/auth/login.ts
- Reasons: query matched file path; query matched file content
## Audit
- Redactions: 0
```

## v1.0.0 Release Candidate Scope

- CLI: `--repo`, `--ask`, `--diff`, `--mode`, `--max-tokens`, `--format`, `--out`, `--include`, `--exclude`, `--no-redact`, `--debug`, `--version`, `--help`
- Inputs: local directory and public GitHub repository URL
- Outputs: Markdown and JSON schema `1.0`
- Security: default high-risk path exclusion, common secret redaction, audit summary, `--no-redact` warning
- Review bundle: diff summary, changed files, related tests/docs, risks, reviewer prompt, token stats
- CI/release gate: `pnpm run release:check` covers lint, typecheck, unit/integration/E2E tests, build, pack dry-run, and high-severity audit

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm pack --dry-run
pnpm run release:check
```

See [docs/quickstart.md](docs/quickstart.md), [docs/cli.md](docs/cli.md), [docs/security.md](docs/security.md), and [docs/review-bundle.md](docs/review-bundle.md).
