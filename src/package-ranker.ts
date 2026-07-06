import type { WorkspacePackage } from "./types.js";

export type PackageRankInput = {
  packages: WorkspacePackage[];
  query?: string;
  targetPackage?: string;
};

export type PackageRank = {
  name: string;
  path: string;
  score: number;
  reasons: string[];
};

export function rankWorkspacePackages(input: PackageRankInput): Map<string, PackageRank> {
  const queryTerms = tokenize(input.query ?? "");
  const ranks = new Map<string, PackageRank>();

  for (const workspacePackage of input.packages) {
    const rank: PackageRank = {
      name: workspacePackage.name,
      path: workspacePackage.path,
      score: 0,
      reasons: []
    };
    if (input.targetPackage && matchesPackageSelector(workspacePackage, input.targetPackage)) {
      rank.score += 30;
      rank.reasons.push("matched --package selector");
    }
    if (queryTerms.some((term) => workspacePackage.name.toLowerCase().includes(term) || workspacePackage.path.toLowerCase().includes(term))) {
      rank.score += 12;
      rank.reasons.push("query matched workspace package");
    }
    ranks.set(workspacePackage.name, rank);
  }

  return ranks;
}

function matchesPackageSelector(workspacePackage: WorkspacePackage, selector: string): boolean {
  const normalized = selector.replaceAll("\\", "/").replace(/\/$/, "");
  return workspacePackage.name === normalized || workspacePackage.path === normalized;
}

function tokenize(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9_/-]+/i)
        .map((term) => term.trim())
        .filter((term) => term.length > 1)
    )
  ];
}
