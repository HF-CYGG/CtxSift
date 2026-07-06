export type OutputFormat = "markdown" | "json";
export type PackMode = "question" | "diff" | "review" | "onboarding" | "bugfix";
export type TargetModel = "claude" | "chatgpt" | "cursor" | "generic";

export type PackRequest = {
  repo: {
    type: "local" | "remote";
    pathOrUrl: string;
    ref?: string;
  };
  task: {
    mode: PackMode;
    query?: string;
    diffBase?: string;
    diffHead?: string;
    targetModel?: TargetModel;
  };
  budget: {
    maxTokens: number;
    hardLimit: boolean;
    reserveForPrompt: number;
    reserveForAnswer: number;
  };
  scope: {
    include?: string[];
    exclude?: string[];
    focusDirs?: string[];
    includeTests?: boolean;
    includeDocs?: boolean;
  };
  security: {
    redactSecrets: boolean;
    emitAuditLog: boolean;
    allowRemoteConfig: boolean;
  };
  output: {
    format: OutputFormat;
    split?: boolean;
    copyToClipboard?: boolean;
    outputPath?: string;
  };
};

export type FileKind = "source" | "test" | "doc" | "config" | "secret" | "generated" | "binary" | "other";

export type FileClassification = {
  kind: FileKind;
  language: string | null;
  isText: boolean;
  isDefaultIgnored: boolean;
  isHighRisk: boolean;
};

export type CandidateFile = {
  path: string;
  absolutePath?: string;
  language: string | null;
  sizeBytes: number;
  estimatedTokens: number;
  content?: string;
  classification?: FileClassification;
  reasons: string[];
  scores: {
    lexical: number;
    structural: number;
    git: number;
    test: number;
    docs: number;
    riskPenalty: number;
    total: number;
  };
};

export type BundleChunk = {
  id: string;
  title: string;
  path: string;
  content: string;
  tokens: number;
};

export type PackOutput = {
  schemaVersion: "1.0";
  task: {
    mode: PackMode;
    query?: string;
    diff?: string;
    targetModel: TargetModel;
  };
  repo: {
    type: "local" | "remote";
    source: string;
    root: string;
    ref: string;
  };
  manifest: {
    repo: string;
    ref: string;
    query?: string;
    totalTokens: number;
    selectedFiles: number;
    droppedFiles: Array<{ path: string; reason: string }>;
    droppedFilesOmitted: number;
    redactions: number;
  };
  tree: string;
  selectedFiles: CandidateFile[];
  chunks: BundleChunk[];
  promptTemplate: string;
  review?: DiffSummary;
  audit: {
    scannedFiles: number;
    ignoredFiles: number;
    redactions: number;
  };
};

export type RepoLoadResult = {
  root: string;
  files: CandidateFile[];
  ignoredFiles: string[];
  tree: string;
};

export type DiffSummary = {
  spec: string;
  base: string;
  head: string;
  stat: string;
  changedFiles: string[];
  relatedTests: string[];
  relatedDocs: string[];
  risks: string[];
  reviewerPrompt: string;
};
