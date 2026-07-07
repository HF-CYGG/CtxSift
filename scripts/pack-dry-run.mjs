import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const forbiddenPackFiles = [
  'AGENTS.md',
  'GLOBAL_RULES.md',
  'benchmark-report.md',
  'benchmark-report.json',
  'acl.txt',
  'tmp-esbuild.exe',
  'tmp-vitest.config.mjs',
  'tmp-vitest.config.js',
  '.tmp-vitest.config.js',
  '.tmp-vitest-no-ts.cjs',
  'tmp-vitest-no-ts.cjs',
  'vitest-config-no-ts.mjs',
  'tmp-vitest-commonjs.config.cjs'
];

const cacheDir = path.join(tmpdir(), 'ctxsift-npm-pack-cache');
if (!existsSync(cacheDir)) {
  mkdirSync(cacheDir, { recursive: true });
}

const npmCommand = resolveNpmCommand();

try {
  const output = execFileSync(npmCommand.command, [
    ...npmCommand.args,
    'pack',
    '--dry-run',
    '--json',
    `--cache=${cacheDir}`
  ], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: cacheDir,
      NPM_CONFIG_LOGLEVEL: process.env.NPM_CONFIG_LOGLEVEL || 'warn'
    }
  });
  assertAllowedPackFiles(parsePackedFilePaths(output));
} catch (error) {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('pack dry-run failed');
} finally {
  try {
    rmSync(cacheDir, { recursive: true, force: true });
  } catch {
    // Best effort only; constrained environments may block cleanup.
  }
}

function parsePackedFilePaths(output) {
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error('Unable to parse npm pack --dry-run JSON output.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Unexpected npm pack --dry-run output shape.');
  }

  return parsed.flatMap((entry) => {
    if (!entry || !Array.isArray(entry.files)) {
      return [];
    }
    return entry.files
      .map((file) => file?.path)
      .filter((filePath) => typeof filePath === 'string');
  });
}

function assertAllowedPackFiles(filePaths) {
  const forbidden = filePaths.filter((filePath) => isForbiddenPackFile(filePath));
  if (forbidden.length > 0) {
    throw new Error(`Pack dry-run included forbidden files: ${forbidden.join(', ')}`);
  }
}

function isForbiddenPackFile(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const normalizedLower = normalized.toLowerCase();
  const segments = normalized.split('/');
  return forbiddenPackFiles.some((file) => file.toLowerCase() === normalizedLower) ||
    normalizedLower === '.docker/config.json' ||
    normalizedLower.endsWith('/.docker/config.json') ||
    normalizedLower === '.ssh/config' ||
    normalizedLower.endsWith('/.ssh/config') ||
    normalizedLower === '.kube/config' ||
    normalizedLower.endsWith('/.kube/config') ||
    normalizedLower === '.git/config' ||
    normalizedLower.endsWith('/.git/config') ||
    normalizedLower === '.config/gh/hosts.yml' ||
    normalizedLower.endsWith('/.config/gh/hosts.yml') ||
    normalizedLower === '.config/gh/hosts.yaml' ||
    normalizedLower.endsWith('/.config/gh/hosts.yaml') ||
    normalizedLower === '.azure/accesstokens.json' ||
    normalizedLower.endsWith('/.azure/accesstokens.json') ||
    normalizedLower === '.azure/msal_token_cache.json' ||
    normalizedLower.endsWith('/.azure/msal_token_cache.json') ||
    normalizedLower === '.config/gcloud/credentials.db' ||
    normalizedLower.endsWith('/.config/gcloud/credentials.db') ||
    normalizedLower === '.config/gcloud/access_tokens.db' ||
    normalizedLower.endsWith('/.config/gcloud/access_tokens.db') ||
    normalizedLower === '.netlify/config.json' ||
    normalizedLower.endsWith('/.netlify/config.json') ||
    normalizedLower === '.config/heroku/accounts.json' ||
    normalizedLower.endsWith('/.config/heroku/accounts.json') ||
    normalizedLower === '.config/configstore/snyk.json' ||
    normalizedLower.endsWith('/.config/configstore/snyk.json') ||
    normalizedLower === '.config/configstore/firebase-tools.json' ||
    normalizedLower.endsWith('/.config/configstore/firebase-tools.json') ||
    normalizedLower === '.bundle/config' ||
    normalizedLower.endsWith('/.bundle/config') ||
    normalizedLower === 'android/key.properties' ||
    normalizedLower.endsWith('/android/key.properties') ||
    normalizedLower === 'android/keystore.properties' ||
    normalizedLower.endsWith('/android/keystore.properties') ||
    normalizedLower === 'android/signing.properties' ||
    normalizedLower.endsWith('/android/signing.properties') ||
    normalizedLower === 'local.properties' ||
    normalizedLower.endsWith('/local.properties') ||
    normalizedLower === '.terraform.d/credentials.tfrc.json' ||
    normalizedLower.endsWith('/.terraform.d/credentials.tfrc.json') ||
    normalizedLower === '.m2/settings.xml' ||
    normalizedLower.endsWith('/.m2/settings.xml') ||
    normalizedLower === '.gradle/gradle.properties' ||
    normalizedLower.endsWith('/.gradle/gradle.properties') ||
    segments.some((segment) => {
      const segmentLower = segment.toLowerCase();
      return segmentLower.startsWith('_tmp_') ||
        segmentLower === 'tmp-npm-cache' ||
        segmentLower.startsWith('.npm-cache') ||
        segmentLower === '.ds_store' ||
        segmentLower === 'thumbs.db' ||
        segmentLower === '.env' ||
        segmentLower.startsWith('.env.') ||
        segmentLower === '.envrc' ||
        segmentLower === '.npmrc' ||
        segmentLower === '.yarnrc' ||
        segmentLower === '.yarnrc.yml' ||
        segmentLower === '.pnpmrc' ||
        segmentLower === '.pypirc' ||
        segmentLower === '.netrc' ||
        segmentLower === '.git-credentials' ||
        segmentLower === '.gitconfig' ||
        segmentLower === '.sentryclirc' ||
        segmentLower === 'sentry.properties' ||
        segmentLower === '.terraformrc' ||
        segmentLower === 'terraform.rc' ||
        segmentLower === '.vault-token' ||
        segmentLower === 'secring.gpg' ||
        segmentLower === 'private-key.asc' ||
        segmentLower === 'secret-key.asc' ||
        segmentLower === 'private.pgp' ||
        segmentLower.endsWith('.opvault') ||
        segmentLower.endsWith('.agilekeychain') ||
        segmentLower === 'auth.json' ||
        segmentLower === 'credentials' ||
        segmentLower === 'credentials.toml' ||
        segmentLower === 'credentials.json' ||
        segmentLower.endsWith('-credentials.json') ||
        segmentLower.endsWith('_credentials.json') ||
        segmentLower.endsWith('.credentials.json') ||
        segmentLower === 'credential.json' ||
        segmentLower === 'nuget.config' ||
        segmentLower === 'gradle.properties' ||
        segmentLower === 'application_default_credentials.json' ||
        (segmentLower.startsWith('client_secret') && segmentLower.endsWith('.json')) ||
        segmentLower === 'client-secret.json' ||
        segmentLower === 'client-secrets.json' ||
        segmentLower.endsWith('-client-secret.json') ||
        segmentLower.endsWith('-client-secrets.json') ||
        segmentLower === 'tokens.json' ||
        segmentLower === 'token.json' ||
        segmentLower === 'secrets.json' ||
        segmentLower === 'secret.json' ||
        segmentLower === 'secrets.yaml' ||
        segmentLower === 'secret.yaml' ||
        segmentLower === 'secrets.yml' ||
        segmentLower === 'secret.yml' ||
        segmentLower.endsWith('.tokens.json') ||
        segmentLower.endsWith('.token.json') ||
        segmentLower.endsWith('.secrets.json') ||
        segmentLower.endsWith('.secret.json') ||
        segmentLower.endsWith('.secrets.yaml') ||
        segmentLower.endsWith('.secret.yaml') ||
        segmentLower.endsWith('.secrets.yml') ||
        segmentLower.endsWith('.secret.yml') ||
        segmentLower === 'service-account.json' ||
        segmentLower === 'service_account.json' ||
        segmentLower === 'serviceaccountkey.json' ||
        segmentLower === 'gcp-service-account.json' ||
        (segmentLower.includes('firebase-adminsdk') && segmentLower.endsWith('.json')) ||
        segmentLower === 'id_rsa' ||
        segmentLower === 'id_dsa' ||
        segmentLower === 'id_ecdsa' ||
        segmentLower === 'id_ed25519' ||
        segmentLower.endsWith('.tfvars') ||
        segmentLower.endsWith('.tfvars.json') ||
        segmentLower.endsWith('.tfstate') ||
        segmentLower.endsWith('.tfstate.backup') ||
        segmentLower.endsWith('.swp') ||
        segmentLower.endsWith('.swo') ||
        segmentLower.endsWith('~') ||
        segmentLower.endsWith('.pem') ||
        segmentLower.endsWith('.key') ||
        segmentLower.endsWith('.ppk') ||
        segmentLower.endsWith('.p12') ||
        segmentLower.endsWith('.pfx') ||
        segmentLower.endsWith('.jks') ||
        segmentLower.endsWith('.jceks') ||
        segmentLower.endsWith('.keystore') ||
        segmentLower.endsWith('.p8') ||
        segmentLower.endsWith('.mobileprovision') ||
        segmentLower.endsWith('.provisionprofile') ||
        segmentLower === 'google-services.json' ||
        segmentLower === 'googleservice-info.plist' ||
        segmentLower.endsWith('.kdbx') ||
        segmentLower.endsWith('.keychain-db') ||
        segmentLower.endsWith('.keychain');
    });
}

function resolveNpmCommand() {
  const override = parseCommandPrefix(process.env.CTXSIFT_NPM_COMMAND);
  if (override) {
    return { command: override[0], args: override.slice(1) };
  }

  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && npmExecPath.endsWith('.js')) {
    return { command: process.execPath, args: [npmExecPath] };
  }

  const bundledNpmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (existsSync(bundledNpmCli)) {
    return { command: process.execPath, args: [bundledNpmCli] };
  }

  return { command: 'npm', args: [] };
}

function parseCommandPrefix(value) {
  if (!value) {
    return null;
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((part) => typeof part !== 'string' || !part)) {
    throw new Error('CTXSIFT_NPM_COMMAND must be a JSON array of non-empty strings.');
  }

  return parsed;
}
