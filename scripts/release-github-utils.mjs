import { URL } from "node:url";

export function formatCommand(parts) {
  return parts.map(formatCommandPart).join(" ");
}

export function parseRepository(repository) {
  if (!repository) {
    return null;
  }

  const rawRepository = typeof repository === "string" ? repository : repository.url;
  if (!rawRepository || typeof rawRepository !== "string") {
    return null;
  }

  try {
    const shorthandMatch = rawRepository.match(/^github:([^/]+)\/([^/]+)$/i);
    if (shorthandMatch) {
      const repo = normalizeRepoName(shorthandMatch[2]);
      if (!repo) {
        return null;
      }
      return { owner: shorthandMatch[1], repo };
    }

    const sshMatch = rawRepository.match(/^git@github\.com:([^/]+)\/(.+)$/i);
    if (sshMatch) {
      const repo = normalizeRepoName(sshMatch[2]);
      if (!repo || repo.includes("/")) {
        return null;
      }
      return { owner: sshMatch[1], repo };
    }

    const clean = rawRepository
      .replace(/^git\+/i, "")
      .replace(/\.git$/i, "");
    const parsed = new URL(clean);
    if (parsed.hostname !== "github.com") {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) {
      return null;
    }

    const repo = normalizeRepoName(segments[1]);
    if (!repo) {
      return null;
    }

    return { owner: segments[0], repo };
  } catch {
    return null;
  }
}

function normalizeRepoName(repo) {
  return repo.split("#", 1)[0].replace(/\.git$/i, "");
}

function formatCommandPart(part) {
  if (part === "") {
    return "\"\"";
  }

  if (!/[\s'"$`;&|<>(){}[\]*?~!#]/u.test(part)) {
    return part;
  }
  return `"${part
    .replaceAll("\\", "\\\\")
    .replaceAll("\"", "\\\"")
    .replaceAll("$", "\\$")
    .replaceAll("`", "\\`")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t")}"`;
}
