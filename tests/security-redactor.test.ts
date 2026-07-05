import { describe, expect, test } from "vitest";
import { redactSecrets } from "../src/security-redactor.js";

describe("redactSecrets", () => {
  test("redacts common repository credentials", () => {
    const result = redactSecrets(
      [
        "DATABASE_URL=postgres://user:password@example.com:5432/app",
        "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "NPM_TOKEN=npm_abcdefghijklmnopqrstuvwxyz123456",
        "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456",
        "password = super-secret-password",
        "credential: plain-text-token"
      ].join("\n")
    );

    expect(result.content).toContain("DATABASE_URL=[REDACTED:DATABASE_URL]");
    expect(result.content).toContain("AWS_SECRET_ACCESS_KEY=[REDACTED:AWS_SECRET_ACCESS_KEY]");
    expect(result.content).toContain("NPM_TOKEN=[REDACTED:NPM_TOKEN]");
    expect(result.content).toContain("Authorization: [REDACTED:BEARER_TOKEN]");
    expect(result.content).toContain("password = [REDACTED:PASSWORD]");
    expect(result.content).toContain("credential: [REDACTED:CREDENTIAL]");
    expect(result.redactions).toBe(6);
  });

  test("does not redact TypeScript parameter type annotations", () => {
    const result = redactSecrets(
      [
        "function login(",
        "  email: string,",
        "  password: string,",
        "  credential: Credential",
        ") {",
        "  return password;",
        "}"
      ].join("\n")
    );

    expect(result.content).toContain("password: string");
    expect(result.content).toContain("credential: Credential");
    expect(result.redactions).toBe(0);
  });
});
