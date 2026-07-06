import { describe, expect, test } from "vitest";
import { prepareRepository } from "../src/repo-source.js";

describe("repo source handling", () => {
  test("recognizes only bare GitHub repository URLs", async () => {
    const repoSource = (await import("../src/repo-source.js")) as Record<string, unknown>;
    const isGitHubRepoUrl = repoSource.isGitHubRepoUrl;

    expect(typeof isGitHubRepoUrl).toBe("function");
    expect((isGitHubRepoUrl as (value: string) => boolean)("https://github.com/HF-CYGG/CtxSift")).toBe(true);
    expect((isGitHubRepoUrl as (value: string) => boolean)("https://github.com/HF-CYGG/CtxSift.git")).toBe(true);
    expect((isGitHubRepoUrl as (value: string) => boolean)("https://github.com/HF-CYGG/CtxSift?tab=readme")).toBe(false);
    expect((isGitHubRepoUrl as (value: string) => boolean)("https://github.com/HF-CYGG/CtxSift#readme")).toBe(false);
  });

  test("rejects unsupported remote URLs before local loading", async () => {
    await expect(prepareRepository("https://example.com/HF-CYGG/CtxSift")).rejects.toThrow(
      "Remote repository URL must be https://github.com/owner/repo"
    );
  });
});
