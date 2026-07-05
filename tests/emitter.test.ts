import { describe, expect, test } from "vitest";
import { emitBundle } from "../src/emitter.js";
import type { PackOutput } from "../src/types.js";

const sampleOutput: PackOutput = {
  schemaVersion: "1.0",
  task: {
    mode: "question",
    query: "Where does auth start?",
    targetModel: "generic"
  },
  repo: {
    type: "local",
    source: "fixture",
    root: "fixture",
    ref: "local"
  },
  manifest: {
    repo: "fixture",
    ref: "local",
    query: "Where does auth start?",
    totalTokens: 42,
    selectedFiles: 1,
    droppedFiles: [],
    redactions: 0
  },
  tree: "src/auth/login.ts",
  selectedFiles: [
    {
      path: "src/auth/login.ts",
      language: "typescript",
      sizeBytes: 123,
      estimatedTokens: 25,
      reasons: ["query matched file path"],
      scores: {
        lexical: 10,
        structural: 5,
        git: 0,
        test: 0,
        docs: 0,
        riskPenalty: 0,
        total: 15
      }
    }
  ],
  chunks: [
    {
      id: "file-1",
      title: "src/auth/login.ts",
      path: "src/auth/login.ts",
      content: "export function login() {}",
      tokens: 25
    }
  ],
  promptTemplate: "Use this context to answer the question.",
  audit: {
    scannedFiles: 3,
    ignoredFiles: 2,
    redactions: 0
  }
};

describe("emitBundle", () => {
  test("emits parseable JSON", () => {
    const emitted = emitBundle(sampleOutput, "json");
    expect(JSON.parse(emitted)).toMatchObject({
      manifest: {
        query: "Where does auth start?"
      }
    });
  });

  test("emits Markdown with manifest, reasons, and audit", () => {
    const emitted = emitBundle(sampleOutput, "markdown");
    expect(emitted).toContain("# CtxSift Bundle");
    expect(emitted).toContain("Where does auth start?");
    expect(emitted).toContain("query matched file path");
    expect(emitted).toContain("## Audit");
  });

  test("uses a longer Markdown fence when content contains triple backticks", () => {
    const emitted = emitBundle(
      {
        ...sampleOutput,
        chunks: [
          {
            id: "file-1",
            title: "README.md",
            path: "README.md",
            content: "Example:\n```ts\nconsole.log('nested');\n```",
            tokens: 10
          }
        ]
      },
      "markdown"
    );

    expect(emitted).toContain("````text\nExample:");
    expect(emitted).toContain("```\n````");
  });
});
