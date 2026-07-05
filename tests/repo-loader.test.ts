import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { loadRepository } from "../src/repo-loader.js";

describe("loadRepository", () => {
  test("applies include and exclude glob patterns deterministically", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsift-glob-"));
    await fs.mkdir(path.join(root, "src", "auth"), { recursive: true });
    await fs.mkdir(path.join(root, "src", "billing"), { recursive: true });
    await fs.mkdir(path.join(root, "docs"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "auth", "login.ts"), "export const login = true;\n", "utf8");
    await fs.writeFile(path.join(root, "src", "billing", "invoice.ts"), "export const invoice = true;\n", "utf8");
    await fs.writeFile(path.join(root, "docs", "auth.md"), "# Auth\n", "utf8");
    await fs.writeFile(path.join(root, ".env"), "OPENAI_API_KEY=sk-proj-secret\n", "utf8");

    const loaded = await loadRepository(root, {
      include: [".env"],
      exclude: ["src/**/invoice.ts", "docs/*.md"]
    });

    const paths = loaded.files.map((file) => file.path);
    expect(paths).toEqual([".env", "src/auth/login.ts"]);
    expect(loaded.ignoredFiles).toContain("src/billing/invoice.ts");
    expect(loaded.ignoredFiles).toContain("docs/auth.md");
  });

  test("ignores unknown binary files by content sniffing", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "ctxsift-binary-"));
    await fs.mkdir(path.join(root, "src"));
    await fs.writeFile(path.join(root, "src", "auth.ts"), "export const auth = true;\n", "utf8");
    await fs.writeFile(path.join(root, "mystery"), Buffer.from([0, 1, 2, 3, 0, 255]));

    const loaded = await loadRepository(root);

    expect(loaded.files.map((file) => file.path)).toContain("src/auth.ts");
    expect(loaded.files.map((file) => file.path)).not.toContain("mystery");
    expect(loaded.ignoredFiles).toContain("mystery");
  });
});
