import { describe, expect, test } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  test("parses v1 CLI options", () => {
    const options = parseArgs([
      "--repo",
      ".",
      "--ask",
      "Where does auth start?",
      "--diff",
      "main...HEAD",
      "--mode",
      "review",
      "--max-tokens",
      "20000",
      "--format",
      "json",
      "--out",
      "ctxbundle.json",
      "--include",
      "src/**",
      "--exclude",
      "dist/**",
      "--workspace-aware",
      "--workspace-graph",
      "--package",
      "apps/web",
      "--profile",
      "private",
      "--no-redact",
      "--debug"
    ]);

    expect(options).toMatchObject({
      repo: ".",
      ask: "Where does auth start?",
      diff: "main...HEAD",
      mode: "review",
      maxTokens: 20000,
      format: "json",
      output: "ctxbundle.json",
      include: ["src/**"],
      exclude: ["dist/**"],
      workspaceAware: true,
      workspaceGraph: true,
      packageName: "apps/web",
      profile: "private",
      redact: false,
      debug: true
    });
  });

  test("allows workspace graph output without ask or diff", () => {
    const options = parseArgs(["--repo", ".", "--workspace-graph", "--format", "json"]);

    expect(options).toMatchObject({
      repo: ".",
      workspaceGraph: true,
      format: "json"
    });
  });

  test("rejects non-strict max token values", () => {
    for (const maxTokens of ["12abc", "1.5"]) {
      expect(() => parseArgs(["--repo", ".", "--ask", "Where does auth start?", "--max-tokens", maxTokens])).toThrow(
        "--max-tokens must be a positive integer"
      );
    }
  });

  test("rejects GitHub repo URLs with query strings or fragments", () => {
    for (const repo of ["https://github.com/HF-CYGG/CtxSift?tab=readme", "https://github.com/HF-CYGG/CtxSift#readme"]) {
      expect(() => parseArgs(["--repo", repo, "--ask", "Where does auth start?"])).toThrow(
        "--repo GitHub URL must be https://github.com/owner/repo"
      );
    }
  });

  test("rejects unsupported remote repo URLs", () => {
    for (const repo of ["https://example.com/HF-CYGG/CtxSift", "http://github.com/HF-CYGG/CtxSift"]) {
      expect(() => parseArgs(["--repo", repo, "--ask", "Where does auth start?"])).toThrow(
        "--repo remote URL must be https://github.com/owner/repo"
      );
    }
  });

  test("rejects blank option values", () => {
    expect(() => parseArgs(["--repo", "   ", "--ask", "Where does auth start?"])).toThrow("Missing value for --repo");
    expect(() => parseArgs(["--repo", ".", "--ask", "   "])).toThrow("Missing value for --ask");
  });
});
