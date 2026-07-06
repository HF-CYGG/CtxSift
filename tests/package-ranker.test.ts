import { describe, expect, test } from "vitest";
import { rankWorkspacePackages } from "../src/package-ranker.js";
import type { WorkspacePackage } from "../src/types.js";

describe("rankWorkspacePackages", () => {
  test("adds query and explicit package reasons", () => {
    const ranked = rankWorkspacePackages({
      packages: [workspacePackage("@ctxsift/web", "apps/web"), workspacePackage("@ctxsift/auth", "packages/auth")],
      query: "How does auth routing work?",
      targetPackage: "apps/web"
    });

    expect(ranked.get("@ctxsift/auth")?.reasons).toContain("query matched workspace package");
    expect(ranked.get("@ctxsift/web")?.reasons).toContain("matched --package selector");
    expect(ranked.get("@ctxsift/web")?.score).toBeGreaterThan(ranked.get("@ctxsift/auth")?.score ?? 0);
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
