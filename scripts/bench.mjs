import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { renderBenchmarkMarkdown, summarizeBenchmarkResults } from "../dist/benchmark-reporter.js";
import { runCli } from "../dist/cli.js";

const root = process.cwd();
const mode = process.argv[2] ?? "--report";
const reportDirectory = path.join(root, "benchmarks");

if (mode === "--fixtures") {
  validateFixtures();
} else if (mode === "--report") {
  await generateReport();
} else {
  throw new Error(`Unknown benchmark mode: ${mode}`);
}

function validateFixtures() {
  for (const fixture of requiredFixtures()) {
    const fixtureRoot = path.join(root, fixture);
    if (!existsSync(fixtureRoot) || !statSync(fixtureRoot).isDirectory()) {
      throw new Error(`Benchmark fixture missing: ${fixture}`);
    }
  }
  process.stdout.write(`Validated ${staticFixtures().length + 1} benchmark fixtures\n`);
}

function requiredFixtures() {
  return [...new Set([...staticFixtures().map((fixture) => fixture.repo), "tests/fixtures/pr-review"])];
}

async function generateReport() {
  const prDiffRepo = await createPrDiffFixtureOrSkip();
  try {
    const fixtures = [...staticFixtures()];
    if (prDiffRepo) {
      fixtures.push(prDiffFixture(prDiffRepo));
    } else {
      process.stdout.write("Skipping dynamic pr-diff fixture: git unavailable in this environment.\n");
    }

    const results = [];
    for (const fixture of fixtures) {
      try {
        results.push(await runFixture(fixture));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(`Skipping fixture "${fixture.name}" due runtime failure: ${message}\n`);
      }
    }
    if (!results.length) {
      throw new Error("No benchmark fixtures completed successfully");
    }
    mkdirSync(reportDirectory, { recursive: true });
    const report = {
      generatedAt: new Date().toISOString(),
      results,
      summary: summarizeBenchmarkResults(results)
    };

    writeFileSync(
      path.join(reportDirectory, "benchmark-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8"
    );
    writeFileSync(
      path.join(reportDirectory, "benchmark-report.md"),
      renderBenchmarkMarkdown(report),
      "utf8"
    );
    process.stdout.write(`Wrote benchmarks/benchmark-report.json and benchmarks/benchmark-report.md for ${results.length} fixtures\n`);
  } finally {
    if (prDiffRepo) {
      rmSync(prDiffRepo, { recursive: true, force: true });
    }
  }
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

async function runFixture(fixture) {
  const repoPath = path.isAbsolute(fixture.repo) ? fixture.repo : path.join(root, fixture.repo);
  const started = performance.now();
  const result = await runCtxsift(["--repo", repoPath, "--format", "json", ...fixture.args]);
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

async function runCtxsift(args) {
  try {
    const stdout = await runCli(args, { emitWarnings: false });
    return { stdout };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`ctxsift ${args.join(" ")} failed:\n${message}`);
  }
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

async function createPrDiffFixtureOrSkip() {
  try {
    return await createPrDiffFixture();
  } catch (error) {
    const maybeError = error;
    if (
      typeof maybeError === "object" &&
      maybeError !== null &&
      "code" in maybeError &&
      (maybeError.code === "EPERM" || maybeError.code === "ENOENT")
    ) {
      return null;
    }
    throw error;
  }
}
