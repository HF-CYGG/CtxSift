import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { classifyFile, normalizePath } from "./file-classifier.js";
import { estimateTokens } from "./token-budgeter.js";
import type { CandidateFile, RepoLoadResult } from "./types.js";

const DEFAULT_IGNORES = [
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".vs",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache"
];

const MAX_TEXT_FILE_BYTES = 512 * 1024;
const execFileAsync = promisify(execFile);

export async function loadRepository(rootPath: string, options?: { include?: string[]; exclude?: string[] }): Promise<RepoLoadResult> {
  const root = await resolveRepositoryRoot(rootPath);
  const includeRules = (options?.include ?? []).map(normalizePath);
  const ignoreRules = [...DEFAULT_IGNORES, ...(await readGitignore(root)), ...(options?.exclude ?? [])].map(normalizePath);
  const files: CandidateFile[] = [];
  const ignoredFiles: string[] = [];

  await walk(root, root, ignoredFiles, async (absolutePath, relativePath) => {
    const normalized = normalizePath(relativePath);
    const classification = classifyFile(normalized);
    const explicit = matchesAnyPattern(normalized, includeRules);

    if (!explicit && (matchesAnyIgnore(normalized, ignoreRules) || classification.isDefaultIgnored)) {
      ignoredFiles.push(normalized);
      return;
    }

    const stats = await fs.stat(absolutePath);
    if (!classification.isText || stats.size > MAX_TEXT_FILE_BYTES) {
      ignoredFiles.push(normalized);
      return;
    }

    const buffer = await fs.readFile(absolutePath);
    if (looksBinary(buffer)) {
      ignoredFiles.push(normalized);
      return;
    }

    const content = buffer.toString("utf8");
    files.push({
      path: normalized,
      absolutePath,
      language: classification.language,
      sizeBytes: stats.size,
      estimatedTokens: estimateTokens(content),
      content,
      classification,
      reasons: explicit ? ["explicitly included"] : [],
      scores: {
        lexical: 0,
        structural: 0,
        git: 0,
        test: 0,
        docs: 0,
        riskPenalty: classification.isHighRisk ? 100 : 0,
        total: 0
      }
    });
  });

  files.sort((left, right) => left.path.localeCompare(right.path));
  ignoredFiles.sort((left, right) => left.localeCompare(right));

  return {
    root,
    files,
    ignoredFiles,
    tree: buildTree(files.map((file) => file.path))
  };
}

export async function resolveRepositoryRoot(rootPath: string): Promise<string> {
  const resolved = path.resolve(rootPath);
  try {
    await fs.stat(path.join(resolved, ".git"));
  } catch {
    return resolved;
  }

  try {
    const { stdout } = await execFileAsync("git", ["-C", resolved, "rev-parse", "--show-toplevel"]);
    return path.resolve(stdout.trim());
  } catch {
    return resolved;
  }
}

async function walk(
  root: string,
  current: string,
  ignoredFiles: string[],
  onFile: (absolutePath: string, relativePath: string) => Promise<void>
): Promise<void> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    const relativePath = path.relative(root, absolutePath);
    const normalized = normalizePath(relativePath);

    if (entry.isDirectory()) {
      if (DEFAULT_IGNORES.includes(entry.name)) {
        await collectIgnoredFiles(root, absolutePath, ignoredFiles);
        continue;
      }
      await walk(root, absolutePath, ignoredFiles, onFile);
      continue;
    }

    if (entry.isFile()) {
      await onFile(absolutePath, normalized);
    }
  }
}

async function collectIgnoredFiles(root: string, current: string, ignoredFiles: string[]): Promise<void> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await collectIgnoredFiles(root, absolutePath, ignoredFiles);
    } else if (entry.isFile()) {
      ignoredFiles.push(normalizePath(path.relative(root, absolutePath)));
    }
  }
}

async function readGitignore(root: string): Promise<string[]> {
  try {
    const content = await fs.readFile(path.join(root, ".gitignore"), "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function matchesAnyIgnore(filePath: string, rules: string[]): boolean {
  return matchesAnyPattern(filePath, rules);
}

function matchesAnyPattern(filePath: string, rules: string[]): boolean {
  return rules.some((rule) => matchesPattern(filePath, rule));
}

function matchesPattern(filePath: string, rule: string): boolean {
  const normalizedRule = normalizePath(rule).replace(/\/$/, "");
  if (normalizedRule.length === 0) {
    return false;
  }

  if (normalizedRule.includes("*")) {
    const placeholder = "\u0000GLOBSTAR\u0000";
    const escaped = normalizedRule
      .replaceAll("**", placeholder)
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replaceAll(placeholder, ".*")
      .replaceAll("*", "[^/]*");
    return new RegExp(`^${escaped}$`).test(filePath) || new RegExp(`(^|/)${escaped}($|/)`).test(filePath);
  }

  return filePath === normalizedRule || filePath.startsWith(`${normalizedRule}/`) || filePath.includes(`/${normalizedRule}/`);
}

function buildTree(paths: string[]): string {
  return paths.join("\n");
}

function looksBinary(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  if (sample.includes(0)) {
    return true;
  }

  if (sample.length === 0) {
    return false;
  }

  let suspicious = 0;
  for (const byte of sample) {
    const isTextControl = byte === 9 || byte === 10 || byte === 13;
    const isPrintable = byte >= 32 && byte !== 127;
    if (!isTextControl && !isPrintable) {
      suspicious += 1;
    }
  }

  return suspicious / sample.length > 0.3;
}
