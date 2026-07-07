import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, test } from "vitest";

describe("GitHub release helper utilities", () => {
  test("formats command previews as single-line shell-safe strings", () => {
    const script = [
      "import { formatCommand } from './scripts/release-github-utils.mjs';",
      "console.log(formatCommand(['gh', 'release', 'create', '--title', 'CtxSift\\nRelease']));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"CtxSift\\nRelease"');
    expect(result.stdout).not.toContain("CtxSift\nRelease");
  });

  test("quotes command preview arguments that contain shell metacharacters", () => {
    const script = [
      "import { formatCommand } from './scripts/release-github-utils.mjs';",
      "console.log(formatCommand(['gh', 'release', 'create', '--title', 'CtxSift;Release']));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"CtxSift;Release"');
    expect(result.stdout).not.toContain(" --title CtxSift;Release");
  });

  test("quotes command preview arguments that contain single quotes", () => {
    const script = [
      "import { formatCommand } from './scripts/release-github-utils.mjs';",
      "console.log(formatCommand(['gh', 'release', 'create', '--title', `CtxSift'Release`]));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"CtxSift\'Release"');
    expect(result.stdout).not.toContain(" --title CtxSift'Release");
  });

  test("quotes empty command preview arguments", () => {
    const script = [
      "import { formatCommand } from './scripts/release-github-utils.mjs';",
      "console.log(formatCommand(['gh', 'release', 'create', '--notes', '']));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('--notes ""');
    expect(result.stdout).not.toContain("--notes \n");
  });

  test("parses npm-style git+https repository URLs", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository({ type: 'git', url: 'git+https://github.com/HF-CYGG/CtxSift.git' });",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ owner: "HF-CYGG", repo: "CtxSift" });
  });

  test("parses npm-style GitHub shorthand repository URLs", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository('github:HF-CYGG/CtxSift');",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ owner: "HF-CYGG", repo: "CtxSift" });
  });

  test("parses GitHub shorthand repository URLs with branch fragments", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository('github:HF-CYGG/CtxSift.git#release');",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ owner: "HF-CYGG", repo: "CtxSift" });
  });

  test("rejects GitHub shorthand repository URLs with empty normalized repository names", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository('github:HF-CYGG/.git#release');",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toBeNull();
  });

  test("parses SSH GitHub repository URLs", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository({ type: 'git', url: 'git@github.com:HF-CYGG/CtxSift.git' });",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ owner: "HF-CYGG", repo: "CtxSift" });
  });

  test("parses ssh protocol GitHub repository URLs", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository({ type: 'git', url: 'ssh://git@github.com/HF-CYGG/CtxSift.git' });",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ owner: "HF-CYGG", repo: "CtxSift" });
  });

  test("rejects SSH GitHub repository URLs with nested paths", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository('git@github.com:HF-CYGG/CtxSift/archive.git');",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toBeNull();
  });

  test("parses npm repository URLs with git suffixes and fragments", () => {
    const script = [
      "import { parseRepository } from './scripts/release-github-utils.mjs';",
      "const parsed = parseRepository({ type: 'git', url: 'git+https://github.com/HF-CYGG/CtxSift.git#main' });",
      "console.log(JSON.stringify(parsed));"
    ].join("\n");

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: path.resolve("."),
      encoding: "utf8",
      windowsHide: true
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ owner: "HF-CYGG", repo: "CtxSift" });
  });
});
