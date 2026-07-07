import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

describe("high-severity audit helper", () => {
  test("uses an explicit pnpm command without relying on shell resolution", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-audit-"));
    const binDir = path.join(workspace, "bin");
    const fakePnpmPath = path.join(binDir, "fake-pnpm.mjs");
    const markerPath = path.join(workspace, "audit-marker.json");
    mkdirSync(binDir);
    writeFakePnpm(fakePnpmPath, markerPath);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = "";
    env.CTXSIFT_PNPM_COMMAND = JSON.stringify([process.execPath, fakePnpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/audit-high.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("fake pnpm audit passed");
  });
});

function writeFakePnpm(fakePnpmPath: string, markerPath: string) {
  writeFileSync(
    fakePnpmPath,
    [
      "import { writeFileSync } from 'node:fs';",
      `const markerPath = ${JSON.stringify(markerPath)};`,
      "const args = process.argv.slice(2);",
      "writeFileSync(markerPath, JSON.stringify(args));",
      "if (args.join(' ') !== 'audit --audit-level high --registry https://registry.npmjs.org') {",
      "  console.error(`unexpected args: ${args.join(' ')}`);",
      "  process.exit(9);",
      "}",
      "console.log('fake pnpm audit passed');"
    ].join("\n"),
    "utf8"
  );
}
