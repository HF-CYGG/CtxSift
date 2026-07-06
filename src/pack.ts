import path from "node:path";
import { loadGitDiffSummary } from "./diff.js";
import { emitBundle } from "./emitter.js";
import { prepareRepository } from "./repo-source.js";
import { loadRepository } from "./repo-loader.js";
import { rankFiles } from "./question-ranker.js";
import { redactSecrets } from "./security-redactor.js";
import { filesToChunks, selectWithinBudget, estimateTokens } from "./token-budgeter.js";
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
    const ranked = rankFiles(loaded.files, request.task.query, diffSummary?.changedFiles ?? []);
    const selected = selectWithinBudget(
      ranked,
      request.budget.maxTokens,
      request.budget.reserveForPrompt,
      request.budget.reserveForAnswer,
      request.budget.hardLimit
    );
    const redactionState = { count: 0 };
    const selectedFiles = selected.selectedFiles.map((file) => redactFileIfNeeded(file, request.security.redactSecrets, redactionState));
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
        redactions: redactionState.count
      },
      tree: loaded.tree,
      selectedFiles: selectedFiles.map(stripInternalFields),
      chunks,
      promptTemplate: buildPromptTemplate(request.task.query, request.task.mode),
      review: diffSummary,
      audit: {
        scannedFiles: loaded.files.length,
        ignoredFiles: loaded.ignoredFiles.length,
        redactions: redactionState.count
      }
    };
  } finally {
    await prepared.cleanup();
  }
}

export function renderPackOutput(output: PackOutput, format: "markdown" | "json"): string {
  return emitBundle(output, format);
}

function redactFileIfNeeded(file: CandidateFile, enabled: boolean, state: { count: number }): CandidateFile {
  if (!enabled || !file.content) {
    return file;
  }

  const result = redactSecrets(file.content);
  state.count += result.redactions;

  return {
    ...file,
    content: result.content,
    estimatedTokens: estimateTokens(result.content)
  };
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
