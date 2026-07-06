import path from "node:path";
import { parseJsonObject, parsePackageManifest } from "./package-manifest.js";
import type {
  CandidateFile,
  WorkspaceBuildTool,
  WorkspaceDetection,
  WorkspacePackage,
  WorkspacePackageManager
} from "./types.js";

export function detectWorkspaces(files: CandidateFile[]): WorkspaceDetection {
  const byPath = new Map(files.map((file) => [file.path, file.content ?? ""]));
  const rootPackageJson = parseJsonObject(byPath.get("package.json"));
  const pnpmPatterns = parsePnpmWorkspaceYaml(byPath.get("pnpm-workspace.yaml"));
  const packageJsonPatterns = rootPackageJson ? parsePackageJsonWorkspaces(rootPackageJson.workspaces) : [];
  const packageManager: WorkspacePackageManager = pnpmPatterns.length > 0 ? "pnpm" : packageJsonPatterns.length > 0 ? "package-json" : "none";
  const patterns = packageManager === "pnpm" ? pnpmPatterns : packageJsonPatterns;
  const packageJsonFiles = files.filter((file) => path.posix.basename(file.path) === "package.json");
  const packages = patterns.length > 0 ? detectPackages(packageJsonFiles, patterns) : [];

  return {
    packageManager,
    buildTools: detectBuildTools(byPath),
    packages
  };
}

function detectPackages(packageJsonFiles: CandidateFile[], patterns: string[]): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];

  for (const file of packageJsonFiles) {
    const packageDir = normalizePackageDir(path.posix.dirname(file.path));
    if (!patterns.some((pattern) => matchesWorkspacePattern(packageDir, pattern))) {
      continue;
    }

    const parsed = parsePackageManifest(file.path, file.content);
    if (!parsed) {
      continue;
    }

    packages.push(parsed);
  }

  packages.sort((left, right) => left.path.localeCompare(right.path));
  return packages;
}

function parsePnpmWorkspaceYaml(content: string | undefined): string[] {
  if (!content) {
    return [];
  }

  const patterns: string[] = [];
  let inPackages = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (/^packages\s*:\s*$/.test(line.trim())) {
      inPackages = true;
      continue;
    }
    if (inPackages && /^\S/.test(line) && !line.trim().startsWith("-")) {
      break;
    }
    const match = inPackages ? line.match(/^\s*-\s*['"]?([^'"]+)['"]?\s*$/) : null;
    if (match && !match[1].startsWith("!")) {
      patterns.push(normalizeWorkspacePattern(match[1]));
    }
  }

  return [...new Set(patterns)];
}

function parsePackageJsonWorkspaces(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map(normalizeWorkspacePattern);
  }
  if (isRecord(value) && Array.isArray(value.packages)) {
    return value.packages.filter((item): item is string => typeof item === "string").map(normalizeWorkspacePattern);
  }
  return [];
}

function matchesWorkspacePattern(packageDir: string, pattern: string): boolean {
  if (pattern === ".") {
    return packageDir === ".";
  }
  if (pattern.endsWith("/**")) {
    const base = pattern.slice(0, -3);
    return packageDir === base || packageDir.startsWith(`${base}/`);
  }
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    if (!packageDir.startsWith(`${base}/`)) {
      return false;
    }
    return !packageDir.slice(base.length + 1).includes("/");
  }
  return packageDir === pattern;
}

function detectBuildTools(byPath: Map<string, string>): WorkspaceBuildTool[] {
  const tools: WorkspaceBuildTool[] = [];
  if (byPath.has("turbo.json")) {
    tools.push("turbo");
  }
  if (byPath.has("nx.json")) {
    tools.push("nx");
  }
  return tools;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWorkspacePattern(pattern: string): string {
  return pattern.replaceAll("\\", "/").replace(/\/$/, "") || ".";
}

function normalizePackageDir(packageDir: string): string {
  return packageDir === "" ? "." : packageDir.replaceAll("\\", "/");
}
