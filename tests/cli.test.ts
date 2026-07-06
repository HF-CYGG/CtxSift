import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const fixtureRoot = fileURLToPath(new URL("./fixtures/basic-app", import.meta.url));

describe("ctxsift CLI", () => {
  test("prints the package version from the package bin entrypoint", async () => {
    await execFileAsync(process.execPath, ["node_modules/typescript/lib/tsc.js", "-p", "tsconfig.build.json"]);
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      version: string;
      bin: { ctxsift: string };
    };
    const binPath = path.join(projectRoot, packageJson.bin.ctxsift);

    const { stdout } = await execFileAsync(process.execPath, [binPath, "--version"]);

    expect(stdout.trim()).toBe(packageJson.version);
  });

  test("prints Markdown context from the package bin entrypoint", async () => {
    await execFileAsync(process.execPath, ["node_modules/typescript/lib/tsc.js", "-p", "tsconfig.build.json"]);
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      bin: { ctxsift: string };
    };
    const binPath = path.join(projectRoot, packageJson.bin.ctxsift);

    const { stdout } = await execFileAsync(process.execPath, [
      binPath,
      "--ask",
      "Where does auth start?",
      "--repo",
      fixtureRoot,
      "--max-tokens",
      "2000",
      "--format",
      "markdown"
    ]);

    expect(stdout).toContain("# CtxSift Bundle");
    expect(stdout).toContain("src/auth/login.ts");
    expect(stdout).not.toContain("sk-proj-fixture-not-real");
  });

  test("prints a warning when redaction is disabled", async () => {
    await execFileAsync(process.execPath, ["node_modules/typescript/lib/tsc.js", "-p", "tsconfig.build.json"]);
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      bin: { ctxsift: string };
    };
    const binPath = path.join(projectRoot, packageJson.bin.ctxsift);

    const { stderr } = await execFileAsync(process.execPath, [
      binPath,
      "--ask",
      "Explain config loading",
      "--repo",
      fixtureRoot,
      "--format",
      "json",
      "--no-redact"
    ]);

    expect(stderr).toContain("WARNING: --no-redact disables secret redaction");
  });
});
