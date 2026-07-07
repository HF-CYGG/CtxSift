#!/usr/bin/env node
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildReviewComment, upsertPullRequestComment } from "./github-pr-comment.js";
import type { PackOutput } from "./types.js";

type CliOptions = {
  bundlePath: string;
  artifactName: string;
};

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    const output = JSON.parse(await fs.readFile(options.bundlePath, "utf8")) as PackOutput;
    const token = requireEnv("GITHUB_TOKEN");
    const repository = requireEnv("GITHUB_REPOSITORY");
    const eventPath = requireEnv("GITHUB_EVENT_PATH");
    const { owner, repo } = parseGitHubRepository(repository);

    const event = JSON.parse(await fs.readFile(eventPath, "utf8")) as { pull_request?: { number?: unknown } };
    const pullNumber = parsePullRequestNumber(event);

    await upsertPullRequestComment({
      owner,
      repo,
      pullNumber,
      token,
      body: buildReviewComment(output, { artifactName: options.artifactName })
    });
  } catch (error) {
    process.stderr.write(`${formatError(error)}\n`);
    process.exitCode = 1;
  }
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    bundlePath: "review-context.json",
    artifactName: "ctxsift-review-context"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    switch (arg) {
      case "--bundle":
        options.bundlePath = requireValue(arg, next);
        index += 1;
        break;
      case "--artifact":
        options.artifactName = requireValue(arg, next);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

export function parseGitHubRepository(value: string): { owner: string; repo: string } {
  const parts = value.split("/").map((part) => part.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts.some((part) => !/^[^/\s?#]+$/.test(part))) {
    throw new Error("GITHUB_REPOSITORY must use owner/repo format");
  }
  return { owner: parts[0], repo: parts[1] };
}

export function parsePullRequestNumber(event: { pull_request?: { number?: unknown } }): number {
  const pullNumber = event.pull_request?.number;
  if (typeof pullNumber !== "number" || !Number.isSafeInteger(pullNumber) || pullNumber <= 0) {
    throw new Error("GITHUB_EVENT_PATH does not contain a positive pull_request.number");
  }
  return pullNumber;
}

function requireValue(flag: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized || normalized.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return normalized;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `ctxsift-pr-comment: ${error.message}`;
  }
  return "ctxsift-pr-comment: unknown error";
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  void main();
}
