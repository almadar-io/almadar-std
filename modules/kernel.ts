/**
 * Kernel Module - the `kernel/` asks of the running kernel itself (EXEC-METAL-5): reorder the pending worklist, read the
 * worklist, frame and stamp, and apply a granted pure operator by name. Grant: `kernel: { "queue": [reorder], "introspect": [read],
 * "apply:<pattern>": [call], "guest": [spawn] }`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, OsGrantNeed, StdOperatorMeta } from '../types.js';
import { arg, osEffect } from './os-common.js';
import { BOOLEAN, INT, NUMBER, SEXPR, STRING, list, lit, nullable, rec, shape, tv } from '../signature.js';

type KernelParam = NonNullable<StdOperatorMeta['params']>[number];

function kernelEffect(def: { grant: OsGrantNeed[]; description: string; params: KernelParam[]; example: string }): StdOperatorMeta {
  return {
    ...osEffect({ answer: shape({}), grant: def.grant, description: def.description, params: def.params, example: def.example }),
    module: 'kernel',
    category: 'std-kernel',
    runsOn: 'any',
    host: 'kernel',
  };
}

function kernelPure(def: { description: string; params: KernelParam[]; returnType: OperatorTypeRef; returnSemantics?: StdOperatorMeta['returnSemantics']; grant: OsGrantNeed[]; example: string }): StdOperatorMeta {
  return {
    module: 'kernel',
    category: 'std-kernel-read',
    evaluation: 'strict',
    minArity: def.params.length,
    maxArity: def.params.length,
    description: def.description,
    hasSideEffects: false,
    host: 'kernel',
    grant: def.grant,
    returnType: def.returnType,
    ...(def.returnSemantics ? { returnSemantics: def.returnSemantics } : {}),
    params: def.params,
    example: def.example,
  };
}

const REORDER: OsGrantNeed[] = [{ kind: 'kernel', access: 'reorder' }];
const READ: OsGrantNeed[] = [{ kind: 'kernel', access: 'read' }];

export const KERNEL_OPERATORS: Record<string, StdOperatorMeta> = {
  'kernel/queue-front': kernelEffect({
    grant: REORDER,
    description: 'Move every pending worklist item whose event name equals the literal event to the front of the queue, keeping their relative order (grant kernel: { "queue": [reorder] }). The reorder applies where this step\'s own emits and listeners are queued, never mid-step (EXEC-METAL-5). event must be a string literal. Success payload: {}. Failure kind: invalid (event is not a string literal), denied (no grant).',
    params: [arg('event', STRING, 'The event name to move; a string literal')],
    example: '["kernel/queue-front", "URGENT", { "emit": { "failure": "KERNEL_FAILED" } }]',
  }),
  'kernel/queue-back': kernelEffect({
    grant: REORDER,
    description: 'Move every pending worklist item whose event name equals the literal event to the back of the queue, keeping their relative order (grant kernel: { "queue": [reorder] }). The reorder applies where this step\'s own emits and listeners are queued, never mid-step (EXEC-METAL-5). event must be a string literal. Success payload: {}. Failure kind: invalid (event is not a string literal), denied (no grant).',
    params: [arg('event', STRING, 'The event name to move; a string literal')],
    example: '["kernel/queue-back", "BACKGROUND", { "emit": { "failure": "KERNEL_FAILED" } }]',
  }),
  'kernel/worklist': kernelPure({
    description: 'Snapshot of the pending worklist as it stood at the start of this step: the event, trait and orbital of each item in queue order (grant kernel: { "introspect": [read] }).',
    params: [],
    returnType: list(shape({ event: STRING, trait: STRING, orbital: STRING })),
    grant: READ,
    example: '["kernel/worklist"] // => [{ event, trait, orbital }]',
  }),
  'kernel/frame': kernelPure({
    description: 'The frame of the running step: the trait, its current state, the event being handled and the entity id (grant kernel: { "introspect": [read] }).',
    params: [],
    returnType: shape({ trait: STRING, state: STRING, event: STRING, entityId: STRING }),
    grant: READ,
    example: '["kernel/frame"] // => { trait, state, event, entityId }',
  }),
  'kernel/stamp': kernelPure({
    description: 'The kernel\'s counters now: the clock in milliseconds (now), the dispatch number, the step number inside the dispatch and the journal length (grant kernel: { "introspect": [read] }).',
    params: [],
    returnType: shape({ now: INT, dispatch: INT, step: INT, journal: INT }),
    grant: READ,
    example: '["kernel/stamp"] // => { now, dispatch, step, journal }',
  }),
  'kernel/apply': kernelPure({
    description: 'Apply the pure operator named by name to the list args and answer its result (grant kernel: { "apply:<pattern>": [call] }, the pattern an exact operator name such as "str/concat" or a namespace prefix such as "math/*"). The name must be a static string (a computed name is refused at validate time). Refused: an unknown name, any operator with side effects or a host, kernel/apply itself and every kernel/* operator, and a name the grant does not cover. Arity and type errors are the operator\'s own.',
    params: [arg('name', STRING, 'The operator name; a static string covered by an apply grant'), arg('args', list(tv('T')), 'The operator\'s arguments')],
    returnType: tv('T'),
    returnSemantics: 'applied-operator<0,1>',
    grant: [{ kind: 'kernel', access: 'call', operator: 0 }],
    example: '["kernel/apply", "str/concat", ["a", "b"]] // => "ab"',
  }),
  'kernel/step': kernelPure({
    description: 'Fire one transition of an open guest (the handle program/open answered) and answer it as data (EXEC-METAL-7; grant kernel: { "guest": [step] }). The request names the trait, the state it fires from, the event, and optionally the payload, the entity row the step reads (entity), a keyed row (entityId) and the dispatch clock (now, ms; absent: the asking step\'s). Nothing cascades and the guest is left as it was: its trait is restored and its renders dropped after the step. The answer: fired, from, to, arm (null when none fired), entity (the row after the step), emits ({ event, payload } in order), effects (the step\'s other resolved effects: render-ui, navigate, navigate-back, log; its sets are in entity and its emits in emits), guards ({ arm, passed } of each arm tried), failure (the thrown effect failure, or null), refused and asks. A transition whose arms hold an ask (persist, fetch, call-service, any os/, program/ or other hosted operator; emit, set, render-ui, navigate, navigate-back, log and notify are not asks) runs nothing and answers refused "io" with the asks it would make. Refused with an error: no grant, a handle naming no open guest, a request missing trait, from or event, a trait the guest does not declare.',
    params: [
      arg('guest', STRING, 'The guest handle program/open answered'),
      arg('request', shape({ trait: STRING, from: STRING, event: STRING, payload: rec('P'), entity: rec('E'), entityId: STRING, now: NUMBER }, ['payload', 'entity', 'entityId', 'now']), 'The transition to fire: { trait, from, event, payload?, entity?, entityId?, now? }'),
    ],
    returnType: shape({
      fired: BOOLEAN,
      from: STRING,
      to: STRING,
      arm: nullable(INT),
      entity: rec('E'),
      emits: list(shape({ event: STRING, payload: SEXPR })),
      effects: list(SEXPR),
      guards: list(shape({ arm: INT, passed: BOOLEAN })),
      failure: nullable(STRING),
      refused: nullable(lit('io')),
      asks: list(STRING),
    }),
    grant: [{ kind: 'kernel', access: 'step' }],
    example: '["kernel/step", "@entity.guest", { "trait": "Src", "from": "idle", "event": "GO", "payload": { "v": 4 } }] // => { fired, from, to, arm, entity, emits, effects, guards, failure, refused, asks }',
  }),
};
