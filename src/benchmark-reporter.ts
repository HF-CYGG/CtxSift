import type { BenchmarkResult, BenchmarkSummary } from "./types.js";

export type BenchmarkReport = {
  generatedAt: string;
  results: BenchmarkResult[];
  summary: BenchmarkSummary;
};

export function summarizeBenchmarkResults(results: BenchmarkResult[]): BenchmarkSummary {
  return {
    fixtures: results.length,
    averageRelevantHitRate: average(results.map((result) => result.relevantFilesHitRate)),
    averageTokenSavingRatio: average(results.map((result) => result.selectedContextTokenSavingRatio)),
    averageWorkspacePackageHitRate: average(results.map((result) => result.workspacePackageHitRate))
  };
}

export function renderBenchmarkMarkdown(report: BenchmarkReport): string {
  const lines = [
    "# CtxSift Benchmark Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "These fixture benchmarks are deterministic local checks. They compare selected context size against a simple full-repo text baseline and do not claim model-answer quality.",
    "",
    "## Summary",
    "",
    `- Fixtures: ${report.summary.fixtures}`,
    `- Average relevant hit rate: ${formatPercent(report.summary.averageRelevantHitRate)}`,
    `- Average token saving ratio: ${formatPercent(report.summary.averageTokenSavingRatio)}`,
    `- Average workspace package hit rate: ${formatPercent(report.summary.averageWorkspacePackageHitRate)}`,
    "",
    "## Results",
    "",
    "| Fixture | Selected files | Selected tokens | Full repo tokens | Token saving | Relevant hit rate | Top-5 coverage | Workspace hit rate | Dropped | Security findings | Generation ms |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const result of report.results) {
    lines.push(
      `| ${result.fixture} | ${result.selectedFilesCount} | ${result.estimatedTokens} | ${result.fullRepoBaselineTokens} | ${formatPercent(result.selectedContextTokenSavingRatio)} | ${formatPercent(result.relevantFilesHitRate)} | ${formatPercent(result.topNRelevantFileCoverage)} | ${formatPercent(result.workspacePackageHitRate)} | ${result.droppedFilesCount} | ${result.securityFindingsCount} | ${result.bundleGenerationMs} |`
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
