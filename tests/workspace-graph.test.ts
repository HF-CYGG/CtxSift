import { describe, expect, test } from "vitest";
import { detectWorkspaces } from "../src/workspace-detector.js";
import { buildWorkspaceGraph } from "../src/workspace-graph.js";
import type { CandidateFile } from "../src/types.js";

describe("buildWorkspaceGraph", () => {
  test("focuses changed packages and their internal dependencies", () => {
    const files = [
      candidate("pnpm-workspace.yaml", "packages:\n  - apps/*\n  - packages/*\n"),
      candidate("apps/web/package.json", JSON.stringify({ name: "@acme/web", dependencies: { "@acme/auth": "workspace:*" } })),
      candidate("apps/web/src/router.ts", "import { authenticate } from '@acme/auth';\n"),
      candidate("packages/auth/package.json", JSON.stringify({ name: "@acme/auth" })),
      candidate("packages/auth/src/index.ts", "export function authenticate() { return true; }\n")
    ];
    const detected = detectWorkspaces(files);
    const analysis = buildWorkspaceGraph(detected, files, ["apps/web/src/router.ts"]);

    expect(analysis.graph.dependencyEdges).toContainEqual({
      from: "@acme/web",
      to: "@acme/auth",
      type: "dependency"
    });
    expect(analysis.graph.focusedPackages.map((workspacePackage) => workspacePackage.name)).toEqual([
      "@acme/web",
      "@acme/auth"
    ]);
    expect(analysis.fileContexts.get("apps/web/src/router.ts")?.focus).toBe("changed");
    expect(analysis.fileContexts.get("packages/auth/src/index.ts")?.focus).toBe("dependency");
  });

  test("returns an empty graph when no workspace config exists", () => {
    const files = [candidate("src/index.ts", "export const app = true;\n")];
    const detected = detectWorkspaces(files);
    const analysis = buildWorkspaceGraph(detected, files, []);

    expect(analysis.graph.packages).toEqual([]);
    expect(analysis.graph.dependencyEdges).toEqual([]);
    expect(analysis.fileContexts.size).toBe(0);
  });
});

function candidate(path: string, content: string): CandidateFile {
  return {
    path,
    language: path.endsWith(".ts") ? "typescript" : null,
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
