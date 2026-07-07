import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("synchronization scope guardrails", () => {
  test("keeps local rules, temporary files, and legacy root benchmark reports ignored", () => {
    const gitignore = readFileSync(".gitignore", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(gitignore).toEqual(expect.arrayContaining([
      "_tmp_*",
      "GLOBAL_RULES.md",
      "benchmark-report.md",
      "benchmark-report.json",
      "tmp-vitest.config.mjs",
      "tmp-vitest.config.js",
      ".tmp-vitest.config.js"
    ]));
  });
});
