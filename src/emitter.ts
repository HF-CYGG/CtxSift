import type { OutputFormat, PackOutput } from "./types.js";

export function emitBundle(output: PackOutput, format: OutputFormat): string {
  if (format === "json") {
    return `${JSON.stringify(output, null, 2)}\n`;
  }

  return emitMarkdown(output);
}

function emitMarkdown(output: PackOutput): string {
  const lines: string[] = [
    "# CtxSift Bundle",
    "",
    "## Task",
    "",
    `- Mode: ${output.task.mode}`,
    `- Query: ${output.task.query ?? "(none)"}`,
    `- Diff: ${output.task.diff ?? "(none)"}`,
    `- Target model: ${output.task.targetModel}`,
    "",
    "## Repository",
    "",
    `- Source: ${output.repo.source}`,
    `- Root: ${output.repo.root}`,
    `- Ref: ${output.repo.ref}`,
    `- Type: ${output.repo.type}`,
    `- Total tokens: ${output.manifest.totalTokens}`,
    `- Selected files: ${output.manifest.selectedFiles}`,
    `- Redactions: ${output.manifest.redactions}`,
    "",
    "## Selected Files",
    ""
  ];

  for (const file of output.selectedFiles) {
    lines.push(`### ${file.path}`, "", `- Tokens: ${file.estimatedTokens}`, `- Score: ${file.scores.total}`, `- Reasons: ${file.reasons.join("; ") || "highest remaining score"}`, "");
  }

  if (output.workspaces) {
    lines.push(
      "## Workspace Graph",
      "",
      `- Package manager: ${output.workspaces.packageManager}`,
      `- Build tools: ${output.workspaces.buildTools.join(", ") || "(none)"}`,
      `- Packages: ${output.workspaces.packages.length}`,
      `- Dependency edges: ${output.workspaces.dependencyEdges.length}`,
      ""
    );

    for (const workspacePackage of output.workspaces.packages) {
      lines.push(`- ${workspacePackage.name} (${workspacePackage.path})`);
    }

    if (output.workspaces.focusedPackages.length > 0) {
      lines.push("", "### Focused Packages", "");
      for (const workspacePackage of output.workspaces.focusedPackages) {
        lines.push(`- ${workspacePackage.name} (${workspacePackage.path}): ${workspacePackage.reasons.join("; ")}`);
      }
    }

    lines.push("");
  }

  lines.push("## Dropped Files", "");
  for (const dropped of output.manifest.droppedFiles) {
    lines.push(`- ${dropped.path}: ${dropped.reason}`);
  }

  if (output.review) {
    lines.push(
      "",
      "## Review Bundle",
      "",
      `- Diff: ${output.review.spec}`,
      `- Changed files: ${output.review.changedFiles.length}`,
      `- Related tests: ${output.review.relatedTests.join(", ") || "(none)"}`,
      `- Related docs: ${output.review.relatedDocs.join(", ") || "(none)"}`,
      `- Risks: ${output.review.risks.join("; ") || "(none)"}`,
      "",
      "### Diff Stat",
      "",
      `${fenceFor(output.review.stat)}text`,
      output.review.stat || "(no stat)",
      fenceFor(output.review.stat),
      "",
      "### AI Reviewer Prompt",
      "",
      output.review.reviewerPrompt,
      ""
    );
  }

  lines.push(
    "",
    "## File Tree",
    "",
    `${fenceFor(output.tree)}text`,
    output.tree,
    fenceFor(output.tree),
    "",
    "## Context",
    ""
  );
  for (const chunk of output.chunks) {
    const fence = fenceFor(chunk.content);
    lines.push(`### ${chunk.path}`, "", `${fence}text`, chunk.content, fence, "");
  }

  lines.push(
    "## Audit",
    "",
    `- Scanned files: ${output.audit.scannedFiles}`,
    `- Ignored files: ${output.audit.ignoredFiles}`,
    `- Redactions: ${output.audit.redactions}`,
    ""
  );

  return `${lines.join("\n")}\n`;
}

function fenceFor(content: string): string {
  const matches = content.match(/`{3,}/g) ?? [];
  const longest = matches.reduce((max, match) => Math.max(max, match.length), 2);
  return "`".repeat(longest + 1);
}
