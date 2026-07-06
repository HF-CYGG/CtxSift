import { describe, expect, test } from "vitest";
import { classifyFile, normalizePath } from "../src/file-classifier.js";

describe("file classification", () => {
  test("normalizes Windows separators to POSIX separators", () => {
    expect(normalizePath("src\\auth\\login.ts")).toBe("src/auth/login.ts");
  });

  test("classifies core file categories", () => {
    expect(classifyFile("src/auth/login.ts").kind).toBe("source");
    expect(classifyFile("tests/auth.test.ts").kind).toBe("test");
    expect(classifyFile("README.md").kind).toBe("doc");
    expect(classifyFile(".env").kind).toBe("secret");
    expect(classifyFile("dist/generated.js").kind).toBe("generated");
    expect(classifyFile(".vs/VSWorkspaceState.json").kind).toBe("generated");
    expect(classifyFile("spring-beans/src/test/resources/example.properties").kind).toBe("test");
  });
});
