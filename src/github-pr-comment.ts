import type { PackOutput } from "./types.js";

export const CTXSIFT_COMMENT_MARKER = "<!-- ctxsift-review-context -->";

export type ReviewCommentOptions = {
  artifactName: string;
};

export type UpsertCommentRequest = {
  owner: string;
  repo: string;
  pullNumber: number;
  token: string;
  body: string;
};

type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;
type GitHubComment = {
  id: number;
  body?: string;
};

export function buildReviewComment(output: PackOutput, options: ReviewCommentOptions): string {
  const selectedFiles = output.selectedFiles.slice(0, 20).map((file) => {
    return `- \`${file.path}\` — ${file.reasons.join("; ") || "selected by rank"}`;
  });
  const risks = output.review?.risks.slice(0, 10).map((risk) => `- ${risk}`) ?? [];

  return [
    CTXSIFT_COMMENT_MARKER,
    "## CtxSift Review Context",
    "",
    `- Artifact: \`${options.artifactName}\``,
    `- Diff: \`${output.review?.spec ?? output.task.diff ?? "(none)"}\``,
    `- Changed files: ${output.review?.changedFiles.length ?? 0}`,
    `- Selected files: ${output.selectedFiles.length}`,
    `- Total tokens: ${output.manifest.totalTokens}`,
    `- Redactions: ${output.manifest.redactions}`,
    "",
    "### Selected Files",
    "",
    selectedFiles.length > 0 ? selectedFiles.join("\n") : "(none)",
    "",
    "### Risk Hints",
    "",
    risks.length > 0 ? risks.join("\n") : "(none)",
    "",
    "Full context is uploaded as the workflow artifact. Source chunks are not embedded in this PR comment."
  ].join("\n");
}

export async function upsertPullRequestComment(request: UpsertCommentRequest, fetchImpl: FetchLike = fetch): Promise<void> {
  validateUpsertCommentRequest(request);
  const token = request.token.trim();

  const commentsUrl = `https://api.github.com/repos/${request.owner}/${request.repo}/issues/${request.pullNumber}/comments?per_page=100`;
  const commentsResponse = await fetchImpl(commentsUrl, {
    headers: githubHeaders(token)
  });
  await assertOk(commentsResponse, "list pull request comments");

  const comments = (await commentsResponse.json()) as GitHubComment[];
  const existing = comments.find((comment) => comment.body?.includes(CTXSIFT_COMMENT_MARKER));
  if (existing) {
    const updateUrl = `https://api.github.com/repos/${request.owner}/${request.repo}/issues/comments/${existing.id}`;
    const updateResponse = await fetchImpl(updateUrl, {
      method: "PATCH",
      headers: githubHeaders(token),
      body: JSON.stringify({ body: request.body })
    });
    await assertOk(updateResponse, "update pull request comment");
    return;
  }

  const createResponse = await fetchImpl(commentsUrl.replace("?per_page=100", ""), {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ body: request.body })
  });
  await assertOk(createResponse, "create pull request comment");
}

function validateUpsertCommentRequest(request: UpsertCommentRequest): void {
  assertGitHubPathSegment(request.owner, "owner");
  assertGitHubPathSegment(request.repo, "repo");
  if (!Number.isSafeInteger(request.pullNumber) || request.pullNumber <= 0) {
    throw new Error("pullNumber must be a positive integer");
  }
  if (!request.token.trim()) {
    throw new Error("token must be non-empty");
  }
  if (!request.body.trim()) {
    throw new Error("body must be non-empty");
  }
}

function assertGitHubPathSegment(value: string, name: string): void {
  if (!/^[^/\s?#]+$/.test(value)) {
    throw new Error(`${name} must be a GitHub path segment`);
  }
}

function githubHeaders(token: string): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-github-api-version": "2022-11-28"
  };
}

async function assertOk(response: Response, action: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const body = await response.text();
  throw new Error(`Failed to ${action}: ${response.status} ${body}`);
}
