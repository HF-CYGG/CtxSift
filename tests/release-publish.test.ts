import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

describe("release publishing helper", () => {
  test("prints shell-safe release commands with quoted titles", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-release-print-"));
    const docsDir = path.join(workspace, "docs");
    const version = "9.9.9-alpha.1";
    const tag = `v${version}`;

    mkdirSync(docsDir);
    writeFileSync(
      path.join(workspace, "package.json"),
      JSON.stringify({
        version,
        repository: {
          type: "git",
          url: "https://github.com/HF-CYGG/CtxSift.git"
        }
      }),
      "utf8"
    );
    writeFileSync(path.join(docsDir, `release-${tag}.md`), `# ${tag}\n`, "utf8");

    const env = { ...process.env };
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;

    const result = spawnSync(process.execPath, [
      path.resolve("scripts/release-github.mjs"),
      "--print-command",
      "--skip-tag-check"
    ], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`--title "CtxSift ${tag}"`);
    expect(result.stdout).not.toContain(`--title CtxSift ${tag} --notes-file`);
  });

  test("treats an existing gh release as a successful confirmation", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-release-"));
    const docsDir = path.join(workspace, "docs");
    const fakeGhPath = path.join(workspace, "fake-gh.mjs");
    const version = "9.9.9-alpha.0";
    const tag = `v${version}`;

    mkdirSync(docsDir);
    writeFileSync(
      path.join(workspace, "package.json"),
      JSON.stringify({
        version,
        repository: {
          type: "git",
          url: "https://github.com/HF-CYGG/CtxSift.git"
        }
      }),
      "utf8"
    );
    writeFileSync(path.join(docsDir, `release-${tag}.md`), `# ${tag}\n`, "utf8");
    writeFakeGh(fakeGhPath);

    const env = { ...process.env };
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;
    env.CTXSIFT_GH_COMMAND = JSON.stringify([process.execPath, fakeGhPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/release-github.mjs"), "--skip-tag-check"], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Release ${tag} already exists on GitHub`);
    expect(result.stdout).toContain(`https://github.com/HF-CYGG/CtxSift/releases/tag/${tag}`);
    expect(result.stderr).not.toContain("unexpected create");
  });
});

function writeFakeGh(fakeGhPath: string) {
  writeFileSync(
    fakeGhPath,
    [
      "const args = process.argv.slice(2);",
      "if (args[0] === '--version') {",
      "  console.log('gh version 2.0.0');",
      "  process.exit(0);",
      "}",
      "if (args[0] === 'release' && args[1] === 'view') {",
      "  console.log(`https://github.com/HF-CYGG/CtxSift/releases/tag/${args[2]}`);",
      "  process.exit(0);",
      "}",
      "if (args[0] === 'release' && args[1] === 'create') {",
      "  console.error('unexpected create');",
      "  process.exit(9);",
      "}",
      "process.exit(1);"
    ].join("\n"),
    "utf8"
  );
}
