import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const cacheDir = path.join(tmpdir(), 'ctxsift-npm-pack-cache');
if (!existsSync(cacheDir)) {
  mkdirSync(cacheDir, { recursive: true });
}

const command = `npm pack --dry-run --cache=${cacheDir}`;

try {
  execSync(command, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: cacheDir,
      NPM_CONFIG_LOGLEVEL: process.env.NPM_CONFIG_LOGLEVEL || 'warn'
    }
  });
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
