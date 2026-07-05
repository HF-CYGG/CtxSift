import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type PreparedRepo = {
  type: "local" | "remote";
  source: string;
  root: string;
  ref: string;
  cleanup: () => Promise<void>;
};

export async function prepareRepository(source: string): Promise<PreparedRepo> {
  if (isGitHubUrl(source)) {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "ctxsift-"));
    const cloneTarget = path.join(tempRoot, "repo");
    await execFileAsync("git", ["clone", "--depth", "1", source, cloneTarget]);
    return {
      type: "remote",
      source,
      root: cloneTarget,
      ref: await readGitRef(cloneTarget),
      cleanup: async () => {
        await rm(tempRoot, { recursive: true, force: true });
      }
    };
  }

  return {
    type: "local",
    source,
    root: source,
    ref: await readGitRef(source),
    cleanup: async () => {}
  };
}

function isGitHubUrl(value: string): boolean {
  return /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+(?:\.git)?$/i.test(value);
}

async function readGitRef(repoRoot: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", repoRoot, "rev-parse", "--short", "HEAD"]);
    return stdout.trim();
  } catch {
    return "local";
  }
}
