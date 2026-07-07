import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const registry = 'https://registry.npmjs.org';
const command =
  process.platform === 'win32'
    ? `npm.cmd audit --audit-level high --registry ${registry}`
    : `npm audit --audit-level high --registry ${registry}`;

const hasNpmLock = existsSync(path.join(process.cwd(), 'package-lock.json'));

if (!hasNpmLock) {
  const pnpmCommand = process.platform === 'win32'
    ? `pnpm.cmd audit --audit-level high --registry ${registry}`
    : `pnpm audit --audit-level high --registry ${registry}`;
  execSync(pnpmCommand, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env
  });
} else {
  execSync(command, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env
  });
}
