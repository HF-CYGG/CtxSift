import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("e2e script guardrails", () => {
  test("cleans the temporary diff repository after the review bundle scenario", () => {
    const script = readFileSync("scripts/e2e.mjs", "utf8");

    expect(script).toContain("rmSync(diffRepo");
    expect(script).toContain("finally");
  });
});
