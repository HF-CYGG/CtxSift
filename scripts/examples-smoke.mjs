import assert from "node:assert/strict";
import {
  buildCtxSiftArgs,
  defaultOutputPath,
  resolveCtxSiftCommand
} from "../examples/vscode-command/ctxsift-command.js";
import {
  buildPackArgs,
  isAllowedPublicGitHubRepo
} from "../examples/public-web-demo/server.mjs";

const vscodeArgs = buildCtxSiftArgs({
  ask: "Where does auth start?",
  outputPath: defaultOutputPath("ctxsift-demo"),
  repo: "ctxsift-demo"
});

assert.deepEqual(vscodeArgs, [
  "--repo",
  "ctxsift-demo",
  "--ask",
  "Where does auth start?",
  "--format",
  "markdown",
  "--out",
  "ctxsift-demo-context.md",
  "--profile",
  "private"
]);

assert.equal(resolveCtxSiftCommand({ extensionPath: "examples/vscode-command", workspaceRoot: "." }).args.length, 1);
assert.equal(isAllowedPublicGitHubRepo("https://github.com/HF-CYGG/CtxSift"), true);
assert.equal(isAllowedPublicGitHubRepo("https://github.com/HF-CYGG/CtxSift.git"), true);
assert.equal(isAllowedPublicGitHubRepo("git@github.com:HF-CYGG/CtxSift.git"), false);
assert.equal(isAllowedPublicGitHubRepo("F:/StarForge/CtxSift"), false);
assert.equal(isAllowedPublicGitHubRepo("https://example.com/HF-CYGG/CtxSift"), false);

assert.deepEqual(
  buildPackArgs({
    ask: "Where is routing?",
    maxTokens: 12000,
    profile: "private",
    repo: "https://github.com/HF-CYGG/CtxSift"
  }),
  [
    "--repo",
    "https://github.com/HF-CYGG/CtxSift",
    "--ask",
    "Where is routing?",
    "--format",
    "json",
    "--max-tokens",
    "12000",
    "--profile",
    "private"
  ]
);
