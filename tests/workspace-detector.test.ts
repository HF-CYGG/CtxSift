import { describe, expect, test } from "vitest";
import { detectWorkspaces } from "../src/workspace-detector.js";
import type { CandidateFile } from "../src/types.js";

describe("detectWorkspaces", () => {
  test("parses pnpm workspace package patterns and build tool metadata", () => {
    const detected = detectWorkspaces([
      candidate("pnpm-workspace.yaml", "packages:\n  - apps/*\n  - packages/*\n"),
      candidate("package.json", JSON.stringify({ private: true })),
      candidate(
        "apps/web/package.json",
        JSON.stringify({
          name: "@acme/web",
          scripts: { build: "vite build" },
          dependencies: { "@acme/auth": "workspace:*" }
        })
      ),
      candidate(
        "packages/auth/package.json",
        JSON.stringify({
          name: "@acme/auth",
          scripts: { test: "vitest run" }
        })
      ),
      candidate("turbo.json", JSON.stringify({ pipeline: { build: {} } })),
      candidate("nx.json", JSON.stringify({ tasksRunnerOptions: {} }))
    ]);

    expect(detected.packageManager).toBe("pnpm");
    expect(detected.buildTools).toEqual(["turbo", "nx"]);
    expect(detected.packages.map((workspacePackage) => workspacePackage.name)).toEqual(["@acme/web", "@acme/auth"]);
    expect(detected.packages.find((workspacePackage) => workspacePackage.name === "@acme/web")?.scripts).toEqual({
      build: "vite build"
    });
  });

  test("parses package.json workspaces when pnpm-workspace.yaml is absent", () => {
    const detected = detectWorkspaces([
      candidate(
        "package.json",
        JSON.stringify({
          private: true,
          workspaces: ["apps/*"]
        })
      ),
      candidate("apps/admin/package.json", JSON.stringify({ name: "@acme/admin" }))
    ]);

    expect(detected.packageManager).toBe("package-json");
    expect(detected.packages.map((workspacePackage) => workspacePackage.path)).toEqual(["apps/admin"]);
  });

  test("ignores workspace patterns without matching package manifests", () => {
    const detected = detectWorkspaces([
      candidate("pnpm-workspace.yaml", "packages:\n  - apps/*\n  - tools/*\n"),
      candidate("apps/web/package.json", JSON.stringify({ name: "@acme/web" }))
    ]);

    expect(detected.packages.map((workspacePackage) => workspacePackage.path)).toEqual(["apps/web"]);
  });
});

function candidate(path: string, content: string): CandidateFile {
  return {
    path,
    language: null,
    sizeBytes: Buffer.byteLength(content),
    estimatedTokens: Math.ceil(content.length / 4),
    content,
    reasons: [],
    scores: {
      lexical: 0,
      structural: 0,
      git: 0,
      test: 0,
      docs: 0,
      workspace: 0,
      riskPenalty: 0,
      total: 0
    }
  };
}
