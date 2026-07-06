import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { renderBenchmarkMarkdown, summarizeBenchmarkResults } from "../dist/benchmark-reporter.js";

const root = process.cwd();
const cli = path.join(root, "dist", "cli.js");
const mode = process.argv[2] ?? "--report";

if (mode === "--fixtures") {
  validateFixtures();
} else if (mode === "--report") {
  await generateReport();
} else {
  throw new Error(`Unknown benchmark mode: ${mode}`);
}

function validateFixtures() {
  for (const fixture of staticFixtures()) {
    const fixtureRoot = path.join(root, fixture.repo);
    if (!statSync(fixtureRoot).isDirectory()) {
      throw new Error(`Benchmark fixture missing: ${fixture.repo}`);
    }
  }
  process.stdout.write(`Validated ${staticFixtures().length + 1} benchmark fixtures\n`);
}

async function generateReport() {
  const prDiffRepo = await createPrDiffFixture();
  const fixtures = [...staticFixtures(), prDiffFixture(prDiffRepo)];
  const results = fixtures.map(runFixture);
  const report = {
    generatedAt: new Date().toISOString(),
    results,
    summary: summarizeBenchmarkResults(results)
  };

  writeFileSync(path.join(root, "benchmark-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(path.join(root, "benchmark-report.md"), renderBenchmarkMarkdown(report), "utf8");
  rmSync(prDiffRepo, { recursive: true, force: true });
  process.stdout.write(`Wrote benchmark-report.json and benchmark-report.md for ${results.length} fixtures\n`);
}

function staticFixtures() {
  return [
    {
      name: "simple-ts",
      repo: "tests/fixtures/basic-app",
      args: ["--ask", "Where does auth start?"],
      expectedFiles: ["src/auth/login.ts"],
      expectedPackages: []
    },
    {
      name: "pnpm-monorepo",
      repo: "tests/fixtures/monorepo",
      args: ["--ask", "Where is auth implemented?", "--workspace-aware"],
      expectedFiles: ["packages/auth/src/index.ts"],
      expectedPackages: ["@ctxsift/auth"]
    },
    {
      name: "turbo-monorepo",
      repo: "tests/fixtures/monorepo",
      args: ["--package", "apps/web", "--ask", "Why might routing break?", "--workspace-aware"],
      expectedFiles: ["apps/web/src/router.ts"],
      expectedPackages: ["@ctxsift/web"]
    },
    {
      name: "nx-monorepo",
      repo: "tests/fixtures/monorepo",
      args: ["--workspace-graph", "--format", "json"],
      expectedFiles: [],
      expectedPackages: ["@ctxsift/web", "@ctxsift/auth"]
    },
    {
      name: "secrets",
      repo: "tests/fixtures/secrets",
      args: ["--ask", "Explain config loading", "--include", ".env.example", "--profile", "strict"],
      expectedFiles: [".env.example"],
      expectedPackages: []
    }
  ];
}

function prDiffFixture(repo) {
  return {
    name: "pr-diff",
    repo,
    args: ["--diff", "main...HEAD", "--mode", "review"],
    expectedFiles: ["src/auth/login.ts", "tests/auth.test.ts"],
    expectedPackages: []
  };
}

function runFixture(fixture) {
  const repoPath = path.isAbsolute(fixture.repo) ? fixture.repo : path.join(root, fixture.repo);
  const started = performance.now();
  const result = runCtxsift(["--repo", repoPath, "--format", "json", ...fixture.args]);
  const elapsed = Math.round(performance.now() - started);
  const output = JSON.parse(result.stdout);
  const selectedPaths = output.selectedFiles.map((file) => file.path);
  const topPaths = selectedPaths.slice(0, 5);
  const baselineTokens = estimateFullRepoTokens(repoPath);
  const expectedFilesCount = fixture.expectedFiles.length || 1;
  const expectedPackageCount = fixture.expectedPackages.length || 1;
  const focusedPackageNames = new Set((output.workspaces?.focusedPackages ?? []).map((workspacePackage) => workspacePackage.name));

  return {
    fixture: fixture.name,
    selectedFilesCount: output.selectedFiles.length,
    estimatedTokens: output.manifest.totalTokens,
    relevantFilesHitRate: fixture.expectedFiles.filter((file) => selectedPaths.includes(file)).length / expectedFilesCount,
    droppedFilesCount: output.manifest.droppedFiles.length + output.manifest.droppedFilesOmitted,
    securityFindingsCount: output.audit.redactions + output.audit.blockedHighRiskFiles.length,
    bundleGenerationMs: elapsed,
    fullRepoBaselineTokens: baselineTokens,
    selectedContextTokenSavingRatio: baselineTokens > 0 ? Math.max(0, (baselineTokens - output.manifest.totalTokens) / baselineTokens) : 0,
    topNRelevantFileCoverage: fixture.expectedFiles.filter((file) => topPaths.includes(file)).length / expectedFilesCount,
    workspacePackageHitRate: fixture.expectedPackages.filter((name) => focusedPackageNames.has(name)).length / expectedPackageCount
  };
}

function runCtxsift(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status !== 0) {
    throw new Error(`ctxsift ${args.join(" ")} failed:\n${result.stderr}`);
  }
  return { stdout: result.stdout };
}

function estimateFullRepoTokens(repoPath) {
  let total = 0;
  for (const filePath of walk(repoPath)) {
    const relative = path.relative(repoPath, filePath).replaceAll("\\", "/");
    if (/(^|\/)(node_modules|dist|build|coverage|\.git)(\/|$)/.test(relative)) {
      continue;
    }
    const buffer = readFileSync(filePath);
    if (buffer.includes(0)) {
      continue;
    }
    total += Math.max(1, Math.ceil(buffer.toString("utf8").length / 4));
  }
  return total;
}

function walk(current) {
  const files = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

async function createPrDiffFixture() {
  const repo = mkdtempSync(path.join(tmpdir(), "ctxsift-bench-pr-"));
  await cp(path.join(root, "tests/fixtures/pr-review"), repo, { recursive: true });
  runGit(repo, ["init", "-b", "main"]);
  runGit(repo, ["config", "user.email", "ctxsift@example.com"]);
  runGit(repo, ["config", "user.name", "CtxSift Bench"]);
  runGit(repo, ["add", "."]);
  runGit(repo, ["commit", "-m", "initial"]);
  runGit(repo, ["checkout", "-b", "feature/auth"]);
  mkdirSync(path.join(repo, "src", "auth"), { recursive: true });
  await writeFile(path.join(repo, "src", "auth", "login.ts"), "export function login(password: string) { return password.trim(); }\n", "utf8");
  mkdirSync(path.join(repo, "tests"), { recursive: true });
  await writeFile(path.join(repo, "tests", "auth.test.ts"), "import '../src/auth/login';\ntest('auth', () => {});\n", "utf8");
  runGit(repo, ["add", "."]);
  runGit(repo, ["commit", "-m", "change auth"]);
  return repo;
}

function runGit(cwd, args) {
  execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
}
