import { describe, expect, test } from "vitest";
import { packRepository } from "../src/pack.js";
import { fileURLToPath } from "node:url";

const fixtureRoot = fileURLToPath(new URL("./fixtures/basic-app", import.meta.url));

describe("JSON bundle schema", () => {
  test("emits v1 schema fields", async () => {
    const output = await packRepository({
      repo: { type: "local", pathOrUrl: fixtureRoot },
      task: { mode: "question", query: "Where does auth start?", targetModel: "generic" },
      budget: { maxTokens: 2000, hardLimit: true, reserveForPrompt: 100, reserveForAnswer: 400 },
      scope: { includeTests: true, includeDocs: true },
      security: { redactSecrets: true, emitAuditLog: true, allowRemoteConfig: false },
      output: { format: "json" }
    });

    expect(output.schemaVersion).toBe("1.0");
    expect(output.task).toMatchObject({ mode: "question", query: "Where does auth start?" });
    expect(output.repo).toMatchObject({ type: "local" });
    expect(output.manifest.droppedFiles[0]).toHaveProperty("reason");
  });
});
