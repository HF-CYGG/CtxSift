import { describe, expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { packRepository } from "../src/pack.js";

describe("fixture coverage", () => {
  test.each([
    ["python-app", "How does routing work?", "app/routes.py"],
    ["monorepo", "Where is auth implemented?", "packages/auth/src/index.ts"],
    ["secrets", "Explain config loading", "README.md"]
  ])("packs %s fixture", async (fixture, query, expectedPath) => {
    const root = fileURLToPath(new URL(`./fixtures/${fixture}`, import.meta.url));
    const output = await packRepository({
      repo: { type: "local", pathOrUrl: root },
      task: { mode: "question", query, targetModel: "generic" },
      budget: { maxTokens: 3000, hardLimit: true, reserveForPrompt: 100, reserveForAnswer: 400 },
      scope: { includeTests: true, includeDocs: true },
      security: { redactSecrets: true, emitAuditLog: true, allowRemoteConfig: false },
      output: { format: "json" }
    });

    expect(output.selectedFiles.map((file) => file.path)).toContain(expectedPath);
    expect(output.chunks.map((chunk) => chunk.content).join("\n")).not.toContain("sk-proj-secret-fixture-key");
  });
});
