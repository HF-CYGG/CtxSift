# VS Code Command Example

This example shows how a VS Code extension can shell out to the local CtxSift
CLI without adding editor integration code to the root package.

The command is:

- `CtxSift: Pack Current Workspace Context`

It uses the first open workspace folder, asks for a task question, writes a
Markdown bundle next to the workspace root, and defaults to `profile: private`.
