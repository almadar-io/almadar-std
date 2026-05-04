/**
 * Shared recipe-verification helper. Each recipe imports `verify(name, schema)`
 * which writes the schema to `/tmp/recipe-<name>.orb` and runs
 * `~/bin/orbital validate`, reporting clean / errors / warnings.
 *
 * Pure-Node helper — no test framework, no extra deps. Recipes stay
 * self-runnable via `node --experimental-strip-types <recipe>.ts` or via
 * `npx tsx <recipe>.ts` for older Node versions.
 */
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { OrbitalSchema } from '@almadar/core/types';

export interface VerifyResult {
  clean: boolean;
  errors: string[];
  warnings: string[];
}

export function verify(name: string, schema: OrbitalSchema): VerifyResult {
  const outPath = `/tmp/recipe-${name}.orb`;
  writeFileSync(outPath, JSON.stringify(schema, null, 2));

  const orbitalBin = join(homedir(), 'bin', 'orbital');
  let stdout = '';
  try {
    stdout = execSync(`${orbitalBin} validate ${outPath} 2>&1`, {
      encoding: 'utf-8',
    });
  } catch (e) {
    // execSync throws on non-zero exit; capture stdout from the error.
    const err = e as { stdout?: Buffer | string };
    stdout = typeof err.stdout === 'string' ? err.stdout : err.stdout?.toString() ?? '';
  }

  const errors = stdout.split('\n').filter((l) => /^(❌|  ❌|Error:)/.test(l));
  const warnings = stdout.split('\n').filter((l) => /^(⚠️|  ⚠️)/.test(l));

  console.log(`\n=== recipe: ${name} ===`);
  console.log(`Wrote ${outPath}`);
  if (errors.length === 0 && warnings.length === 0) {
    console.log('Validation: ✅ CLEAN');
  } else {
    console.log(`Validation: errors=${errors.length} warnings=${warnings.length}`);
    for (const line of errors.slice(0, 5)) console.log('  ' + line.trim());
    for (const line of warnings.slice(0, 5)) console.log('  ' + line.trim());
  }
  return { clean: errors.length === 0 && warnings.length === 0, errors, warnings };
}
