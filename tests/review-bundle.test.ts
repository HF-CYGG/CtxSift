import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";
import { packRepository } from "../src/pack.js";

const execFileAsync = promisify(execFile);

describe("diff-aware review bundle", () => {
  test("includes changed files, related tests, risks, and reviewer prompt", async () => {
    const repo = await createDiffFixture();

    const output = await packRepository({
      repo: { type: "local", pathOrUrl: repo },
      task: {
        mode: "review",
        query: "Review this auth change",
        diffBase: "main",
        diffHead: "HEAD",
        targetModel: "generic"
      },
      budget: { maxTokens: 4000, hardLimit: true, reserveForPrompt: 100, reserveForAnswer: 400 },
      scope: { includeTests: true, includeDocs: true },
      security: { redactSecrets: true, emitAuditLog: true, allowRemoteConfig: false },
      output: { format: "json" }
    });

    expect(output.review?.changedFiles).toContain("src/auth/login.ts");
    expect(output.review?.relatedTests).toContain("tests/auth.test.ts");
    expect(output.review?.risks).toContain("Auth/security-sensitive path changed: src/auth/login.ts");
    expect(output.review?.reviewerPrompt).toContain("Review the supplied diff-aware repository context");
    expect(output.selectedFiles.map((file) => file.path)).toContain("src/auth/login.ts");
  });
});

async function createDiffFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsift-diff-"));
  await fs.mkdir(path.join(root, "src", "auth"), { recursive: true });
  await fs.mkdir(path.join(root, "tests"), { recursive: true });
  await fs.writeFile(path.join(root, "README.md"), "Auth starts in src/auth/login.ts\n", "utf8");
  await fs.writeFile(path.join(root, "src", "auth", "login.ts"), "export function login() { return 'ok'; }\n", "utf8");
  await fs.writeFile(path.join(root, "tests", "auth.test.ts"), "import '../src/auth/login';\n", "utf8");
  await git(root, ["init", "-b", "main"]);
  await git(root, ["config", "user.email", "ctxsift@example.com"]);
  await git(root, ["config", "user.name", "CtxSift Test"]);
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "initial"]);
  await git(root, ["checkout", "-b", "feature/auth-change"]);
  await fs.writeFile(path.join(root, "src", "auth", "login.ts"), "export function login(password: string) { return password.trim(); }\n", "utf8");
  await fs.writeFile(path.join(root, "tests", "auth.test.ts"), "import '../src/auth/login';\ntest('auth', () => {});\n", "utf8");
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "change auth"]);
  return root;
}

async function git(cwd: string, args: string[]): Promise<void> {
  await execFileAsync("git", args, { cwd });
}
