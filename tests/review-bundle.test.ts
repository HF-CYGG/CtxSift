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

    expect(output.review?.changedFiles).toContain("packages/auth/src/login.ts");
    expect(output.review?.relatedTests).toContain("packages/auth/tests/auth.test.ts");
    expect(output.review?.risks).toContain("Auth/security-sensitive path changed: packages/auth/src/login.ts");
    expect(output.review?.reviewerPrompt).toContain("Review the supplied diff-aware repository context");
    expect(output.selectedFiles.map((file) => file.path)).toContain("packages/auth/src/login.ts");
    expect(output.workspaces?.focusedPackages.map((workspacePackage) => workspacePackage.name)).toContain("@ctxsift/auth");
    expect(output.selectedFiles.find((file) => file.path === "packages/auth/src/login.ts")?.reasons).toContain(
      "workspace package: @ctxsift/auth"
    );
  });
});

async function createDiffFixture(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsift-diff-"));
  await fs.mkdir(path.join(root, "packages", "auth", "src"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "auth", "tests"), { recursive: true });
  await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ private: true, workspaces: ["packages/*"] }),
    "utf8"
  );
  await fs.writeFile(path.join(root, "packages", "auth", "package.json"), JSON.stringify({ name: "@ctxsift/auth" }), "utf8");
  await fs.writeFile(path.join(root, "README.md"), "Auth starts in packages/auth/src/login.ts\n", "utf8");
  await fs.writeFile(path.join(root, "packages", "auth", "src", "login.ts"), "export function login() { return 'ok'; }\n", "utf8");
  await fs.writeFile(path.join(root, "packages", "auth", "tests", "auth.test.ts"), "import '../src/login';\n", "utf8");
  await git(root, ["init", "-b", "main"]);
  await git(root, ["config", "user.email", "ctxsift@example.com"]);
  await git(root, ["config", "user.name", "CtxSift Test"]);
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "initial"]);
  await git(root, ["checkout", "-b", "feature/auth-change"]);
  await fs.writeFile(
    path.join(root, "packages", "auth", "src", "login.ts"),
    "export function login(password: string) { return password.trim(); }\n",
    "utf8"
  );
  await fs.writeFile(path.join(root, "packages", "auth", "tests", "auth.test.ts"), "import '../src/login';\ntest('auth', () => {});\n", "utf8");
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "change auth"]);
  return root;
}

async function git(cwd: string, args: string[]): Promise<void> {
  await execFileAsync("git", args, { cwd });
}
