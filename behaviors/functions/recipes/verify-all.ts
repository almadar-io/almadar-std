/**
 * Verify every recipe in this folder. Imports each recipe's exported
 * `schema` and runs `~/bin/orbital validate` against it. Reports a
 * per-recipe pass/fail and exits non-zero if any recipe fails.
 *
 * Usage:
 *   cd packages/almadar-std
 *   npx tsx behaviors/functions/recipes/verify-all.ts
 */
import { verify } from './_lib/verify';
import { schema as r01 } from './01-single-atom/recipe';
import { schema as r02 } from './02-atom-with-config/recipe';
import { schema as r03 } from './03-atom-event-rename/recipe';
import { schema as r04 } from './04-two-atoms-shared-entity/recipe';
import { schema as r05 } from './05-cross-trait-listen/recipe';
import { schema as r06 } from './06-multi-orbital-app/recipe';
import { schema as r07 } from './07-typed-payload-listener/recipe';
import { schema as r08 } from './08-organism-slice/recipe';
import { schema as r09 } from './09-effect-override/recipe';
import { schema as r10 } from './10-whole-app/recipe';

const recipes = [
  ['01-single-atom', r01],
  ['02-atom-with-config', r02],
  ['03-atom-event-rename', r03],
  ['04-two-atoms-shared-entity', r04],
  ['05-cross-trait-listen', r05],
  ['06-multi-orbital-app', r06],
  ['07-typed-payload-listener', r07],
  ['08-organism-slice', r08],
  ['09-effect-override', r09],
  ['10-whole-app', r10],
] as const;

let passed = 0;
let failed = 0;
for (const [name, schema] of recipes) {
  const result = verify(name, schema);
  if (result.clean) passed++;
  else failed++;
}

console.log('\n========================================');
console.log(`Recipes: ${passed} passed, ${failed} failed of ${recipes.length}`);
console.log('========================================');
process.exit(failed === 0 ? 0 : 1);
