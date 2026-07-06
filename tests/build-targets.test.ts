import { describe, expect, test } from "vitest";
import { detectBuildTargets } from "../src/build-targets.js";
import type { CandidateFile, WorkspacePackage } from "../src/types.js";

describe("detectBuildTargets", () => {
  test("detects package scripts, build tool metadata, and tsconfig references", () => {
    const targets = detectBuildTargets({
      files: [
        candidate("turbo.json", JSON.stringify({ pipeline: { build: {} } })),
        candidate("nx.json", JSON.stringify({ targetDefaults: { test: {} } })),
        candidate(
          "tsconfig.json",
          JSON.stringify({
            references: [{ path: "./packages/auth" }, { path: "apps/web" }]
          })
        )
      ],
      packages: [
        workspacePackage("@ctxsift/web", "apps/web", { build: "vite build" }),
        workspacePackage("@ctxsift/auth", "packages/auth", { test: "vitest run" })
      ]
    });

    expect(targets).toEqual(
      expect.arrayContaining([
        { type: "script", name: "build", packageName: "@ctxsift/web", packagePath: "apps/web", command: "vite build" },
        { type: "script", name: "test", packageName: "@ctxsift/auth", packagePath: "packages/auth", command: "vitest run" },
        { type: "tool", name: "turbo", packageName: null, packagePath: ".", command: null },
        { type: "tool", name: "nx", packageName: null, packagePath: ".", command: null },
        { type: "tsconfig-reference", name: "packages/auth", packageName: "@ctxsift/auth", packagePath: "packages/auth", command: null },
        { type: "tsconfig-reference", name: "apps/web", packageName: "@ctxsift/web", packagePath: "apps/web", command: null }
      ])
    );
  });
});

function workspacePackage(name: string, packagePath: string, scripts: Record<string, string>): WorkspacePackage {
  return {
    name,
    path: packagePath,
    packageJsonPath: `${packagePath}/package.json`,
    scripts,
    dependencies: {
      dependency: [],
      devDependency: [],
      peerDependency: [],
      optionalDependency: []
    }
  };
}

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
