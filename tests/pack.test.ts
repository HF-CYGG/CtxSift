import { describe, expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { packRepository } from "../src/pack.js";

const fixtureRoot = fileURLToPath(new URL("./fixtures/basic-app", import.meta.url));

describe("packRepository", () => {
  test("selects task-relevant auth context and excludes secrets", async () => {
    const repo = await createBasicFixtureWithIgnoredBuildOutput();

    const output = await packRepository({
      repo: { type: "local", pathOrUrl: repo },
      task: {
        mode: "question",
        query: "Where does auth start?",
        targetModel: "generic"
      },
      budget: {
        maxTokens: 2000,
        hardLimit: true,
        reserveForPrompt: 100,
        reserveForAnswer: 400
      },
      scope: {
        includeTests: true,
        includeDocs: true
      },
      security: {
        redactSecrets: true,
        emitAuditLog: true,
        allowRemoteConfig: false
      },
      output: {
        format: "json"
      }
    });

    const selectedPaths = output.selectedFiles.map((file) => file.path);

    expect(selectedPaths).toContain("src/auth/login.ts");
    expect(selectedPaths).toContain("src/auth/session.ts");
    expect(selectedPaths).toContain("tests/auth.test.ts");
    expect(selectedPaths).toContain("README.md");
    expect(selectedPaths).not.toContain(".env.example");
    expect(selectedPaths).not.toContain("dist/generated.js");
    expect(selectedPaths).not.toContain("src/cache.ts");
    expect(output.manifest.query).toBe("Where does auth start?");
    expect(output.manifest.totalTokens).toBeLessThanOrEqual(2000);
    expect(output.audit.redactions).toBe(0);
    expect(output.audit.ignoredFiles).toBeGreaterThanOrEqual(2);
    expect(output.selectedFiles.find((file) => file.path === "src/auth/login.ts")?.reasons).toContain(
      "query matched file path"
    );
  });

  test("redacts secret-like content before emitting chunks", async () => {
    const output = await packRepository({
      repo: { type: "local", pathOrUrl: fixtureRoot },
      task: {
        mode: "question",
        query: "Where is configuration loaded?",
        targetModel: "generic"
      },
      budget: {
        maxTokens: 4000,
        hardLimit: true,
        reserveForPrompt: 100,
        reserveForAnswer: 400
      },
      scope: {
        include: [".env.example"],
        includeTests: false,
        includeDocs: true
      },
      security: {
        redactSecrets: true,
        emitAuditLog: true,
        allowRemoteConfig: false
      },
      output: {
        format: "json"
      }
    });

    const allContent = output.chunks.map((chunk) => chunk.content).join("\n");

    expect(allContent).not.toContain("sk-proj-fixture-not-real");
    expect(allContent).toContain("[REDACTED:OPENAI_API_KEY]");
    expect(output.audit.redactions).toBeGreaterThanOrEqual(1);
  });

  test("honors hard token limits by dropping oversized files", async () => {
    const output = await packRepository({
      repo: { type: "local", pathOrUrl: fixtureRoot },
      task: {
        mode: "question",
        query: "Where does auth start?",
        targetModel: "generic"
      },
      budget: {
        maxTokens: 1,
        hardLimit: true,
        reserveForPrompt: 0,
        reserveForAnswer: 0
      },
      scope: {
        includeTests: true,
        includeDocs: true
      },
      security: {
        redactSecrets: true,
        emitAuditLog: true,
        allowRemoteConfig: false
      },
      output: {
        format: "json"
      }
    });

    expect(output.manifest.totalTokens).toBeLessThanOrEqual(1);
    expect(output.selectedFiles).toHaveLength(0);
    expect(output.manifest.droppedFiles).toContainEqual({
      path: "tests/auth.test.ts",
      reason: "token budget exceeded"
    });
  });

  test("caps large-repository metadata while reporting omitted counts", async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsift-large-meta-"));
    await fs.mkdir(path.join(repo, "src"), { recursive: true });
    await fs.writeFile(path.join(repo, "src", "target.ts"), "export const targetFeature = true;\n", "utf8");
    for (let index = 0; index < 350; index += 1) {
      await fs.writeFile(path.join(repo, `irrelevant-${index}.txt`), `irrelevant file ${index}\n`, "utf8");
    }

    const output = await packRepository({
      repo: { type: "local", pathOrUrl: repo },
      task: { mode: "question", query: "target feature", targetModel: "generic" },
      budget: { maxTokens: 20, hardLimit: true, reserveForPrompt: 0, reserveForAnswer: 0 },
      scope: { includeTests: true, includeDocs: true },
      security: { redactSecrets: true, emitAuditLog: true, allowRemoteConfig: false },
      output: { format: "json" }
    });

    expect(output.tree).toContain("more files omitted from tree");
    expect(output.manifest.droppedFiles.length).toBeLessThanOrEqual(200);
    expect(output.manifest.droppedFilesOmitted).toBeGreaterThan(0);
  });

  test("redacts only selected output files", async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsift-redact-selected-"));
    await fs.mkdir(path.join(repo, "src"), { recursive: true });
    await fs.mkdir(path.join(repo, "logs"), { recursive: true });
    await fs.writeFile(path.join(repo, "src", "target.ts"), "export const target = 'sk-proj-selected-secret';\n", "utf8");
    await fs.writeFile(path.join(repo, "logs", "unselected.log"), "sk-proj-dropped-secret\n", "utf8");

    const output = await packRepository({
      repo: { type: "local", pathOrUrl: repo },
      task: { mode: "question", query: "target", targetModel: "generic" },
      budget: { maxTokens: 2000, hardLimit: true, reserveForPrompt: 100, reserveForAnswer: 400 },
      scope: { includeTests: true, includeDocs: true },
      security: { redactSecrets: true, emitAuditLog: true, allowRemoteConfig: false },
      output: { format: "json" }
    });
    const allContent = output.chunks.map((chunk) => chunk.content).join("\n");

    expect(allContent).toContain("[REDACTED:OPENAI_API_KEY]");
    expect(allContent).not.toContain("sk-proj-selected-secret");
    expect(allContent).not.toContain("sk-proj-dropped-secret");
    expect(output.audit.redactions).toBe(1);
  });
});

async function createBasicFixtureWithIgnoredBuildOutput(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsift-basic-"));
  await fs.cp(fixtureRoot, root, { recursive: true });
  await fs.mkdir(path.join(root, "dist"), { recursive: true });
  await fs.writeFile(path.join(root, "dist", "generated.js"), "export const generated = true;\n", "utf8");
  return root;
}
