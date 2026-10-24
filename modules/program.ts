/**
 * Program Module — read, print and evaluate programs held as data.
 *
 * A program is a quoted S-expression (`quote` / `quasiquote`). `program/read`
 * parses `.lolo` text into one, `program/print` formats one back to `.lolo`, and
 * `program/validate` reports whether one passes the same 0-error / 0-warning gate as
 * `orb validate` without writing, `program/eval` validates one and writes it into the workspace, returning its traits as
 * values or the validator's errors as data.
 * `program/compose` assembles several
 * programs into one app (core `composeAppFromFiles`: pages, layout, wiring, nav).
 * A program is `.orb` IR; an orbital value at `orbitals[i]` stands for its import
 * orbital. Options are positional; the `{ emit: { success, failure } }` config is
 * always its own trailing argument. All of them run on the server. Design:
 * `docs/Almadar_Studio_Behavior.md`.
 *
 * @packageDocumentation
 */

import type { StdOperatorMeta } from '../types.js';
import { BOOLEAN, EMIT_ENVELOPE, EVENT_KEY, NUMBER, STRING, list, lit, mapOf, nullable, openShape, shape, union } from '../signature.js';

const EMIT_OPTIONS: NonNullable<StdOperatorMeta['params']>[number] = { name: 'options', type: EMIT_ENVELOPE, description: 'Emit configuration ({ emit: { success, failure } })', optional: true };

const VALIDATION_FINDING = openShape({ code: STRING, path: STRING, message: STRING });
const ValidationReport = shape({
  success: BOOLEAN,
  valid: BOOLEAN,
  errors: nullable(list(VALIDATION_FINDING)),
  warnings: nullable(list(VALIDATION_FINDING)),
  stats: nullable(openShape({ orbitals: NUMBER, entities: NUMBER, traits: NUMBER, pages: NUMBER })),
});

export const PROGRAM_OPERATORS: Record<string, StdOperatorMeta> = {
  'program/read': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 3,
    description: 'Parse `.lolo` source text into a quoted program. With inspect:true and an absolute path, return the resolved program, original-source anchors and imported source provenance; version identifies the editor document. With embeds:true, the text\'s inline behavior embeds `[{ orbital, trait, behavior, line, column }]` (what `orb embeds` prints). With resolve:true and the absolute path, the file resolved as `orb resolve` prints it, `{ program, text }`; with output, also written there with its catalogs and lazy behaviors (without it, a program with lazy behaviors or locales is refused).',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: 'sexpr',
    params: [{ name: 'text', type: 'string', description: '`.lolo` source' }, { name: 'inspection', type: openShape({ inspect: BOOLEAN, embeds: BOOLEAN, resolve: BOOLEAN, path: STRING, output: STRING, version: NUMBER }), description: 'Optional inspection (inspect, path, version), embed listing (embeds) or resolution (resolve, path, output) request', optional: true }, EMIT_OPTIONS],
    example: '["program/read", "@entity.draft", { "emit": { "success": "READ", "failure": "READ_FAILED" } }]',
  },
  'program/print': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 3,
    description: 'Format a quoted program as `.lolo` source text. With `source`, format that authored `.lolo` text instead (comments kept, the bytes `orb format` prints; `.orb` JSON prints with sorted keys) and the program is not read: `node` prints the one construct at a path (`orbitals[0].traits[2]`, `orbitals[0].entity.fields[1]`), `nodes` every construct a path with `[*]` matches, as a list.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: union(STRING, list(STRING)),
    params: [
      { name: 'program', type: { kind: 'sexpr' }, description: 'A quoted program (not read when `source` is given)' },
      { name: 'options', type: openShape({ source: STRING, node: STRING, nodes: STRING }), description: 'Authored `source` to format, at one `node` path or every `nodes` match', optional: true },
      EMIT_OPTIONS,
    ],
    example: '["program/print", null, { "source": "@entity.text", "node": "orbitals[0].traits[0]" }, { "emit": { "success": "PRINTED", "failure": "PRINT_FAILED" } }]',
  },
  'program/eval': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 3,
    description: 'Validate a program (`.orb` IR) at the 0-error / 0-warning bar and write it into the workspace (default `orbitals/<name>.orb`, or the project named by `into`). Success carries `{ behavior, traits, value }` — where the program was written, its traits as values, and the program itself as a behavior value; failure carries the validator errors as data. A `prior` program keeps ids stable across a re-evaluation.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: 'EvaluatedProgram',
    params: [
      { name: 'program', type: { kind: 'sexpr' }, description: 'A quoted program' },
      { name: 'options', type: EMIT_ENVELOPE, description: 'An optional target project (`into`) and prior program (`prior`)', optional: true },
      EMIT_OPTIONS,
    ],
    example: '["program/eval", "@entity.program", { "emit": { "success": "BUILT", "failure": "BUILD_FAILED" } }]',
  },
  'program/validate': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 3,
    description: 'Validate a program (`.orb` IR) at the same 0-error / 0-warning bar as `program/eval`, without writing anything. Success always carries `{ valid, errors, warnings }`: `valid` is true only when both lists are empty, each finding is `{ code, message, path?, line?, column? }`. A `prior` program keeps ids stable, and `final` checks it as a finished app.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: union(ValidationReport, shape({
      valid: BOOLEAN,
      errors: list(openShape({ code: STRING, message: STRING })),
      warnings: list(openShape({ code: STRING, message: STRING })),
    })),
    params: [
      { name: 'program', type: { kind: 'sexpr' }, description: 'A quoted program' },
      { name: 'options', type: openShape({ prior: { kind: 'sexpr' }, final: BOOLEAN, report: BOOLEAN, path: STRING, denyWarnings: BOOLEAN, patterns: STRING, services: STRING }), description: 'An optional prior program (`prior`) and `final` flag; or `{ report: true, path, final?, denyWarnings?, patterns?, services? }`: the report `orb validate --json` prints for the file at the absolute `path` (the program argument is not read)', optional: true },
      EMIT_OPTIONS,
    ],
    example: '["program/validate", "@entity.program", { "emit": { "success": "CHECKED", "failure": "CHECK_FAILED" } }]',
  },
  'program/step': {
    module: 'program', category: 'std-program',
    minArity: 2, maxArity: 3,
    description: 'Play transitions of a program in one run of the kernel, each from the state it names, and return each request played: the request with its `result` circuit step — whether it fired, the arm that fired, every guard tried, each effect of the fired arm (`routed` when its failure went to its declared `emit.failure`), the events it emitted, and each `@ensures` of the arm judged by the kernel (`held`, `broken` with its counterexample bindings, or `inconclusive` with the reason). It also carries `outcomes`: every trait the dispatch cascade moved, in dispatch order, each `{ orbital, trait, event, from, to, arm, fired, effects, emitted }` (`event` is the event that trait handled, `arm` the arm that fired or null, `effects` that arm\'s effects as the top-level `effects` report them; the first is the requested trait, equal to the top-level fields). A request may seed its trait\'s entity row (`entity`: fields merged over the row before the event), override its trait\'s knobs (`config`: values over the declared config defaults, for that trait and the whole call, since `@config` folds into the program; two requests giving one knob different values are refused), dispatch as a user (`viewer`: a user object, or null for nobody) and pin the clock (`now`: the ms-epoch `@now` its dispatch reads); without them the request plays as before. Each result also carries `entityAfter`: the requested trait\'s entity row after the request. A keyed os/* or http ask a step makes is left pending, reported among the effects and neither run nor failed, so no completion route fires; a later request plays its answer event (an unkeyed one fails, as with no host). With `options.live: true` the requests run on the native program host instead: their os/* and http asks are answered by this machine, and each request waits for its open calls to end; a request\'s `settleMs` cancels a call still open after that many milliseconds (live only), and without it the request waits with no cutoff. With `options.render`, each result also carries `rendered`: the slots its trait filled, walked by the kernel\'s render probe as typed node facts (pattern, renderer coverage, entity binding, `@trait` references).',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: list('PlayedStep'),
    params: [
      { name: 'program', type: { kind: 'sexpr' }, description: 'A quoted program' },
      { name: 'requests', type: { kind: 'array', of: { kind: 'object', fields: { orbital: 'string', trait: 'string', from: 'string', event: 'string' }, open: true } }, description: 'The transitions to play: `{ orbital, trait, from, event, payload, entity?, config?, viewer?, now?, settleMs? }` each' },
      {
        name: 'options',
        type: openShape({ key: STRING, render: BOOLEAN, live: BOOLEAN, report: lit('raw'), emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY }) }),
        description: 'Emit configuration ({ emit: { success, failure } }); `render: true` adds each result\'s `rendered` slot facts; `live: true` runs the requests on the native host; `report: "raw"` answers the kernel\'s cascade report unshaped, exactly what `orb execute --steps` prints, and each request needs only `trait` and `event` (it dispatches from the held state)',
        optional: true,
      },
    ],
    example: '["program/step", "@entity.program", [{ "orbital": "Editor", "trait": "Modes", "from": "NORMAL", "event": "KEY", "payload": { "key": "i" } }], { "emit": { "success": "STEPPED", "failure": "STEP_FAILED" } }]',
  },
  'program/inputs': {
    module: 'program', category: 'std-program',
    minArity: 0, maxArity: 2,
    description: 'Reflect the running program\'s declared external inputs, the events an outside client may send: `inputs` lists each with its orbital, trait, event, qualified `address`, description, declared `payloadSchema` and the JSON Schema of that payload (`parameters`), so a tool-calling model can be offered them as tools; `entities` lists the persisted entities `persist/read-named` accepts. An optional `{ select: [{ event, payload? }] }` also answers `selected`: the inputs those addresses (`EVENT`, `Trait.EVENT` or `Orbital.Trait.EVENT`, resolved from the calling trait) name, in order, each with the stated `payload` in place of its own; an address that is not a declared external input fails the call. Success carries `{ result: { inputs, entities, selected }, text }`. Nothing is filtered by caller: `program/dispatch` decides at dispatch. The same options can also ask for runtime reads, each answered only when asked: `{ state: orbital }` adds `state: { orbital, traits: [{ trait, entityId, state, entity }] }` (every running instance of that orbital\'s traits, with its entity; an orbital that is not registered fails the call), `{ stats: true }` adds `stats: { registeredSchemas, registeredTraits, activeInstances, cachedEntities }` (the kernel\'s counters), and `{ trace: n }` adds `trace`, the host\'s last `n` traced dispatch steps, oldest first (asked of the host, which keeps the trace; empty while tracing is off).',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: openShape({
      inputs: list(openShape({ orbital: STRING, trait: STRING, event: STRING, address: STRING, payloadSchema: list(openShape({ name: STRING, type: STRING })), parameters: openShape({ type: STRING }) })),
      entities: list(STRING),
      selected: list(openShape({ orbital: STRING, trait: STRING, event: STRING, address: STRING, payloadSchema: list(openShape({ name: STRING, type: STRING })), parameters: openShape({ type: STRING }) })),
      state: openShape({ orbital: STRING, traits: list(openShape({ trait: STRING, entityId: STRING, state: STRING })) }),
      stats: shape({ registeredSchemas: NUMBER, registeredTraits: NUMBER, activeInstances: NUMBER, cachedEntities: NUMBER }),
      trace: list(openShape({ seq: NUMBER, seed: STRING })),
    }),
    params: [
      { name: 'options', type: openShape({ select: list(openShape({ event: STRING })), state: STRING, stats: BOOLEAN, trace: NUMBER }), description: 'An optional selection (`select`) of inputs to reflect with a stated payload, and the runtime reads to add: `state` (an orbital), `stats`, `trace` (a step count)', optional: true },
      EMIT_OPTIONS,
    ],
    example: '["program/inputs", { "select": [{ "event": "Chat.ADD_NOTE" }] }, { "emit": { "success": "INPUTS_KNOWN", "failure": "INPUTS_FAILED" } }]',
  },
  'program/self': {
    module: 'program', category: 'std-program',
    minArity: 0, maxArity: 1,
    description: 'Reflect the running program: the resolved program (`.orb` IR) the calling orbital belongs to, read-only. Success carries `{ result, text }` with the program as `result`. For a std program composed into an app that must read the app it runs in (std-mock-seed seeds the app\'s own entities from it).',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: 'sexpr',
    params: [EMIT_OPTIONS],
    example: '["program/self", { "emit": { "success": "PROGRAM_KNOWN", "failure": "PROGRAM_FAILED" } }]',
  },
  'program/dispatch': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 4,
    description: 'Dispatch one declared external input AS THE CURRENT USER, through the ordinary dispatch: its guards, grants and entity policies apply, never a bypass. The address is `EVENT`, `Trait.EVENT` or `Orbital.Trait.EVENT` (resolved from the calling trait) and must name a declared external input; the arguments are the payload object or its JSON text (absent or empty is `{}`). An optional `{ schema: [field] }` holds the arguments to a stated payload before dispatch. Success carries `{ result, text }`, the outcome the model is answered with: `{ ok: true, emitted: [{ event, payload? }] }`, or `{ ok: false, error }` for a refusal (an undeclared input, arguments that are not a JSON object, `{ error, issues }` when they miss the schema) or a dispatch that did not take effect (a rejection code, a failed guard, a failed effect, no transition). Given one options object `{ inbound: name, body?, headers? }` in place of the address, it instead delivers `body` (text) and `headers` (`{ name: text }`) to the program\'s inbound handler `name` through the kernel\'s inbound route, credential check and answer path, as a request to `/api/hooks/<name>` is delivered, and success carries the handler\'s answer `{ status, body }` (an undeclared name is the kernel\'s 404 answer, not a failure). The delivery runs inside the asking dispatch, so an answer only a later completion would carry is not waited for: the answer is what the delivering dispatch settled. The options may instead describe an event request, as the HTTP dispatch routes carry it: `orbital` and `event` (required, and the address must be `orbital.targetTrait.event`), `targetTrait` (absent: the orbital\'s handlers are discovered, or `traits: [{ trait, from, event? }]` run as declared, an empty list being the inert `no-dispatchable-traits` rejection), `entityId` (default `default`), `mount: [{ trait, event }]` (a lifecycle batch), `input: true` (only a declared external input runs, otherwise the `not-an-external-input` rejection), `clientId` (the origin left out of the live broadcast), `locale`, `delivery` and `dispatchLog` (continuing a client-begun dispatch) and `viewer` (the dispatch\'s `@user`). Such a request is not limited to declared inputs; an empty text, record or mount list counts as absent. `wire: true` answers the whole `EventResponse` instead of the outcome, and `stream: true` (with `wire`) adds `items: [{ type: event|effect|complete, data, timestamp }]`, the dispatch\'s emitted events and client effects in execution order followed by the response. A failure carries `errors: [{ code, status }]`: `ORBITAL_NOT_FOUND` 404, `LOCALE_NOT_DECLARED` 400, `NO_TRAIT` 400, `INVALID_REQUEST` 400, `EVENT_PROCESSING_ERROR`.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: openShape({ ok: BOOLEAN, error: STRING, emitted: list(openShape({ event: STRING })) }),
    params: [
      { name: 'address', type: union(STRING, openShape({ inbound: STRING, body: nullable(STRING), headers: nullable(mapOf(STRING, STRING)) })), description: 'The input to dispatch: `EVENT`, `Trait.EVENT` or `Orbital.Trait.EVENT`; or an inbound delivery `{ inbound, body?, headers? }`' },
      { name: 'arguments', type: STRING, description: 'The payload as JSON text, as a model sends it (a payload object is accepted too); absent or empty is no payload', optional: true },
      { name: 'options', type: openShape({ schema: list(openShape({ name: STRING, type: STRING })), wire: BOOLEAN, stream: BOOLEAN, input: BOOLEAN, orbital: STRING, targetTrait: STRING, entityId: STRING, event: STRING, traits: nullable(list(openShape({ trait: STRING, from: STRING }))), mount: list(shape({ trait: STRING, event: STRING })), clientId: STRING, locale: STRING, delivery: openShape({ event: STRING }), dispatchLog: openShape({ prevEvents: list(openShape({ event: STRING })), prevStates: list(STRING) }), viewer: nullable(openShape({ id: STRING })) }), description: 'An optional stated payload (`schema`) the arguments are checked against before dispatch, and the event-request options (`wire`, `stream`, `input`, `orbital`, `targetTrait`, `entityId`, `event`, `traits`, `mount`, `clientId`, `locale`, `delivery`, `dispatchLog`, `viewer`)', optional: true },
      EMIT_OPTIONS,
    ],
    example: '["program/dispatch", "@payload.address", "@payload.arguments", { "emit": { "success": "DISPATCHED", "failure": "DISPATCH_FAILED" } }]',
  },
  'program/tick': {
    module: 'program', category: 'std-program',
    minArity: 0, maxArity: 1,
    description: 'Run one tick pass of the host now: every declared `[background]` tick that is due runs over its rows, as the host\'s own tick driver runs it (a tick that is not `[background]` runs only where a client mounts its trait, so a pass never fires one). The first pass of a host only captures its clock. Success carries `{ result: { ran: [{ trait, tick }] } }`, the ticks that ran, in order. For a server program answering a scheduler that wakes a host scaled to zero; who may ask is the program\'s own gate.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: shape({ ran: list(shape({ trait: STRING, tick: STRING })) }),
    params: [EMIT_OPTIONS],
    example: '["program/tick", { "key": "@payload.requestId", "emit": { "success": "TICK_RAN", "failure": "TICK_FAILED" } }]',
  },
  'program/resolve-rows': {
    module: 'program', category: 'std-program',
    minArity: 2, maxArity: 3,
    description: 'Resolve a row-set reference (`{ entityType, ids, total, query }`, the `ref` a rendered row set carries) against the store as it is now, FOR THE VIEWER NAMED: the entity\'s `@read` policy is applied for that viewer inside the one resolver every renderer reaches, so a row they may not read is omitted, as is a row deleted since the reference was made. The viewer is always stated (`null` is the anonymous viewer), never taken from the asking dispatch. Success carries `{ result: { rows, total } }`; a malformed reference fails.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: shape({ rows: list(openShape({ id: STRING })), total: NUMBER }),
    params: [
      { name: 'reference', type: openShape({ entityType: STRING, ids: list(STRING), total: NUMBER }), description: 'The row-set reference to resolve' },
      { name: 'viewer', type: openShape({ id: STRING }), description: 'The viewer the rows are resolved for (`null` is anonymous)' },
      EMIT_OPTIONS,
    ],
    example: '["program/resolve-rows", "@payload.ref", "@payload.viewer", { "key": "@payload.requestId", "emit": { "success": "ROWS_RESOLVED", "failure": "ROWS_UNRESOLVED" } }]',
  },
  'program/live': {
    module: 'program', category: 'std-program',
    minArity: 0, maxArity: 2,
    description: 'Subscribe to the host\'s live broadcast, the feed `orb serve`\'s `/api/events` stream carries (the success emits of `persist` and running calls\' messages, EXEC-QUEUE-13). Keyed with an `onMessage` route, each item a connection would receive arrives as that event `{ event, payload?, source, key }`, in order, until `cancel-call` names the key: a peer\'s row only when `viewer` may read it (an absent or `null` viewer receives every row, as a sign-in-free ticket does), never an item `clientId`\'s own request produced. Unkeyed, it is refused. For a server program pushing the feed to its clients; who may subscribe is the program\'s own gate.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: openShape({ event: STRING }),
    params: [
      { name: 'subscription', type: openShape({ viewer: nullable(openShape({ id: STRING })), clientId: STRING }), description: 'Whose feed it is: the `viewer` whose `@read` filters peers\' rows, and the `clientId` whose own items are left out', optional: true },
      { name: 'options', type: openShape({ key: STRING, emit: openShape({ onMessage: EVENT_KEY, failure: EVENT_KEY }) }), description: 'The stream key (required) and its routes: { key, emit: { onMessage, failure } }; cancel-call with the key ends the stream', optional: true },
    ],
    example: '["program/live", { "viewer": "@payload.viewer", "clientId": "@payload.clientId" }, { "key": "@payload.streamKey", "emit": { "onMessage": "LIVE_ITEM", "failure": "LIVE_FAILED" } }]',
  },
  'persist/read-named': {
    module: 'program', category: 'std-program',
    minArity: 1, maxArity: 2,
    description: 'Read the rows of a persisted entity chosen at run time, through its `@read` policy for the current user (only the rows they may read), oldest first. The name must be one of the program\'s persisted entities, otherwise the effect fails with a typed `unknown-entity` error in `errors`. Success carries `{ result: { entity, count, rows }, text }`.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: shape({ entity: STRING, count: NUMBER, rows: list(openShape({ id: STRING })) }),
    params: [
      { name: 'entity', type: STRING, description: 'The persisted entity to read, by name' },
      EMIT_OPTIONS,
    ],
    example: '["persist/read-named", "@payload.entity", { "emit": { "success": "ROWS_READ", "failure": "ROWS_REFUSED" } }]',
  },
  'program/compose': {
    module: 'program', category: 'std-program',
    minArity: 2, maxArity: 3,
    description: 'Assemble programs into one app program, in the order given: pages, layout, event wiring and the app nav (core `composeAppFromFiles`). Success carries the composed program; it is not validated or written — pass it to `program/eval`.',
    hasSideEffects: true,
    runsOn: 'server',
    host: 'program',
    returnType: 'sexpr',
    params: [
      { name: 'programs', type: { kind: 'array', of: { kind: 'sexpr' } }, description: 'The programs to assemble, in roster order' },
      { name: 'options', type: EMIT_ENVELOPE, description: 'The app name, an optional layout strategy and theme (empty = none)' },
      EMIT_OPTIONS,
    ],
    example: '["program/compose", "@entity.programs", { "appName": "Shop" }, { "emit": { "success": "COMPOSED", "failure": "COMPOSE_FAILED" } }]',
  },
};

export function getProgramOperators(): string[] {
  return Object.keys(PROGRAM_OPERATORS);
}
