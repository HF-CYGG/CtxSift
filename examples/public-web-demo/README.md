# Public Web Demo Example

This example shows a small local web server that shells out to the CtxSift CLI
for public GitHub repositories only.

Run from the repository root after `pnpm build`:

```bash
node examples/public-web-demo/server.mjs
```

The demo rejects local paths, SSH URLs, and non-GitHub URLs. It defaults to
`profile: private` and returns the normal CtxSift JSON bundle from `/api/pack`.
