export type RedactionResult = {
  content: string;
  redactions: number;
};

const VALUE_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "OPENAI_API_KEY",
    pattern: /\bsk-(?:proj|live|test)?-[A-Za-z0-9_-]{8,}\b/g
  },
  {
    name: "GITHUB_TOKEN",
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{16,}\b/g
  },
  {
    name: "AWS_ACCESS_KEY_ID",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g
  },
  {
    name: "PRIVATE_KEY",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
  },
  {
    name: "JWT",
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
  },
  {
    name: "BEARER_TOKEN",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/gi
  }
];

const ASSIGNMENT_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "DATABASE_URL",
    pattern: /\b(DATABASE_URL\s*=\s*)([^\s"'`]+)/gi
  },
  {
    name: "AWS_SECRET_ACCESS_KEY",
    pattern: /\b(AWS_SECRET_ACCESS_KEY\s*=\s*)([A-Za-z0-9/+=]{16,})/g
  },
  {
    name: "NPM_TOKEN",
    pattern: /\b(NPM_TOKEN\s*=\s*)(npm_[A-Za-z0-9_-]+|[A-Za-z0-9_-]{12,})/gi
  },
  {
    name: "PASSWORD",
    pattern: /((?:^|\n)\s*password\s*[:=]\s*)([^\s"'`]+)/gi
  },
  {
    name: "CREDENTIAL",
    pattern: /((?:^|\n)\s*credential\s*[:=]\s*)([^\s"'`]+)/gi
  }
];

export function redactSecrets(content: string): RedactionResult {
  let redacted = content;
  let redactions = 0;

  for (const { name, pattern } of ASSIGNMENT_PATTERNS) {
    redacted = redacted.replace(pattern, (match: string, prefix: string, value: string) => {
      if (isTypeAnnotationValue(value)) {
        return match;
      }
      redactions += 1;
      return `${prefix}[REDACTED:${name}]`;
    });
  }

  for (const { name, pattern } of VALUE_PATTERNS) {
    redacted = redacted.replace(pattern, () => {
      redactions += 1;
      return `[REDACTED:${name}]`;
    });
  }

  return { content: redacted, redactions };
}

function isTypeAnnotationValue(value: string): boolean {
  return /^(string|number|boolean|bigint|symbol|unknown|any|never|void|object|[A-Z][A-Za-z0-9_<>]*)[,;)]?$/.test(value);
}
