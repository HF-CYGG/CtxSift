import { detectBuildTargets } from "./build-targets.js";
import { extractImportGraph } from "./import-graph.js";
import { rankWorkspacePackages } from "./package-ranker.js";
import type {
  CandidateFile,
  WorkspaceAnalysis,
  WorkspaceDependencyEdge,
  WorkspaceDependencyType,
  WorkspaceDetection,
  WorkspaceFileContext,
  WorkspaceFocus,
  WorkspaceGraph,
  WorkspacePackage,
  WorkspacePackageReason
} from "./types.js";

const DEPENDENCY_TYPES: WorkspaceDependencyType[] = ["dependency", "devDependency", "peerDependency", "optionalDependency"];

export type BuildWorkspaceGraphOptions = {
  query?: string;
  targetPackage?: string;
};

export function buildWorkspaceGraph(
  detection: WorkspaceDetection,
  files: CandidateFile[],
  changedFiles: string[],
  options: BuildWorkspaceGraphOptions = {}
): WorkspaceAnalysis {
  const dependencyEdges = buildDependencyEdges(detection.packages);
  const packageByFile = attributeFilesToPackages(files, detection.packages);
  const changedPackageNames = new Set<string>();

  for (const changedFile of changedFiles) {
    const changedPackage = packageByFile.get(changedFile);
    if (changedPackage) {
      changedPackageNames.add(changedPackage.name);
    }
  }

  const dependencyPackageNames = collectDependencyPackages(changedPackageNames, dependencyEdges);
  const packageRanks = rankWorkspacePackages({
    packages: detection.packages,
    query: options.query,
    targetPackage: options.targetPackage
  });
  const packageReasons = buildPackageReasons(detection.packages, changedPackageNames, dependencyPackageNames, packageRanks);
  const fileContexts = new Map<string, WorkspaceFileContext>();

  for (const file of files) {
    const workspacePackage = packageByFile.get(file.path);
    if (!workspacePackage) {
      continue;
    }

    const focus = focusForPackage(workspacePackage.name, changedPackageNames, dependencyPackageNames, packageRanks);
    const reasons = [`workspace package: ${workspacePackage.name}`];
    if (focus === "target") {
      reasons.push("matched --package selector");
    } else if (focus === "changed") {
      reasons.push("workspace package changed in requested diff");
    } else if (focus === "dependency") {
      reasons.push("workspace dependency of changed package");
    } else if (focus === "query") {
      reasons.push("query matched workspace package");
    }

    fileContexts.set(file.path, {
      packageName: workspacePackage.name,
      packagePath: workspacePackage.path,
      focus,
      reasons
    });
  }

  const graph: WorkspaceGraph = {
    packageManager: detection.packageManager,
    buildTools: detection.buildTools,
    packages: detection.packages,
    dependencyEdges,
    buildTargets: detectBuildTargets({ files, packages: detection.packages }),
    importEdges: extractImportGraph({ files, packages: detection.packages }),
    focusedPackages: packageReasons,
    packageReasons
  };

  return {
    graph,
    fileContexts,
    changedPackageNames,
    dependencyPackageNames
  };
}

function buildDependencyEdges(packages: WorkspacePackage[]): WorkspaceDependencyEdge[] {
  const internalNames = new Set(packages.map((workspacePackage) => workspacePackage.name));
  const edges: WorkspaceDependencyEdge[] = [];

  for (const workspacePackage of packages) {
    for (const type of DEPENDENCY_TYPES) {
      for (const dependencyName of workspacePackage.dependencies[type] ?? []) {
        if (internalNames.has(dependencyName)) {
          edges.push({ from: workspacePackage.name, to: dependencyName, type });
        }
      }
    }
  }

  edges.sort((left, right) => `${left.from}:${left.to}:${left.type}`.localeCompare(`${right.from}:${right.to}:${right.type}`));
  return edges;
}

function attributeFilesToPackages(files: CandidateFile[], packages: WorkspacePackage[]): Map<string, WorkspacePackage> {
  const sortedPackages = [...packages].sort((left, right) => right.path.length - left.path.length);
  const packageByFile = new Map<string, WorkspacePackage>();

  for (const file of files) {
    const workspacePackage = sortedPackages.find((candidate) => fileBelongsToPackage(file.path, candidate.path));
    if (workspacePackage) {
      packageByFile.set(file.path, workspacePackage);
    }
  }

  return packageByFile;
}

function fileBelongsToPackage(filePath: string, packagePath: string): boolean {
  return packagePath === "." || filePath === packagePath || filePath.startsWith(`${packagePath}/`);
}

function collectDependencyPackages(changedPackageNames: Set<string>, dependencyEdges: WorkspaceDependencyEdge[]): Set<string> {
  const dependencyNames = new Set<string>();

  for (const edge of dependencyEdges) {
    if (changedPackageNames.has(edge.from)) {
      dependencyNames.add(edge.to);
    }
  }

  return dependencyNames;
}

function buildPackageReasons(
  packages: WorkspacePackage[],
  changedPackageNames: Set<string>,
  dependencyPackageNames: Set<string>,
  packageRanks: Map<string, { score: number; reasons: string[] }>
): WorkspacePackageReason[] {
  return packages
    .map((workspacePackage) => {
      const reasons: string[] = [];
      if (changedPackageNames.has(workspacePackage.name)) {
        reasons.push("changed file in requested diff");
      }
      if (dependencyPackageNames.has(workspacePackage.name)) {
        reasons.push("internal dependency of changed workspace package");
      }
      for (const reason of packageRanks.get(workspacePackage.name)?.reasons ?? []) {
        reasons.push(reason);
      }
      return {
        name: workspacePackage.name,
        path: workspacePackage.path,
        reasons
      };
    })
    .filter((reason) => reason.reasons.length > 0);
}

function focusForPackage(
  packageName: string,
  changedPackageNames: Set<string>,
  dependencyPackageNames: Set<string>,
  packageRanks: Map<string, { score: number; reasons: string[] }>
): WorkspaceFocus {
  const rankReasons = packageRanks.get(packageName)?.reasons ?? [];
  if (rankReasons.includes("matched --package selector")) {
    return "target";
  }
  if (changedPackageNames.has(packageName)) {
    return "changed";
  }
  if (dependencyPackageNames.has(packageName)) {
    return "dependency";
  }
  if (rankReasons.includes("query matched workspace package")) {
    return "query";
  }
  return "none";
}
