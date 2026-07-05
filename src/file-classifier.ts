import path from "node:path";
import type { FileClassification, FileKind } from "./types.js";

const SOURCE_EXTENSIONS = new Map<string, string>([
  [".ts", "typescript"],
  [".tsx", "typescript"],
  [".js", "javascript"],
  [".jsx", "javascript"],
  [".mjs", "javascript"],
  [".cjs", "javascript"],
  [".py", "python"],
  [".go", "go"],
  [".rs", "rust"],
  [".java", "java"],
  [".kt", "kotlin"],
  [".cs", "csharp"],
  [".rb", "ruby"],
  [".php", "php"],
  [".swift", "swift"]
]);

const DOC_EXTENSIONS = new Set([".md", ".mdx", ".rst", ".txt", ".adoc"]);
const CONFIG_EXTENSIONS = new Set([".json", ".yaml", ".yml", ".toml", ".ini", ".config"]);
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".7z",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".class"
]);

const GENERATED_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  "vendor"
]);

const SECRET_FILE_PATTERNS = [
  /^\.env(?:\.|$)/,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /id_rsa$/i,
  /id_dsa$/i,
  /private[-_]?key/i,
  /secrets?(\.|\/|$)/i
];

export function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

export function classifyFile(filePath: string): FileClassification {
  const normalized = normalizePath(filePath);
  const baseName = path.posix.basename(normalized);
  const extension = path.posix.extname(normalized).toLowerCase();
  const segments = normalized.split("/");
  const isGenerated = segments.some((segment) => GENERATED_SEGMENTS.has(segment));
  const isSecret = SECRET_FILE_PATTERNS.some((pattern) => pattern.test(normalized) || pattern.test(baseName));
  const isBinary = BINARY_EXTENSIONS.has(extension);
  const isTest = /(^|\/)(tests?|__tests__)\//i.test(normalized) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(normalized);
  const language = SOURCE_EXTENSIONS.get(extension) ?? null;

  let kind: FileKind = "other";
  if (isSecret) {
    kind = "secret";
  } else if (isGenerated) {
    kind = "generated";
  } else if (isBinary) {
    kind = "binary";
  } else if (isTest) {
    kind = "test";
  } else if (DOC_EXTENSIONS.has(extension) || /^readme/i.test(baseName) || /^adr/i.test(baseName)) {
    kind = "doc";
  } else if (language) {
    kind = "source";
  } else if (CONFIG_EXTENSIONS.has(extension) || baseName.startsWith(".")) {
    kind = "config";
  }

  return {
    kind,
    language,
    isText: !isBinary,
    isDefaultIgnored: isGenerated || isBinary || isSecret,
    isHighRisk: isSecret
  };
}
