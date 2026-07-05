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
      redact: false,
      debug: true
    });
  });
});
