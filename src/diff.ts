import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { DiffSummary } from "./types.js";

const execFileAsync = promisify(execFile);

export type DiffSpec = {
  base: string;
  head: string;
};

export function parseDiffSpec(spec: string): DiffSpec {
  const parts = spec.split("...");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("--diff must use <base>...<head> format");
  }
  return { base: parts[0], head: parts[1] };
}

export async function loadGitDiffSummary(repoRoot: string, spec: string): Promise<DiffSummary> {
  parseDiffSpec(spec);
  const [nameOnly, stat] = await Promise.all([
    runGit(repoRoot, ["diff", "--name-only", spec]),
    runGit(repoRoot, ["diff", "--stat", spec])
  ]);

  return summarizeDiff({
    spec,
    changedFiles: nameOnly.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    stat: stat.trim()
  });
}

export function summarizeDiff(input: { spec: string; changedFiles: string[]; stat: string }): DiffSummary {
  const parsed = parseDiffSpec(input.spec);
  const relatedTests = input.changedFiles.filter((file) => /(^|\/)(tests?|__tests__)\//i.test(file) || /\.(test|spec)\./i.test(file));
  const relatedDocs = input.changedFiles.filter((file) => /(^|\/)(readme|docs?|adr|agents|claude|llms\.txt)/i.test(file) || /\.(md|mdx|rst|txt)$/i.test(file));
  const risks = input.changedFiles.flatMap((file) => riskForFile(file));

  return {
    spec: input.spec,
    base: parsed.base,
    head: parsed.head,
    stat: input.stat,
    changedFiles: input.changedFiles,
    relatedTests,
    relatedDocs,
    risks,
    reviewerPrompt: [
      "Review the supplied diff-aware repository context.",
      "Focus on behavioral regressions, missing tests, security-sensitive changes, and compatibility risks.",
      "Do not invent findings that are not supported by the provided files."
    ].join("\n")
  };
}

function riskForFile(file: string): string[] {
  const risks: string[] = [];
  if (/\.env|secret|credential|token|private|\.pem$|\.key$/i.test(file)) {
    risks.push(`Sensitive path changed: ${file}`);
  }
  if (/(auth|login|session|permission|security)/i.test(file)) {
    risks.push(`Auth/security-sensitive path changed: ${file}`);
  }
  if (/(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/i.test(file)) {
    risks.push(`Dependency manifest changed: ${file}`);
  }
  return risks;
}

async function runGit(repoRoot: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: repoRoot });
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`git ${args.join(" ")} failed: ${message}`);
  }
}
