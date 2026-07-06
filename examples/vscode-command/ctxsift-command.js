import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ALLOWED_FORMATS = new Set(["markdown", "json"]);
const ALLOWED_PROFILES = new Set(["balanced", "private", "strict"]);

export function defaultOutputPath(workspaceName) {
  const safeName = path
    .basename(workspaceName || "workspace")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${safeName || "workspace"}-context.md`;
}

export function buildCtxSiftArgs(options) {
  const repo = requireText(options.repo, "repo");
  const ask = requireText(options.ask, "ask");
  const format = options.format ?? "markdown";
  const profile = options.profile ?? "private";
  const outputPath = requireText(options.outputPath, "outputPath");

  if (!ALLOWED_FORMATS.has(format)) {
    throw new Error("format must be markdown or json");
  }
  if (!ALLOWED_PROFILES.has(profile)) {
    throw new Error("profile must be balanced, private, or strict");
  }

  const args = ["--repo", repo, "--ask", ask, "--format", format, "--out", outputPath, "--profile", profile];
  if (options.maxTokens !== undefined) {
    const maxTokens = Number.parseInt(String(options.maxTokens), 10);
    if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
      throw new Error("maxTokens must be a positive integer");
    }
    args.push("--max-tokens", String(maxTokens));
  }
  return args;
}

export function resolveCtxSiftCommand(options) {
  const extensionPath = path.resolve(options.extensionPath);
  const localCli = path.resolve(extensionPath, "..", "..", "dist", "cli.js");
  if (existsSync(localCli)) {
    return { command: process.execPath, args: [localCli] };
  }

  const workspaceRoot = options.workspaceRoot ? path.resolve(options.workspaceRoot) : process.cwd();
  const workspaceCli = path.resolve(workspaceRoot, "node_modules", ".bin", process.platform === "win32" ? "ctxsift.cmd" : "ctxsift");
  if (existsSync(workspaceCli)) {
    return { command: workspaceCli, args: [] };
  }

  return { command: "ctxsift", args: [] };
}

function requireText(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}
