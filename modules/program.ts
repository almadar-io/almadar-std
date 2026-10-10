/**
 * Program Module — read, print and evaluate programs held as data.
 *
 * A program is a quoted S-expression (`quote` / `quasiquote`). `program/read`
 * parses `.lolo` text into one, `program/print` formats one back to `.lolo`, and
 * `program/eval` validates one (the same 0-error / 0-warning gate as
 * `orb validate`) and writes it into the workspace, returning its traits as
 * values or the validator's errors as data. `program/compose` assembles several
 * programs into one app (core `composeAppFromFiles`: pages, layout, wiring, nav).
 * A program is `.orb` IR; an orbital value at `orbitals[i]` stands for its import
 * orbital. Options are positional; the `{ emit: { success, failure } }` config is
 * always its own trailing argument. All of them run on the server. Design:
 * `docs/Almadar_Studio_Behavior.md`.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';

const EMIT_OPTIONS: NonNullable<StdOperatorMeta['params']>[number] = { name: 'options', type: { kind: 'object', fields: {}, open: true }, description: 'Emit configuration ({ emit: { success, failure } })', optional: true };

export const PROGRAM_OPERATORS: Record<string, StdOperatorMeta> = {
  'program/read': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 2,
    description: 'Parse `.lolo` source text into a quoted program.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'sexpr',
    params: [{ name: 'text', type: 'string', description: '`.lolo` source' }, EMIT_OPTIONS],
    example: '["program/read", "@entity.draft", { "emit": { "success": "READ", "failure": "READ_FAILED" } }]',
  },
  'program/print': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 2,
    description: 'Format a quoted program as `.lolo` source text.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'string',
    params: [{ name: 'program', type: { kind: 'sexpr' }, description: 'A quoted program' }, EMIT_OPTIONS],
    example: '["program/print", "@entity.program", { "emit": { "success": "PRINTED", "failure": "PRINT_FAILED" } }]',
  },
  'program/eval': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 3,
    description: 'Validate a program (`.orb` IR) at the 0-error / 0-warning bar and write it into the workspace (default `orbitals/<name>.orb`, or the project named by `into`). Success carries `{ behavior, traits, value }` — where the program was written, its traits as values, and the program itself as a behavior value; failure carries the validator errors as data. A `prior` program keeps ids stable across a re-evaluation.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'EvaluatedProgram',
    params: [
      { name: 'program', type: { kind: 'sexpr' }, description: 'A quoted program' },
      { name: 'options', type: { kind: 'object', fields: { into: 'string', prior: { kind: 'sexpr' } } }, description: 'An optional target project (`into`) and prior program (`prior`)', optional: true },
      EMIT_OPTIONS,
    ],
    example: '["program/eval", "@entity.program", { "emit": { "success": "BUILT", "failure": "BUILD_FAILED" } }]',
  },
  'program/compose': {
    module: 'program', category: 'std-program',
    minArity: 2, maxArity: 3,
    description: 'Assemble programs into one app program, in the order given: pages, layout, event wiring and the app nav (core `composeAppFromFiles`). Success carries the composed program; it is not validated or written — pass it to `program/eval`.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'sexpr',
    params: [
      { name: 'programs', type: { kind: 'array', of: { kind: 'sexpr' } }, description: 'The programs to assemble, in roster order' },
      { name: 'options', type: { kind: 'object', fields: { appName: 'string', layout: 'string', theme: 'string' } }, description: 'The app name, an optional layout strategy and theme (empty = none)' },
      EMIT_OPTIONS,
    ],
    example: '["program/compose", "@entity.programs", { "appName": "Shop" }, { "emit": { "success": "COMPOSED", "failure": "COMPOSE_FAILED" } }]',
  },
};

export function getProgramOperators(): string[] {
  return Object.keys(PROGRAM_OPERATORS);
}
