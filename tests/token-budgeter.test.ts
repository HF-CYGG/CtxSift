import { describe, expect, test } from "vitest";
import { selectWithinBudget } from "../src/token-budgeter.js";
import type { CandidateFile } from "../src/types.js";

describe("selectWithinBudget", () => {
  test("truncates the top relevant oversized file instead of dropping it entirely", () => {
    const content = `${"createBean dependency injection lifecycle management\n".repeat(500)}`;
    const selected = selectWithinBudget([candidate("src/AbstractFactory.ts", content, 1000)], 100, 0, 0, true);

    expect(selected.selectedFiles).toHaveLength(1);
    expect(selected.selectedFiles[0]?.path).toBe("src/AbstractFactory.ts");
    expect(selected.selectedFiles[0]?.estimatedTokens).toBeLessThanOrEqual(100);
    expect(selected.selectedFiles[0]?.content).toContain("[CtxSift: file truncated to fit token budget]");
    expect(selected.selectedFiles[0]?.reasons).toContain("truncated to token budget");
    expect(selected.totalTokens).toBeLessThanOrEqual(100);
  });
});

function candidate(path: string, content: string, estimatedTokens: number): CandidateFile {
  return {
    path,
    language: "typescript",
    sizeBytes: Buffer.byteLength(content),
    estimatedTokens,
    content,
    classification: {
      kind: "source",
      language: "typescript",
      isText: true,
      isDefaultIgnored: false,
      isHighRisk: false
    },
    reasons: ["implementation source context"],
    scores: {
      lexical: 80,
      structural: 40,
      git: 0,
      test: 0,
      docs: 0,
      workspace: 0,
      riskPenalty: 0,
      total: 120
    }
  };
}
