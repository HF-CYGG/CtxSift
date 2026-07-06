import { describe, expect, test } from "vitest";
import { renderBenchmarkMarkdown, summarizeBenchmarkResults } from "../src/benchmark-reporter.js";
import type { BenchmarkResult } from "../src/types.js";

describe("benchmark reporter", () => {
  test("summarizes result averages and renders a conservative markdown report", () => {
    const results: BenchmarkResult[] = [
      benchmarkResult("simple-ts", 2, 100, 200, 1, 1, 1),
      benchmarkResult("pnpm-monorepo", 3, 150, 600, 1, 1, 1)
    ];
    const summary = summarizeBenchmarkResults(results);
    const markdown = renderBenchmarkMarkdown({ generatedAt: "2026-07-07T00:00:00.000Z", results, summary });

    expect(summary).toMatchObject({
      fixtures: 2,
      averageRelevantHitRate: 1,
      averageTokenSavingRatio: 0.625,
      averageWorkspacePackageHitRate: 1
    });
    expect(markdown).toContain("# CtxSift Benchmark Report");
    expect(markdown).toContain("These fixture benchmarks are deterministic local checks");
    expect(markdown).toContain(
      "| pnpm-monorepo | 3 | 150 | 600 | 75.0% | 100.0% | 100.0% | 100.0% | 0 | 0 | 12 |"
    );
  });
});

function benchmarkResult(
  fixture: string,
  selectedFilesCount: number,
  estimatedTokens: number,
  fullRepoBaselineTokens: number,
  relevantFilesHitRate: number,
  topNRelevantFileCoverage: number,
  workspacePackageHitRate: number
): BenchmarkResult {
  return {
    fixture,
    selectedFilesCount,
    estimatedTokens,
    relevantFilesHitRate,
    droppedFilesCount: 0,
    securityFindingsCount: 0,
    bundleGenerationMs: 12,
    fullRepoBaselineTokens,
    selectedContextTokenSavingRatio: (fullRepoBaselineTokens - estimatedTokens) / fullRepoBaselineTokens,
    topNRelevantFileCoverage,
    workspacePackageHitRate
  };
}
