import path from "node:path";
import { parseJsonObject } from "./package-manifest.js";
import type { CandidateFile, WorkspaceBuildTarget, WorkspacePackage } from "./types.js";

export type DetectBuildTargetsInput = {
  files: CandidateFile[];
  packages: WorkspacePackage[];
};

export function detectBuildTargets(input: DetectBuildTargetsInput): WorkspaceBuildTarget[] {
  return [
    ...detectScriptTargets(input.packages),
    ...detectToolTargets(input.files),
    ...detectTsconfigReferenceTargets(input.files, input.packages)
  ];
}

function detectScriptTargets(packages: WorkspacePackage[]): WorkspaceBuildTarget[] {
  return packages.flatMap((workspacePackage) => {
    return Object.entries(workspacePackage.scripts).map(([name, command]) => ({
      type: "script" as const,
      name,
      packageName: workspacePackage.name,
      packagePath: workspacePackage.path,
      command
    }));
  });
}

function detectToolTargets(files: CandidateFile[]): WorkspaceBuildTarget[] {
  const paths = new Set(files.map((file) => file.path));
  const targets: WorkspaceBuildTarget[] = [];
  if (paths.has("turbo.json")) {
    targets.push({ type: "tool", name: "turbo", packageName: null, packagePath: ".", command: null });
  }
  if (paths.has("nx.json")) {
    targets.push({ type: "tool", name: "nx", packageName: null, packagePath: ".", command: null });
  }
  return targets;
}

function detectTsconfigReferenceTargets(files: CandidateFile[], packages: WorkspacePackage[]): WorkspaceBuildTarget[] {
  const packageByPath = new Map(packages.map((workspacePackage) => [workspacePackage.path, workspacePackage]));
  const targets: WorkspaceBuildTarget[] = [];

  for (const file of files) {
    if (!/(^|\/)tsconfig(?:\.[^/]+)?\.json$/i.test(file.path)) {
      continue;
    }
    const parsed = parseJsonObject(file.content);
    const references = Array.isArray(parsed?.references) ? parsed.references : [];
    const basePath = path.posix.dirname(file.path) === "." ? "" : `${path.posix.dirname(file.path)}/`;
    for (const reference of references) {
      if (!isRecord(reference) || typeof reference.path !== "string") {
        continue;
      }
      const referencedPath = normalizeReferencePath(`${basePath}${reference.path}`);
      const workspacePackage = packageByPath.get(referencedPath);
      targets.push({
        type: "tsconfig-reference",
        name: referencedPath,
        packageName: workspacePackage?.name ?? null,
        packagePath: referencedPath,
        command: null
      });
    }
  }

  return targets;
}

function normalizeReferencePath(referencePath: string): string {
  return referencePath.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
