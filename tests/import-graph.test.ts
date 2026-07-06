import { describe, expect, test } from "vitest";
import { extractImportGraph } from "../src/import-graph.js";
import type { CandidateFile, WorkspacePackage } from "../src/types.js";

describe("extractImportGraph", () => {
  test("maps source imports to internal workspace packages", () => {
    const edges = extractImportGraph({
      files: [
        candidate("apps/web/src/router.ts", "import { authenticate } from '@ctxsift/auth';\nimport './local';\n"),
        candidate("packages/auth/src/index.ts", "export const authenticate = true;\n")
      ],
      packages: [workspacePackage("@ctxsift/web", "apps/web"), workspacePackage("@ctxsift/auth", "packages/auth")]
    });

    expect(edges).toEqual([
      {
        fromFile: "apps/web/src/router.ts",
        fromPackage: "@ctxsift/web",
        specifier: "@ctxsift/auth",
        toPackage: "@ctxsift/auth"
      }
    ]);
  });
});

function workspacePackage(name: string, packagePath: string): WorkspacePackage {
  return {
    name,
    path: packagePath,
    packageJsonPath: `${packagePath}/package.json`,
    scripts: {},
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
    language: "typescript",
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
