import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("benchmark script guardrails", () => {
  test("cleans the dynamic pr-diff repository in a finally block", () => {
    const script = readFileSync("scripts/bench.mjs", "utf8");

    expect(script).toContain("finally");
    expect(script).toContain("rmSync(prDiffRepo");
  });
});
