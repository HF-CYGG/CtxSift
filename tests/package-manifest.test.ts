import { describe, expect, test } from "vitest";
import { parsePackageManifest } from "../src/package-manifest.js";

describe("parsePackageManifest", () => {
  test("parses package identity, scripts, and dependency groups", () => {
    const manifest = parsePackageManifest(
      "packages/auth/package.json",
      JSON.stringify({
        name: "@ctxsift/auth",
        scripts: { build: "tsc -b", test: "vitest run" },
        dependencies: { "@ctxsift/core": "workspace:*" },
        devDependencies: { vitest: "^3.2.4" },
        peerDependencies: { typescript: "^5.8.3" },
        optionalDependencies: { fsevents: "^2.3.3" }
      })
    );

    expect(manifest).toMatchObject({
      name: "@ctxsift/auth",
      path: "packages/auth",
      packageJsonPath: "packages/auth/package.json",
      scripts: { build: "tsc -b", test: "vitest run" },
      dependencies: {
        dependency: ["@ctxsift/core"],
        devDependency: ["vitest"],
        peerDependency: ["typescript"],
        optionalDependency: ["fsevents"]
      }
    });
  });

  test("returns null for invalid JSON", () => {
    expect(parsePackageManifest("packages/auth/package.json", "{nope")).toBeNull();
  });
});
