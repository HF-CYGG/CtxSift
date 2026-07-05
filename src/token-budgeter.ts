import type { BundleChunk, CandidateFile } from "./types.js";

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

export function filesToChunks(files: CandidateFile[]): BundleChunk[] {
  return files.map((file, index) => ({
    id: `file-${index + 1}`,
    title: file.path,
    path: file.path,
    content: file.content ?? "",
    tokens: file.estimatedTokens
  }));
}
