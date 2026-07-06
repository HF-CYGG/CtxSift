export type OutputFormat = "markdown" | "json";
export type PackMode = "question" | "diff" | "review" | "onboarding" | "bugfix";
export type TargetModel = "claude" | "chatgpt" | "cursor" | "generic";
export type SecurityProfile = "balanced" | "private" | "strict";

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
    workspaceAware?: boolean;
    workspaceGraphOnly?: boolean;
    targetPackage?: string;
  };
  security: {
    redactSecrets: boolean;
    emitAuditLog: boolean;
    allowRemoteConfig: boolean;
    profile?: SecurityProfile;
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
    workspace: number;
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
  workspaces?: WorkspaceGraph;
  review?: DiffSummary;
  audit: {
    scannedFiles: number;
    ignoredFiles: number;
    redactions: number;
    securityPolicy: SecurityProfile;
    riskScore: number;
    blockedHighRiskFiles: Array<{ path: string; reason: string }>;
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

export type WorkspacePackageManager = "pnpm" | "package-json" | "none";
export type WorkspaceBuildTool = "turbo" | "nx";
export type WorkspaceDependencyType = "dependency" | "devDependency" | "peerDependency" | "optionalDependency";
export type WorkspaceFocus = "target" | "changed" | "dependency" | "query" | "none";

export type WorkspacePackage = {
  name: string;
  path: string;
  packageJsonPath: string;
  scripts: Record<string, string>;
  dependencies: Partial<Record<WorkspaceDependencyType, string[]>>;
};

export type WorkspaceDependencyEdge = {
  from: string;
  to: string;
  type: WorkspaceDependencyType;
};

export type WorkspacePackageReason = {
  name: string;
  path: string;
  reasons: string[];
};

export type WorkspaceGraph = {
  packageManager: WorkspacePackageManager;
  buildTools: WorkspaceBuildTool[];
  packages: WorkspacePackage[];
  dependencyEdges: WorkspaceDependencyEdge[];
  buildTargets?: WorkspaceBuildTarget[];
  importEdges?: WorkspaceImportEdge[];
  focusedPackages: WorkspacePackageReason[];
  packageReasons: WorkspacePackageReason[];
};

export type WorkspaceDetection = {
  packageManager: WorkspacePackageManager;
  buildTools: WorkspaceBuildTool[];
  packages: WorkspacePackage[];
};

export type WorkspaceFileContext = {
  packageName: string;
  packagePath: string;
  focus: WorkspaceFocus;
  reasons: string[];
};

export type WorkspaceAnalysis = {
  graph: WorkspaceGraph;
  fileContexts: Map<string, WorkspaceFileContext>;
  changedPackageNames: Set<string>;
  dependencyPackageNames: Set<string>;
};

export type WorkspaceBuildTarget = {
  type: "script" | "tool" | "tsconfig-reference";
  name: string;
  packageName: string | null;
  packagePath: string;
  command: string | null;
};

export type WorkspaceImportEdge = {
  fromFile: string;
  fromPackage: string | null;
  specifier: string;
  toPackage: string;
};
