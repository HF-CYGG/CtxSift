import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("GitHub Action metadata", () => {
  test("defines an artifact-first review context action with gated PR comments", () => {
    const metadata = readFileSync("action.yml", "utf8");
    const docs = readFileSync("docs/github-action.md", "utf8");

    expect(metadata).toContain("using: composite");
    expect(metadata).toContain("comment:");
    expect(metadata).toContain('default: "false"');
    expect(metadata).toContain("actions/upload-artifact@v4");
    expect(metadata).toContain("node \"$CTXSIFT_ACTION_PATH/dist/pr-comment-cli.js\"");
    expect(metadata).toContain("Full source context stays in the artifact");
    expect(docs).toContain("pull-requests: write");
    expect(docs).toContain("artifact-only");
  });

  test("keeps review workflow permissions read-only unless comments are enabled", () => {
    const workflow = readFileSync(".github/workflows/ctxsift-review.yml", "utf8");
    const docs = readFileSync("docs/review-bundle.md", "utf8");

    expect(workflow).toContain("permissions:\n  contents: read");
    expect(workflow).not.toContain("\n  pull-requests: write\njobs:");
    expect(workflow).toContain("# pull-requests: write");
    expect(workflow).toContain("comment: ${{ vars.CTXSIFT_REVIEW_COMMENT == 'true' }}");
    expect(workflow).toContain("github-token: ${{ secrets.GITHUB_TOKEN }}");
    expect(docs).toContain("Sticky PR comments are disabled by default");
    expect(docs).toContain("Set repository variable `CTXSIFT_REVIEW_COMMENT` to `true`");
  });

  test("quotes action descriptions that contain colon-space YAML tokens", () => {
    const metadata = readFileSync("action.yml", "utf8");
    const invalidDescriptions = metadata
      .split(/\r?\n/)
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => line.trimStart().startsWith("description:"))
      .filter(({ line }) => {
        const value = line.slice(line.indexOf("description:") + "description:".length).trim();
        return value.includes(": ") && !value.startsWith('"') && !value.startsWith("'");
      });

    expect(invalidDescriptions).toEqual([]);
  });
});
