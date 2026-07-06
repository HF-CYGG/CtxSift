import path from "node:path";
import type { WorkspacePackage } from "./types.js";

export function parsePackageManifest(packageJsonPath: string, content: string | undefined): WorkspacePackage | null {
  const parsed = parseJsonObject(content);
  if (!parsed) {
    return null;
  }

  const packagePath = normalizePackageDir(path.posix.dirname(packageJsonPath));
  return {
    name: typeof parsed.name === "string" && parsed.name.length > 0 ? parsed.name : packagePath,
    path: packagePath,
    packageJsonPath,
    scripts: readStringRecord(parsed.scripts),
    dependencies: {
      dependency: Object.keys(readStringRecord(parsed.dependencies)),
      devDependency: Object.keys(readStringRecord(parsed.devDependencies)),
      peerDependency: Object.keys(readStringRecord(parsed.peerDependencies)),
      optionalDependency: Object.keys(readStringRecord(parsed.optionalDependencies))
    }
  };
}

export function parseJsonObject(content: string | undefined): Record<string, unknown> | null {
  if (!content) {
    return null;
  }
  try {
    const parsed = JSON.parse(content) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePackageDir(packageDir: string): string {
  return packageDir === "" ? "." : packageDir.replaceAll("\\", "/");
}
