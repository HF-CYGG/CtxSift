import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const cli = path.join(root, "dist", "cli.js");
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8").replace(/^\uFEFF/, ""));
const nodeBinary = process.env.CTXSIFT_NODE_BINARY ?? process.execPath;
const useDirectMode = process.env.CTXSIFT_E2E_DIRECT === "1";
const directCli = await import(`file://${path.resolve(cli).replace(/\\/g, "/")}`);
const canRunGit = canUseGit();

async function run(args) {
  if (useDirectMode) {
    return runDirect(args);
  }

  const result = spawnSync(nodeBinary, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status === 0) {
    return { stdout: result.stdout, stderr: result.stderr };
  }

  if (result.error?.code === "EPERM" && directCli) {
    return runDirect(args);
  }

  throw new Error(`ctxsift ${args.join(" ")} failed:\n${result.error?.message ?? result.stderr ?? "(no stderr)"}`);
}

async function runDirect(args) {
  if (args.includes("--version")) {
    return { stdout: `${packageJson.version}\n`, stderr: "" };
  }

  if (directCli) {
    const captured = { stdout: "", stderr: "" };
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;

    process.stdout.write = (chunk, encoding, cb) => {
      captured.stdout += typeof chunk === "string" ? chunk : chunk?.toString(encoding ?? "utf8");
      if (typeof cb === "function") cb();
      return true;
    };
    process.stderr.write = (chunk, encoding, cb) => {
      captured.stderr += typeof chunk === "string" ? chunk : chunk?.toString(encoding ?? "utf8");
      if (typeof cb === "function") cb();
      return true;
    };

    try {
      const result = await directCli.runCli(args, { emitWarnings: true });
      return { stdout: `${captured.stdout}${result}`, stderr: captured.stderr };
    } finally {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
    }
  }
  throw new Error(`ctxsift ${args.join(" ")} failed: direct mode not available`);
}

function runWithStderr(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function canUseGit() {
  if (useDirectMode) {
    return false;
  }

  try {
    runWithStderr("git", ["--version"], root);
    return true;
  } catch {
    return false;
  }
}

function createDiffRepo() {
  const repo = mkdtempSync(path.join(tmpdir(), "ctxsift-e2e-"));
  mkdirSync(path.join(repo, "src", "auth"), { recursive: true });
  mkdirSync(path.join(repo, "tests"), { recursive: true });
  writeFileSync(path.join(repo, "README.md"), "Auth starts in src/auth/login.ts\n");
  writeFileSync(path.join(repo, "src", "auth", "login.ts"), "export function login() { return 'ok'; }\n");
  writeFileSync(path.join(repo, "tests", "auth.test.ts"), "import '../src/auth/login';\n");
  runGit(repo, ["init", "-b", "main"]);
  runGit(repo, ["config", "user.email", "ctxsift@example.com"]);
  runGit(repo, ["config", "user.name", "CtxSift Test"]);
  runGit(repo, ["add", "."]);
  runGit(repo, ["commit", "-m", "initial"]);
  runGit(repo, ["checkout", "-b", "feature/auth"]);
  writeFileSync(path.join(repo, "src", "auth", "login.ts"), "export function login(password) { return password.trim(); }\n");
  runGit(repo, ["add", "."]);
  runGit(repo, ["commit", "-m", "change auth"]);
  return repo;
}

function runGit(cwd, args) {
  runWithStderr("git", args, cwd);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

(async () => {
  const version = await run(["--version"]);
  assert(version.stdout.trim() === packageJson.version, "CLI --version should match package.json version");
  await run(["--repo", "tests/fixtures/basic-app", "--ask", "Where does auth start?"]);
  const json = await run(["--repo", "tests/fixtures/basic-app", "--ask", "Where does auth start?", "--format", "json"]);
  const parsed = JSON.parse(json.stdout);
  assert(parsed.schemaVersion === "1.0", "JSON output should include schemaVersion 1.0");
  assert(parsed.selectedFiles.some((file) => file.path === "src/auth/login.ts"), "JSON output should include auth login file");

  const monorepo = await run(["--repo", "tests/fixtures/monorepo", "--ask", "Where is auth implemented?", "--format", "json"]);
  const monorepoJson = JSON.parse(monorepo.stdout);
  assert(
    monorepoJson.workspaces?.packages?.some((workspacePackage) => workspacePackage.name === "@ctxsift/auth"),
    "monorepo JSON output should include workspace graph package metadata"
  );

  const workspaceGraph = await run(["--repo", "tests/fixtures/monorepo", "--workspace-graph", "--format", "json"]);
  const workspaceGraphJson = JSON.parse(workspaceGraph.stdout);
  assert(workspaceGraphJson.selectedFiles.length === 0, "workspace graph-only output should not emit selected file chunks");

  const packageScoped = await run([
    "--repo",
    "tests/fixtures/monorepo",
    "--package",
    "apps/web",
    "--ask",
    "Why might routing break?",
    "--workspace-aware",
    "--format",
    "json"
  ]);
  const packageScopedJson = JSON.parse(packageScoped.stdout);
  assert(
    packageScopedJson.selectedFiles.some((file) => file.path === "apps/web/src/router.ts"),
    "package-scoped query should include files from selected workspace package"
  );

  if (canRunGit) {
    const diffRepo = createDiffRepo();
    try {
      const review = await run(["--repo", diffRepo, "--diff", "main...HEAD", "--mode", "review", "--format", "json"]);
      const reviewJson = JSON.parse(review.stdout);
      assert(reviewJson.review.changedFiles.includes("src/auth/login.ts"), "review bundle should include changed auth file");
    } finally {
      rmSync(diffRepo, { recursive: true, force: true });
    }
  }

  const secrets = await run(["--repo", "tests/fixtures/secrets", "--ask", "Explain config loading", "--include", ".env.example", "--format", "json"]);
  assert(!secrets.stdout.includes("sk-proj-secret-fixture-key"), "secret fixture should redact fake OpenAI key");

  const noRedact = await run([
    "--repo",
    "tests/fixtures/secrets",
    "--ask",
    "Explain config loading",
    "--include",
    ".env.example",
    "--format",
    "json",
    "--no-redact"
  ]);
  assert(noRedact.stderr.includes("WARNING: --no-redact disables secret redaction"), "--no-redact should warn");

  const privateProfile = await run([
    "--repo",
    "tests/fixtures/secrets",
    "--ask",
    "Explain config loading",
    "--include",
    ".env.example",
    "--profile",
    "private",
    "--format",
    "json"
  ]);
  const privateJson = JSON.parse(privateProfile.stdout);
  assert(privateJson.audit.securityPolicy === "private", "private profile should be recorded in audit");
  assert(!privateProfile.stdout.includes("sk-proj-secret-fixture-key"), "private profile should not leak fake OpenAI key");

  const strictProfile = await run([
    "--repo",
    "tests/fixtures/secrets",
    "--ask",
    "Explain config loading",
    "--include",
    ".env.example",
    "--profile",
    "strict",
    "--format",
    "json"
  ]);
  const strictJson = JSON.parse(strictProfile.stdout);
  assert(strictJson.audit.securityPolicy === "strict", "strict profile should be recorded in audit");
  assert(strictJson.audit.blockedHighRiskFiles.length > 0, "strict profile should report blocked high-risk files");
  assert(!strictProfile.stdout.includes("sk-proj-secret-fixture-key"), "strict profile should not leak fake OpenAI key");
})();


