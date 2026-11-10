#!/usr/bin/env node
// Runs orb against std as npm ships it: every `uses X from "almadar-std/<name>"` resolves in the staged registry, and
// a store holding the staged std and the packed core answers a real command.
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

function arg(flag) {
  const at = process.argv.indexOf(flag);
  if (at < 0 || at + 1 >= process.argv.length) throw new Error(`usage: packaged-std.mjs --stage <dir> --core <dir> --orb <binary>; missing ${flag}`);
  return process.argv[at + 1];
}

function walk(dir, suffix, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, suffix, out);
    else if (entry.name.endsWith(suffix)) out.push(path);
  }
  return out;
}

function fail(message) {
  console.error(`packaged-std: ${message}`);
  process.exit(1);
}

const stage = arg('--stage');
const core = arg('--core');
const orb = arg('--orb');

const registry = new Map(walk(join(stage, 'behaviors/registry'), '.orb').map((path) => [basename(path, '.orb'), path]));
const missing = new Set();
let uses = 0;
for (const file of walk(join(stage, 'behaviors/lolo'), '.lolo')) {
  for (const match of readFileSync(file, 'utf8').matchAll(/^\s*uses\s+\w+\s+from\s+"almadar-std\/([^"]+)"/gm)) {
    uses += 1;
    if (!registry.has(match[1])) missing.add(match[1]);
  }
}
if (uses === 0) fail(`no almadar-std uses found under ${stage}`);
if (missing.size > 0) fail(`${missing.size} behaviors named by uses are absent from the staged registry: ${[...missing].sort().join(', ')}`);
console.log(`ok: ${uses} almadar-std uses resolve in the staged registry`);

const home = mkdtempSync(join(tmpdir(), 'packaged-std-'));
try {
  const scope = join(home, '.orb/node_modules/@almadar');
  mkdirSync(join(scope, 'core'), { recursive: true });
  cpSync(stage, join(scope, 'std'), { recursive: true });
  const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', home], { cwd: core }).toString());
  execFileSync('tar', ['-xzf', join(home, packed.filename), '-C', join(scope, 'core'), '--strip-components', '1']);
  const env = { PATH: process.env.PATH, HOME: home, ORB_HANDED_OFF: '1' };
  const run = () => spawnSync(orb, ['list', '--global', '--json'], { env, cwd: home, encoding: 'utf8' });

  const listed = run();
  if (listed.status !== 0) fail(`orb list --global exited ${listed.status}: ${listed.stderr}`);
  const names = JSON.parse(listed.stdout).map((row) => row.package);
  for (const name of ['@almadar/core', '@almadar/std']) if (!names.includes(name)) fail(`orb list --global does not name ${name}: ${listed.stdout}`);
  console.log('ok: orb list --global answers from the packaged store');

  const spec = walk(join(scope, 'std/behaviors/registry'), '.orb').find((path) => basename(path, '.orb') === 'orb-packages');
  if (spec === undefined) fail('the packaged store has no orb-packages program');
  rmSync(spec);
  const control = run();
  if (control.status === 0) fail('control run with orb-packages removed from the registry succeeded; the check proves nothing');
  console.log('ok: control run with orb-packages removed failed as it must');
} finally {
  rmSync(home, { recursive: true, force: true });
}
