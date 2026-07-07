import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

describe("benchmark fixture validation", () => {
  test("requires the pr-review source fixture that backs the dynamic pr-diff benchmark", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-bench-fixtures-"));
    for (const fixturePath of [
      "tests/fixtures/basic-app",
      "tests/fixtures/monorepo",
      "tests/fixtures/secrets"
    ]) {
      mkdirSync(path.join(workspace, fixturePath), { recursive: true });
    }

    const result = spawnSync(process.execPath, [path.resolve("scripts/bench.mjs"), "--fixtures"], {
      cwd: workspace,
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Benchmark fixture missing: tests/fixtures/pr-review");
  });
});
