import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const registry = 'https://registry.npmjs.org';
const auditArgs = ['audit', '--audit-level', 'high', '--registry', registry];
const hasNpmLock = existsSync(path.join(process.cwd(), 'package-lock.json'));
const command = hasNpmLock ? resolveNpmCommand() : resolvePnpmCommand();

execFileSync(command.command, [...command.args, ...auditArgs], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

function resolvePnpmCommand() {
  const override = parseCommandPrefix(process.env.CTXSIFT_PNPM_COMMAND, 'CTXSIFT_PNPM_COMMAND');
  if (override) {
    return { command: override[0], args: override.slice(1) };
  }

  const shimCommand = resolveWindowsPnpmShim();
  if (shimCommand) {
    return shimCommand;
  }

  return { command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args: [] };
}

function resolveNpmCommand() {
  const override = parseCommandPrefix(process.env.CTXSIFT_NPM_COMMAND, 'CTXSIFT_NPM_COMMAND');
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

  return { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', args: [] };
}

function resolveWindowsPnpmShim() {
  if (process.platform !== 'win32') {
    return null;
  }

  const pathValue = process.env.Path ?? process.env.PATH ?? '';
  for (const entry of pathValue.split(path.delimiter)) {
    if (!entry) {
      continue;
    }

    const shimPath = path.join(entry, 'pnpm.cmd');
    const nodePath = path.resolve(entry, '..', 'node', 'bin', 'node.exe');
    const pnpmPath = path.resolve(entry, '..', 'node', 'node_modules', 'pnpm', 'bin', 'pnpm.mjs');
    if (existsSync(shimPath) && existsSync(nodePath) && existsSync(pnpmPath)) {
      return { command: nodePath, args: [pnpmPath] };
    }
  }

  return null;
}

function parseCommandPrefix(value, name) {
  if (!value) {
    return null;
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((part) => typeof part !== 'string' || !part)) {
    throw new Error(`${name} must be a JSON array of non-empty strings.`);
  }

  return parsed;
}