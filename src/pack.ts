import path from "node:path";
import { loadGitDiffSummary } from "./diff.js";
import { emitBundle } from "./emitter.js";
import { classifyFile } from "./file-classifier.js";
import { prepareRepository } from "./repo-source.js";
import { loadRepository } from "./repo-loader.js";
import { rankFiles } from "./question-ranker.js";
import { calculateRiskScore, applySecurityPolicy } from "./security-policy.js";
import { filesToChunks, selectWithinBudget } from "./token-budgeter.js";
import { detectWorkspaces } from "./workspace-detector.js";
import { buildWorkspaceGraph } from "./workspace-graph.js";
import type { CandidateFile, PackRequest, PackOutput } from "./types.js";

const DROPPED_FILES_LIMIT = 200;

export async function packRepository(request: PackRequest): Promise<PackOutput> {
  const prepared = await prepareRepository(request.repo.pathOrUrl);
  try {
    const loaded = await loadRepository(prepared.root, {
      include: request.scope.include,
      exclude: request.scope.exclude
    });
    const diffSummary = request.task.diffBase && request.task.diffHead
      ? await loadGitDiffSummary(loaded.root, `${request.task.diffBase}...${request.task.diffHead}`)
      : undefined;
    const workspaceAnalysis = request.scope.workspaceAware === false
      ? buildWorkspaceGraph({ packageManager: "none", buildTools: [], packages: [] }, loaded.files, [])
      : buildWorkspaceGraph(detectWorkspaces(loaded.files), loaded.files, diffSummary?.changedFiles ?? [], {
          query: request.task.query,
          targetPackage: request.scope.targetPackage
        });
    const ranked = request.scope.workspaceGraphOnly
      ? []
      : rankFiles(loaded.files, request.task.query, diffSummary?.changedFiles ?? [], workspaceAnalysis);
    const selected = request.scope.workspaceGraphOnly
      ? { selectedFiles: [], droppedFiles: [], totalTokens: 0 }
      : selectWithinBudget(
          ranked,
          request.budget.maxTokens,
          request.budget.reserveForPrompt,
          request.budget.reserveForAnswer,
          request.budget.hardLimit
        );
    const securityProfile = request.security.profile ?? "balanced";
    const securityState = {
      redactions: 0,
      blockedHighRiskFiles: collectIgnoredHighRiskFiles(loaded.ignoredFiles)
    };
    const selectedFiles = selected.selectedFiles.map((file) =>
      applySecurityPolicy(file, {
        profile: securityProfile,
        redactSecrets: request.security.redactSecrets,
        state: securityState
      })
    );
    const chunks = filesToChunks(selectedFiles);
    const totalTokens = selectedFiles.reduce((sum, file) => sum + file.estimatedTokens, 0);
    const droppedFiles = selected.droppedFiles.slice(0, DROPPED_FILES_LIMIT);

    return {
      schemaVersion: "1.0",
      task: {
        mode: request.task.mode,
        query: request.task.query,
        diff: request.task.diffBase && request.task.diffHead ? `${request.task.diffBase}...${request.task.diffHead}` : undefined,
        targetModel: request.task.targetModel ?? "generic"
      },
      repo: {
        type: prepared.type,
        source: prepared.source,
        root: loaded.root,
        ref: request.repo.ref ?? prepared.ref
      },
      manifest: {
        repo: path.resolve(loaded.root),
        ref: request.repo.ref ?? prepared.ref,
        query: request.task.query,
        totalTokens,
        selectedFiles: selectedFiles.length,
        droppedFiles,
        droppedFilesOmitted: Math.max(0, selected.droppedFiles.length - droppedFiles.length),
        redactions: securityState.redactions
      },
      tree: loaded.tree,
      selectedFiles: selectedFiles.map(stripInternalFields),
      chunks,
      promptTemplate: buildPromptTemplate(request.task.query, request.task.mode),
      workspaces: workspaceAnalysis.graph.packages.length > 0 ? workspaceAnalysis.graph : undefined,
      review: diffSummary,
      audit: {
        scannedFiles: loaded.files.length,
        ignoredFiles: loaded.ignoredFiles.length,
        redactions: securityState.redactions,
        securityPolicy: securityProfile,
        riskScore: calculateRiskScore(securityState),
        blockedHighRiskFiles: securityState.blockedHighRiskFiles
      }
    };
  } finally {
    await prepared.cleanup();
  }
}

export function renderPackOutput(output: PackOutput, format: "markdown" | "json"): string {
  return emitBundle(output, format);
}

function stripInternalFields(file: CandidateFile): CandidateFile {
  return {
    path: file.path,
    language: file.language,
    sizeBytes: file.sizeBytes,
    estimatedTokens: file.estimatedTokens,
    reasons: file.reasons,
    scores: file.scores
  };
}

function collectIgnoredHighRiskFiles(ignoredFiles: string[]): Array<{ path: string; reason: string }> {
  return ignoredFiles
    .filter((filePath) => classifyFile(filePath).isHighRisk)
    .map((filePath) => ({
      path: filePath,
      reason: "high-risk file excluded by security defaults"
    }));
}

function buildPromptTemplate(query: string | undefined, mode: string): string {
  if (mode === "review") {
    return [
      "Use this diff-aware context bundle to review the change.",
      "Focus on regressions, missing tests, security-sensitive edits, and compatibility risks.",
      query ? `Additional task: ${query}` : "Do not perform a full automated review; prepare findings from the supplied context only."
    ].join("\n");
  }

  return [
    "Use the provided repository context to answer the user's task.",
    "Prefer cited file paths and explain uncertainty when the context is insufficient.",
    query ? `Task: ${query}` : "Task: Review the selected repository context."
  ].join("\n");
}
