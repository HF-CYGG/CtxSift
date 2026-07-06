import { redactSecrets } from "./security-redactor.js";
import { estimateTokens } from "./token-budgeter.js";
import type { CandidateFile, SecurityProfile } from "./types.js";

export type SecurityPolicyState = {
  redactions: number;
  blockedHighRiskFiles: Array<{ path: string; reason: string }>;
};

export type SecurityPolicyOptions = {
  profile: SecurityProfile;
  redactSecrets: boolean;
  state: SecurityPolicyState;
};

export function applySecurityPolicy(file: CandidateFile, options: SecurityPolicyOptions): CandidateFile {
  if (shouldBlockBody(file, options.profile)) {
    const reason = `high-risk file body blocked by ${options.profile} security profile`;
    options.state.blockedHighRiskFiles.push({ path: file.path, reason });
    const content = `[CtxSift: blocked high-risk file body under ${options.profile} security profile]\n`;
    return {
      ...file,
      content,
      sizeBytes: Buffer.byteLength(content),
      estimatedTokens: estimateTokens(content),
      reasons: [...new Set([...file.reasons, `blocked high-risk file body under ${options.profile} security profile`])]
    };
  }

  if (!options.redactSecrets || !file.content) {
    return file;
  }

  const result = redactSecrets(file.content);
  options.state.redactions += result.redactions;
  return {
    ...file,
    content: result.content,
    estimatedTokens: estimateTokens(result.content)
  };
}

export function calculateRiskScore(state: SecurityPolicyState): number {
  return state.redactions * 5 + state.blockedHighRiskFiles.length * 20;
}

function shouldBlockBody(file: CandidateFile, profile: SecurityProfile): boolean {
  if (profile === "balanced") {
    return false;
  }
  return Boolean(file.classification?.isHighRisk);
}
