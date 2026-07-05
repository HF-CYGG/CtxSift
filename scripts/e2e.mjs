import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const cli = path.join(root, "dist", "cli.js");

run(["--repo", "tests/fixtures/basic-app", "--ask", "Where does auth start?"]);
const json = run(["--repo", "tests/fixtures/basic-app", "--ask", "Where does auth start?", "--format", "json"]);
const parsed = JSON.parse(json.stdout);
assert(parsed.schemaVersion === "1.0", "JSON output should include schemaVersion 1.0");
assert(parsed.selectedFiles.some((file) => file.path === "src/auth/login.ts"), "JSON output should include auth login file");

const diffRepo = createDiffRepo();
const review = run(["--repo", diffRepo, "--diff", "main...HEAD", "--mode", "review", "--format", "json"]);
const reviewJson = JSON.parse(review.stdout);
assert(reviewJson.review.changedFiles.includes("src/auth/login.ts"), "review bundle should include changed auth file");

const secrets = run(["--repo", "tests/fixtures/secrets", "--ask", "Explain config loading", "--include", ".env.example", "--format", "json"]);
assert(!secrets.stdout.includes("sk-proj-secret-fixture-key"), "secret fixture should redact fake OpenAI key");

const noRedact = run([
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

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status !== 0) {
    throw new Error(`ctxsift ${args.join(" ")} failed:\n${result.error?.message ?? result.stderr ?? "(no stderr)"}`);
  }
  return { stdout: result.stdout, stderr: result.stderr };
}

function runWithStderr(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
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
