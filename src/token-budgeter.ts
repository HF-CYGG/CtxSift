import type { BundleChunk, CandidateFile } from "./types.js";

const MIN_TRUNCATED_FILE_TOKENS = 50;
const TRUNCATION_MARKER = "\n\n[CtxSift: file truncated to fit token budget]\n";

export function estimateTokens(text: string): number {
  if (text.length === 0) {
    return 0;
  }

  const wordish = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(Math.max(text.length / 4, wordish * 1.3)));
}

export function selectWithinBudget(
  rankedFiles: CandidateFile[],
  maxTokens: number,
  reserveForPrompt: number,
  reserveForAnswer: number,
  hardLimit = true
): { selectedFiles: CandidateFile[]; droppedFiles: Array<{ path: string; reason: string }>; totalTokens: number } {
  const usableBudget = Math.max(0, maxTokens - reserveForPrompt - reserveForAnswer);
  const selectedFiles: CandidateFile[] = [];
  const droppedFiles: Array<{ path: string; reason: string }> = [];
  let totalTokens = 0;

  for (const file of rankedFiles) {
    if (file.estimatedTokens === 0) {
      droppedFiles.push({ path: file.path, reason: "empty file" });
      continue;
    }

    if (file.scores.total <= 0) {
      droppedFiles.push({ path: file.path, reason: "not relevant to task" });
      continue;
    }

    if (totalTokens + file.estimatedTokens <= usableBudget) {
      selectedFiles.push(file);
      totalTokens += file.estimatedTokens;
    } else {
      const remainingTokens = usableBudget - totalTokens;
      const truncated = selectedFiles.length === 0 ? truncateFileToBudget(file, remainingTokens) : null;
      if (truncated) {
        selectedFiles.push(truncated);
        totalTokens += truncated.estimatedTokens;
        continue;
      }

      if (!hardLimit && selectedFiles.length === 0) {
        selectedFiles.push(file);
        totalTokens += file.estimatedTokens;
        continue;
      }
      droppedFiles.push({ path: file.path, reason: "token budget exceeded" });
    }
  }

  return { selectedFiles, droppedFiles, totalTokens };
}

function truncateFileToBudget(file: CandidateFile, tokenBudget: number): CandidateFile | null {
  if (!file.content || tokenBudget < MIN_TRUNCATED_FILE_TOKENS) {
    return null;
  }

  const markerTokens = estimateTokens(TRUNCATION_MARKER);
  const contentTokenBudget = tokenBudget - markerTokens;
  if (contentTokenBudget < MIN_TRUNCATED_FILE_TOKENS / 2) {
    return null;
  }

  let snippet = file.content.slice(0, Math.max(1, Math.floor(contentTokenBudget * 4)));
  let content = `${snippet}${TRUNCATION_MARKER}`;
  let estimatedTokens = estimateTokens(content);

  while (estimatedTokens > tokenBudget && snippet.length > 0) {
    snippet = snippet.slice(0, Math.floor(snippet.length * 0.9));
    content = `${snippet}${TRUNCATION_MARKER}`;
    estimatedTokens = estimateTokens(content);
  }

  if (estimatedTokens > tokenBudget || estimatedTokens === 0) {
    return null;
  }

  return {
    ...file,
    content,
    sizeBytes: Buffer.byteLength(content),
    estimatedTokens,
    reasons: [...new Set([...file.reasons, "truncated to token budget"])]
  };
}

export function filesToChunks(files: CandidateFile[]): BundleChunk[] {
  return files.map((file, index) => ({
    id: `file-${index + 1}`,
    title: file.path,
    path: file.path,
    content: file.content ?? "",
    tokens: file.estimatedTokens
  }));
}
