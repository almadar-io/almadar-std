#!/usr/bin/env node
// Publish-time materialization (docs/Almadar_Behavior_Packages.md §15): this
// package is read live from its .lolo sources in the workspace; the published
// tarball carries the lowered programs. Writes them into behaviors/registry and
// declares `orb.registry` in package.json. Needs an `orb` with `orb lower`
// (ORB_BIN, ~/bin/orb, or the devDependency on PATH via `pnpm exec`).
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { materializeRegistry, readBehaviorPackage } from '@almadar/core/behavior-package';

const root = process.cwd();
const manifestPath = join(root, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
// `orb` resolves behavior packages node-style; a standalone checkout of this
// package does not contain itself, so its own imports (and, for std, the
// operator table) would not resolve. Install it into its own node_modules.
const self = join(root, 'node_modules', ...manifest.name.split('/'));
if (!existsSync(self)) {
  mkdirSync(dirname(self), { recursive: true });
  symlinkSync(root, self, 'dir');
}
const orb = materializeRegistry(readBehaviorPackage(root));
manifest.orb = orb;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[materialize] ${manifest.name}: programs lowered into ${orb.registry}; orb.registry declared`);
