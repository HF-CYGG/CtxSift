import { describe, expect, test } from "vitest";
import { rankFiles } from "../src/question-ranker.js";
import type { CandidateFile, FileKind } from "../src/types.js";

describe("rankFiles", () => {
  test("does not rank files by stop-word path matches", () => {
    const ranked = rankFiles(
      [
        candidate("backend/sql/013_o2o_return_reject_and_completed.sql", "ALTER TABLE o2o_preorders ADD COLUMN authenticated_at TEXT;", "other"),
        candidate("src/auth/login.ts", "export function loginWithPermissionRedirect() { return true; }", "source")
      ],
      "Where are authentication, permissions, and safe redirects handled?"
    );

    expect(ranked[0].path).toBe("src/auth/login.ts");
    expect(ranked.find((file) => file.path.endsWith(".sql"))?.reasons).not.toContain("query matched file path");
  });
});

function candidate(path: string, content: string, kind: FileKind): CandidateFile {
  return {
    path,
    language: path.endsWith(".ts") ? "typescript" : null,
    sizeBytes: Buffer.byteLength(content),
    estimatedTokens: Math.ceil(content.length / 4),
    content,
    classification: {
      kind,
      language: path.endsWith(".ts") ? "typescript" : null,
      isText: true,
      isDefaultIgnored: false,
      isHighRisk: false
    },
    reasons: [],
    scores: {
      lexical: 0,
      structural: 0,
      git: 0,
      test: 0,
      docs: 0,
      riskPenalty: 0,
      total: 0
    }
  };
}
