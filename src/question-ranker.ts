import type { CandidateFile, WorkspaceAnalysis } from "./types.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "by",
  "do",
  "does",
  "for",
  "from",
  "how",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "what",
  "where",
  "why",
  "with"
]);

export function rankFiles(
  files: CandidateFile[],
  query: string | undefined,
  changedFiles: string[] = [],
  workspace?: WorkspaceAnalysis
): CandidateFile[] {
  const queryTerms = tokenize(query ?? "");
  const changed = new Set(changedFiles);
  const ranked = files.map((file) => scoreFile(file, queryTerms, changed, workspace));

  ranked.sort((left, right) => {
    if (right.scores.total !== left.scores.total) {
      return right.scores.total - left.scores.total;
    }
    return left.path.localeCompare(right.path);
  });

  return ranked;
}

function scoreFile(
  file: CandidateFile,
  queryTerms: string[],
  changedFiles: Set<string>,
  workspace: WorkspaceAnalysis | undefined
): CandidateFile {
  const pathText = file.path.toLowerCase();
  const contentText = (file.content ?? "").toLowerCase();
  const reasons = new Set(file.reasons);
  const hasQueryMatch = queryTerms.some((term) => pathText.includes(term) || contentText.includes(term));
  const asksForImplementation = isImplementationQuestion(queryTerms);
  let lexical = 0;
  let structural = 0;
  let test = 0;
  let docs = 0;
  let workspaceScore = 0;
  let explicit = 0;
  let git = 0;

  for (const term of queryTerms) {
    if (pathText.includes(term)) {
      lexical += 12;
      reasons.add("query matched file path");
    }
    if (contentText.includes(term)) {
      lexical += 8;
      reasons.add("query matched file content");
    }
  }

  if (/src\/(index|main|server|app)\./i.test(file.path)) {
    structural += 4;
    reasons.add("entrypoint-like file");
  }

  if (file.classification?.kind === "source" && hasQueryMatch) {
    structural += asksForImplementation ? 40 : 6;
    reasons.add("implementation source context");
  }

  if (file.classification?.kind === "test") {
    test += queryTerms.some((term) => pathText.includes(term) || contentText.includes(term)) ? 8 : 2;
    reasons.add("related test context");
  }

  if (file.classification?.kind === "doc") {
    const isProjectInstruction = /(^|\/)(readme|docs?|adr|agents|claude|llms\.txt)/i.test(file.path);
    docs += queryTerms.some((term) => contentText.includes(term)) ? 8 : 2;
    if (isProjectInstruction) {
      docs += 4;
    }
    reasons.add("related documentation context");
  }

  if (changedFiles.has(file.path)) {
    git += 20;
    reasons.add("changed in requested diff");
  }

  if ([...changedFiles].some((changed) => sharesTopLevelDirectory(file.path, changed))) {
    git += 4;
    reasons.add("near changed file");
  }

  if (file.classification?.kind === "secret") {
    reasons.add("explicitly included high-risk file");
  }

  if (file.reasons.includes("explicitly included")) {
    explicit = 100;
  }

  const workspaceContext = workspace?.fileContexts.get(file.path);
  if (workspaceContext) {
    for (const reason of workspaceContext.reasons) {
      reasons.add(reason);
    }
    if (workspaceContext.focus === "target") {
      workspaceScore += 30;
    } else if (workspaceContext.focus === "changed") {
      workspaceScore += 18;
    } else if (workspaceContext.focus === "dependency") {
      workspaceScore += 12;
    } else if (workspaceContext.focus === "query") {
      workspaceScore += 10;
    }
  }

  const riskPenalty = file.classification?.isHighRisk ? 5 : 0;
  const sizePenalty = file.sizeBytes > 100_000 ? 8 : file.sizeBytes > 30_000 ? 3 : 0;
  if (sizePenalty > 0) {
    reasons.add("large file penalty applied");
  }
  const total = lexical + structural + test + docs + workspaceScore + git + explicit - riskPenalty - sizePenalty;

  return {
    ...file,
    reasons: [...reasons],
    scores: {
      lexical,
      structural,
      git,
      test,
      docs,
      workspace: workspaceScore,
      riskPenalty,
      total
    }
  };
}

function sharesTopLevelDirectory(left: string, right: string): boolean {
  const leftTop = left.split("/")[0];
  const rightTop = right.split("/")[0];
  return leftTop.length > 0 && leftTop === rightTop;
}

function tokenize(value: string): string[] {
  const baseTerms = value
    .toLowerCase()
    .split(/[^a-z0-9_/-]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));

  return [...new Set(baseTerms.flatMap(expandTerm))];
}

function expandTerm(term: string): string[] {
  const variants = [term];
  if (term.endsWith("ing") && term.length > 5) {
    const stem = term.slice(0, -3);
    variants.push(stem, `${stem}e`, `${stem}s`);
  }
  if (term.endsWith("s") && term.length > 3) {
    variants.push(term.slice(0, -1));
  }
  return variants;
}

function isImplementationQuestion(queryTerms: string[]): boolean {
  return queryTerms.some((term) => {
    return (
      term.startsWith("implement") ||
      term.startsWith("handl") ||
      term.startsWith("manag") ||
      term.startsWith("mapp") ||
      term.startsWith("schedul") ||
      term.startsWith("reconcil") ||
      term.startsWith("authenticat") ||
      term.startsWith("authoriz") ||
      [
        "apply",
        "applied",
        "creation",
        "create",
        "lifecycle",
        "flow",
        "route",
        "routing",
        "controller",
        "controllers",
        "interceptor",
        "interceptors",
        "annotation",
        "annotations"
      ].includes(term)
    );
  });
}
