#!/usr/bin/env node
// Publish-time materialization (docs/Almadar_Behavior_Packages.md §15): this
// package is read live from its .lolo sources in the workspace; the published
// tarball carries the lowered programs. Writes them into behaviors/registry and
// declares `orb.registry` in package.json. Needs an `orb` with `orb lower`
// (ORB_BIN, ~/bin/orb-dev, or the devDependency on PATH via `pnpm exec`).
// `--stage <dir>` materializes a copy of what the package publishes into <dir>
// and leaves this checkout untouched, so a workspace that reads it live keeps
// reading the .lolo; `orb release` publishes <dir>. `--link <package>=<dir>`
// installs a dependency the staged copy resolves (the same release's staged std)
// into its node_modules, which npm leaves out of the published tarball.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { materializeRegistry, readBehaviorPackage } from '@almadar/core/behavior-package';

const USAGE = 'usage: materialize-registry.mjs [--stage <dir> [--link <package>=<dir>]...]';

/** `--stage <dir>` and each `--link <package>=<dir>`: a dependency the staged copy resolves from <dir>. */
function parseFlags(argv) {
  let stage;
  const links = [];
  for (let i = 0; i < argv.length; i += 2) {
    const value = argv[i + 1];
    if (value === undefined) throw new Error(USAGE);
    if (argv[i] === '--stage') stage = resolve(value);
    else if (argv[i] === '--link' && value.includes('=')) {
      const at = value.indexOf('=');
      links.push({ name: value.slice(0, at), dir: resolve(value.slice(at + 1)) });
    } else throw new Error(USAGE);
  }
  if (links.length > 0 && stage === undefined) throw new Error(USAGE);
  return { stage, links };
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

const { stage, links } = parseFlags(process.argv.slice(2));
const root = stage ?? process.cwd();
if (stage) stagePackage(process.cwd(), stage);
for (const link of links) {
  const at = join(root, 'node_modules', ...link.name.split('/'));
  mkdirSync(dirname(at), { recursive: true });
  symlinkSync(link.dir, at, 'dir');
}
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
