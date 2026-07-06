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
});
