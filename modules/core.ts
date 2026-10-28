/**
 * Core Module - Language Primitives
 *
 * The 28 unnamespaced S-expression operators that form the .orb language core:
 * arithmetic primitives, comparison, logic, control flow, and effects.
 *
 * These operators existed in the retired `@almadar/operators` package prior to
 * its merge into `@almadar/std`. They live here alongside the library modules
 * (math, str, array, etc.) so the whole operator surface has one home.
 *
 * Effect operators declare rich Schema v2 params and effect metadata so
 * validators, LLM prompt generators, and the Rust compiler can reason about
 * shapes (literal unions for persist actions, UISlot for render-ui, event keys
 * for emit) instead of relying on string heuristics.
 *
 * @packageDocumentation
 */

import type { OperatorTypeRef, StdOperatorMeta } from '../types.js';
import { BOOLEAN, each, SHAPE, STRING, SEXPR, bindingOf, fn, lit, list, mapOf, nullable, openShape, rec, sexprOf, shape, tv, union } from '../signature.js';

// ============================================================================
// Shared type refs
// ============================================================================

const NUMBER: OperatorTypeRef = 'number';
const ORDERED: OperatorTypeRef = tv('T', union(NUMBER, STRING));
const BINDING: OperatorTypeRef = { kind: 'binding' };
const ENTITY_REF: OperatorTypeRef = { kind: 'entityRef' };
const EVENT_KEY: OperatorTypeRef = { kind: 'eventKey' };
const UI_SLOT: OperatorTypeRef = { kind: 'uiSlot' };
const PATTERN_TYPE: OperatorTypeRef = { kind: 'patternType' };

const KEYED_CALL_ENVELOPE: OperatorTypeRef = openShape({
  key: STRING,
  emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY, cancelled: EVENT_KEY, onMessage: EVENT_KEY }),
});

const HOST_CALL_ENVELOPE: OperatorTypeRef = openShape({
  emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }),
});

const RESP_SCALAR: OperatorTypeRef = union(STRING, NUMBER, lit(null));

/** A redis reply: a scalar or a list nested up to three levels (`REDIS_REPLY_DEPTH` in the kernel). */
const REDIS_REPLY: OperatorTypeRef = union(RESP_SCALAR, list(union(RESP_SCALAR, list(union(RESP_SCALAR, list(RESP_SCALAR))))));

const REDIS_OPTIONS: OperatorTypeRef = openShape({
  auth: union(STRING, openShape({ credential: STRING, scope: union(lit('app'), lit('user')) })),
  user: STRING,
  db: NUMBER,
  key: STRING,
  emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }),
});

const PG_SCALAR: OperatorTypeRef = union(STRING, NUMBER, BOOLEAN, lit(null));

/** A postgres result value: a scalar or an array nested up to three levels (`POSTGRES_ARRAY_DEPTH` in the kernel). */
const PG_VALUE: OperatorTypeRef = union(PG_SCALAR, list(union(PG_SCALAR, list(union(PG_SCALAR, list(PG_SCALAR))))));

/** A bind value: a scalar, or a list of them (a Postgres array). */
const PG_BIND: OperatorTypeRef = union(PG_SCALAR, list(PG_SCALAR));

const PG_OPTIONS: OperatorTypeRef = openShape({
  auth: union(STRING, openShape({ credential: STRING, scope: union(lit('app'), lit('user')) })),
  user: STRING,
  database: STRING,
  tls: BOOLEAN,
  timeoutMs: NUMBER,
  key: STRING,
  emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }),
});

const OAUTH_PROVIDER: OperatorTypeRef = union(lit('google'), lit('github'), lit('auth0'));

const OAUTH_CLIENT: OperatorTypeRef = openShape({
  tag: OAUTH_PROVIDER,
  mode: union(lit('real'), lit('mock')),
  issuer: STRING,
  endpoints: openShape({ authorization: STRING, token: STRING, revocation: STRING, userinfo: STRING }),
  clientId: STRING,
  clientSecret: STRING,
  clientAuth: union(lit('basic'), lit('post'), lit('none')),
});

const OAUTH_CONNECTION: OperatorTypeRef = shape({
  provider: OAUTH_PROVIDER,
  connected: BOOLEAN,
  account: STRING,
  avatarUrl: STRING,
  scope: list(STRING),
  connectedAt: STRING,
});

const HTTP_METHOD: OperatorTypeRef = union(lit('GET'), lit('POST'), lit('PUT'), lit('PATCH'), lit('DELETE'));
const HTTP_CREDENTIAL_SLOT: OperatorTypeRef = union(STRING, openShape({ credential: STRING, scope: union(lit('app'), lit('user')) }));

const HTTP_RETRY: OperatorTypeRef = shape({
  max: NUMBER,
  on: list(union(lit('1xx'), lit('408'), lit('5xx'), lit('429'), lit('timeout'), lit('failed'), NUMBER)),
  backoffMs: NUMBER,
  scheduleMs: list(NUMBER),
  noResponseMax: NUMBER,
});

const HTTP_GRANT_REQUEST: OperatorTypeRef = shape({
  headers: mapOf(STRING, STRING),
  timeoutMs: nullable(NUMBER),
  retry: HTTP_RETRY,
});

const HTTP_AUTH: OperatorTypeRef = openShape({
  scheme: union(lit('bearer'), lit('api-key'), lit('basic'), lit('oauth2-client'), lit('hmac-sha256'), lit('token-exchange'), lit('jwt-bearer'), lit('aws-sigv4'), lit('vapid'), lit('oauth-client')),
  credential: HTTP_CREDENTIAL_SLOT,
  name: STRING,
  in: union(lit('header'), lit('query')),
  user: HTTP_CREDENTIAL_SLOT,
  tokenUrl: STRING,
  grantRequest: HTTP_GRANT_REQUEST,
  clientId: HTTP_CREDENTIAL_SLOT,
  clientSecret: HTTP_CREDENTIAL_SLOT,
  scope: STRING,
  signs: STRING,
  prefix: STRING,
  encoding: union(lit('hex'), lit('base64')),
  grant: STRING,
  body: openShape({ json: rec('A'), form: rec('A') }),
  clientAuth: union(lit('basic'), lit('post')),
  op: union(lit('discovery'), lit('code'), lit('connect'), lit('refresh'), lit('revoke'), lit('userinfo')),
  client: OAUTH_CLIENT,
  code: STRING,
  state: STRING,
  provider: OAUTH_PROVIDER,
  refreshToken: STRING,
  token: STRING,
  accessToken: STRING,
  accessField: STRING,
  expiresField: STRING,
  expiresMarginMs: NUMBER,
  storeAs: openShape({ name: STRING, scope: union(lit('app'), lit('user')) }),
  key: HTTP_CREDENTIAL_SLOT,
  alg: union(lit('RS256'), lit('ES256')),
  claims: rec('A'),
  accessKeyId: HTTP_CREDENTIAL_SLOT,
  secretAccessKey: HTTP_CREDENTIAL_SLOT,
  sessionToken: HTTP_CREDENTIAL_SLOT,
  region: STRING,
  service: STRING,
  privateKey: HTTP_CREDENTIAL_SLOT,
  publicKey: STRING,
  subject: STRING,
});

const HTTP_PAGINATE: OperatorTypeRef = openShape({
  style: union(lit('cursor'), lit('offset'), lit('page'), lit('link-header')),
  param: STRING,
  next: SEXPR,
  collect: SEXPR,
  max: NUMBER,
});

const HTTP_REQUEST: OperatorTypeRef = openShape({
  query: rec('P'),
  headers: mapOf(STRING, STRING),
  json: tv('J'),
  form: rec('S'),
  text: STRING,
  bytes: STRING,
  multipart: openShape({ kind: union(lit('related'), lit('form-data')), parts: list(openShape({ headers: mapOf(STRING, STRING), text: STRING, bytes: STRING })) }),
  webpush: openShape({ subscription: openShape({ endpoint: STRING, keys: openShape({ p256dh: STRING, auth: STRING }) }), payload: STRING, ttl: NUMBER, urgency: union(lit('very-low'), lit('low'), lit('normal'), lit('high')) }),
  retry: HTTP_RETRY,
  presign: openShape({ expiresSec: NUMBER }),
  formEncoding: union(lit('html'), lit('rfc3986')),
  auth: HTTP_AUTH,
  timeoutMs: nullable(NUMBER),
  delayMs: nullable(NUMBER),
  responseAs: union(lit('text'), lit('bytes')),
  paginate: HTTP_PAGINATE,
  stream: union(lit('sse'), lit('json-lines')),
});

const PERSIST_ACTION: OperatorTypeRef = {
  kind: 'union',
  of: [
    { kind: 'literal', value: 'create' },
    { kind: 'literal', value: 'upsert' },
    { kind: 'literal', value: 'update' },
    { kind: 'literal', value: 'delete' },
    { kind: 'literal', value: 'clear' },
    { kind: 'literal', value: 'batch' },
  ],
};

const SET_OPERATION: OperatorTypeRef = {
  kind: 'union',
  of: [
    { kind: 'literal', value: 'increment' },
    { kind: 'literal', value: 'decrement' },
    { kind: 'literal', value: 'multiply' },
    { kind: 'literal', value: 'append' },
    { kind: 'literal', value: 'remove' },
  ],
};

const NOTIFY_CHANNEL: OperatorTypeRef = {
  kind: 'union',
  of: [
    { kind: 'literal', value: 'email' },
    { kind: 'literal', value: 'push' },
    { kind: 'literal', value: 'sms' },
    { kind: 'literal', value: 'in-app' },
  ],
};

// ============================================================================
// Core operators
// ============================================================================

export const CORE_OPERATORS: Record<string, StdOperatorMeta> = {
  // --- arithmetic primitives --------------------------------------------------

  '+': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: null,
    description: 'Add numbers',
    hasSideEffects: false,
    sign: 'sum',
    returnType: 'number',
    returnSemantics: 'integer-closed',
    params: [{ name: '...nums', type: NUMBER, description: 'Numbers to sum' }],
    example: '["+", 1, 2, 3] // => 6',
  },
  '-': {
    module: 'core',
    category: 'arithmetic',
    minArity: 1,
    maxArity: 2,
    description: 'Subtract or negate',
    hasSideEffects: false,
    returnType: 'number',
    returnSemantics: 'integer-closed',
    params: [
      { name: 'a', type: NUMBER, description: 'Left operand or value to negate' },
      { name: 'b', type: NUMBER, description: 'Right operand', optional: true },
    ],
    example: '["-", 5, 2] // => 3; ["-", 5] // => -5',
  },
  '*': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: null,
    description: 'Multiply numbers',
    hasSideEffects: false,
    sign: 'product',
    returnType: 'number',
    returnSemantics: 'integer-closed',
    params: [{ name: '...nums', type: NUMBER, description: 'Numbers to multiply' }],
    example: '["*", 2, 3, 4] // => 24',
  },
  '/': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: 2,
    description: 'Divide numbers',
    hasSideEffects: false,
    failable: { unlessNonZero: [1] },
    returnType: nullable('number'),
    params: [
      { name: 'a', type: NUMBER, description: 'Numerator' },
      { name: 'b', type: NUMBER, description: 'Denominator' },
    ],
    example: '["/", 10, 2] // => 5',
  },
  '%': {
    module: 'core',
    category: 'arithmetic',
    minArity: 2,
    maxArity: 2,
    description: 'Modulo (remainder)',
    hasSideEffects: false,
    failable: { unlessNonZero: [1] },
    returnType: nullable('number'),
    returnSemantics: 'integer-closed',
    params: [
      { name: 'a', type: NUMBER, description: 'Dividend' },
      { name: 'b', type: NUMBER, description: 'Divisor' },
    ],
    example: '["%", 10, 3] // => 1',
  },

  // --- comparison -------------------------------------------------------------

  '=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Equal to',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: tv('T'), description: 'Left operand' },
      { name: 'b', type: tv('T'), description: 'Right operand' },
    ],
    example: '["=", "active", "active"]',
  },
  '==': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Equal to (canonical .lolo spelling)',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: tv('T'), description: 'Left operand' },
      { name: 'b', type: tv('T'), description: 'Right operand' },
    ],
    example: '["==", "active", "active"]',
  },
  '!=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Not equal to',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: tv('T'), description: 'Left operand' },
      { name: 'b', type: tv('T'), description: 'Right operand' },
    ],
    example: '["!=", 1, null]',
  },
  '<': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Less than',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: ORDERED, description: 'Left operand' },
      { name: 'b', type: ORDERED, description: 'Right operand' },
    ],
    example: '["<", 5, 10]',
  },
  '>': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Greater than',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: ORDERED, description: 'Left operand' },
      { name: 'b', type: ORDERED, description: 'Right operand' },
    ],
    example: '[">", 10, 0]',
  },
  '<=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Less than or equal',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: ORDERED, description: 'Left operand' },
      { name: 'b', type: ORDERED, description: 'Right operand' },
    ],
    example: '["<=", 100, 100]',
  },
  '>=': {
    module: 'core',
    category: 'comparison',
    minArity: 2,
    maxArity: 2,
    description: 'Greater than or equal',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [
      { name: 'a', type: ORDERED, description: 'Left operand' },
      { name: 'b', type: ORDERED, description: 'Right operand' },
    ],
    example: '[">=", 18, 18]',
  },

  // --- logic ------------------------------------------------------------------

  and: {
    visual: { form: 'series' },
    module: 'core',
    category: 'logic',
    minArity: 2,
    maxArity: null,
    description: 'Logical AND of booleans; short-circuits on the first false',
    hasSideEffects: false,
    returnType: BOOLEAN,
    params: [{ name: '...operands', type: BOOLEAN, description: 'Boolean operands' }],
    example: '["and", ["=", "active", "active"], [">", 5, 0]]',
  },
  or: {
    visual: { form: 'parallel' },
    module: 'core',
    category: 'logic',
    minArity: 2,
    maxArity: null,
    description: 'Logical OR of booleans; short-circuits on the first true',
    hasSideEffects: false,
    returnType: BOOLEAN,
    params: [{ name: '...operands', type: BOOLEAN, description: 'Boolean operands' }],
    example: '["or", ["=", "admin", "user"], ["=", "admin", "owner"]]',
  },
  default: {
    module: 'core',
    category: 'logic',
    minArity: 2,
    maxArity: 2,
    description: 'The value, or the fallback (evaluated only then) when the value is null',
    hasSideEffects: false,
    returnType: tv('T'),
    returnSemantics: 'coalesce',
    params: [
      { name: 'value', type: tv('T'), description: 'The value, possibly null' },
      { name: 'fallback', type: tv('T'), description: 'The value when the first is null' },
    ],
    example: '["default", null, "N/A"] // => "N/A"',
  },
  not: {
    visual: { form: 'invert' },
    module: 'core',
    category: 'logic',
    minArity: 1,
    maxArity: 1,
    description: 'Logical NOT',
    hasSideEffects: false,
    returnType: 'boolean',
    params: [{ name: 'operand', type: BOOLEAN, description: 'The boolean to negate' }],
    example: '["not", false]',
  },
  if: {
    visual: { form: 'branch' },
    module: 'core',
    category: 'logic',
    minArity: 3,
    maxArity: 3,
    description: 'Conditional expression (ternary). Both branches have the same type, which is the result type.',
    hasSideEffects: false,
    returnType: tv('T'),
    returnSemantics: 'branch-union',
    params: [
      { name: 'cond', type: BOOLEAN, description: 'Condition' },
      { name: 'then', type: tv('T'), description: 'Value or effect if true' },
      { name: 'else', type: tv('T'), description: 'Value or effect if false' },
    ],
    example: '["if", [">", 5, 0], "alive", "dead"]',
  },

  as: {
    module: 'core',
    category: 'logic',
    minArity: 2,
    maxArity: 2,
    description:
      'Explicit cast: the value, converted to the named type. To a nominal type it is legal only where the type relation allows the conversion with a cast (a string to CallKey); plain assignment never makes it. A CallKey is a string at rest, so the value is unchanged; an empty string is invalid. To a declared type it is a checked narrowing: the value when it is of that type, null when it is not (a union, a list of SExpr or an operator result read as the record it holds).',
    hasSideEffects: false,
    failable: { unlessNominal: [1] },
    returnType: nullable(SHAPE),
    params: [
      { name: 'value', type: tv('T'), description: 'The value to convert' },
      { name: 'type', type: SHAPE, description: 'The name of the type to convert to' },
    ],
    example: '["as", "search", "CallKey"] // => "search"',
  },

  typed: {
    module: 'core',
    category: 'logic',
    minArity: 2,
    maxArity: 2,
    description:
      'Resolved IR only, never written in .lolo: the value, checked to be of the type the program declared for it. `orb resolve` writes it at an operator argument whose declared type is a list of a union or of SExpr, so the kernel binds the operator\'s type variable to that declared type instead of reading one from the items. An item outside the declared type is a type mismatch.',
    hasSideEffects: false,
    returnType: tv('T'),
    returnSemantics: 'identity-of-arg<0>',
    params: [
      { name: 'value', type: tv('T'), description: 'The argument value' },
      { name: 'type', type: 'string', description: 'The declared type, as the JSON of an IR type' },
    ],
    example: '["typed", "@entity.via", "{\\"kind\\":\\"array\\",\\"inner\\":{\\"kind\\":\\"sexpr\\"}}"]',
  },

  // --- control ----------------------------------------------------------------

  let: {
    visual: { form: 'scope' },
    module: 'core',
    category: 'control',
    minArity: 2,
    maxArity: 2,
    description: 'Bind local variables for a body expression',
    hasSideEffects: false,
    returnType: tv('T'),
    returnSemantics: 'identity-of-arg<1>',
    params: [
      {
        name: 'bindings',
        type: SEXPR,
        description: 'Array of [name, value] pairs',
      },
      { name: 'body', type: sexprOf(tv('T')), description: 'Expression or effect list using the bindings' },
    ],
    example: '["let", [["x", 10]], ["+", "x", 1]]',
  },
  do: {
    visual: { form: 'ladder' },
    module: 'core',
    category: 'control',
    minArity: 1,
    maxArity: null,
    description: 'Sequential execution of multiple effects/expressions',
    hasSideEffects: false,
    returnType: tv('T'),
    returnSemantics: 'last-of-args',
    params: [{ name: '...exprs', type: sexprOf({kind:'var',name:'T',each:true}), description: 'Effects/expressions to run in order' }],
    example: '["do", ["set", "@entity.x", 0], ["set", "@entity.y", 0]]',
  },
  list: {
    module: 'core',
    category: 'control',
    minArity: 0,
    maxArity: null,
    description: 'Literal array constructor — evaluates each argument and returns them as an array. Lowering wraps a literal list bound for a literal-array slot in `list` so it is unambiguously data, never a call (disambiguates a list whose first element collides with an operator name, e.g. [path method …]).',
    hasSideEffects: false,
    returnType: list(each('T')),
    params: [{ name: '...items', type: each('T'), description: 'Items to collect into a literal array' }],
    example: '["list", "path", "method", "status"] // => ["path", "method", "status"]',
  },
  when: {
    visual: { form: 'branch' },
    module: 'core',
    category: 'control',
    minArity: 2,
    maxArity: 2,
    description: 'Conditional effect without an else branch',
    hasSideEffects: false,
    returnType: 'void',
    params: [
      { name: 'cond', type: BOOLEAN, description: 'Guard expression' },
      { name: 'effect', type: SEXPR, description: 'Effect to run if cond is true' },
    ],
    example: '["when", [">", "@entity.health", 0], ["emit", "ALIVE"]]',
  },
  fn: {
    visual: { form: 'template' },
    module: 'core',
    category: 'control',
    minArity: 2,
    maxArity: 2,
    description: 'Lambda expression (used for per-item renders and transforms)',
    hasSideEffects: false,
    returnType: fn([tv('T')], tv('U')),
    acceptsLambda: true,
    lambdaArgPosition: 1,
    params: [
      { name: 'paramName', type: bindingOf(tv('T')), description: 'Name of the parameter binding' },
      { name: 'body', type: sexprOf(tv('U')), description: 'Expression evaluated per invocation' },
    ],
    example: '["fn", "item", { "type": "typography", "content": "@item.title" }]',
  },

  quote: {
    visual: { form: 'template' },
    module: 'core',
    category: 'control',
    minArity: 1,
    maxArity: 1,
    description: 'Holds an S-expression as data: nothing inside it is evaluated, and its bindings are not resolved (a guard or effect handed to a diagram)',
    hasSideEffects: false,
    returnType: 'sexpr',
    params: [
      { name: 'body', type: STRING, description: 'The quoted expression as canonical JSON text with every @ written as \\u0040 (the .lolo parser encodes `(quote x)`)' },
    ],
    example: '["quote", "[\\">\\",\\"\\\\\\\\u0040payload.amount\\",0]"]',
  },

  quasiquote: {
    visual: { form: 'template' },
    module: 'core',
    category: 'control',
    minArity: 1,
    maxArity: null,
    description: 'A quoted template with live holes: the template is held as data like `quote`, and each `(unquote e)` inside it is replaced by the value of `e` (a program built from values the trait holds, for `program/eval`)',
    hasSideEffects: false,
    returnType: 'sexpr',
    params: [
      { name: 'body', type: STRING, description: 'The template as canonical JSON text with every @ written as \\u0040 and each hole i written as ["unquote", i] (the .lolo parser encodes `(quasiquote x)`)' },
      { name: 'holes', type: SEXPR, description: 'The unquoted expressions, in canonical order; hole i fills marker i' },
    ],
    example: '["quasiquote", "[\\"set\\",\\"\\\\\\\\u0040entity.a\\",[\\"unquote\\",0]]", "@payload.v"]',
  },

  unquote: {
    module: 'core',
    category: 'control',
    minArity: 1,
    maxArity: 1,
    description: 'A live hole inside `(quasiquote …)`: its expression is evaluated and spliced into the template. Legal only inside a quasiquote',
    hasSideEffects: false,
    returnType: tv('T'),
    params: [
      { name: 'expr', type: sexprOf(tv('T')), description: 'The expression whose value fills the hole' },
    ],
    example: '["quasiquote", "[\\"unquote\\",0]", "@entity.widget"]',
  },

  // --- effect -----------------------------------------------------------------

  set: {
    module: 'core',
    // emit key order: effect/set.rs:101
    emitKeys: ['success'],
    category: 'effect',
    minArity: 2,
    maxArity: 2,
    description: 'Set a binding to a value',
    hasSideEffects: true,
    runsOn: 'any',
    returnType: 'void',
    params: [
      { name: 'binding', type: bindingOf(tv('T')), description: 'Target binding (e.g. "@entity.field")' },
      { name: 'value', type: tv('T'), description: 'Value to assign (literal or expression)' },
    ],
    example: '["set", "@entity.health", 100]',
    effect: {
      kind: 'set',
      // success emit carries the written value, of the binding's type.
      produces: tv('T'),
      config: { operation: SET_OPERATION },
    },
  },
  emit: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Emit an event onto the bus',
    hasSideEffects: true,
    runsOn: 'any',
    returnType: 'void',
    params: [
      { name: 'event', type: EVENT_KEY, description: 'Event key' },
      { name: 'payload', type: ENTITY_REF, description: 'Optional payload', optional: true },
    ],
    example: '["emit", "PLAYER_DIED", { "playerId": "p1" }]',
    busExcluded: ['INIT', 'LOAD', '$MOUNT'],
    effect: {
      kind: 'emit',
      produces: {
        kind: 'object',
        fields: { event: EVENT_KEY, payload: ENTITY_REF },
        open: true,
      },
    },
  },
  persist: {
    module: 'core',
    // emit key order: effect/persist.rs:214, :492
    emitKeys: ['success', 'failure'],
    category: 'effect',
    minArity: 2,
    maxArity: 4,
    description: 'Create, upsert, update, delete, clear, or batch entity records. Optional trailing { emit: { success, failure } } options object attaches closed-circuit emit routing.',
    hasSideEffects: true,
    runsOn: 'server',
    entityArgPosition: 1,
    returnType: 'void',
    params: [
      { name: 'action', type: PERSIST_ACTION, description: 'Persist action' },
      { name: 'entity', type: { kind: 'entity' }, description: 'Target entity name' },
      { name: 'data', type: ENTITY_REF, description: 'Payload (create/upsert/update) or entity id (delete)', optional: true },
      {
        name: 'options',
        type: {
          kind: 'object',
          fields: {
            emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }),
          },
          open: true,
        },
        description: 'Optional trailing options object carrying { emit: { success, failure } } closed-circuit routing',
        optional: true,
      },
    ],
    example: '["persist", "create", "Task", { "title": "Buy milk" }, { "emit": { "success": "TASK_CREATED" } }]',
    effect: {
      kind: 'persist',
      // Action-discriminated union. The compiler narrows at the call site
      // based on the action arg literal to pick the right branch when
      // checking the emit.success event's declared payload.
      //   create/upsert/update -> the resulting entity record
      //   delete/clear  -> { id, deleted }
      //   batch         -> summary of operations
      produces: {
        kind: 'union',
        of: [
          { kind: 'entity' },
          {
            kind: 'object',
            fields: { id: STRING, deleted: BOOLEAN },
            open: false,
          },
          {
            kind: 'object',
            fields: {
              operations: list(openShape({ action: STRING, entity: STRING })),
              completedCount: NUMBER,
              totalCount: NUMBER,
            },
            open: false,
          },
        ],
      },
    },
  },
  navigate: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 3,
    description:
      'Navigate to a route: (navigate path payload? options?) — options carries { crumb } labelling the navigation-stack entry for the target page',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: 'void',
    params: [
      { name: 'path', type: STRING, description: 'Route path (supports :param placeholders)' },
      {
        name: 'params',
        type: rec('P'),
        description: 'Optional route params',
        optional: true,
      },
      {
        name: 'options',
        type: openShape({ crumb: STRING }),
        description: 'Optional navigation options: { crumb } labels the navigation-stack entry for the target page',
        optional: true,
      },
    ],
    example: '["navigate", "/tasks/:id", { "id": "t1" }]',
    effect: { kind: 'navigate' },
  },
  'navigate-back': {
    module: 'core',
    category: 'effect',
    minArity: 0,
    maxArity: 0,
    description: 'Pop the orbital-scoped navigation stack and return to the previous entry',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: 'void',
    effect: { kind: 'navigate-back' },
  },
  notify: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Show a notification (in-app, email, push, sms)',
    hasSideEffects: true,
    runsOn: 'any',
    returnType: 'void',
    params: [
      { name: 'channel', type: NOTIFY_CHANNEL, description: 'Delivery channel' },
      { name: 'message', type: STRING, description: 'Message body', optional: true },
    ],
    example: '["notify", "in-app", "Task created successfully"]',
    effect: { kind: 'notify' },
  },
  log: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Emit a structured log line at a level, info by default (compiled + runtime); `orb -v` shows info, `-vv` debug',
    hasSideEffects: true,
    runsOn: 'any',
    returnType: 'void',
    params: [
      { name: 'message', type: STRING, description: 'Log message' },
      { name: 'level', type: union(lit('debug'), lit('info'), lit('warn'), lit('error')), description: 'Level: "debug", "info" (default), "warn" or "error"', optional: true, defaultValue: 'info' },
    ],
    example: '["log", "Context below compact threshold", "debug"]',
    effect: { kind: 'log' },
  },
  spawn: {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Spawn a new entity instance (games)',
    hasSideEffects: true,
    runsOn: 'any',
    returnType: 'void',
    params: [
      { name: 'entity', type: { kind: 'entity' }, description: 'Entity name to spawn' },
      {
        name: 'initialState',
        type: rec('S'),
        description: 'Initial field values',
        optional: true,
      },
    ],
    example: '["spawn", "Bullet", { "x": 10, "y": 20 }]',
    effect: { kind: 'spawn' },
  },
  despawn: {
    module: 'core',
    category: 'effect',
    minArity: 0,
    maxArity: 1,
    description: 'Despawn an entity instance (games)',
    hasSideEffects: true,
    runsOn: 'any',
    returnType: 'void',
    params: [
      { name: 'entityId', type: STRING, description: 'Target entity id (defaults to @entity.id)', optional: true },
    ],
    example: '["despawn", "@entity.id"]',
    effect: { kind: 'despawn' },
  },
  fetch: {
    module: 'core',
    // emit key order: effect/fetch.rs:94
    emitKeys: ['success', 'failure'],
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Fetch an entity (by id) or a collection (by filter) from persistence',
    hasSideEffects: true,
    runsOn: 'server',
    entityArgPosition: 0,
    returnType: 'void',
    params: [
      { name: 'entity', type: { kind: 'entity' }, description: 'Target entity name' },
      {
        name: 'options',
        type: {
          kind: 'object',
          fields: {
            id: STRING,
            filter: SEXPR,
            limit: NUMBER,
            offset: NUMBER,
            include: { kind: 'array', of: STRING },
            emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }),
          },
          open: true,
        },
        description: 'Fetch options: id | filter | limit | offset | include | emit',
        optional: true,
      },
    ],
    example: '["fetch", "Task", { "id": "t1", "emit": { "success": "TASK_LOADED" } }]',
    effect: {
      kind: 'fetch',
      produces: {
        kind: 'object',
        fields: {
          data: {
            kind: 'union',
            of: [
              { kind: 'entity' },
              { kind: 'array', of: { kind: 'entity' } },
            ],
          },
          totalCount: 'number',
        },
        open: false,
      },
    },
  },
  'fetch-stream': {
    module: 'core',
    // emit key order: effect/fetch.rs:451
    emitKeys: ['onMessage', 'success', 'failure'],
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Stream an LLM or HTTP response, emitting on_message per chunk, success on completion, failure on error',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'entity', type: { kind: 'entity' }, description: 'Target entity name' },
      {
        name: 'options',
        type: {
          kind: 'object',
          fields: {
            id: STRING,
            filter: SEXPR,
            emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }),
          },
          open: true,
        },
        description: 'Stream options: id | filter | emit',
        optional: true,
      },
    ],
    example: '["fetch-stream", "Message", { "emit": { "on_message": "CHUNK_RECEIVED", "success": "STREAM_DONE", "failure": "STREAM_FAILED" } }]',
    effect: {
      kind: 'fetch-stream',
      produces: { kind: 'entity' },
    },
  },
  'send-server': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description: 'Send an orbital event to the server over WebSocket (client-side; chat/real-time trigger)',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: 'void',
    params: [
      { name: 'event', type: EVENT_KEY, description: 'Target orbital event name on the server' },
      {
        name: 'payload',
        type: rec('P'),
        description: 'Event payload to forward to the server',
        optional: true,
      },
    ],
    example: '["send-server", "CHAT_MESSAGE", { "text": "hello" }]',
    effect: { kind: 'send-server' },
  },
  'call-service': {
    module: 'core',
    // emit key order: effect/keyed_call.rs:15, call_service.rs:325
    emitKeys: ['success', 'failure', 'onMessage', 'cancelled'],
    category: 'effect',
    minArity: 2,
    maxArity: 4,
    description:
      'Invoke an external service action. Optional trailing { key, emit: { success, failure, cancelled } } options object attaches closed-circuit emit routing (V2 frame contract); key names the call for cancel-call.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'service', type: STRING, description: 'Service name (e.g. "llm", "stripe")' },
      { name: 'action', type: STRING, description: 'Service action (e.g. "generate", "charge")' },
      {
        name: 'params',
        type: rec('P'),
        description: 'Service-specific params',
        optional: true,
      },
      {
        name: 'options',
        type: KEYED_CALL_ENVELOPE,
        description:
          'Optional trailing options object. Set `{ emit: { success: "...", failure: "...", cancelled: "..." } }` to wire closed-circuit result routing (V2 frame), and `key` to name the call for `cancel-call`.',
        optional: true,
      },
    ],
    example: '["call-service", "my-service", "run", { "target": "https://example.com/hook", "event": "order.placed" }, { "emit": { "success": "Done", "failure": "Failed" } }]',
    effect: {
      kind: 'call-service',
      // TODO(entity-v2): narrow to the declared service return type once
      // per-service return shapes live on the orbital services block.
      // Today the emit.success payload is whatever the service adapter returns.
      produces: rec('R'),
    },
  },
  http: {
    module: 'core',
    // emit key order: effect/keyed_call.rs:15
    emitKeys: ['success', 'failure', 'onMessage', 'cancelled'],
    // effect/http.rs:22 REQUEST_KEYS, :42 BODY_KEYS, :49 AUTH_SCHEMES, :62-90 auth_keys, :234 onUnauthorized, :239 aws-sigv4 required, :398 queryEncoding; orbital-core wire/http_wire.rs:287 default ports
    httpWire: {
      requestKeys: ['query', 'headers', 'json', 'form', 'text', 'bytes', 'multipart', 'auth', 'timeoutMs', 'delayMs', 'responseAs', 'paginate', 'stream', 'retry', 'formEncoding', 'queryEncoding', 'presign', 'webpush'],
      bodyKeys: ['json', 'form', 'text', 'bytes', 'multipart', 'webpush'],
      queryEncodings: ['uri', 'rfc3986'],
      defaultPorts: { http: 80, https: 443 },
      authSchemes: [
        { name: 'oauth-client', keys: ['scheme', 'op', 'client', 'clients', 'code', 'state', 'subject', 'provider', 'refreshToken', 'token', 'accessToken'] },
        { name: 'bearer', keys: ['scheme', 'credential'] },
        { name: 'api-key', keys: ['scheme', 'credential', 'name', 'in'] },
        { name: 'basic', keys: ['scheme', 'user', 'credential'] },
        { name: 'oauth2-client', keys: ['scheme', 'tokenUrl', 'clientId', 'clientSecret', 'scope', 'grantRequest', 'onUnauthorized'], onUnauthorized: ['reply', 'refresh'] },
        { name: 'token-exchange', keys: ['scheme', 'tokenUrl', 'grant', 'body', 'clientAuth', 'clientId', 'clientSecret', 'accessField', 'expiresField', 'expiresMarginMs', 'storeAs', 'grantRequest', 'rotate', 'onUnauthorized'], onUnauthorized: ['reply', 'refresh'] },
        { name: 'jwt-bearer', keys: ['scheme', 'key', 'alg', 'claims', 'tokenUrl', 'grant', 'scope', 'expiresMarginMs', 'storeAs', 'grantRequest', 'onUnauthorized'], onUnauthorized: ['reply', 'refresh'] },
        { name: 'hmac-sha256', keys: ['scheme', 'credential', 'name', 'signs', 'encoding', 'prefix'] },
        { name: 'aws-sigv4', keys: ['scheme', 'accessKeyId', 'secretAccessKey', 'sessionToken', 'region', 'service'], required: ['accessKeyId', 'secretAccessKey', 'region', 'service'] },
        { name: 'vapid', keys: ['scheme', 'privateKey', 'publicKey', 'subject'] },
      ],
    },
    category: 'effect',
    minArity: 3,
    maxArity: 5,
    description:
      'Send HTTP through the shared kernel: (http METHOD origin path request? options?). The origin, optionally including a path prefix, must be declared in egress; credentials are host-resolved named secret knobs. Keyless calls can run on client/extension; auth requires server execution. Replies carry { status, headers, body, key } (non-2xx is a success reply); failures carry { error, kind, credential, key }. Optional trailing { key, emit: { success, failure, cancelled, onMessage } } routes the result like call-service. An oauth-client auth runs one OAuth op end to end: discovery against a literal origin, and code, connect, refresh, revoke and userinfo against (http METHOD oauth-endpoint token|revocation|userinfo …), whose URL comes from the client metadata; failures carry { error, kind: oauth, code, reason }.',
    hasSideEffects: true,
    runsOn: 'server',
    oauth: {
      endpointTarget: 'oauth-endpoint',
      endpointKinds: ['token', 'revocation', 'userinfo'],
      ops: [
        { name: 'discovery', required: [], optional: [] },
        { name: 'code', required: ['code', 'state'], optional: ['subject'], endpoint: 'token' },
        { name: 'connect', required: ['code', 'state', 'provider'], optional: [], endpoint: 'token' },
        { name: 'refresh', required: ['refreshToken'], optional: [], endpoint: 'token' },
        { name: 'revoke', required: ['token'], optional: [], endpoint: 'revocation' },
        { name: 'userinfo', required: ['accessToken'], optional: [], endpoint: 'userinfo' },
      ],
    },
    returnType: 'void',
    params: [
      { name: 'method', type: HTTP_METHOD, description: 'HTTP method word: GET, POST, PUT, PATCH or DELETE' },
      { name: 'origin', type: STRING, description: 'Origin with optional path prefix: a string literal or a url-typed @config knob' },
      { name: 'path', type: STRING, description: 'Request path, starting with "/"' },
      {
        name: 'request',
        type: HTTP_REQUEST,
        description: 'Request parts: query, headers, at most one body (json | form | text | bytes | multipart | webpush), auth, formEncoding, retry, presign, timeoutMs, delayMs (the host waits that many milliseconds before it sends; cancel-call aborts the wait), responseAs, paginate, stream',
        optional: true,
      },
      {
        name: 'options',
        type: KEYED_CALL_ENVELOPE,
        description: 'Optional trailing options: { key } names the call for cancel-call; { emit: { success, failure, cancelled, onMessage } } wires closed-circuit result routing',
        optional: true,
      },
    ],
    example: '["http", "GET", "https://api.example.com", "/items", { "query": { "limit": 10 } }, { "emit": { "success": "ITEMS_LOADED", "failure": "ITEMS_FAILED" } }]',
    effect: {
      kind: 'http',
      produces: shape({ status: NUMBER, headers: mapOf(STRING, STRING), body: STRING, key: union(STRING, lit(null)) }),
    },
  },
  redis: {
    module: 'core',
    // emit key order: effect/redis.rs:17
    emitKeys: ['success', 'failure'],
    category: 'effect',
    defaultPorts: { redis: 6379, rediss: 6379 },
    minArity: 2,
    maxArity: 4,
    description:
      'Run one redis command through the shared kernel: (redis origin command options? options?). The kernel speaks RESP over the host\'s raw TCP (TLS for rediss://); the origin must be a redis:// or rediss:// origin declared in egress. command is a list of text items (the command name first). One connection serves one call: AUTH (an ACL user with auth + user) and SELECT (db) go out as one pipeline whose replies are checked before the command runs. The success payload is { reply, key }: reply is the server\'s answer as text, a number or null, or a list of those nested up to 3 lists deep (a deeper reply fails). The failure payload is { error, kind, code, credential, key }: kind is refused (egress, grant or an invalid call), unconfigured (the auth credential is not held), timeout, failed, protocol, unsupported or redis (the server answered an error; code is its error word such as WRONGTYPE).',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'origin', type: STRING, description: 'A redis:// or rediss:// origin: a string literal or a url-typed @config knob' },
      { name: 'command', type: list(STRING), description: 'The command as text items, name first: ["SET", "k", "v", "PX", "1000"]' },
      {
        name: 'options',
        type: REDIS_OPTIONS,
        description: 'Optional trailing options: auth (a secret-typed knob naming the password credential), user (the ACL user), db (the database to SELECT), key (a non-empty string echoed as key), emit: { success, failure }',
        optional: true,
      },
      {
        name: 'more',
        type: REDIS_OPTIONS,
        description: 'Optional second options object; the two share one namespace, so a key may sit in either',
        optional: true,
      },
    ],
    example: '["redis", "redis://cache.internal:6379", ["GET", "@payload.key"], { "auth": "@config.password" }, { "emit": { "success": "GOT", "failure": "GET_FAILED" } }]',
    effect: { kind: 'redis', produces: shape({ reply: REDIS_REPLY, key: nullable(STRING) }) },
  },
  postgres: {
    module: 'core',
    // emit key order: effect/postgres.rs:19
    emitKeys: ['success', 'failure'],
    category: 'effect',
    defaultPorts: { postgres: 5432, postgresql: 5432 },
    minArity: 3,
    maxArity: 5,
    description:
      'Run one read-only SQL statement through the shared kernel: (postgres origin sql params options? options?). The kernel speaks the Postgres wire protocol over the host\'s raw TCP (an in-band SSLRequest and the kernel TLS when tls is true); the origin must be a postgres:// or postgresql:// origin declared in egress. sql is exactly one SELECT (or WITH ... SELECT): the kernel\'s read-only guard, the same one orb validate applies to a literal statement, refuses anything else before it connects. params are the bind values $1, $2, ... sent as text for the server to type. options: auth (a secret-typed knob naming the password credential; cleartext, MD5 and SCRAM-SHA-256 logins), user (required), database (default: the user), tls, timeoutMs (the statement timeout), key, emit: { success, failure }. One call is one connection. The success payload is { rows, rowCount, columns, key }: rows are maps of column name to value (booleans, numbers, null, text, lists of those; an int8 past 2^53, numeric, json, jsonb, uuid, date, time, timestamp and every other type as the text Postgres prints; timestamptz as UTC ISO text; bytea as base64), columns are { name, typeOid }. The failure payload is { error, kind, code, credential, key }: kind is refused (egress, grant, the read-only guard or an invalid call), unconfigured, timeout, failed, protocol, unsupported or postgres (the server answered an error; code is its SQLSTATE such as 42P01).',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'origin', type: STRING, description: 'A postgres:// or postgresql:// origin: a string literal or a url-typed @config knob' },
      { name: 'sql', type: STRING, description: 'One read-only SELECT statement, with $1, $2, ... placeholders' },
      { name: 'params', type: list(PG_BIND), description: 'The bind values for the placeholders, in order; null is SQL NULL, a list a Postgres array, an object JSON' },
      {
        name: 'options',
        type: PG_OPTIONS,
        description: 'Options: auth (secret knob), user (required), database, tls, timeoutMs, key, emit: { success, failure }',
        optional: true,
      },
      {
        name: 'more',
        type: PG_OPTIONS,
        description: 'Optional second options object; the two share one namespace, so a key may sit in either',
        optional: true,
      },
    ],
    example: '["postgres", "postgres://db.internal:5432", "SELECT id, name FROM users WHERE id = $1", ["@payload.id"], { "auth": "@config.password", "user": "app" }, { "emit": { "success": "ROWS", "failure": "QUERY_FAILED" } }]',
    effect: { kind: 'postgres', produces: shape({ rows: list(mapOf(STRING, PG_VALUE)), rowCount: NUMBER, columns: list(shape({ name: STRING, typeOid: NUMBER })), key: nullable(STRING) }) },
  },
  'cancel-call': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 1,
    description:
      'Abort the in-flight keyed call started with this key in the same running app: a call-service, an http, a browser/prompt or a browser/embed; a no-op when none is in flight. A list of keys aborts each in turn. The cancelled call emits its declared emit.cancelled event with { key }, never success or failure, and a reply that arrives later is dropped.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [{ name: 'key', type: union(STRING, list(STRING)), description: 'The key the call declared in its options, or a list of keys' }],
    example: '["cancel-call", "@entity.id"]',
    effect: { kind: 'cancel-call' },
  },
  'random-bytes': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      'Draw n bytes from the host CSPRNG (journaled, so a replay sees the same bytes). The success payload is { value }: the bytes as base64url without padding, for an OAuth state or a PKCE verifier. n is an integer from 1 to 1024. An optional key (a non-empty string expression) is echoed as key in the success and failure payloads, so a caller can carry its request context through the draw.',
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: { intRange: { arg: 0, min: 1, max: 1024 } },
    returnType: 'void',
    params: [
      { name: 'bytes', type: NUMBER, description: 'How many random bytes to draw (1 to 1024)' },
      {
        name: 'options',
        type: openShape({ key: STRING, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }) }),
        description: 'Optional trailing options: { key } is a non-empty string echoed as key in the success and failure payloads (absent: no key field); { emit: { success, failure } } routes the { value } payload and the { error } failure',
        optional: true,
      },
    ],
    example: '["random-bytes", 32, { "emit": { "success": "STATE_DRAWN", "failure": "STATE_FAILED" } }]',
    effect: { kind: 'random-bytes', produces: shape({ value: STRING }) },
  },
  'credential-status': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      'A bare secret knob checks the signed-in user credential; { credential: knob, scope: app | user } explicitly selects a scope. App checks need no viewer and treat absent or empty values as disconnected. User checks require a signed-in viewer and never fall back to app credentials. Success is { connected, label }: label is the non-secret account name stored beside the credential (the email it was signed in as), empty text when it has none; the credential value is never readable.',
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: {},
    returnType: 'void',
    params: [
      { name: 'credential', type: union(STRING, shape({ credential: STRING, scope: union(lit('app'), lit('user')) })), description: 'A secret-typed @config knob (user scope), or a closed credential/scope object with an explicit app or user scope' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the { connected } payload and the { error } failure',
        optional: true,
      },
    ],
    example: '["credential-status", { "credential": "@config.apiKey", "scope": "app" }, { "emit": { "success": "STATUS_KNOWN" } }]',
    effect: { kind: 'credential-status', produces: shape({ connected: BOOLEAN, label: STRING }) },
  },
  'credential-forget': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      'Drop the signed-in viewer\'s stored credential named by a secret knob; the success payload is { connected: false, label: "" }. Fails when nobody is signed in.',
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: {},
    returnType: 'void',
    params: [
      { name: 'credential', type: STRING, description: 'A secret-typed @config knob whose value names the credential' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the { connected } payload and the { error } failure',
        optional: true,
      },
    ],
    example: '["credential-forget", "@config.googleToken", { "emit": { "success": "DISCONNECTED" } }]',
    effect: { kind: 'credential-forget', produces: shape({ connected: BOOLEAN, label: STRING }) },
  },
  'access-check': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      'Ask the kernel for the verdict of an entity access policy: whether viewer may create, read, update or delete row of entity, evaluated by the same evaluator fetch and persist enforce. The success payload is { allowed }; an entity with no policy for the action allows every viewer, a null viewer is nobody. An entity the program does not declare, an unknown action or a request missing a key fails with { error }.',
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: {},
    returnType: 'void',
    params: [
      {
        name: 'request',
        type: shape({
          entity: STRING,
          action: union(lit('create'), lit('read'), lit('update'), lit('delete')),
          row: ENTITY_REF,
          viewer: nullable(ENTITY_REF),
        }),
        description: 'The entity name, the action, the candidate row (the incoming data for create, the existing row otherwise) and the viewer (null for nobody)',
      },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the { allowed } payload and the { error } failure',
        optional: true,
      },
    ],
    example: '["access-check", { "entity": "Task", "action": "create", "row": { "ownerId": "u1" }, "viewer": { "id": "u1" } }, { "emit": { "success": "CHECKED", "failure": "CHECK_FAILED" } }]',
    effect: { kind: 'access-check', produces: shape({ allowed: BOOLEAN }) },
  },
  'credential-list': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      "Masked credential inventory: whether the host's credential store can encrypt, the integrations mode, each service's status and every declared credential's source (store, env or none) with its last four characters, never the value. The declared names are the registry's remaining services plus the secret knobs the running program reads. Open to every caller. The success payload is { enabled, mode, services, entries }.",
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: { request: true },
    returnType: 'void',
    params: [
      { name: 'request', type: shape({ service: STRING }, ['service']), description: 'An optional { service } filter' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the result payload and the { error, code } failure',
        optional: true,
      },
    ],
    example: '["credential-list", { "service": "llm" }, { "emit": { "success": "LISTED" } }]',
    effect: { kind: 'credential-list', produces: shape({ enabled: BOOLEAN, mode: STRING, services: list(openShape({ id: STRING, service: STRING, configured: BOOLEAN, mocked: BOOLEAN, status: STRING, backend: STRING, needs: STRING })), entries: list(openShape({ id: STRING, service: STRING, envVar: STRING, required: BOOLEAN, description: STRING, configured: BOOLEAN, source: STRING, last4: STRING })) }) },
  },
  'credential-set': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      "Store a credential value encrypted in the host's credential store; only a credential the named service or program group declares is accepted. Requires the caller's @user.role to be one of ALMADAR_CREDENTIAL_ADMIN_ROLES (default admin, owner); fails closed without one. The success payload is { saved, service, envVar, last4 }; the value is never echoed or logged.",
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: { request: true },
    returnType: 'void',
    params: [
      { name: 'request', type: shape({ service: STRING, envVar: STRING, value: STRING }), description: '{ service, envVar, value }' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the result payload and the { error, code } failure',
        optional: true,
      },
    ],
    example: '["credential-set", { "service": "KeysOrbital", "envVar": "ALMADAR_API_KEY_SALT", "value": "@payload.value" }, { "emit": { "success": "SAVED" } }]',
    effect: { kind: 'credential-set', produces: shape({ saved: BOOLEAN, service: STRING, envVar: STRING, last4: STRING }) },
  },
  'credential-remove': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      "Delete a stored credential row so resolution falls back to the environment; only a declared credential is accepted. Requires the caller's @user.role to be one of ALMADAR_CREDENTIAL_ADMIN_ROLES (default admin, owner); fails closed without one. The success payload is { removed }.",
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: { request: true },
    returnType: 'void',
    params: [
      { name: 'request', type: shape({ service: STRING, envVar: STRING }), description: '{ service, envVar }' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the result payload and the { error, code } failure',
        optional: true,
      },
    ],
    example: '["credential-remove", { "service": "KeysOrbital", "envVar": "ALMADAR_API_KEY_SALT" }, { "emit": { "success": "REMOVED" } }]',
    effect: { kind: 'credential-remove', produces: shape({ removed: BOOLEAN }) },
  },
  'credential-test': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      "Credential presence check for a service or program group: the required declared credentials the store or the environment do not hold. Presence only, never a live probe. Requires the caller's @user.role to be one of ALMADAR_CREDENTIAL_ADMIN_ROLES (default admin, owner); fails closed without one. The success payload is { service, configured, missing, probed, ok, message }.",
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: { request: true },
    returnType: 'void',
    params: [
      { name: 'request', type: shape({ service: STRING }), description: '{ service }' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the result payload and the { error, code } failure',
        optional: true,
      },
    ],
    example: '["credential-test", { "service": "LlmOrbital" }, { "emit": { "success": "TESTED" } }]',
    effect: { kind: 'credential-test', produces: shape({ service: STRING, configured: BOOLEAN, missing: list(STRING), probed: BOOLEAN, ok: BOOLEAN, message: STRING }) },
  },
  'credential-mode': {
    module: 'core',
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      'Switch the host\'s integrations mode flag between "mock" and "real"; the host may refuse (mock under production). Requires the caller\'s @user.role to be one of ALMADAR_CREDENTIAL_ADMIN_ROLES (default admin, owner); fails closed without one. The success payload is { mode }.',
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: { request: true },
    returnType: 'void',
    params: [
      { name: 'request', type: shape({ mode: union(lit('mock'), lit('real')) }), description: '{ mode: "mock" | "real" }' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the result payload and the { error, code } failure',
        optional: true,
      },
    ],
    example: '["credential-mode", { "mode": "real" }, { "emit": { "success": "MODE_SET" } }]',
    effect: { kind: 'credential-mode', produces: shape({ mode: STRING }) },
  },
  'credential-rotate': {
    module: 'core',
    category: 'effect',
    minArity: 0,
    maxArity: 1,
    description:
      "Re-encrypt every stored credential row under the current master key. It takes no request, only the optional options. Requires the caller's @user.role to be one of ALMADAR_CREDENTIAL_ADMIN_ROLES (default admin, owner); fails closed without one. The success payload is { rotated, alreadyCurrent, unreadable }.",
    hasSideEffects: true,
    runsOn: 'server',
    closedCall: {},
    returnType: 'void',
    params: [
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } } routes the result payload and the { error, code } failure',
        optional: true,
      },
    ],
    example: '["credential-rotate", { "emit": { "success": "ROTATED" } }]',
    effect: { kind: 'credential-rotate', produces: shape({ rotated: NUMBER, alreadyCurrent: NUMBER, unreadable: NUMBER }) },
  },
  'oauth-authorize': {
    module: 'core',
    // emit key order: effect/oauth.rs:20
    emitKeys: ['success', 'failure'],
    category: 'effect',
    minArity: 2,
    maxArity: 3,
    description:
      'Start an OAuth authorization for a client: (oauth-authorize CLIENT { redirectUri, scope?, subject?, params? } { emit }). The state and the PKCE verifier are drawn from the host CSPRNG (journaled); the pending grant, verifier included, stays with the host and is consumed once by an oauth-client connect or code. A client described by an issuer needs its discovery to have run first. A host that can open the consent page for the person (a browser extension) does so and returns the authorization code it got in code; every other host answers code as empty text and the program carries authUrl to the person. The success payload is { authUrl, state, code }; the failure payload is { error, code, reason }.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'client', type: OAUTH_CLIENT, description: 'The OAuth client: tag, mode, issuer XOR endpoints, secret-knob clientId / clientSecret, clientAuth' },
      {
        name: 'authorize',
        type: openShape({ redirectUri: STRING, scope: union(STRING, list(STRING)), subject: STRING, params: mapOf(STRING, STRING) }),
        description: 'The redirect URI, the scopes, the subject that must complete the grant, extra authorization parameters',
      },
      {
        name: 'options',
        type: openShape({ key: STRING, emit: openShape({ success: EVENT_KEY, failure: EVENT_KEY }) }),
        description: 'Optional trailing options: { key } is a non-empty string echoed as key in the success and failure payloads; { emit: { success, failure } } routes the result',
        optional: true,
      },
    ],
    example: '["oauth-authorize", { "tag": "google", "mode": "real", "issuer": "@config.issuer", "clientId": "@config.id", "clientSecret": "@config.secret", "clientAuth": "post" }, { "redirectUri": "https://app.example.com/cb", "scope": ["openid"] }, { "emit": { "success": "AUTH_URL" } }]',
    effect: { kind: 'oauth-authorize', produces: shape({ authUrl: STRING, state: STRING, code: STRING }) },
  },
  'oauth-connection-status': {
    module: 'core',
    // emit key order: effect/oauth.rs:20
    emitKeys: ['success', 'failure'],
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      'The signed-in viewer\'s connection to a provider (google, github or auth0): (oauth-connection-status PROVIDER { emit }). The success payload is the connection row { provider, connected, account, avatarUrl, scope, connectedAt }; the tokens are never readable. Fails not-signed-in when nobody is signed in.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'provider', type: OAUTH_PROVIDER, description: 'google, github or auth0' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } }',
        optional: true,
      },
    ],
    example: '["oauth-connection-status", "google", { "emit": { "success": "CONNECTION" } }]',
    effect: { kind: 'oauth-connection-status', produces: OAUTH_CONNECTION },
  },
  'oauth-connection-forget': {
    module: 'core',
    // emit key order: effect/oauth.rs:20
    emitKeys: ['success', 'failure'],
    category: 'effect',
    minArity: 1,
    maxArity: 2,
    description:
      'Drop the signed-in viewer\'s connection to a provider: (oauth-connection-forget PROVIDER { emit }). The success payload is the disconnected connection row. Fails not-signed-in when nobody is signed in.',
    hasSideEffects: true,
    runsOn: 'server',
    returnType: 'void',
    params: [
      { name: 'provider', type: OAUTH_PROVIDER, description: 'google, github or auth0' },
      {
        name: 'options',
        type: HOST_CALL_ENVELOPE,
        description: 'Optional trailing options: { emit: { success, failure } }',
        optional: true,
      },
    ],
    example: '["oauth-connection-forget", "google", { "emit": { "success": "DISCONNECTED" } }]',
    effect: { kind: 'oauth-connection-forget', produces: OAUTH_CONNECTION },
  },
  'render-ui': {
    module: 'core',
    category: 'effect',
    minArity: 2,
    maxArity: 2,
    description: 'Render a pattern into a UI slot',
    hasSideEffects: true,
    runsOn: 'client',
    returnType: 'void',
    params: [
      { name: 'slot', type: UI_SLOT, description: 'Target UI slot (main, sidebar, modal, hud, ...)' },
      {
        name: 'pattern',
        type: {
          kind: 'union',
          of: [
            { kind: 'object', fields: { patternType: PATTERN_TYPE }, open: true },
            { kind: 'literal', value: null },
          ],
        },
        description: 'Pattern config (or null to clear the slot)',
      },
    ],
    example: '["render-ui", "main", { "patternType": "entity-table", "columns": ["name"] }]',
    effect: { kind: 'render-ui' },
  },
};

/**
 * Get all core operator names.
 */
export function getCoreOperators(): string[] {
  return Object.keys(CORE_OPERATORS);
}
