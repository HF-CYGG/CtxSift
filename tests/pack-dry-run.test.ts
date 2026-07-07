import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

describe("pack dry-run guardrails", () => {
  test("fails when npm dry-run output contains local or temporary files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "dist/cli.js", "GLOBAL_RULES.md"]);

    const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    const env = { ...process.env };
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("GLOBAL_RULES.md");
  });

  test("fails when npm dry-run output contains nested temporary directories", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "docs/_tmp_nested/leak.txt"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("docs/_tmp_nested/leak.txt");
  });

  test("fails when npm dry-run output contains OS or editor temporary files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      ".DS_Store",
      "docs/Thumbs.db",
      "src/index.ts.swp",
      "src/index.ts~"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".DS_Store");
    expect(result.stderr).toContain("docs/Thumbs.db");
    expect(result.stderr).toContain("src/index.ts.swp");
    expect(result.stderr).toContain("src/index.ts~");
  });

  test("fails when npm dry-run output contains environment secret files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "dist/cli.js", ".env"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".env");
  });

  test("fails when npm dry-run output contains direnv environment files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "dist/cli.js", ".envrc"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".envrc");
  });

  test("fails when npm dry-run output contains private key or certificate files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "secrets/id_rsa", "certs/client.pem"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("secrets/id_rsa");
    expect(result.stderr).toContain("certs/client.pem");
  });

  test("fails when npm dry-run output contains local keychain or PuTTY private key files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "keys/server.ppk",
      "Library/Keychains/login.keychain-db",
      "Library/Keychains/System.keychain"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("keys/server.ppk");
    expect(result.stderr).toContain("Library/Keychains/login.keychain-db");
    expect(result.stderr).toContain("Library/Keychains/System.keychain");
  });

  test("fails when npm dry-run output contains Java keystore files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "certs/server.jks",
      "certs/truststore.jceks",
      "certs/client.keystore"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("certs/server.jks");
    expect(result.stderr).toContain("certs/truststore.jceks");
    expect(result.stderr).toContain("certs/client.keystore");
  });

  test("fails when npm dry-run output contains mobile signing credential files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "ios/AuthKey_ABC123.p8",
      "ios/app.mobileprovision",
      "ios/app.provisionprofile"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("ios/AuthKey_ABC123.p8");
    expect(result.stderr).toContain("ios/app.mobileprovision");
    expect(result.stderr).toContain("ios/app.provisionprofile");
  });

  test("fails when npm dry-run output contains Firebase mobile app config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "android/app/google-services.json",
      "ios/Runner/GoogleService-Info.plist",
      "macos/Runner/GoogleService-Info.plist"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("android/app/google-services.json");
    expect(result.stderr).toContain("ios/Runner/GoogleService-Info.plist");
    expect(result.stderr).toContain("macos/Runner/GoogleService-Info.plist");
  });

  test("fails when npm dry-run output contains Android signing property files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "android/key.properties",
      "android/keystore.properties",
      "android/signing.properties"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("android/key.properties");
    expect(result.stderr).toContain("android/keystore.properties");
    expect(result.stderr).toContain("android/signing.properties");
  });

  test("fails when npm dry-run output contains Android or Flutter local properties files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "local.properties",
      "android/local.properties",
      "packages/app/android/local.properties"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("local.properties");
    expect(result.stderr).toContain("android/local.properties");
    expect(result.stderr).toContain("packages/app/android/local.properties");
  });

  test("fails when npm dry-run output contains GnuPG or PGP private key files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      ".gnupg/secring.gpg",
      "keys/private-key.asc",
      "keys/secret-key.asc",
      "keys/private.pgp"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".gnupg/secring.gpg");
    expect(result.stderr).toContain("keys/private-key.asc");
    expect(result.stderr).toContain("keys/secret-key.asc");
    expect(result.stderr).toContain("keys/private.pgp");
  });

  test("fails when npm dry-run output contains password manager vault files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "vault/passwords.kdbx",
      "vault/Personal.opvault/profile.js",
      "vault/Legacy.agilekeychain/data/default"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("vault/passwords.kdbx");
    expect(result.stderr).toContain("vault/Personal.opvault/profile.js");
    expect(result.stderr).toContain("vault/Legacy.agilekeychain/data/default");
  });

  test("fails when npm dry-run output contains package manager auth config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".npmrc", ".yarnrc.yml"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".npmrc");
    expect(result.stderr).toContain(".yarnrc.yml");
  });

  test("fails when npm dry-run output contains Ruby package manager credential files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".gem/credentials", ".bundle/config"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".gem/credentials");
    expect(result.stderr).toContain(".bundle/config");
  });

  test("fails when npm dry-run output contains cross-language package registry credentials", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".pypirc", ".cargo/credentials.toml"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".pypirc");
    expect(result.stderr).toContain(".cargo/credentials.toml");
  });

  test("fails when npm dry-run output contains Composer or NuGet auth config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "composer/auth.json", "NuGet.Config"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("composer/auth.json");
    expect(result.stderr).toContain("NuGet.Config");
  });

  test("fails when npm dry-run output contains Maven or Gradle auth config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".m2/settings.xml", ".gradle/gradle.properties"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".m2/settings.xml");
    expect(result.stderr).toContain(".gradle/gradle.properties");
  });

  test("fails when npm dry-run output contains project Gradle properties files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "gradle.properties",
      "android/gradle.properties",
      "packages/mobile/android/gradle.properties"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("gradle.properties");
    expect(result.stderr).toContain("android/gradle.properties");
    expect(result.stderr).toContain("packages/mobile/android/gradle.properties");
  });

  test("fails when npm dry-run output contains generic credential files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".netrc", "config/credentials.json"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".netrc");
    expect(result.stderr).toContain("config/credentials.json");
  });

  test("fails when npm dry-run output contains prefixed credential JSON files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "android/play-store-credentials.json",
      "config/prod.credentials.json",
      "config/stripe_credentials.json"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("android/play-store-credentials.json");
    expect(result.stderr).toContain("config/prod.credentials.json");
    expect(result.stderr).toContain("config/stripe_credentials.json");
  });

  test("fails when npm dry-run output contains cloud credential files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      ".aws/credentials",
      "gcloud/application_default_credentials.json"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".aws/credentials");
    expect(result.stderr).toContain("gcloud/application_default_credentials.json");
  });

  test("fails when npm dry-run output contains cloud CLI token cache files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      ".azure/accessTokens.json",
      ".azure/msal_token_cache.json",
      ".config/gcloud/credentials.db",
      ".config/gcloud/access_tokens.db"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".azure/accessTokens.json");
    expect(result.stderr).toContain(".azure/msal_token_cache.json");
    expect(result.stderr).toContain(".config/gcloud/credentials.db");
    expect(result.stderr).toContain(".config/gcloud/access_tokens.db");
  });

  test("fails when npm dry-run output contains deployment platform CLI auth files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      ".vercel/auth.json",
      ".netlify/config.json",
      ".config/heroku/auth.json",
      ".config/heroku/accounts.json"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".vercel/auth.json");
    expect(result.stderr).toContain(".netlify/config.json");
    expect(result.stderr).toContain(".config/heroku/auth.json");
    expect(result.stderr).toContain(".config/heroku/accounts.json");
  });

  test("fails when npm dry-run output contains CLI auth configstore files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      ".sentryclirc",
      ".config/configstore/snyk.json",
      ".config/configstore/firebase-tools.json"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".sentryclirc");
    expect(result.stderr).toContain(".config/configstore/snyk.json");
    expect(result.stderr).toContain(".config/configstore/firebase-tools.json");
  });

  test("fails when npm dry-run output contains Sentry properties files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "sentry.properties",
      "android/sentry.properties",
      "ios/sentry.properties"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("sentry.properties");
    expect(result.stderr).toContain("android/sentry.properties");
    expect(result.stderr).toContain("ios/sentry.properties");
  });

  test("fails when npm dry-run output contains Docker registry auth config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".docker/config.json"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".docker/config.json");
  });

  test("fails when npm dry-run output contains SSH client config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".ssh/config"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".ssh/config");
  });

  test("fails when npm dry-run output contains Kubernetes client config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".kube/config"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".kube/config");
  });

  test("fails when npm dry-run output contains Git repository config files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".git/config"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".git/config");
  });

  test("fails when npm dry-run output contains Git user credential files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".git-credentials", ".gitconfig"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".git-credentials");
    expect(result.stderr).toContain(".gitconfig");
  });

  test("fails when npm dry-run output contains GitHub CLI auth host files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", ".config/gh/hosts.yml", ".config/gh/hosts.yaml"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".config/gh/hosts.yml");
    expect(result.stderr).toContain(".config/gh/hosts.yaml");
  });

  test("fails when npm dry-run output contains Terraform variable or state files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "infra/terraform.tfvars",
      "infra/prod.auto.tfvars.json",
      "infra/terraform.tfstate",
      "infra/terraform.tfstate.backup"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("infra/terraform.tfvars");
    expect(result.stderr).toContain("infra/prod.auto.tfvars.json");
    expect(result.stderr).toContain("infra/terraform.tfstate");
    expect(result.stderr).toContain("infra/terraform.tfstate.backup");
  });

  test("fails when npm dry-run output contains HashiCorp CLI credential files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      ".terraformrc",
      "terraform.rc",
      ".terraform.d/credentials.tfrc.json",
      ".vault-token"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain(".terraformrc");
    expect(result.stderr).toContain("terraform.rc");
    expect(result.stderr).toContain(".terraform.d/credentials.tfrc.json");
    expect(result.stderr).toContain(".vault-token");
  });

  test("fails when npm dry-run output contains token or generated secret files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "config/tokens.json", "secrets/secrets.yaml"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("config/tokens.json");
    expect(result.stderr).toContain("secrets/secrets.yaml");
  });

  test("fails when npm dry-run output contains prefixed token or secret files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "config/prod.secrets.json",
      "config/local.secret.yaml",
      "config/staging.tokens.json"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("config/prod.secrets.json");
    expect(result.stderr).toContain("config/local.secret.yaml");
    expect(result.stderr).toContain("config/staging.tokens.json");
  });

  test("fails when npm dry-run output contains Google OAuth client secret files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "config/client_secret_123.apps.googleusercontent.com.json",
      "config/client-secrets.json",
      "config/oauth-client-secret.json"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("config/client_secret_123.apps.googleusercontent.com.json");
    expect(result.stderr).toContain("config/client-secrets.json");
    expect(result.stderr).toContain("config/oauth-client-secret.json");
  });

  test("fails when npm dry-run output contains service account credential files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "config/service-account.json", "config/service_account.json"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("config/service-account.json");
    expect(result.stderr).toContain("config/service_account.json");
  });

  test("fails when npm dry-run output contains Firebase or GCP service account key variants", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, [
      "package.json",
      "config/serviceAccountKey.json",
      "config/project-firebase-adminsdk-prod.json",
      "config/gcp-service-account.json"
    ]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("config/serviceAccountKey.json");
    expect(result.stderr).toContain("config/project-firebase-adminsdk-prod.json");
    expect(result.stderr).toContain("config/gcp-service-account.json");
  });

  test("fails when npm dry-run output contains case variants of sensitive files", () => {
    const workspace = mkdtempSync(path.join(tmpdir(), "ctxsift-pack-"));
    const binDir = path.join(workspace, "bin");
    const fakeNpmPath = path.join(binDir, "fake-npm.mjs");
    mkdirSync(binDir);
    writeFakeNpm(fakeNpmPath, ["package.json", "CONFIG/.ENV", "CERTS/CLIENT.PEM"]);

    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
    env[pathKey] = `${binDir}${path.delimiter}${process.env[pathKey] ?? ""}`;
    env.CTXSIFT_NPM_COMMAND = JSON.stringify([process.execPath, fakeNpmPath]);

    const result = spawnSync(process.execPath, [path.resolve("scripts/pack-dry-run.mjs")], {
      cwd: workspace,
      encoding: "utf8",
      env,
      windowsHide: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Pack dry-run included forbidden files");
    expect(result.stderr).toContain("CONFIG/.ENV");
    expect(result.stderr).toContain("CERTS/CLIENT.PEM");
  });
});

function writeFakeNpm(fakeNpmPath: string, filePaths: string[]) {
  const output = JSON.stringify([
    {
      id: "ctxsift@9.9.9-alpha.0",
      files: filePaths.map((filePath) => ({ path: filePath }))
    }
  ]);

  writeFileSync(
    fakeNpmPath,
    `console.log(${JSON.stringify(output)});\n`,
    "utf8"
  );
}
