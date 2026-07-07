import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import https from "node:https";
import { URL } from "node:url";
import { Buffer } from "node:buffer";

const args = new Set(process.argv.slice(2));
const printCommand = args.has("--print-command") || args.has("--dry-run");
const skipTagCheck = args.has("--skip-tag-check");
const preferApi = args.has("--use-api");

const authToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageJsonText = readFileSync(packageJsonPath, "utf8").replace(/^\uFEFF/, "");
const packageJson = JSON.parse(packageJsonText);
const version = packageJson.version;
if (!version) {
  throw new Error("package.json does not define a version");
}

const tag = `v${version}`;
const releaseNotesPath = path.resolve(process.cwd(), `docs/release-${tag}.md`);
if (!existsSync(releaseNotesPath)) {
  throw new Error(`Release note file missing: docs/release-${tag}.md`);
}

const hasGh = Boolean(runCommand(["gh", "--version"], { allowFailure: true }));
const useApi = preferApi || (!hasGh && Boolean(authToken));
const branch = getCurrentBranch();
const tagCheck = checkLocalTag(tag);
const hasCheckedTag = tagCheck.checked;
const hasLocalTag = tagCheck.exists;

const releaseArgs = [
  "release",
  "create",
  tag,
  "--title",
  `CtxSift ${tag}`,
  "--notes-file",
  path.relative(process.cwd(), releaseNotesPath),
  "--target",
  branch,
  "--verify-tag"
];

if (/[A-Za-z]/.test(tag) && /-(alpha|beta|rc)\b/.test(tag)) {
  releaseArgs.push("--prerelease");
}

const command = `gh ${releaseArgs.join(" ")}`;
const scriptPath = path.resolve(process.cwd(), "scripts/release-github.mjs");
const apiCommand = `node ${path.relative(process.cwd(), scriptPath)} --use-api`;

if (printCommand) {
  console.log(command);
  if (hasLocalTag) {
    // no-op
  } else if (skipTagCheck) {
    // no-op
  } else if (hasCheckedTag) {
    console.log(`\nTag ${tag} is not present locally. Run: git tag ${tag} && git push origin ${tag}`);
  } else {
    console.log(`\nUnable to verify tag ${tag} locally in this environment. Run: git tag ${tag} && git push origin ${tag}`);
  }

  if (!hasGh && authToken) {
    console.log(`\nGitHub CLI not available. You can publish using token auth:\n${apiCommand} --skip-tag-check`);
  }
  process.exit(0);
}

if (!skipTagCheck && !hasCheckedTag) {
  throw new Error("Unable to verify local tag state. Ensure git is available and retry, or rerun with --skip-tag-check.");
}

if (!skipTagCheck && !hasLocalTag) {
  throw new Error(`Tag ${tag} is not found locally. Run ` +
    `\ngit tag ${tag}\ngit push origin ${tag}`);
}

const repository = parseRepository(packageJson.repository);

if (hasGh && !useApi) {
  const existing = runCommand(["gh", "release", "view", tag], { requireSuccess: false });
  if (existing) {
    throw new Error(`Release ${tag} already exists. If this is intended, delete or edit the existing GitHub release first.`);
  }

  const releaseResult = spawnSync("gh", releaseArgs, { stdio: "inherit", windowsHide: true, shell: false });
  if (releaseResult.status !== 0) {
    const code = releaseResult.status === null ? "spawn-failed" : String(releaseResult.status);
    throw new Error(`gh release create returned non-zero status: ${code}`);
  }

  console.log(`Created GitHub release ${tag} from ${branch}`);
  process.exit(0);
}

if (!useApi) {
  throw new Error("GitHub CLI `gh` is not available and no GH_TOKEN/GITHUB_TOKEN is set. Install gh or set token auth and rerun with --use-api / --skip-tag-check.");
}

if (!repository) {
  throw new Error("Unable to parse repository owner/repo from package.json repository field.");
}

await createReleaseFromApi(repository);
console.log(`Created or confirmed GitHub release ${tag} from ${branch}`);

function runCommand(args, options = { requireSuccess: true }) {
  const requireSuccess = typeof options.allowFailure === "boolean" ? !options.allowFailure : options.requireSuccess !== false;
  const result = spawnSync(args[0], args.slice(1), {
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status === null && (result.error?.message ?? "")) {
    return null;
  }

  if (requireSuccess && result.status !== 0) {
    throw new Error(`Command failed: ${args.join(" ")}`);
  }

  return result.stdout?.trim() ?? null;
}

function getCurrentBranch() {
  const headPath = path.join(process.cwd(), ".git", "HEAD");
  try {
    const head = readFileSync(headPath, "utf8").trim();
    const match = head.match(/^ref:\s+refs\/heads\/(.+)$/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // fallthrough
  }
  return process.env.GITHUB_REF_NAME || process.env.GITHUB_HEAD_REF || "master";
}

function checkLocalTag(tag) {
  const gitDir = path.join(process.cwd(), ".git");
  if (!existsSync(gitDir)) {
    return { checked: false, exists: false };
  }

  const tagRef = path.join(gitDir, "refs", "tags", tag);
  if (existsSync(tagRef)) {
    return { checked: true, exists: true };
  }

  const packedRefsPath = path.join(gitDir, "packed-refs");
  try {
    const packedRefs = readFileSync(packedRefsPath, "utf8");
    const found = packedRefs
      .split(/\r?\n/)
      .some((line) => line && !line.startsWith("#") && !line.startsWith("^") && line.endsWith(`refs/tags/${tag}`));
    return { checked: true, exists: found };
  } catch {
    return { checked: false, exists: false };
  }
}

function parseRepository(repository) {
  if (!repository) {
    return null;
  }

  const rawRepository = typeof repository === "string" ? repository : repository.url;
  if (!rawRepository || typeof rawRepository !== "string") {
    return null;
  }

  try {
    const clean = rawRepository.replace(/\.git$/i, "");
    const parsed = new URL(clean);
    if (parsed.hostname !== "github.com") {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) {
      return null;
    }

    return { owner: segments[0], repo: segments[1] };
  } catch {
    return null;
  }
}

function requestGitHub(pathname, method, body) {
  const bodyText = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname: "api.github.com",
        path: pathname,
        headers: {
          "user-agent": "ctxsift-release-script",
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
          ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
          ...(bodyText ? { "content-type": "application/json", "content-length": Buffer.byteLength(bodyText) } : {})
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 0, body: raw });
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("GitHub API request timeout"));
    });

    if (bodyText) {
      req.write(bodyText);
    }
    req.end();
  });
}

async function createReleaseFromApi({ owner, repo }) {
  const checkPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/tags/${encodeURIComponent(tag)}`;
  const checkResult = await requestGitHub(checkPath, "GET");

  if (checkResult.status !== 404 && checkResult.status !== 200) {
    throw new Error(`GitHub API release check failed (status=${checkResult.status}). Response: ${checkResult.body}`);
  }

  if (checkResult.status === 200) {
    const bodyText = checkResult.body || "{}";
    const existing = safeJsonParse(bodyText);
    const existingUrl = existing?.html_url;
    console.log(`Release ${tag} already exists on GitHub` + (existingUrl ? `: ${existingUrl}` : ""));
    return;
  }

  const createPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases`;
  const createBody = {
    tag_name: tag,
    target_commitish: branch,
    name: `CtxSift ${tag}`,
    body: readFileSync(releaseNotesPath, "utf8"),
    draft: false,
    prerelease: /[A-Za-z]/.test(tag) && /-(alpha|beta|rc)\b/.test(tag)
  };

  const createResult = await requestGitHub(createPath, "POST", createBody);
  if (createResult.status !== 201) {
    throw new Error(`GitHub API release create failed (status=${createResult.status}). Response: ${createResult.body}`);
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
