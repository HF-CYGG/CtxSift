import { describe, expect, test } from "vitest";
import { parseDiffSpec, summarizeDiff } from "../src/diff.js";

describe("diff helpers", () => {
  test("parses triple-dot diff specs", () => {
    expect(parseDiffSpec("main...HEAD")).toEqual({ base: "main", head: "HEAD" });
  });

  test("summarizes changed files and risks", () => {
    const summary = summarizeDiff({
      spec: "main...HEAD",
      changedFiles: ["src/auth/login.ts", "tests/auth.test.ts", ".env.example"],
      stat: "3 files changed"
    });

    expect(summary.changedFiles).toContain("src/auth/login.ts");
    expect(summary.risks).toContain("Sensitive path changed: .env.example");
    expect(summary.relatedTests).toContain("tests/auth.test.ts");
  });
});
