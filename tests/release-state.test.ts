import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

type PackageJson = {
  version: string;
};

describe("release state documentation", () => {
  test("tracks the current package version across release-facing documents", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;
    const version = packageJson.version;
    const tag = `v${version}`;
    const releaseDocPath = `docs/release-${tag}.md`;

    const readme = readFileSync("README.md", "utf8");
    const changelog = readFileSync("CHANGELOG.md", "utf8");
    const developmentState = readFileSync("DEVELOPMENT_STATE.md", "utf8");

    expect(existsSync(releaseDocPath)).toBe(true);
    expect(readme).toContain(`Release-${tag.replace("-", "--")}`);
    expect(readme).toContain(`releases/tag/${tag}`);
    expect(readme).toContain(releaseDocPath);
    expect(changelog).toContain(`## ${version} -`);
    expect(developmentState).toContain(`${tag} continuous optimization`);
  });
});
