# Diff-Aware Review Bundles

CtxSift can prepare context for any AI reviewer:

```bash
ctxsift --repo . --diff main...HEAD --mode review --format markdown --out review-context.md
```

The review bundle includes:

- diff spec and Git stat
- changed files
- related tests
- related docs
- risk hints for auth/security/dependency/secret-sensitive paths
- selected source context
- AI reviewer prompt
- token budget summary

CtxSift does not decide whether a PR is correct. It prepares the repository context a reviewer needs.
