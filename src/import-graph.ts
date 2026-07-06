import type { CandidateFile, WorkspaceImportEdge, WorkspacePackage } from "./types.js";

export type ExtractImportGraphInput = {
  files: CandidateFile[];
  packages: WorkspacePackage[];
};

export function extractImportGraph(input: ExtractImportGraphInput): WorkspaceImportEdge[] {
  const edges: WorkspaceImportEdge[] = [];
  const sortedPackages = [...input.packages].sort((left, right) => right.path.length - left.path.length);

  for (const file of input.files) {
    if (!file.content || file.classification?.kind === "doc") {
      continue;
    }
    const fromPackage = sortedPackages.find((workspacePackage) => belongsToPackage(file.path, workspacePackage.path))?.name ?? null;
    for (const specifier of extractImportSpecifiers(file.content)) {
      const toPackage = input.packages.find((workspacePackage) => specifier === workspacePackage.name || specifier.startsWith(`${workspacePackage.name}/`));
      if (toPackage) {
        edges.push({
          fromFile: file.path,
          fromPackage,
          specifier,
          toPackage: toPackage.name
        });
      }
    }
  }

  return edges.sort((left, right) => `${left.fromFile}:${left.specifier}`.localeCompare(`${right.fromFile}:${right.specifier}`));
}

function extractImportSpecifiers(content: string): string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /\bimport\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+[^'"]+\s+from\s+["']([^"']+)["']/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (match[1]) {
        specifiers.add(match[1]);
      }
    }
  }

  return [...specifiers];
}

function belongsToPackage(filePath: string, packagePath: string): boolean {
  return packagePath === "." || filePath === packagePath || filePath.startsWith(`${packagePath}/`);
}
