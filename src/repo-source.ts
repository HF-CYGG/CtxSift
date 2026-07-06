import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[^/\s?#]+\/[^/\s?#]+(?:\.git)?$/i;

export type PreparedRepo = {
  type: "local" | "remote";
  source: string;
  root: string;
  ref: string;
  cleanup: () => Promise<void>;
};

export async function prepareRepository(source: string): Promise<PreparedRepo> {
  const normalizedSource = source.trim();
  if (isRemoteUrl(normalizedSource) && !isGitHubRepoUrl(normalizedSource)) {
    throw new Error("Remote repository URL must be https://github.com/owner/repo");
  }

  if (isGitHubRepoUrl(normalizedSource)) {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "ctxsift-"));
    const cloneTarget = path.join(tempRoot, "repo");
    await execFileAsync("git", ["clone", "--depth", "1", normalizedSource, cloneTarget]);
    return {
      type: "remote",
      source: normalizedSource,
      root: cloneTarget,
      ref: await readGitRef(cloneTarget),
      cleanup: async () => {
        await rm(tempRoot, { recursive: true, force: true });
      }
    };
  }

  return {
    type: "local",
    source: normalizedSource,
    root: normalizedSource,
    ref: await readGitRef(normalizedSource),
    cleanup: async () => {}
  };
}

export function isGitHubRepoUrl(value: string): boolean {
  return GITHUB_REPO_URL_PATTERN.test(value.trim());
}

function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

async function readGitRef(repoRoot: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", repoRoot, "rev-parse", "--short", "HEAD"]);
    return stdout.trim();
  } catch {
    return "local";
  }
}
