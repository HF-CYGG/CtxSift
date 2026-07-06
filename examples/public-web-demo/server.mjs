import { execFile } from "node:child_process";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ALLOWED_PROFILES = new Set(["balanced", "private", "strict"]);
const PUBLIC_GITHUB_REPO_PATTERN = /^https:\/\/github\.com\/[^/\s?#]+\/[^/\s?#]+(?:\.git)?$/i;

export function isAllowedPublicGitHubRepo(value) {
  return typeof value === "string" && PUBLIC_GITHUB_REPO_PATTERN.test(value.trim());
}

export function buildPackArgs(input) {
  const normalized = normalizePackInput(input);
  return [
    "--repo",
    normalized.repo,
    "--ask",
    normalized.ask,
    "--format",
    "json",
    "--max-tokens",
    String(normalized.maxTokens),
    "--profile",
    normalized.profile
  ];
}

export function normalizePackInput(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Request body must be a JSON object");
  }

  const repo = requireText(input.repo, "repo").trim();
  const ask = requireText(input.ask, "ask").trim();
  const profile = input.profile ?? "private";
  const maxTokens = input.maxTokens === undefined ? 20000 : Number.parseInt(String(input.maxTokens), 10);

  if (!isAllowedPublicGitHubRepo(repo)) {
    throw new Error("repo must be a public https://github.com/owner/repo URL");
  }
  if (!ALLOWED_PROFILES.has(profile)) {
    throw new Error("profile must be balanced, private, or strict");
  }
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
    throw new Error("maxTokens must be a positive integer");
  }

  return { ask, maxTokens, profile, repo };
}

export function createServer(options = {}) {
  const root = options.root ?? path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const cliPath = options.cliPath ?? path.join(root, "dist", "cli.js");

  return http.createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/") {
        sendHtml(response, renderPage());
        return;
      }

      if (request.method === "POST" && request.url === "/api/pack") {
        const input = JSON.parse(await readBody(request));
        const args = buildPackArgs(input);
        const result = await execFileAsync(process.execPath, [cliPath, ...args], {
          cwd: root,
          maxBuffer: 10 * 1024 * 1024,
          timeout: 120000
        });
        sendJson(response, 200, JSON.parse(result.stdout));
        return;
      }

      sendJson(response, 404, { error: "not found" });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "unknown error" });
    }
  });
}

function requireText(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) {
        reject(new Error("Request body is too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendHtml(response, html) {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function renderPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CtxSift Public Demo</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #f5f7f8; color: #14211f; }
      main { max-width: 860px; margin: 0 auto; padding: 40px 20px; }
      form { display: grid; gap: 12px; }
      input, textarea, button { font: inherit; padding: 10px 12px; border: 1px solid #9aa8a4; border-radius: 6px; }
      textarea { min-height: 96px; }
      button { width: max-content; background: #103d3b; color: white; border-color: #103d3b; cursor: pointer; }
      pre { margin-top: 24px; padding: 16px; background: #0d1716; color: #d8fff8; overflow: auto; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>CtxSift Public Demo</h1>
      <form id="pack-form">
        <input name="repo" placeholder="https://github.com/HF-CYGG/CtxSift" required />
        <textarea name="ask" placeholder="Where does review context generation start?" required></textarea>
        <button type="submit">Generate JSON Bundle</button>
      </form>
      <pre id="output">{}</pre>
    </main>
    <script>
      const form = document.querySelector("#pack-form");
      const output = document.querySelector("#output");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        output.textContent = "Loading...";
        const body = Object.fromEntries(new FormData(form).entries());
        const response = await fetch("/api/pack", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });
        output.textContent = JSON.stringify(await response.json(), null, 2);
      });
    </script>
  </body>
</html>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number.parseInt(process.env.PORT ?? "4173", 10);
  createServer().listen(port, () => {
    process.stdout.write(`CtxSift public demo listening on http://localhost:${port}\n`);
  });
}
