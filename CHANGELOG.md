# Changelog

## 1.0.0 - 2026-07-07

- Added installable `ctxsift` CLI.
- Added local directory and public GitHub repository inputs.
- Added question-aware deterministic file ranking with reasons.
- Added diff-aware review bundle mode.
- Added Markdown and JSON schema `1.0` outputs.
- Added token budgeting, dropped-file reasons, and audit summaries.
- Added default redaction for common secret classes and `--no-redact` warning.
- Added GitHub Actions CI and review-bundle workflow example.
- Added unit, integration, CLI E2E, fixture, diff, and security tests.
- Added release gate script covering lint, typecheck, tests, E2E, build, pack dry-run, and high-severity audit.
- Added large-repository metadata caps and selected-output redaction for production-scale repositories.
