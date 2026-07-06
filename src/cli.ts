#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDiffSpec } from "./diff.js";
import { packRepository, renderPackOutput } from "./pack.js";
import type { OutputFormat, PackMode, PackRequest, SecurityProfile } from "./types.js";

const VERSION = "1.3.0-alpha.0";
const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[^/\s?#]+\/[^/\s?#]+(?:\.git)?$/i;

export type CliOptions = {
  ask?: string;
  repo: string;
  diff?: string;
  mode: PackMode;
  maxTokens: number;
  format: OutputFormat;
  output?: string;
  include: string[];
  exclude: string[];
  workspaceAware: boolean;
  workspaceGraph: boolean;
  packageName?: string;
  profile: SecurityProfile;
  redact: boolean;
  debug: boolean;
};

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (!options.redact) {
      process.stderr.write("WARNING: --no-redact disables secret redaction. Do not share the generated bundle publicly.\n");
    }
    const request = createPackRequest(options);
    const result = await packRepository(request);
    const emitted = renderPackOutput(result, options.format);

    if (options.output) {
      await fs.writeFile(options.output, emitted, "utf8");
      return;
    }

    process.stdout.write(emitted);
  } catch (error) {
    process.stderr.write(`${formatError(error)}\n`);
    process.exitCode = 1;
  }
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    repo: ".",
    mode: "question",
    maxTokens: 20_000,
    format: "markdown",
    include: [],
    exclude: [],
    workspaceAware: false,
    workspaceGraph: false,
    profile: "balanced",
    redact: true,
    debug: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--ask":
        options.ask = requireValue(arg, next);
        index += 1;
        break;
      case "--repo":
        options.repo = parseRepo(requireValue(arg, next));
        index += 1;
        break;
      case "--diff":
        options.diff = requireValue(arg, next);
        index += 1;
        break;
      case "--mode":
        options.mode = parseMode(requireValue(arg, next));
        index += 1;
        break;
      case "--max-tokens":
        {
          const maxTokensText = requireValue(arg, next).trim();
          const maxTokens = Number(maxTokensText);
          if (!/^[1-9]\d*$/.test(maxTokensText) || !Number.isSafeInteger(maxTokens)) {
            throw new Error("--max-tokens must be a positive integer");
          }
          options.maxTokens = maxTokens;
        }
        index += 1;
        break;
      case "--format":
        options.format = parseFormat(requireValue(arg, next));
        index += 1;
        break;
      case "--output":
      case "--out":
        options.output = requireValue(arg, next);
        index += 1;
        break;
      case "--include":
        options.include.push(...splitList(requireValue(arg, next)));
        index += 1;
        break;
      case "--exclude":
        options.exclude.push(...splitList(requireValue(arg, next)));
        index += 1;
        break;
      case "--workspace-aware":
        options.workspaceAware = true;
        break;
      case "--workspace-graph":
        options.workspaceGraph = true;
        options.workspaceAware = true;
        break;
      case "--package":
        options.packageName = requireValue(arg, next);
        options.workspaceAware = true;
        index += 1;
        break;
      case "--profile":
        options.profile = parseProfile(requireValue(arg, next));
        index += 1;
        break;
      case "--no-redact":
        options.redact = false;
        break;
      case "--debug":
        options.debug = true;
        break;
      case "--version":
      case "-v":
        process.stdout.write(`${VERSION}\n`);
        process.exit(0);
        break;
      case "--help":
      case "-h":
        process.stdout.write(helpText());
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.ask && !options.diff && !options.workspaceGraph) {
    throw new Error("Provide --ask <question>, --diff <base>...<head>, or --workspace-graph");
  }

  return options;
}

function createPackRequest(options: CliOptions): PackRequest {
  const parsedDiff = options.diff ? parseDiffSpec(options.diff) : undefined;
  return {
    repo: {
      type: /^https:\/\/github\.com\//i.test(options.repo) ? "remote" : "local",
      pathOrUrl: options.repo
    },
    task: {
      mode: options.workspaceGraph && !options.ask && !options.diff ? "onboarding" : options.mode,
      query: options.ask,
      diffBase: parsedDiff?.base,
      diffHead: parsedDiff?.head,
      targetModel: "generic"
    },
    budget: {
      maxTokens: options.maxTokens,
      hardLimit: true,
      reserveForPrompt: 100,
      reserveForAnswer: 400
    },
    scope: {
      include: options.include,
      exclude: options.exclude,
      includeTests: true,
      includeDocs: true,
      workspaceAware: true,
      workspaceGraphOnly: options.workspaceGraph && !options.ask && !options.diff,
      targetPackage: options.packageName
    },
    security: {
      redactSecrets: options.redact,
      emitAuditLog: true,
      allowRemoteConfig: false,
      profile: options.profile
    },
    output: {
      format: options.format,
      outputPath: options.output
    }
  };
}

function requireValue(flag: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized || normalized.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return normalized;
}

function parseFormat(value: string): OutputFormat {
  if (value === "markdown" || value === "json") {
    return value;
  }
  throw new Error("--format must be markdown or json");
}

function parseMode(value: string): PackMode {
  if (value === "question" || value === "diff" || value === "review" || value === "onboarding" || value === "bugfix") {
    return value;
  }
  throw new Error("--mode must be question, diff, review, onboarding, or bugfix");
}

function parseProfile(value: string): SecurityProfile {
  if (value === "balanced" || value === "private" || value === "strict") {
    return value;
  }
  throw new Error("--profile must be balanced, private, or strict");
}

function parseRepo(value: string): string {
  const repo = value.trim();
  if (/^https:\/\/github\.com\//i.test(repo) && !GITHUB_REPO_URL_PATTERN.test(repo)) {
    throw new Error("--repo GitHub URL must be https://github.com/owner/repo");
  }
  if (/^https?:\/\//i.test(repo) && !GITHUB_REPO_URL_PATTERN.test(repo)) {
    throw new Error("--repo remote URL must be https://github.com/owner/repo");
  }
  return repo;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function helpText(): string {
  return `CtxSift ${VERSION}

Usage:
  ctxsift --repo . --ask "Where does auth start?"
  ctxsift --repo . --diff main...HEAD --mode review
  ctxsift --repo https://github.com/user/repo --ask "How does routing work?"

Options:
  --repo <path-or-github-url>
  --ask <question>
  --diff <base>...<head>
  --mode question|review|diff|onboarding|bugfix
  --max-tokens <positive-integer>
  --format markdown|json
  --out <file>
  --include <glob[,glob]>
  --exclude <glob[,glob]>
  --workspace-aware
  --workspace-graph
  --package <workspace-name-or-path>
  --profile balanced|private|strict
  --no-redact
  --debug
  --version
  --help
`;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `ctxsift: ${error.message}`;
  }
  return "ctxsift: unknown error";
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  void main();
}
