# GitHub Action

CtxSift ships a composite GitHub Action that generates PR review context bundles.
The default mode is artifact-only: it uploads Markdown and JSON bundles and does
not write PR comments.

## Minimal Artifact Workflow

```yaml
name: CtxSift Review Context

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read

jobs:
  ctxsift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: HF-CYGG/CtxSift@master
        with:
          profile: private
```

For local development inside this repository, use `uses: ./` instead of
`HF-CYGG/CtxSift@master`.

## Sticky PR Comment

Sticky comments are disabled by default. To enable them, grant
`pull-requests: write`, set `comment: "true"`, and pass `github-token`.

```yaml
permissions:
  contents: read
  pull-requests: write

jobs:
  ctxsift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: HF-CYGG/CtxSift@master
        with:
          profile: private
          comment: "true"
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

The PR comment includes only summary data: artifact name, diff, changed-file
count, selected files, token count, redaction count, and risk hints. It does not
embed source chunks. Full review context stays in the workflow artifact.

`artifact` upload can be switched off with `upload-artifact: "false"` independently
from comment behavior. When comment is enabled, artifact generation and upload still
run unless explicitly disabled by `upload-artifact: "false"`.

Artifact upload can be disabled independently with `upload-artifact: "false"`.
When this option is `false`, only sticky comment behavior changes; bundle
generation still runs and writes local `*.md` and `*.json` files.

For release operations, the project policy requires the publish sequence:

- `npm run release:publish:print-command`
- `npm run release:publish -- --skip-tag-check`

The second step requires valid GitHub credentials (`gh` CLI or token-backed API path)
and is expected to be executed after all verification steps pass for that version.

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `repo` | `.` | Repository path to analyze after checkout. |
| `diff` | derived from PR base | Git diff spec such as `origin/main...HEAD`. Required outside `pull_request` events. |
| `mode` | `review` | CtxSift mode. |
| `profile` | `balanced` | Security profile: `balanced`, `private`, or `strict`. |
| `max-tokens` | `20000` | Selected-context token budget. |
| `workspace-aware` | `true` | Enables package graph-aware ranking. |
| `output-prefix` | `review-context` | Prefix for generated `.md` and `.json` files. |
| `artifact-name` | `ctxsift-review-context` | Uploaded artifact name and comment reference. |
| `upload-artifact` | `true` | Upload generated files as a workflow artifact. |
| `comment` | `false` | Update a sticky PR summary comment. |
| `github-token` | empty | Required only when `comment` is `true`. |

## Outputs

| Output | Description |
| --- | --- |
| `markdown-path` | Generated Markdown bundle path. |
| `json-path` | Generated JSON bundle path. |
| `artifact-name` | Artifact name used by the action. |
| `selected-files` | Number of selected files in the JSON bundle. |

## Permissions and Forks

- Artifact-only mode uses only `contents: read`.
- Sticky comments require `pull-requests: write`.
- `upload-artifact: "false"` only controls artifact upload, not bundle generation.
- The PR comment contains summary-only output; no source snippets are posted.
- For forked PRs, keep `pull_request` trigger. `pull_request_target` is not
  recommended for untrusted fork code.
- Comment + artifact behavior is version-stable and should not be repurposed as an
  access control workaround: use comment only for summary and artifact for full
  context.

## Private Repositories

Artifacts can contain source context. Treat `ctxsift-review-context` as
repository-sensitive output and rely on normal Actions artifact access controls.
For stricter source protection, use:

```yaml
with:
  profile: strict
  comment: "false"
```

`private` and `strict` profiles block high-risk file bodies even when files are
explicitly included. Sticky comments never contain source chunks, but artifacts are
the complete review context and should not be published outside trusted repository
access.
