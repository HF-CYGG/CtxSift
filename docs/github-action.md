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
      - uses: HF-CYGG/CtxSift@main
        with:
          profile: private
```

For local development inside this repository, use `uses: ./` instead of
`HF-CYGG/CtxSift@main`.

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
      - uses: HF-CYGG/CtxSift@main
        with:
          profile: private
          comment: "true"
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

The PR comment includes only the artifact name, diff summary, changed-file count,
selected-file list, redaction counts, and risk hints. It does not embed source
chunks. Full review context remains in the workflow artifact.

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

Artifact-only mode needs only `contents: read`. Sticky comments require
`pull-requests: write`.

For pull requests from forks, GitHub can downgrade write permissions for
`GITHUB_TOKEN` unless the repository explicitly allows write tokens for forked
pull request workflows. In that case, the artifact will still be generated, but
the comment step may fail unless permissions allow it.

Do not switch this workflow to `pull_request_target` for untrusted fork code. The
default `pull_request` trigger keeps the review bundle local to the runner and
avoids exposing elevated write tokens to code from the PR branch.

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
explicitly included. Sticky comments never contain source chunks, but artifacts
are the complete review context and should not be published outside trusted
repository access.
