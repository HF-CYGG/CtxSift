import { describe, expect, test } from "vitest";
import { buildReviewComment, CTXSIFT_COMMENT_MARKER, upsertPullRequestComment } from "../src/github-pr-comment.js";
import { parseArgs, parseGitHubRepository, parsePullRequestNumber } from "../src/pr-comment-cli.js";
import type { PackOutput } from "../src/types.js";

describe("github PR comments", () => {
  test("builds a review summary without embedding source chunks", () => {
    const body = buildReviewComment(sampleOutput, { artifactName: "ctxsift-review-context" });

    expect(body).toContain(CTXSIFT_COMMENT_MARKER);
    expect(body).toContain("ctxsift-review-context");
    expect(body).toContain("Changed files: 1");
    expect(body).toContain("src/auth/login.ts");
    expect(body).toContain("- `src/auth/login.ts` — changed in requested diff; workspace package: @acme/auth");
    expect(body).not.toContain("export function login");
  });

  test("updates an existing sticky comment", async () => {
    const calls: Array<{ url: string; method: string }> = [];
    const fetchImpl = async (url: string | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ url: String(url), method: init?.method ?? "GET" });
      if (!init?.method) {
        return jsonResponse([{ id: 42, body: `${CTXSIFT_COMMENT_MARKER}\nold` }]);
      }
      return jsonResponse({ id: 42 });
    };

    await upsertPullRequestComment(
      {
        owner: "acme",
        repo: "demo",
        pullNumber: 7,
        token: "ghs_test",
        body: "new body"
      },
      fetchImpl
    );

    expect(calls).toEqual([
      {
        url: "https://api.github.com/repos/acme/demo/issues/7/comments?per_page=100",
        method: "GET"
      },
      {
        url: "https://api.github.com/repos/acme/demo/issues/comments/42",
        method: "PATCH"
      }
    ]);
  });

  test("rejects invalid existing sticky comment ids before updating", async () => {
    const fetchImpl = async (_url: string | URL, init?: RequestInit): Promise<Response> => {
      if (!init?.method) {
        return jsonResponse([{ id: "42/evil", body: `${CTXSIFT_COMMENT_MARKER}\nold` }]);
      }
      throw new Error("fetch should not be called");
    };

    await expect(
      upsertPullRequestComment(
        {
          owner: "acme",
          repo: "demo",
          pullNumber: 7,
          token: "ghs_test",
          body: "new body"
        },
        fetchImpl
      )
    ).rejects.toThrow("comment id must be a positive integer");
  });

  test("rejects non-array GitHub comments responses before writing", async () => {
    const fetchImpl = async (_url: string | URL, init?: RequestInit): Promise<Response> => {
      if (!init?.method) {
        return jsonResponse({ id: 42, body: `${CTXSIFT_COMMENT_MARKER}\nold` });
      }
      throw new Error("fetch should not be called");
    };

    await expect(
      upsertPullRequestComment(
        {
          owner: "acme",
          repo: "demo",
          pullNumber: 7,
          token: "ghs_test",
          body: "new body"
        },
        fetchImpl
      )
    ).rejects.toThrow("GitHub comments response must be an array");
  });

  test("rejects non-object GitHub comments response items before writing", async () => {
    const fetchImpl = async (_url: string | URL, init?: RequestInit): Promise<Response> => {
      if (!init?.method) {
        return jsonResponse([null]);
      }
      throw new Error("fetch should not be called");
    };

    await expect(
      upsertPullRequestComment(
        {
          owner: "acme",
          repo: "demo",
          pullNumber: 7,
          token: "ghs_test",
          body: "new body"
        },
        fetchImpl
      )
    ).rejects.toThrow("GitHub comments response items must be objects");
  });

  test("rejects non-string GitHub comment bodies before matching sticky comments", async () => {
    const fetchImpl = async (_url: string | URL, init?: RequestInit): Promise<Response> => {
      if (!init?.method) {
        return jsonResponse([{ id: 42, body: 123 }]);
      }
      throw new Error("fetch should not be called");
    };

    await expect(
      upsertPullRequestComment(
        {
          owner: "acme",
          repo: "demo",
          pullNumber: 7,
          token: "ghs_test",
          body: "new body"
        },
        fetchImpl
      )
    ).rejects.toThrow("GitHub comment body must be a string when present");
  });

  test("trims GitHub token before sending authorization headers", async () => {
    const authorizations: string[] = [];
    const fetchImpl = async (_url: string | URL, init?: RequestInit): Promise<Response> => {
      authorizations.push((init?.headers as Record<string, string>).authorization);
      if (!init?.method) {
        return jsonResponse([]);
      }
      return jsonResponse({ id: 43 });
    };

    await upsertPullRequestComment(
      {
        owner: "acme",
        repo: "demo",
        pullNumber: 7,
        token: "  ghs_test  ",
        body: "new body"
      },
      fetchImpl
    );

    expect(authorizations).toEqual(["Bearer ghs_test", "Bearer ghs_test"]);
  });

  test("rejects invalid GitHub comment request values before fetching", async () => {
    const fetchImpl = async (): Promise<Response> => {
      throw new Error("fetch should not be called");
    };
    const baseRequest = {
      owner: "acme",
      repo: "demo",
      pullNumber: 7,
      token: "ghs_test",
      body: "new body"
    };

    await expect(upsertPullRequestComment(null as unknown as Parameters<typeof upsertPullRequestComment>[0], fetchImpl)).rejects.toThrow(
      "request must be an object"
    );
    await expect(upsertPullRequestComment([] as unknown as Parameters<typeof upsertPullRequestComment>[0], fetchImpl)).rejects.toThrow(
      "request must be an object"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, owner: "acme/evil" }, fetchImpl)).rejects.toThrow(
      "owner must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, repo: "demo?tab=issues" }, fetchImpl)).rejects.toThrow(
      "repo must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, owner: "." }, fetchImpl)).rejects.toThrow(
      "owner must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, repo: ".." }, fetchImpl)).rejects.toThrow(
      "repo must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, owner: "acme%2Fevil" }, fetchImpl)).rejects.toThrow(
      "owner must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, repo: "demo%2fissues" }, fetchImpl)).rejects.toThrow(
      "repo must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, owner: "acme\\evil" }, fetchImpl)).rejects.toThrow(
      "owner must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, repo: "demo\\issues" }, fetchImpl)).rejects.toThrow(
      "repo must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, owner: "acme\u0000evil" }, fetchImpl)).rejects.toThrow(
      "owner must be a GitHub path segment"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, repo: "demo\u007Fissues" }, fetchImpl)).rejects.toThrow(
      "repo must be a GitHub path segment"
    );
    await expect(
      upsertPullRequestComment({ ...baseRequest, owner: 123 } as unknown as Parameters<typeof upsertPullRequestComment>[0], fetchImpl)
    ).rejects.toThrow("owner must be a GitHub path segment");
    await expect(
      upsertPullRequestComment({ ...baseRequest, repo: null } as unknown as Parameters<typeof upsertPullRequestComment>[0], fetchImpl)
    ).rejects.toThrow("repo must be a GitHub path segment");
    await expect(upsertPullRequestComment({ ...baseRequest, pullNumber: 0 }, fetchImpl)).rejects.toThrow(
      "pullNumber must be a positive integer"
    );
    await expect(upsertPullRequestComment({ ...baseRequest, token: "   " }, fetchImpl)).rejects.toThrow(
      "token must be non-empty"
    );
    await expect(
      upsertPullRequestComment({ ...baseRequest, token: 123 } as unknown as Parameters<typeof upsertPullRequestComment>[0], fetchImpl)
    ).rejects.toThrow("token must be non-empty");
    await expect(upsertPullRequestComment({ ...baseRequest, body: "   " }, fetchImpl)).rejects.toThrow(
      "body must be non-empty"
    );
    await expect(
      upsertPullRequestComment({ ...baseRequest, body: null } as unknown as Parameters<typeof upsertPullRequestComment>[0], fetchImpl)
    ).rejects.toThrow("body must be non-empty");
  });

  test("parses PR comment CLI options", () => {
    expect(parseArgs(["--bundle", "bundle.json", "--artifact", "ctxsift-review-context"])).toEqual({
      bundlePath: "bundle.json",
      artifactName: "ctxsift-review-context"
    });
  });

  test("rejects blank PR comment CLI option values", () => {
    expect(() => parseArgs(null as never)).toThrow("args must be an array");
    expect(() => parseArgs("--bundle" as never)).toThrow("args must be an array");
    expect(() => parseArgs(["--bundle", "   "])).toThrow("Missing value for --bundle");
    expect(() => parseArgs(["--artifact", "   "])).toThrow("Missing value for --artifact");
  });

  test("parses GitHub repository environment strictly", () => {
    expect(parseGitHubRepository("acme/demo")).toEqual({ owner: "acme", repo: "demo" });
    expect(() => parseGitHubRepository("acme/demo/extra")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme/   ")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("   /demo")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme?/demo")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme/demo#readme")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme demo/repo")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("./demo")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme/..")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme%2Fdemo/repo")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme/demo%2fissues")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme\\demo/repo")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme/demo\\issues")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme\u0000demo/repo")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository("acme/demo\u007Fissues")).toThrow("GITHUB_REPOSITORY must use owner/repo format");
    expect(() => parseGitHubRepository(123 as never)).toThrow("GITHUB_REPOSITORY must use owner/repo format");
  });

  test("parses pull request event number strictly", () => {
    expect(parsePullRequestNumber({ pull_request: { number: 7 } })).toBe(7);
    expect(() => parsePullRequestNumber({})).toThrow("GITHUB_EVENT_PATH does not contain a positive pull_request.number");
    expect(() => parsePullRequestNumber({ pull_request: { number: 0 } })).toThrow(
      "GITHUB_EVENT_PATH does not contain a positive pull_request.number"
    );
    expect(() => parsePullRequestNumber({ pull_request: { number: "7" } })).toThrow(
      "GITHUB_EVENT_PATH does not contain a positive pull_request.number"
    );
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

const sampleOutput: PackOutput = {
  schemaVersion: "1.0",
  task: { mode: "review", query: "Review auth", diff: "main...HEAD", targetModel: "generic" },
  repo: { type: "local", source: ".", root: ".", ref: "local" },
  manifest: {
    repo: ".",
    ref: "local",
    query: "Review auth",
    totalTokens: 20,
    selectedFiles: 1,
    droppedFiles: [],
    droppedFilesOmitted: 0,
    redactions: 0
  },
  tree: "src/auth/login.ts",
  selectedFiles: [
    {
      path: "src/auth/login.ts",
      language: "typescript",
      sizeBytes: 24,
      estimatedTokens: 6,
      reasons: ["changed in requested diff", "workspace package: @acme/auth"],
      scores: {
        lexical: 0,
        structural: 0,
        git: 20,
        test: 0,
        docs: 0,
        workspace: 18,
        riskPenalty: 0,
        total: 38
      }
    }
  ],
  chunks: [
    {
      id: "file-1",
      title: "src/auth/login.ts",
      path: "src/auth/login.ts",
      content: "export function login() {}",
      tokens: 6
    }
  ],
  promptTemplate: "Review this change.",
  review: {
    spec: "main...HEAD",
    base: "main",
    head: "HEAD",
    stat: "src/auth/login.ts | 1 +",
    changedFiles: ["src/auth/login.ts"],
    relatedTests: [],
    relatedDocs: [],
    risks: ["Auth/security-sensitive path changed: src/auth/login.ts"],
    reviewerPrompt: "Review the supplied diff-aware repository context."
  },
  audit: { scannedFiles: 3, ignoredFiles: 0, redactions: 0, securityPolicy: "balanced", riskScore: 0, blockedHighRiskFiles: [] }
};
