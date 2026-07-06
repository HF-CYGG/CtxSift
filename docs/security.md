# Security

CtxSift is local-first. It does not call an LLM, upload repository content, or require a vector database.

## Defaults

- Redaction is enabled by default.
- High-risk files such as `.env`, private keys, PEM files, certificates, and generated secret artifacts are excluded unless explicitly included.
- Binary files and generated directories are excluded.
- Common secret patterns are replaced with `[REDACTED:SECRET_TYPE]`.
- Output includes an audit summary with scanned files, ignored files, redaction count, security policy, blocked high-risk files, and risk score.

## Security Profiles

```bash
ctxsift --repo . --ask "Explain config" --profile balanced
ctxsift --repo . --ask "Explain config" --profile private
ctxsift --repo . --ask "Explain config" --profile strict
```

- `balanced`: default behavior. CtxSift keeps useful selected context and redacts common secret values.
- `private`: stricter private-repository behavior. High-risk files do not emit their body even when explicitly included.
- `strict`: maximum protection. High-risk file bodies are blocked and reported in audit output.

When a high-risk file body is blocked, the output chunk contains a short CtxSift marker instead of the file contents. The audit includes `blockedHighRiskFiles` and `riskScore`.

## Covered Secret Classes

- OpenAI API keys
- GitHub tokens
- AWS access keys and secret access keys
- JWTs
- bearer tokens
- database URLs
- NPM tokens
- private key blocks
- password-like assignments
- credential-like assignments

## `--no-redact`

`--no-redact` disables content redaction and prints a warning to stderr. It should only be used for private local debugging.

Security profiles still apply high-risk body blocking for `private` and `strict`; `--no-redact` should not be used for public or shared bundles.
