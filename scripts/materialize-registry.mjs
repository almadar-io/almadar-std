#!/usr/bin/env node
// Publish-time materialization (docs/Almadar_Behavior_Packages.md §15): this
// package is read live from its .lolo sources in the workspace; the published
// tarball carries the lowered programs. Writes them into behaviors/registry and
// declares `orb.registry` in package.json. Needs an `orb` with `orb lower`
// (ORB_BIN, ~/bin/orb-dev, or the devDependency on PATH via `pnpm exec`).
// `--stage <dir>` materializes a copy of what the package publishes into <dir>
// and leaves this checkout untouched, so a workspace that reads it live keeps
// reading the .lolo; `orb release` publishes <dir>.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { materializeRegistry, readBehaviorPackage } from '@almadar/core/behavior-package';

function stageFlag(argv) {
  if (argv.length === 0) return undefined;
  if (argv.length !== 2 || argv[0] !== '--stage') throw new Error('usage: materialize-registry.mjs [--stage <dir>]');
  return resolve(argv[1]);
}

/** Unpacks what `npm pack` would publish from `source` into `dir`. */
function stagePackage(source, dir) {
  const packs = mkdtempSync(join(tmpdir(), 'materialize-'));
  try {
    const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', packs], { cwd: source }).toString());
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    execFileSync('tar', ['-xzf', join(packs, packed.filename), '-C', dir, '--strip-components', '1']);
  } finally {
    rmSync(packs, { recursive: true, force: true });
  }
}

const stage = stageFlag(process.argv.slice(2));
const root = stage ?? process.cwd();
if (stage) stagePackage(process.cwd(), stage);
const manifestPath = join(root, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
// `orb` resolves behavior packages node-style; a standalone checkout of this
// package does not contain itself, so its own imports (and, for std, the
// operator table) would not resolve. Install it into its own node_modules.
// A staged copy is not linked: orb resolves it from its own root, and a live
// package reached through node_modules does not resolve (G-CROSS gap ledger).
const self = join(root, 'node_modules', ...manifest.name.split('/'));
if (!stage && !existsSync(self)) {
  mkdirSync(dirname(self), { recursive: true });
  symlinkSync(root, self, 'dir');
}
const orb = materializeRegistry(readBehaviorPackage(root));
manifest.orb = orb;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[materialize] ${manifest.name}: programs lowered into ${join(root, orb.registry)}; orb.registry declared`);
