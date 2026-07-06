import { describe, expect, test } from "vitest";
import { applySecurityPolicy } from "../src/security-policy.js";
import type { CandidateFile } from "../src/types.js";

describe("applySecurityPolicy", () => {
  test("balanced profile redacts selected file content", () => {
    const state = { redactions: 0, blockedHighRiskFiles: [] };
    const secured = applySecurityPolicy(secretCandidate("config.ts", "export const token = 'ghp_abcdefghijklmnopqrstuvwxyz123456';"), {
      profile: "balanced",
      redactSecrets: true,
      state
    });

    expect(secured.content).toContain("[REDACTED:GITHUB_TOKEN]");
    expect(state.redactions).toBe(1);
    expect(state.blockedHighRiskFiles).toEqual([]);
  });

  test("strict profile blocks high-risk file bodies even when explicitly included", () => {
    const state = { redactions: 0, blockedHighRiskFiles: [] };
    const secured = applySecurityPolicy(secretCandidate(".env.example", "OPENAI_API_KEY=sk-proj-secret-fixture-key"), {
      profile: "strict",
      redactSecrets: true,
      state
    });

    expect(secured.content).toContain("blocked high-risk file body under strict security profile");
    expect(secured.content).not.toContain("sk-proj-secret-fixture-key");
    expect(secured.reasons).toContain("blocked high-risk file body under strict security profile");
    expect(state.blockedHighRiskFiles).toContainEqual({
      path: ".env.example",
      reason: "high-risk file body blocked by strict security profile"
    });
  });
});

function secretCandidate(path: string, content: string): CandidateFile {
  return {
    path,
    language: path.endsWith(".ts") ? "typescript" : null,
    sizeBytes: Buffer.byteLength(content),
    estimatedTokens: Math.ceil(content.length / 4),
    content,
    classification: {
      kind: path.startsWith(".env") ? "secret" : "source",
      language: path.endsWith(".ts") ? "typescript" : null,
      isText: true,
      isDefaultIgnored: path.startsWith(".env"),
      isHighRisk: path.startsWith(".env")
    },
    reasons: [],
    scores: {
      lexical: 1,
      structural: 0,
      git: 0,
      test: 0,
      docs: 0,
      workspace: 0,
      riskPenalty: 0,
      total: 1
    }
  };
}
