/**
 * Kernel Module - the `kernel/` asks of the running kernel itself (EXEC-METAL-5): reorder the pending worklist, read the
 * worklist, frame and stamp, and apply a granted pure operator by name. Grant: `kernel: { "queue": [reorder], "introspect": [read],
 * "apply:<pattern>": [call], "guest": [spawn] }`.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, OsGrantNeed, StdOperatorMeta } from '../types.js';
import { arg, osEffect } from './os-common.js';
import { BOOLEAN, INT, NUMBER, SEXPR, STRING, list, lit, nullable, shape, tv } from '../signature.js';

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
    description: 'Fire one transition of an open guest (the handle program/open answered) and answer it as data (EXEC-METAL-7; grant kernel: { "guest": [step] }). The request names the trait, the state it fires from, the event, and optionally the payload, the entity row the step reads (entity; absent: the trait\'s or keyed row\'s declared defaults and then its stored row, as a step of a trait nothing has touched reads it, never a frame the guest holds), a keyed row (entityId) and the dispatch clock (now, ms; absent: the asking step\'s). Nothing cascades and the guest is left as it was: its trait is restored and its renders dropped after the step. The answer: fired, from, to, arm (null when none fired), before (the row the step started from), entity (the row after the step), emits ({ event, payload, completion } in order; completion marks the reply or failure an effect\'s declared route fired, which a dispatch never collapses, EXEC-QUEUE-4), effects (the step\'s other resolved effects: render-ui, navigate, navigate-back, log; its sets are in entity and its emits in emits), guards ({ arm, passed } of each arm tried), failure (the thrown effect failure, or null), refused and asks. A guest with no host (opened with no host ports, as program/open opens one without grants) runs every step in place: its own rows answer its fetches and persists and any other ask fails there, exactly as a native dispatch into it does, and the routed success and failure emits are in emits. On a hosted guest the step is handed to the guest\'s host (GuestHost step), which runs that one step with its I/O answered as it answers a dispatch\'s, under the guest\'s own grants, and nothing it emits is delivered. The answer also carries rendered ({ slot, trait, orbital, embedded, content } for each render-ui the step painted) and navigations ({ trait, path }), as a guest dispatch answer reports them. A request with delivery: { at } is a delivery through the trait\'s listen at that position (EXEC-QUEUE-3, EXEC-STEP-1a): its per key is resolved against the raw payload first, then its when guard is checked from the requested state, then its with mapping makes the trigger\'s payload, and the listen\'s trigger fires on the keyed row (key). A keyed delivery that names no row (no entityId) runs nothing and answers keyRequired true with its key, for the caller to step that row (making it on first use and running its INIT first, as a native delivery does); one that names a different row than its key is refused. A guard that fails answers delivered false; a key that is not a non-empty string answers delivered false and keyRefused with the reason (a failing guard wins, as a native delivery does); nothing runs either way. A plain request answers delivered true and key null. A request with entry true is a dispatch\'s own event entering the kernel: its payload is checked against the event the trait declares first, and a misfit runs nothing and answers rejected with the refusal a native dispatch answers (EXEC-EVAL-10); a delivery is never an entry. A delivery with mount: { route, crumb? } is a route mount\'s $MOUNT through that listen: its payload is the announcement of that route { page, route, traits, entities, ancestors, label?, crumb? }, built by the guest as a native route mount builds it (EXEC-SEED-7), and a route that resolves to no page delivers nothing. A delivery may name its emitter (the trait whose emit it carries): a per key that is refused (and that the listen\'s when guard, judged from the listener\'s initial state, admits) is then answered to that emitter as a native delivery\'s is: deliveryRejected carries the DELIVERY_REJECTED payload for the emitter\'s declared listeners, or, when it declares none, the step answers rejected with the refusal a native dispatch answers. A step on a keyed row answers quiet: true when it left the row in its trait\'s initial state with its fields the declared defaults and nothing held or deferred for it (EXEC-STEP-1b), for the caller to drop the row once nothing more is queued for it; an unkeyed step answers no quiet. A request naming tick (and no event or delivery) runs that tick of the trait from the state given, its appliesTo, afterEntryMs and guard judged as a tick pass judges them, with no payload; a tick that does not apply answers fired false. A step whose emit breaks its emitter\'s declaration of that emit answers rejected likewise; rejected is null otherwise. A request naming leg (the handle program/dispatch { lolo: "begin" } answered for a hosted split guest\'s server leg) commits: the step runs in that leg\'s session, origin and locale, from the trait\'s current state when from is absent and on the guest\'s own frame, nothing is restored after it, and its outcome joins the leg for program/dispatch { lolo: "finish" } to answer as the host answers a leg it ran itself. Refused with an error: no grant, a handle naming no open guest, a request missing trait, from (without leg) or event, a trait the guest does not declare, a leg on a guest with no host, a leg that is not open.',
    params: [
      arg('guest', STRING, 'The guest handle program/open answered'),
      arg('request', shape({ trait: STRING, from: STRING, event: STRING, payload: SEXPR, entity: SEXPR, entityId: STRING, now: NUMBER, entry: BOOLEAN, delivery: shape({ at: NUMBER }), mount: shape({ route: STRING, crumb: STRING }, ['crumb']), emitter: STRING, tick: STRING, leg: STRING }, ['from', 'event', 'payload', 'entity', 'entityId', 'now', 'entry', 'delivery', 'mount', 'emitter', 'tick', 'leg']), 'The transition to fire: { trait, from, event, payload?, entity?, entityId?, now? }, or a delivery through one of the trait\'s listens: { trait, from, delivery: { at }, payload } with the raw source payload'),
    ],
    returnType: shape({
      fired: BOOLEAN,
      from: STRING,
      to: STRING,
      arm: nullable(INT),
      before: SEXPR,
      entity: SEXPR,
      emits: list(shape({ event: STRING, payload: SEXPR, completion: BOOLEAN })),
      effects: list(SEXPR),
      guards: list(shape({ arm: INT, passed: BOOLEAN })),
      failure: nullable(STRING),
      refused: nullable(lit('io')),
      asks: list(STRING),
      delivered: BOOLEAN,
      key: nullable(STRING),
      keyRefused: nullable(STRING),
      keyRequired: BOOLEAN,
      rejected: nullable(STRING),
      deliveryRejected: SEXPR,
      quiet: BOOLEAN,
      rendered: list(SEXPR),
      navigations: list(shape({ trait: STRING, path: STRING })),
    }),
    grant: [{ kind: 'kernel', access: 'step' }],
    example: '["kernel/step", "@entity.guest", { "trait": "Src", "from": "idle", "event": "GO", "payload": { "v": 4 } }] // => { fired, from, to, arm, entity, emits, effects, guards, failure, refused, asks }',
  }),
};
